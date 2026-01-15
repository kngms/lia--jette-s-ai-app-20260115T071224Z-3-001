
import React, { useState, useRef, useEffect } from 'react';
import { processWritingTask, textToSpeech } from '../services/gemini';
import { AssistantConfig, Tone, Length, AppSettings } from '../types';
import { Loader2, CheckCircle, Copy, Save, Wand2, Volume2, Square, Play, Pause, FastForward, Mail, Download } from 'lucide-react';

const WritingAssistant: React.FC = () => {
  // Pre-fill with example text containing errors
  const [inputText, setInputText] = useState('Sehr geehrte Damen und Herren, hiermit wollte ich mich bewerben auf die Stelle als Manager. Ich bin sehr gut in team arbeit und ich habe viel erfahrung.');
  
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const [config, setConfig] = useState<AssistantConfig>({
    tone: 'professional',
    length: 'medium',
    action: 'check'
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stopAudio();
    };
  }, []);

  const updateProgress = () => {
    if (isPlaying && audioContextRef.current) {
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate + offsetRef.current;
      if (elapsed >= duration) {
        setIsPlaying(false);
        setCurrentTime(duration);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      } else {
        setCurrentTime(elapsed);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const result = await processWritingTask(inputText, config.action, config.tone, config.length);
      setOutputText(result || '');
      // Clear audio cache when text changes
      audioBufferRef.current = null;
      setCurrentTime(0);
      setDuration(0);
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please check your API usage.');
    } finally {
      setLoading(false);
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

  const togglePlayback = async () => {
    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      if (!audioBufferRef.current) {
        setLoading(true);
        try {
          const result = await textToSpeech(outputText);
          if (result) {
            audioBufferRef.current = result.audioBuffer;
            audioContextRef.current = result.audioContext;
            setDuration(result.audioBuffer.duration);
            playFromOffset(0);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        playFromOffset(currentTime >= duration ? 0 : currentTime);
      }
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
    // If playing, we need to reset startTime because the elapsed calculation depends on rate
    if (isPlaying && audioContextRef.current) {
      offsetRef.current = currentTime;
      startTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveAsTemplate = () => {
    const templates = JSON.parse(localStorage.getItem('templates') || '[]');
    const newTemplate = {
      id: Date.now().toString(),
      title: inputText.substring(0, 20) + '...',
      content: outputText,
      category: 'work',
      createdAt: Date.now()
    };
    localStorage.setItem('templates', JSON.stringify([newTemplate, ...templates]));
    alert('Saved to Library!');
  };

  const downloadText = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-text-${Date.now()}.txt`;
    a.click();
  };

  const sendEmail = () => {
    if (!settings?.emailConfig?.userEmail) {
      alert('Please configure your email in Settings first.');
      return;
    }
    const subject = "Enhanced Text from Lia's AI";
    const body = `Original:\n${inputText}\n\nImproved:\n${outputText}`;
    const mailto = `mailto:${settings.emailConfig.userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  // Helper function to render Markdown-like syntax (bold and lists)
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => {
      // Check for list items
      const isList = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const content = isList ? line.trim().substring(2) : line;
      
      // Split by bold markers
      const parts = content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-indigo-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isList) {
        return (
          <div key={index} className="flex items-start gap-2 ml-4 mb-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            <p className="text-slate-700 leading-relaxed">{parts}</p>
          </div>
        );
      }

      if (line.trim() === '') {
        return <br key={index} />;
      }

      return <p key={index} className="mb-2 text-slate-700 leading-relaxed">{parts}</p>;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Wand2 className="text-indigo-600" />
          Smart Assistant
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</label>
            <select 
              value={config.action} 
              onChange={(e) => setConfig({...config, action: e.target.value as any})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="check">Check Mistakes</option>
              <option value="rephrase">Polite Rephrase</option>
              <option value="summarize">Summarize</option>
              <option value="synonyms">Find Synonyms</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tone</label>
            <select 
              value={config.tone} 
              onChange={(e) => setConfig({...config, tone: e.target.value as any})}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="empathetic">Empathetic</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider transition-colors ${config.action === 'summarize' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
               Length {config.action === 'summarize' && '(Required)'}
            </label>
            <select 
              value={config.length} 
              onChange={(e) => setConfig({...config, length: e.target.value as any})}
              className={`w-full border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm transition-all ${config.action === 'summarize' ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'bg-slate-50'}`}
            >
              <option value="short">Short</option>
              <option value="medium">Normal</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            placeholder="Type or paste your text here..."
            className="w-full min-h-[150px] bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 text-slate-700 resize-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleProcess}
            disabled={loading || !inputText}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
            {loading ? 'Processing...' : 'Enhance Text'}
          </button>
        </div>
      </div>

      {outputText && (
        <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-indigo-900">Improved Version</h4>
            <div className="flex gap-2">
              <button 
                onClick={sendEmail}
                className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                title="Send via Email"
              >
                <Mail size={18} />
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(outputText);
                  alert('Copied to clipboard!');
                }}
                className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                title="Copy"
              >
                <Copy size={18} />
              </button>
              <button 
                onClick={downloadText}
                className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                title="Download .txt"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={saveAsTemplate}
                className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                title="Save as Template"
              >
                <Save size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-indigo-100/50">
            <div className="flex items-center gap-4 mb-3">
              <button 
                onClick={togglePlayback}
                disabled={loading}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-0.5" fill="currentColor" />}
              </button>
              
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-indigo-400 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-lg">
                {[0.75, 1, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      playbackRate === rate ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none text-indigo-950">
            {renderFormattedText(outputText)}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingAssistant;
