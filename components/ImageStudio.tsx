
import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { Loader2, Download, Sparkles, Image as ImageIcon, Sliders } from 'lucide-react';

const ImageStudio: React.FC = () => {
  // Pre-filled prompt
  const [prompt, setPrompt] = useState('Ein futuristisches Gewächshaus auf dem Mars, warme Beleuchtung, Pflanzen, 4k Render, Unreal Engine');
  
  const [aspectRatio, setAspectRatio] = useState<any>('1:1');
  const [stylePreset, setStylePreset] = useState('None');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const url = await generateImage(prompt, aspectRatio, stylePreset, negativePrompt);
      setResult(url);
    } catch (error) {
      console.error(error);
      alert('Generierung fehlgeschlagen. Bitte prüfe dein Guthaben oder den Prompt.');
    } finally {
      setLoading(false);
    }
  };

  const aspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const styles = ['None', 'Fotorealistisch', 'Anime', 'Ölgemälde', 'Cyberpunk', 'Aquarell', '3D Render', 'Skizze'];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Sparkles className="text-amber-500" />
          Kreativ Studio
        </h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Beschreibe dein Bild</label>
            <textarea
              placeholder="Ein magischer Wald mit schwebenden Laternen im Pixar-Stil..."
              className="w-full min-h-[100px] bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 text-slate-700 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Format</label>
            <div className="flex flex-wrap gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    aspectRatio === ratio 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Sliders size={14} />
            {showAdvanced ? 'Weniger Optionen' : 'Erweiterte Einstellungen'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stil-Voreinstellung</label>
                  <select 
                    value={stylePreset} 
                    onChange={(e) => setStylePreset(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Negativer Prompt (Was vermeiden?)</label>
                  <input 
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="unscharf, schlechte qualität, verzerrt..."
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
               </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
            {loading ? 'Erstelle Kunstwerk...' : 'Bild Generieren'}
          </button>
        </div>
      </div>

      {(result || loading) && (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-center min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse">Die KI malt deine Vision...</p>
            </div>
          ) : result ? (
            <div className="relative group w-full flex flex-col items-center">
              <img 
                src={result} 
                alt="AI Generated" 
                className="rounded-2xl max-h-[600px] object-contain shadow-2xl"
              />
              <a
                href={result}
                download="ai-image.png"
                className="mt-6 flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-full hover:bg-slate-900 transition-all font-medium text-sm"
              >
                <Download size={18} />
                Download (Hohe Qualität)
              </a>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ImageStudio;
