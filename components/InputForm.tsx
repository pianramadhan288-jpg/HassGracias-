
import React, { useState, useCallback, useRef } from 'react';
import { StockAnalysisInput, AppConfig, CapitalTier, ImageAsset } from '../types';
import { ChevronRight, Zap, Shield, Terminal, Image as ImageIcon, Check, Trash2, Plus, Eye, Wallet, ShieldCheck, Lock, BrainCircuit } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: StockAnalysisInput) => void;
  loading: boolean;
  defaultConfig?: AppConfig;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, loading, defaultConfig }) => {
  const [ticker, setTicker] = useState('');
  const [capital, setCapital] = useState('');
  const [tier, setTier] = useState<CapitalTier>(defaultConfig?.defaultTier || 'RETAIL');
  const [rawText, setRawText] = useState('');
  const [images, setImages] = useState<ImageAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const newImage: ImageAsset = {
          id: crypto.randomUUID(),
          base64: base64String,
          mimeType: file.type,
          preview: reader.result as string
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !capital || !rawText) return;

    const input: StockAnalysisInput = {
      ticker: ticker.toUpperCase(),
      price: "0",
      capital,
      capitalTier: tier,
      riskProfile: defaultConfig?.riskProfile || 'BALANCED',
      images: images,
      rawIntelligenceData: rawText
    };

    onSubmit(input);
  };

  const tiers: { id: CapitalTier; label: string; range: string; icon: any; strategy: string }[] = [
    { 
        id: 'MICRO', 
        label: 'MICRO', 
        range: '< 100 Juta', 
        icon: <Zap size={14} />,
        strategy: 'MODE: GUERRILLA. AI akan sangat protektif terhadap fee transaksi & potensi nyangkut. Fokus pada perputaran kas cepat.'
    },
    { 
        id: 'RETAIL', 
        label: 'RETAIL', 
        range: '100Jt - 1M', 
        icon: <Wallet size={14} />,
        strategy: 'MODE: GROWTH. AI menggunakan standar analisis trend & fundamental klasik. Keseimbangan antara profit & keamanan.'
    },
    { 
        id: 'HIGH_NET', 
        label: 'HIGH NET', 
        range: '1M - 10M', 
        icon: <ShieldCheck size={14} />,
        strategy: 'MODE: WEALTH. AI fokus pada preservasi aset & dividen. Menghindari saham gorengan yang terlalu volatile.'
    },
    { 
        id: 'INSTITUTIONAL', 
        label: 'WHALE', 
        range: '> 10 Miliar', 
        icon: <Lock size={14} />,
        strategy: 'MODE: MARKET MAKER. AI fokus pada Likuiditas (Bid/Offer). Menganalisa apakah market sanggup menampung uang Anda.'
    }
  ];

  const activeTierInfo = tiers.find(t => t.id === tier);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER: MANDATE & VISION STATUS */}
      <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1 bg-[#0a0a0a] border border-[#151515] rounded-3xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Target Mandate</span>
                    </div>
                    <div className="px-2 py-0.5 bg-indigo-500/10 rounded text-[9px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-tighter">
                        {defaultConfig?.riskProfile}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="TICKER" 
                      value={ticker} 
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      className="bg-transparent border-b border-[#222] py-2 text-2xl font-black text-white focus:border-white outline-none transition-all placeholder:text-slate-800"
                    />
                    <input 
                      type="number" 
                      placeholder="CAPITAL (IDR)" 
                      value={capital} 
                      onChange={(e) => setCapital(e.target.value)}
                      className="bg-transparent border-b border-[#222] py-2 text-xl font-mono text-white focus:border-white outline-none transition-all placeholder:text-slate-800"
                    />
                </div>
            </div>

            {/* MULTI IMAGE UPLOAD ZONE */}
            <div className="w-full md:w-80 flex flex-col gap-2">
                <label 
                    className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden bg-[#0a0a0a] hover:bg-[#111] group min-h-[140px]
                    ${images.length > 0 ? 'border-indigo-500/30' : 'border-[#151515] hover:border-slate-700'}`}
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                    <div className="flex flex-col items-center p-4">
                        <div className={`p-3 rounded-full mb-2 transition-colors ${images.length > 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#151515] text-slate-600 group-hover:text-indigo-400'}`}>
                           {images.length > 0 ? <Plus size={20} /> : <ImageIcon size={20} />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-tighter leading-tight">
                            {images.length > 0 ? 'Add More Evidence' : 'Paste or Upload Images'}
                        </span>
                        {images.length > 0 && (
                            <span className="mt-1 text-[9px] font-mono text-indigo-400">{images.length} files encoded (HD)</span>
                        )}
                    </div>
                </label>
            </div>
          </div>

          {/* IMAGE PREVIEW GRID */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 animate-in slide-in-from-top-4 duration-300">
                {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#222] group">
                        <img src={img.preview} alt="Evidence" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                        <button 
                            type="button" 
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-1 right-1 p-1.5 bg-black/80 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-rose-600"
                        >
                            <Trash2 size={12} />
                        </button>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                            <Eye size={8} /> HD
                        </div>
                    </div>
                ))}
            </div>
          )}
      </div>

      {/* TIER SELECTION & STRATEGY EXPLANATION */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tiers.map((t) => (
                <button 
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all group ${tier === t.id ? 'bg-white border-white text-black' : 'bg-[#0a0a0a] border-[#222] text-slate-500 hover:border-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        {t.icon}
                        <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                    </div>
                    <span className={`text-[9px] font-mono ${tier === t.id ? 'text-slate-600' : 'text-slate-600 group-hover:text-slate-400'}`}>{t.range}</span>
                </button>
            ))}
        </div>
        
        {/* Dynamic Strategy Description Box */}
        {activeTierInfo && (
             <div className="bg-[#111] border border-[#222] p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <BrainCircuit size={16} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">AI Logic: {activeTierInfo.label} Protocol</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        {activeTierInfo.strategy}
                    </p>
                </div>
             </div>
        )}
      </div>

      {/* TERMINAL: THE DATA RESERVOIR */}
      <div className="bg-[#050505] border border-[#151515] rounded-[32px] overflow-hidden shadow-2xl">
          <div className="h-12 bg-[#0a0a0a] border-b border-[#151515] px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="ml-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Terminal size={12}/> Intelligence Terminal
                  </span>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-[9px] font-mono text-slate-700 uppercase tracking-tighter">Encoding: UTF-8</span>
                  <div className="h-4 w-px bg-[#222]"></div>
                  <button type="button" onClick={() => setRawText('')} className="text-[9px] font-bold text-slate-600 hover:text-rose-500 uppercase tracking-widest">Clear</button>
              </div>
          </div>
          <div className="relative">
              <textarea 
                placeholder="TEMPEL DATA FULL ANDA DISINI (Fundamental, Monte Carlo, Order Book, dll)..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onPaste={handlePaste}
                className="w-full min-h-[500px] bg-transparent p-8 text-slate-300 font-mono text-[11px] leading-relaxed outline-none resize-none"
              />
              <div className="absolute bottom-8 right-8 pointer-events-none opacity-5 flex flex-col items-end">
                  <Zap size={64} />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Forensic Active</span>
              </div>
          </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="flex flex-col md:flex-row items-center justify-end gap-6 px-2">
        <button 
          type="submit" 
          disabled={loading || !ticker || !capital || !rawText}
          className={`w-full md:w-auto px-12 py-5 rounded-2xl font-black text-xs flex items-center justify-center gap-4 transition-all tracking-[0.2em] ${loading ? 'bg-indigo-900 text-indigo-400 cursor-wait' : 'bg-white text-black hover:bg-slate-200 hover:-translate-y-1 active:translate-y-0'}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              CROSS-AUDITING DATA...
            </>
          ) : (
            <>
              EXECUTE FORENSIC AUDIT
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default InputForm;
