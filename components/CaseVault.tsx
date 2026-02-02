import React, { useRef, useState, useMemo, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { FolderOpen, Trash2, Download, Upload, Layers, CheckSquare, Square } from 'lucide-react';

interface CaseVaultProps {
  onLoadCase: (data: AnalysisResult) => void;
  onDeleteCase: (id: string) => void; 
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onRunConsistency: (selectedCases: AnalysisResult[]) => void;
  cases: AnalysisResult[];
}

const ScoreSparkline = ({ history }: { history: AnalysisResult[] }) => {
    if (history.length < 2) return null;
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const scores = sorted.map(h => h.stressTest.score);
    const max = 100; const width = 100; const height = 30;
    const points = scores.map((score, i) => `${(i / (scores.length - 1)) * width},${height - (score / max) * height}`).join(' ');
    const lastScore = scores[scores.length - 1]; const prevScore = scores[scores.length - 2];
    
    return (
        <div className="mt-4 pt-3 border-t border-[#333]">
            <svg width="100%" height={height} className="overflow-visible opacity-50">
                <polyline points={points} fill="none" stroke={lastScore >= prevScore ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
};

const CaseVault: React.FC<CaseVaultProps> = ({ onLoadCase, onDeleteCase, onImport, onExport, onRunConsistency, cases }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // FIX: Sync selection with available cases (Remove Ghost Selection)
  useEffect(() => {
    const validIds = new Set(cases.map(c => c.id || c.ticker));
    setSelectedIds(prev => {
        const newSet = new Set(Array.from(prev).filter(id => validIds.has(id)));
        return newSet.size !== prev.size ? newSet : prev;
    });
  }, [cases]);

  const activeTicker = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const firstId = Array.from(selectedIds)[0];
    const item = cases.find(c => c.id === firstId || (!c.id && c.ticker === firstId));
    return item ? item.ticker : null;
  }, [selectedIds, cases]);

  const toggleSelection = (item: AnalysisResult) => {
    const id = item.id || item.ticker;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-600">
        <FolderOpen size={64} strokeWidth={1} className="mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">Vault Empty</h3>
        <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2 bg-white text-black rounded-lg font-bold text-sm">Import Archives</button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onImport} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-6 border-b border-[#222]">
        <div className="flex gap-2">
            <button onClick={onExport} className="p-2 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 rounded-lg"><Download size={18} /></button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 rounded-lg"><Upload size={18} /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onImport} />
        </div>
        {selectedIds.size >= 2 && (
            <button onClick={() => onRunConsistency(cases.filter(c => selectedIds.has(c.id || c.ticker)))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Layers size={16} /> Audit Trend ({selectedIds.size})
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((item, index) => {
          const isSelected = selectedIds.has(item.id || item.ticker);
          const isDisabled = activeTicker !== null && activeTicker !== item.ticker && !isSelected;
          const bestPlan = item.strategy.bestTimeframe === 'SHORT' ? item.strategy.shortTerm : item.strategy.bestTimeframe === 'MEDIUM' ? item.strategy.mediumTerm : item.strategy.longTerm;

          return (
            <div key={`${item.ticker}-${index}`} onClick={() => !isDisabled && toggleSelection(item)}
                className={`group relative bg-[#111] border rounded-2xl p-6 transition-all duration-300 cursor-pointer ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/20' : isDisabled ? 'opacity-30 border-[#222]' : 'border-[#222] hover:border-[#444] hover:-translate-y-1'}`}>
              
              {/* Header: Title + Date vs Score + Checkbox */}
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h3 className="text-2xl font-bold text-white">{item.ticker}</h3>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</div>
                  </div>
                  
                  {/* Right Side Group: Score & Checkbox */}
                  <div className="flex items-center gap-3">
                      <div className={`text-xl font-bold ${item.stressTest.score >= 70 ? 'text-emerald-500' : item.stressTest.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {item.stressTest.score}
                      </div>
                      
                      {/* Vertical Separator */}
                      <div className="w-px h-6 bg-[#333]"></div>

                      {/* Checkbox */}
                      <div className="text-slate-600 group-hover:text-slate-300 transition-colors">
                          {isSelected ? <CheckSquare className="text-indigo-500" size={20} /> : <Square size={20} />}
                      </div>
                  </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded border ${bestPlan.verdict.includes('BUY') || bestPlan.verdict.includes('ACCUMULATE') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {bestPlan.verdict}
                  </span>
                  <span className="px-2 py-1 text-[10px] font-bold rounded bg-[#222] text-slate-400 border border-[#333]">{item.strategy.bestTimeframe}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={(e) => { e.stopPropagation(); onLoadCase(item); }} className="flex-1 bg-white hover:bg-slate-200 text-black font-bold text-xs py-2 rounded-lg">View</button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteCase(item.id || item.ticker); }} className="p-2 bg-[#222] hover:bg-rose-900/30 hover:text-rose-500 text-slate-500 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CaseVault;