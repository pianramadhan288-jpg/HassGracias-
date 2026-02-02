
import React, { useState, useEffect } from 'react';
import { AnalysisResult, TradePlan } from '../types';
import { TrendingUp, TrendingDown, Minus, Copy, CheckCircle, Clock, Lock, Target, AlertTriangle, Archive, FileText, BarChart3, Activity, Eye, Maximize2 } from 'lucide-react';

interface AnalysisCardProps {
  data: AnalysisResult;
  onSave?: (data: AnalysisResult) => void;
  isSaved?: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ data, onSave, isSaved = false }) => {
  const [activeTab, setActiveTab] = useState<'SHORT' | 'MEDIUM' | 'LONG'>('SHORT');
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    if (data.strategy.bestTimeframe) setActiveTab(data.strategy.bestTimeframe);
  }, [data]);

  const activePlan = activeTab === 'SHORT' ? data.strategy.shortTerm : activeTab === 'MEDIUM' ? data.strategy.mediumTerm : data.strategy.longTerm;
  const isForbidden = activePlan.status === 'FORBIDDEN';

  const getPlanByTF = (tf: string) => {
    if (tf === 'SHORT') return data.strategy.shortTerm;
    if (tf === 'MEDIUM') return data.strategy.mediumTerm;
    return data.strategy.longTerm;
  };

  const bidRaw = data.supplyDemand?.bidStrength || 0;
  const offerRaw = data.supplyDemand?.offerStrength || 0;
  const totalFlow = bidRaw + offerRaw || 1; 
  const bidPct = Math.round((bidRaw / totalFlow) * 100);
  const offerPct = 100 - bidPct;

  const handleCopy = async () => {
    const textBuffer = `
[TRADELOGIC INTELLIGENCE REPORT]
TICKER: ${data.ticker}
PRICE: ${data.priceInfo.current} (${data.priceInfo.diffPercent}% vs Avg)
SCORE: ${data.stressTest.score}/100
VERDICT: ${activePlan.verdict}

--- EXECUTIVE SUMMARY ---
${data.summary}

--- MARKET STRUCTURE ---
Bid/Offer Balance: ${bidPct}% vs ${offerPct}%
Order Flow Status: ${data.supplyDemand.verdict}
Bandar Insight: ${data.brokerAnalysis.insight}

--- STRATEGY (${activeTab} TERM) ---
Entry: ${activePlan.entry}
Target: ${activePlan.tp}
Stop Loss: ${activePlan.sl}
Rationale: ${activePlan.reasoning}

--- FAILURE MODE (BEAR CASE) ---
${data.bearCase}
    `.trim();

    try {
      await navigator.clipboard.writeText(textBuffer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const Card = ({ children, className = '', title, icon, action }: any) => (
      <div className={`bg-[#111] border border-[#222] rounded-3xl p-6 relative overflow-hidden ${className}`}>
          {title && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-500">
                    {icon && React.cloneElement(icon, { size: 16 })}
                    <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
                </div>
                {action}
              </div>
          )}
          {children}
      </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
              <div className="flex items-center gap-3">
                  <h1 className="text-5xl font-bold text-white tracking-tighter">{data.ticker}</h1>
                  <span className="px-3 py-1 bg-[#222] text-slate-300 text-xs font-bold rounded-full border border-[#333]">{data.marketCapAnalysis.category}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl font-mono text-slate-200">{data.priceInfo.current}</span>
                  <span className={`text-sm font-bold ${data.priceInfo.diffPercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {data.priceInfo.diffPercent > 0 ? '+' : ''}{data.priceInfo.diffPercent}% vs Avg
                  </span>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={handleCopy} className="p-3 bg-[#222] hover:bg-[#333] text-slate-300 rounded-xl border border-[#333] transition-all flex items-center justify-center min-w-[50px]">
                  {copied ? <CheckCircle size={20} className="text-emerald-400" /> : <Copy size={20} />}
              </button>
              <button onClick={() => { if(onSave && !localSaved) { onSave(data); setLocalSaved(true); }}} disabled={localSaved} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${localSaved ? 'bg-[#222] text-slate-500' : 'bg-white text-black hover:bg-slate-200'}`}>
                  {localSaved ? <CheckCircle size={16}/> : <Archive size={16} />} {localSaved ? 'Saved' : 'Save Case'}
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-4 bg-gradient-to-br from-[#111] to-[#0a0a0a]">
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-xs font-bold text-slate-500 uppercase">Forensic Score</span>
                      <div className={`text-6xl font-bold mt-2 ${data.stressTest.score >= 70 ? 'text-emerald-400' : data.stressTest.score >= 40 ? 'text-amber-400' : 'text-rose-500'}`}>
                          {data.stressTest.score}
                      </div>
                  </div>
                  <div className="h-16 w-16 rounded-full border-4 border-[#222] flex items-center justify-center">
                       <Activity className="text-slate-500" />
                  </div>
              </div>
              <div className="mt-4 text-sm text-slate-400 leading-relaxed">"{data.summary}"</div>
          </Card>

          <Card className="md:col-span-4" title="AI Projection" icon={<Target />}>
              <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${data.prediction.direction === 'UP' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {data.prediction.direction === 'UP' ? <TrendingUp size={32} /> : data.prediction.direction === 'DOWN' ? <TrendingDown size={32} /> : <Minus size={32} />}
                  </div>
                  <div>
                      <div className="text-2xl font-bold text-white">{data.prediction.direction}</div>
                      <div className="text-xs text-slate-500 font-mono">Confidence: {data.prediction.probability}%</div>
                  </div>
              </div>
              <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${data.prediction.direction === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${data.prediction.probability}%` }}></div>
              </div>
          </Card>

           <Card className="md:col-span-4" title="Order Flow Ratio" icon={<BarChart3 />}>
              <div className="flex justify-between text-xs font-bold mb-2">
                   <span className="text-emerald-400">BID: {bidPct}%</span>
                   <span className="text-rose-400">OFFER: {offerPct}%</span>
               </div>
               <div className="h-4 w-full bg-[#222] rounded-full overflow-hidden flex mb-4">
                   <div className="h-full bg-emerald-500" style={{ width: `${bidPct}%` }}></div>
                   <div className="h-full bg-rose-500" style={{ width: `${offerPct}%` }}></div>
               </div>
               <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-400 font-mono text-center uppercase tracking-wide">{data.supplyDemand?.verdict}</div>
                    <div className="text-[10px] text-slate-600">Raw Score: {bidRaw}/{offerRaw}</div>
               </div>
          </Card>

          {/* EVIDENCE SECTION (MULTI-IMAGE SUPPORT) */}
          {data.evidenceImages && data.evidenceImages.length > 0 && (
            <Card 
              className="md:col-span-12" 
              title={`Original Evidence (${data.evidenceImages.length} Files)`} 
              icon={<Eye />}
              action={
                <button 
                  onClick={() => setShowEvidence(!showEvidence)} 
                  className="px-3 py-1 bg-[#222] text-[10px] font-bold text-slate-400 rounded-lg hover:text-white transition-all uppercase flex items-center gap-1"
                >
                  <Maximize2 size={12} /> {showEvidence ? 'Collapse' : 'Expand'}
                </button>
              }
            >
              <div className={`transition-all duration-500 overflow-hidden ${showEvidence ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.evidenceImages.map((imgSrc, idx) => (
                    <div key={idx} className="bg-black rounded-2xl overflow-hidden border border-[#222] aspect-video relative group">
                      <img src={imgSrc} alt={`Evidence ${idx + 1}`} className="w-full h-full object-contain" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-[10px] font-mono text-white">
                        IMG_0{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {!showEvidence && (
                <div className="mt-2 text-[10px] text-slate-600 font-mono uppercase italic">
                  {data.evidenceImages.length} Visual data points embedded. Click expand to verify AI extraction.
                </div>
              )}
            </Card>
          )}

          <Card className="md:col-span-8 min-h-[300px]" title="Execution Strategy" icon={<Clock />}>
              <div className="flex gap-2 mb-6 border-b border-[#222]">
                  {['SHORT', 'MEDIUM', 'LONG'].map(tf => {
                      const planForTF = getPlanByTF(tf);
                      const showBestBadge = data.strategy.bestTimeframe === tf && 
                                          (planForTF.status === 'RECOMMENDED' || planForTF.status === 'POSSIBLE');
                      
                      return (
                        <button key={tf} onClick={() => setActiveTab(tf as any)} 
                            className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === tf ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                            {tf} TERM {showBestBadge && <span className="ml-2 text-emerald-400 tracking-tighter">• BEST</span>}
                        </button>
                      );
                  })}
              </div>
              
              {isForbidden ? (
                  <div className="p-3 md:p-6 bg-rose-950/20 border border-rose-500/20 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-rose-500 shrink-0">
                          <AlertTriangle size={16} />
                          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider">Forbidden</h3>
                      </div>
                      <p className="text-rose-200/70 text-[11px] md:text-sm leading-tight md:leading-relaxed border-l-2 border-rose-500/20 pl-2 md:pl-4 md:border-l">
                          {activePlan.reasoning}
                      </p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                      <div className="space-y-4 col-span-1">
                          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Entry</div>
                              <div className="text-lg font-mono text-blue-400">{activePlan.entry}</div>
                          </div>
                          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target</div>
                              <div className="text-lg font-mono text-emerald-400">{activePlan.tp}</div>
                          </div>
                          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stop Loss</div>
                              <div className="text-lg font-mono text-rose-400">{activePlan.sl}</div>
                          </div>
                      </div>
                      <div className="col-span-2 p-6 bg-[#1a1a1a] rounded-xl border border-[#333]">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-3">Rationale</div>
                          <p className="text-slate-200 leading-relaxed text-sm">{activePlan.reasoning}</p>
                          <div className={`mt-4 inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${activePlan.status === 'RECOMMENDED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              VERDICT: {activePlan.verdict}
                          </div>
                      </div>
                  </div>
              )}
          </Card>

          <Card className="md:col-span-4" title="Failure Mode" icon={<AlertTriangle />}>
               <p className="text-rose-200/80 text-sm leading-relaxed">{data.bearCase}</p>
          </Card>

          <Card className="md:col-span-12" title="Forensic Log" icon={<FileText />}>
              <div className="bg-[#0a0a0a] p-6 rounded-xl border border-[#222] font-mono text-xs text-slate-400 leading-loose h-64 overflow-y-auto">
                  <p className="whitespace-pre-line">{data.fullAnalysis}</p>
              </div>
          </Card>
      </div>
    </div>
  );
};

export default AnalysisCard;
