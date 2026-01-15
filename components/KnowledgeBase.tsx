
import React, { useState, useRef, useEffect } from 'react';
import TemplateManager from './TemplateManager';
import { processKnowledgeSource } from '../services/gemini';
import { KnowledgeSource } from '../types';
import { BookMarked, Database, UploadCloud, Link as LinkIcon, FileText, Youtube, Loader2, Tag, Trash2, ExternalLink } from 'lucide-react';

const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'storage' | 'templates'>('storage');
  
  // Storage State
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSources = localStorage.getItem('knowledgeSources');
    if (savedSources) setSources(JSON.parse(savedSources));
  }, []);

  const saveSources = (newSources: KnowledgeSource[]) => {
    setSources(newSources);
    try {
        localStorage.setItem('knowledgeSources', JSON.stringify(newSources));
    } catch (e) {
        alert("Storage full! Please delete some items.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsProcessing(true);
    
    try {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            // Simulate Backend Processing
            const result = await processKnowledgeSource(
                file.name,
                base64,
                file.type,
                ['User Upload']
            );
            saveSources([result, ...sources]);
            setIsProcessing(false);
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        console.error(error);
        setIsProcessing(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!uploadUrl.trim()) return;
    setIsProcessing(true);
    
    try {
        const type = uploadUrl.includes('youtube') ? 'youtube/link' : 'link';
        const result = await processKnowledgeSource(
            uploadUrl, // Name initially is URL, service will fix title
            uploadUrl,
            type,
            ['Web Resource']
        );
        saveSources([result, ...sources]);
        setUploadUrl('');
    } catch (error) {
        console.error(error);
        alert("Failed to process link.");
    } finally {
        setIsProcessing(false);
    }
  };

  const deleteSource = (id: string) => {
    if(!window.confirm("Delete this source?")) return;
    saveSources(sources.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-slate-100 mb-4 mx-auto md:mx-0 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('storage')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'storage' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <Database size={18} /> Knowledge Uploads
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <BookMarked size={18} /> Text Templates
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-300">
        
        {activeTab === 'storage' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Upload Panel */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                       <UploadCloud className="text-indigo-600"/> Add Knowledge
                    </h3>
                    
                    <div className="space-y-4">
                       {/* File Upload */}
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all group"
                       >
                          <FileText size={32} className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                          <p className="font-bold text-slate-600 text-sm">Upload Documents</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, Images</p>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*" />
                       </div>

                       {/* URL Upload */}
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Web or YouTube Link</label>
                          <div className="flex gap-2">
                             <input 
                               value={uploadUrl} 
                               onChange={e => setUploadUrl(e.target.value)} 
                               placeholder="https://..." 
                               className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                               onKeyDown={e => e.key === 'Enter' && handleUrlUpload()}
                             />
                             <button 
                               onClick={handleUrlUpload}
                               disabled={!uploadUrl || isProcessing}
                               className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                             >
                                {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <LinkIcon size={20}/>}
                             </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Supports YouTube Playlists (will be processed as a collection).</p>
                       </div>
                    </div>
                 </div>

                 {/* Stats */}
                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2">Library Stats</h4>
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs text-indigo-700">Total Sources</span>
                       <span className="font-bold text-indigo-900">{sources.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-indigo-700">Processed Chunks</span>
                       <span className="font-bold text-indigo-900">{sources.reduce((acc, s) => acc + (s.chunks?.length || 0), 0)}</span>
                    </div>
                 </div>
              </div>

              {/* List Panel */}
              <div className="lg:col-span-2 space-y-4">
                 <h3 className="font-bold text-lg text-slate-800 px-2">Library Content</h3>
                 {sources.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                       <Database size={48} className="mx-auto mb-2 text-slate-300" />
                       <p className="text-sm">No sources added yet.</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {sources.map(source => (
                          <div key={source.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all group">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-lg ${source.mimeType.includes('youtube') ? 'bg-red-50 text-red-600' : source.mimeType.includes('pdf') ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                      {source.mimeType.includes('youtube') ? <Youtube size={20}/> : <FileText size={20}/>}
                                   </div>
                                   <div>
                                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{source.metadata.title}</h4>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                         <span>{new Date(source.metadata.created_at).toLocaleDateString()}</span>
                                         <span>•</span>
                                         <span className="uppercase">{source.metadata.type}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                   {source.mimeType.includes('http') && (
                                     <a href={source.content} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600">
                                        <ExternalLink size={16}/>
                                     </a>
                                   )}
                                   <button onClick={() => deleteSource(source.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500">
                                      <Trash2 size={16}/>
                                   </button>
                                </div>
                             </div>
                             
                             <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg">
                                {source.metadata.summary}
                             </p>

                             <div className="flex flex-wrap gap-2 items-center">
                                <Tag size={12} className="text-slate-400" />
                                {source.metadata.tags.map(tag => (
                                   <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                      {tag}
                                   </span>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'templates' && <TemplateManager />}
      </div>
    </div>
  );
};

export default KnowledgeBase;
