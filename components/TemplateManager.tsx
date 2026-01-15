
import React, { useState, useEffect } from 'react';
import { Template } from '../types';
import { Trash2, Copy, BookMarked, Search, Plus } from 'lucide-react';

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('templates');
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('templates', JSON.stringify(updated));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  const filtered = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookMarked className="text-indigo-600" />
          My Library
        </h3>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search your templates..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center text-center space-y-4 border-2 border-dashed border-slate-200 text-slate-400">
          <BookMarked size={48} />
          <p className="font-medium text-lg text-slate-600">Your library is empty</p>
          <p className="text-sm max-w-xs">Use the Writing Assistant to create and save improved versions of your texts as templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-800 line-clamp-1">{template.title}</h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyToClipboard(template.content)}
                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => deleteTemplate(template.id)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                {template.content}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {template.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
