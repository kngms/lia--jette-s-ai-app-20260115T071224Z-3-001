
import React, { useState, useRef, useEffect } from 'react';
import { textToSpeech, generatePodcastScript, synthesizeMultiSpeakerAudio, extractTextFromSources, getSettings, bufferToWav } from '../services/gemini';
import { Mic2, Play, Pause, Square, Loader2, Volume2, Podcast, FileText, Youtube, Plus, Trash2, X, UploadCloud, File as FileIcon, Link as LinkIcon, Wand2, Download, Check, Clock } from 'lucide-react';
import { AppSettings, Persona } from '../types';
import * as mammoth from 'mammoth';

const AudioLab: React.FC = () => {
  // Persistence Initialization
  const [text, setText] = useState(() => localStorage.getItem('audioLab_text') || 'Willkommen im Voice Lab. Hier kannst du Dokumente vorlesen lassen oder Podcasts generieren.');
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  
  // Settings Persistence
  const [voice, setVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>(() => (localStorage.getItem('audioLab_voice') as any) || 'Kore');
  const [mode, setMode] = useState<'reader' | 'podcast'>(() => (localStorage.getItem('audioLab_mode') as any) || 'reader');
  
  // Podcast Settings Persistence
  const [podcastFormat, setPodcastFormat] = useState(() => localStorage.getItem('audioLab_format') || 'Discussion');
  const [duration, setDuration] = useState<'5' | '15' | '30'>(() => (localStorage.getItem('audioLab_duration') as any) || '5');
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('audioLab_personas') || '[]');
      } catch { return []; }
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio Persistence
  const [playbackRate, setPlaybackRate] = useState(() => parseFloat(localStorage.getItem('audioLab_rate') || '1'));
  const [currentTime, setCurrentTime] = useState(() => parseFloat(localStorage.getItem('audioLab_currentTime') || '0'));
  
  const [durationAudio, setDurationAudio] = useState(0);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Sources Persistence
  const [links, setLinks] = useState<string[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('audioLab_links') || '[]');
      } catch { return []; }
  });
  const [newLink, setNewLink] = useState('');
  
  // File Upload Persistence
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, data: string, mimeType: string}[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('audioLab_files') || '[]');
      } catch { return []; }
  });
  const [isDragging, setIsDragging] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef(currentTime);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioSourceRef.current) audioSourceRef.current.stop();
      
      // Save current time on unmount
      localStorage.setItem('audioLab_currentTime', currentTimeRef.current.toString());
    };
  }, []);

  // Update ref when state changes
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('audioLab_text', text); }, [text]);
  useEffect(() => { localStorage.setItem('audioLab_voice', voice); }, [voice]);
  useEffect(() => { localStorage.setItem('audioLab_mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('audioLab_format', podcastFormat); }, [podcastFormat]);
  useEffect(() => { localStorage.setItem('audioLab_duration', duration); }, [duration]);
  useEffect(() => { localStorage.setItem('audioLab_personas', JSON.stringify(selectedPersonaIds)); }, [selectedPersonaIds]);
  useEffect(() => { localStorage.setItem('audioLab_links', JSON.stringify(links)); }, [links]);
  useEffect(() => { localStorage.setItem('audioLab_rate', playbackRate.toString()); }, [playbackRate]);
  useEffect(() => { 
      try {
          localStorage.setItem('audioLab_files', JSON.stringify(uploadedFiles)); 
      } catch (e) {
          console.error("Failed to save files to localStorage", e);
      }
  }, [uploadedFiles]);

  const updateProgress = () => {
    if (isPlaying && audioContextRef.current) {
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate + offsetRef.current;
      if (elapsed >= durationAudio) {
        setIsPlaying(false);
        setCurrentTime(durationAudio);
        localStorage.setItem('audioLab_currentTime', durationAudio.toString());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      } else {
        setCurrentTime(elapsed);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const playFromOffset = (offset: number) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioContextRef.current.destination);
    
    startTimeRef.current = audioContextRef.current.currentTime;
    offsetRef.current = offset;
    
    source.start(0, offset);
    audioSourceRef.current = source;
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleSynthesize = async () => {
    setLoading(true);
    stopAudio();
    audioBufferRef.current = null;
    
    try {
      if (mode === 'podcast') {
        let activePersonas: Persona[] = [];
        
        if (selectedPersonaIds.length > 0) {
            activePersonas = settings?.podcastConfig.personas.filter(p => selectedPersonaIds.includes(p.id)) || [];
        } else {
            // Randomly pick 2 personas if none selected
            const allPersonas = settings?.podcastConfig.personas || [];
            if (allPersonas.length >= 2) {
                const shuffled = [...allPersonas].sort(() => 0.5 - Math.random());
                activePersonas = shuffled.slice(0, 2);
                alert(`Randomly selected hosts: ${activePersonas.map(p => p.name).join(' & ')}`);
            } else {
                activePersonas = allPersonas;
            }
        }

        if (activePersonas.length === 0) {
          alert("No personas available!");
          setLoading(false);
          return;
        }

        const allSources = [
           ...links.map(l => `Link: ${l}`),
           ...uploadedFiles.map(f => `File: ${f.name} (Context provided)`),
           text ? `Extra Context: ${text}` : ''
        ].filter(Boolean);

        if (allSources.length === 0 && !text) {
           alert("Please add sources or a topic description.");
           setLoading(false);
           return;
        }
        
        const script = await generatePodcastScript(
           text || "Summarize the sources", 
           activePersonas, 
           podcastFormat,
           allSources,
           duration
        );
        
        if (!script) throw new Error("Failed to generate script");
        
        const result = await synthesizeMultiSpeakerAudio(script, activePersonas);
        if (result) {
          audioBufferRef.current = result.audioBuffer;
          audioContextRef.current = result.audioContext;
          setDurationAudio(result.audioBuffer.duration);
          playFromOffset(0);
        }
      } else {
        // Reader Mode
        if (!text.trim()) {
            alert("No text to read. Please upload documents and extract text first, or type something.");
            setLoading(false);
            return;
        }
        const result = await textToSpeech(text, voice);
        if (result) {
          audioBufferRef.current = result.audioBuffer;
          audioContextRef.current = result.audioContext;
          setDurationAudio(result.audioBuffer.duration);
          playFromOffset(0);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Audio generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioBufferRef.current) return;
    const wavBlob = bufferToWav(audioBufferRef.current, audioBufferRef.current.length);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-export-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Document Handling ---

  const processFiles = async (files: FileList | File[]) => {
    if (uploadedFiles.length + files.length > 30) {
        alert("Maximum 30 documents allowed.");
        return;
    }

    Array.from(files).forEach(async (file) => {
      try {
        let fileData = '';
        let mimeType = file.type;

        // DOCX Handling via Mammoth
        if (file.name.endsWith('.docx')) {
           const arrayBuffer = await file.arrayBuffer();
           const result = await mammoth.extractRawText({ arrayBuffer });
           // Convert extracted text to base64 so it fits the existing data structure
           fileData = btoa(unescape(encodeURIComponent(result.value))); 
           mimeType = 'text/plain'; // Treat as text after extraction
        } 
        // Text/Code/CSV/MD Handling
        else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
           const textContent = await file.text();
           fileData = btoa(unescape(encodeURIComponent(textContent)));
           mimeType = 'text/plain';
        } 
        // PDF & Image Handling (Native Gemini Support)
        else {
           const reader = new FileReader();
           reader.onload = (e) => {
              const base64 = (e.target?.result as string).split(',')[1];
              setUploadedFiles(prev => [...prev, {
                name: file.name,
                data: base64,
                mimeType: file.type
              }]);
           };
           reader.readAsDataURL(file);
           return; // Early return as reader is async
        }

        // Add processed text/docx file
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          data: fileData,
          mimeType: mimeType
        }]);

      } catch (e) {
        console.error("File processing error", e);
        alert(`Failed to process ${file.name}`);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleExtractText = async () => {
    if (uploadedFiles.length === 0 && links.length === 0) return;
    setExtracting(true);
    try {
        const extracted = await extractTextFromSources(uploadedFiles, links);
        setText(prev => (prev ? prev + "\n\n" + extracted : extracted || ""));
    } catch (e) {
        console.error(e);
        alert("Failed to extract text.");
    } finally {
        setExtracting(false);
    }
  };

  const downloadSources = () => {
      const content = [
          "--- SOURCE LIST ---",
          ...links.map(l => `LINK: ${l}`),
          ...uploadedFiles.map(f => `FILE: ${f.name}`),
          "",
          "--- CONTEXT ---",
          text
      ].join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sources_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const togglePersonaSelection = (id: string) => {
      if (selectedPersonaIds.includes(id)) {
          setSelectedPersonaIds(selectedPersonaIds.filter(pid => pid !== id));
      } else {
          if (selectedPersonaIds.length >= 2) {
              // Usually podcasts are 2 people, maybe limit to 2 for simplicity
              alert("Tip: 2 Hosts work best. You can select more, but it might get crowded.");
          }
          setSelectedPersonaIds([...selectedPersonaIds, id]);
      }
  };

  // --- Audio Control Helpers ---

  const togglePlayback = () => {
    if (!audioBufferRef.current) return;
    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Save persistence on pause
      localStorage.setItem('audioLab_currentTime', currentTimeRef.current.toString());
    } else {
      playFromOffset(currentTime >= durationAudio ? 0 : currentTime);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    offsetRef.current = 0;
    // Save persistence on stop
    localStorage.setItem('audioLab_currentTime', '0');
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (isPlaying) {
      playFromOffset(newTime);
    } else {
      offsetRef.current = newTime;
    }
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (audioSourceRef.current) {
      audioSourceRef.current.playbackRate.value = newRate;
    }
    if (isPlaying && audioContextRef.current) {
      offsetRef.current = currentTime;
      startTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  const addLink = () => {
    if(newLink) {
        setLinks([...links, newLink]);
        setNewLink('');
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4 mb-8">
          <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
            <Mic2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Voice Lab</h3>
            <p className="text-sm text-slate-500 mt-1">
              Read documents aloud or convert topics into podcast discussions.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setMode('reader'); setText(localStorage.getItem('audioLab_text') || 'Willkommen im Voice Lab. Hier kannst du Dokumente vorlesen lassen oder Podcasts generieren.'); }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              mode === 'reader' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText size={16} /> Document Reader
          </button>
          <button
            onClick={() => { setMode('podcast'); setText(localStorage.getItem('audioLab_text') || 'Die Auswirkungen von künstlicher Intelligenz auf die moderne Arbeitswelt.'); }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              mode === 'podcast' 
                ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Podcast size={16} /> Deep Podcast
          </button>
        </div>

        {/* --- READER MODE UI --- */}
        {mode === 'reader' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
             
             {/* Upload Zone */}
             <div 
               className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center gap-4 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
               onDrop={handleDrop}
             >
                <div className={`p-4 rounded-full ${isDragging ? 'bg-white text-indigo-600' : 'bg-white text-slate-400'} shadow-sm`}>
                   <UploadCloud size={32} />
                </div>
                <div>
                   <p className="font-bold text-slate-700 text-lg">Drop your documents here</p>
                   <p className="text-sm text-slate-500">PDF, DOCX, TXT, Images (Max 30)</p>
                   <p className="text-[10px] text-slate-400 mt-1">Files are processed locally or securely via Gemini.</p>
                </div>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   multiple 
                   accept=".pdf,.docx,.txt,.md,.csv,image/*" 
                   className="hidden" 
                   onChange={handleFileSelect} 
                />
                <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                   Select Files
                </button>
             </div>

             {/* File List & Extract Button */}
             {(uploadedFiles.length > 0 || links.length > 0) && (
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-bold text-slate-500 uppercase">Attached Sources ({uploadedFiles.length + links.length})</span>
                     <button 
                        onClick={handleExtractText}
                        disabled={extracting}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                     >
                        {extracting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {extracting ? 'Extracting...' : 'Extract Text to Read'}
                     </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                     {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 shadow-sm">
                           <FileIcon size={12} className="text-indigo-500" />
                           <span className="truncate max-w-[150px]">{f.name}</span>
                           <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                        </div>
                     ))}
                     {links.map((l, i) => (
                        <div key={`link-${i}`} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 shadow-sm">
                           <LinkIcon size={12} className="text-blue-500" />
                           <span className="truncate max-w-[150px]">{l}</span>
                           <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                        </div>
                     ))}
                  </div>
               </div>
             )}

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase">Text to Read</label>
               <textarea
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 placeholder="Extracted text will appear here. You can also paste text directly..."
                 className="w-full min-h-[200px] bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
               />
             </div>

             <div className="flex gap-4 items-center">
                <div className="flex-1 space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Voice</label>
                   <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                      {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const).map(v => (
                        <button key={v} onClick={() => setVoice(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${voice === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{v}</button>
                      ))}
                   </div>
                </div>
                <button
                  onClick={handleSynthesize}
                  disabled={loading || !text.trim()}
                  className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                  Read Aloud
                </button>
             </div>
          </div>
        )}
        
        {/* --- PODCAST MODE UI --- */}
        {mode === 'podcast' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
             <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
               <h4 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2"><Podcast size={16}/> Podcast Configuration</h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-xs font-bold text-purple-700 uppercase block mb-2">Discussion Style</label>
                    <select 
                      value={podcastFormat} 
                      onChange={(e) => setPodcastFormat(e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Discussion">💬 Casual Discussion</option>
                      <option value="Deep Dive">🔬 Deep Dive Analysis</option>
                      <option value="Pro/Contra">⚖️ Pro & Contra Debate</option>
                      <option value="Storytelling">📖 Narrative Storytelling</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-purple-700 uppercase block mb-2">Duration</label>
                    <div className="flex gap-2">
                        {['5', '15', '30'].map(d => (
                            <button 
                                key={d}
                                onClick={() => setDuration(d as any)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${duration === d ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {d} Min
                            </button>
                        ))}
                    </div>
                 </div>
               </div>

               {/* Persona Selection */}
               <div className="mt-6">
                   <label className="text-xs font-bold text-purple-700 uppercase block mb-3">Select Hosts (Pick 2)</label>
                   <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                       {settings?.podcastConfig.personas.map(p => {
                           const isSelected = selectedPersonaIds.includes(p.id);
                           return (
                               <button 
                                   key={p.id}
                                   onClick={() => togglePersonaSelection(p.id)}
                                   className={`flex items-center gap-2 p-2 pr-4 rounded-full border transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'}`}
                               >
                                   <div className={`w-8 h-8 rounded-full ${p.avatarColor} flex items-center justify-center text-white font-bold text-xs border-2 border-white`}>
                                       {p.name.charAt(0)}
                                   </div>
                                   <span className="text-xs font-bold">{p.name}</span>
                                   {isSelected && <Check size={12} />}
                               </button>
                           )
                       })}
                   </div>
                   {selectedPersonaIds.length === 0 && <p className="text-[10px] text-purple-400 mt-1 italic">If none selected, 2 random hosts will be chosen.</p>}
               </div>

               <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-purple-700 uppercase">Add Web Link</label>
                    {(links.length > 0 || uploadedFiles.length > 0) && (
                        <button onClick={downloadSources} className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-1">
                            <Download size={10} /> Save List
                        </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                       <input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://..." className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500" />
                       <button onClick={addLink} className="bg-purple-200 text-purple-800 p-2 rounded-xl hover:bg-purple-300"><Plus size={18}/></button>
                  </div>
               </div>

               <div className="mt-4">
                  <label className="text-xs font-bold text-purple-700 uppercase block mb-2">Sources</label>
                  {links.length === 0 && uploadedFiles.length === 0 ? (
                     <p className="text-xs text-purple-400 italic">No sources added. Upload documents in Reader mode or add links here.</p>
                  ) : (
                     <div className="flex flex-wrap gap-2">
                        {links.map((l, i) => (
                           <div key={i} className="bg-white px-3 py-1 rounded-lg text-xs border border-purple-100 flex items-center gap-2 text-purple-800">
                              <LinkIcon size={10} /> {l.slice(0, 30)}... <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))}><X size={10}/></button>
                           </div>
                        ))}
                        {uploadedFiles.map((f, i) => (
                           <div key={i} className="bg-white px-3 py-1 rounded-lg text-xs border border-purple-100 flex items-center gap-2 text-purple-800">
                              <FileIcon size={10} /> {f.name}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase">Topic Description (Optional)</label>
               <textarea
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 placeholder="Describe the topic to guide the hosts..."
                 className="w-full min-h-[100px] bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 text-sm"
               />
             </div>

             <button
               onClick={handleSynthesize}
               disabled={loading || (!text && links.length === 0 && uploadedFiles.length === 0)}
               className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {loading ? <Loader2 className="animate-spin" /> : <Podcast size={20} />}
               Generate Podcast ({duration} Min)
             </button>
           </div>
        )}

        {/* --- AUDIO PLAYER (Shared) --- */}
        {(durationAudio > 0 || currentTime > 0) && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 animate-in slide-in-from-bottom-4 mt-8 text-white shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={togglePlayback}
                className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg ${
                  mode === 'podcast' ? 'bg-purple-500 hover:bg-purple-400' : 'bg-indigo-500 hover:bg-indigo-400'
                }`}
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
              </button>
              
              <div className="flex-1 space-y-2">
                <input
                  type="range"
                  min="0"
                  max={durationAudio || 100}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 ${mode === 'podcast' ? 'accent-purple-500' : 'accent-indigo-500'}`}
                />
                <div className="flex justify-between text-xs font-bold text-slate-400 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(durationAudio)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Speed</span>
                {[0.75, 1, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                      playbackRate === rate 
                        ? 'bg-white text-slate-900' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                  <button
                    onClick={handleDownloadAudio}
                    className="flex items-center gap-2 text-slate-900 bg-white hover:bg-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    onClick={stopAudio}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-400 font-bold text-xs px-3 py-1.5"
                  >
                    <Square size={14} fill="currentColor" /> Stop
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioLab;
