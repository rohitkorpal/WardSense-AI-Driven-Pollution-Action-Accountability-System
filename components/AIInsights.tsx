import React from 'react';
import { Ward, UserRole, AIRecommendation, AIAnalysisResult } from '../types';

interface AIInsightsProps {
  ward: Ward;
  role: UserRole;
  analysis: AIAnalysisResult | null;
  loading: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ ward, role, analysis, loading }) => {
  const recommendations = analysis?.recommendations || [];
  const groundingUrls = analysis?.groundingUrls || [];
  const trendAnalysis = analysis?.trendAnalysis || '';
  const news = analysis?.news || [];

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-indigo-500/30 shadow-2xl flex flex-col h-full min-h-[400px]">
      {/* Header with Terminal Aesthetic */}
      <div className="bg-slate-900/80 p-4 border-b border-indigo-500/20 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
          <div className="font-mono text-xs text-indigo-400 font-bold tracking-wider ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            GEMINI_INTELLIGENCE_NODE_v3.0
          </div>
        </div>
        {loading ? (
           <span className="font-mono text-[10px] text-indigo-300 animate-pulse">PROCESSING DATA STREAM...</span>
        ) : (
           <span className="font-mono text-[10px] text-green-400">● SYSTEM ONLINE</span>
        )}
      </div>

      <div className="p-6 flex-1 bg-slate-900/40 relative overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-4 font-mono">
            <div className="h-2 bg-indigo-500/20 rounded w-3/4 animate-pulse"></div>
            <div className="h-2 bg-indigo-500/20 rounded w-1/2 animate-pulse delay-75"></div>
            <div className="h-2 bg-indigo-500/20 rounded w-5/6 animate-pulse delay-150"></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
               <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
               <p className="text-xs text-indigo-300 font-mono tracking-widest text-center">
                 SEARCHING GLOBAL NEWS DATABASE<br/>& ANALYZING TRENDS
               </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Historical Trend Section */}
            {trendAnalysis && (
              <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-lg mb-6">
                 <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                    <h3 className="text-xs font-bold text-indigo-200 font-mono uppercase tracking-wider">Historical Context</h3>
                 </div>
                 <p className="text-sm text-indigo-100/80 leading-relaxed font-sans border-l-2 border-indigo-500/50 pl-3">
                   {trendAnalysis}
                 </p>
              </div>
            )}

            {/* Recommendations */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-indigo-500 font-mono text-sm">{'>'}</span>
                <h3 className="text-sm font-bold text-white font-mono uppercase">Strategic Recommendations</h3>
              </div>
              
              {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                <div 
                  key={rec.id} 
                  className="group relative bg-slate-800/50 hover:bg-slate-800/80 p-4 rounded-r-xl rounded-bl-xl border-l-2 transition-all duration-300 hover:translate-x-1 mb-3"
                  style={{
                    borderColor: rec.type === 'urgent' ? '#ef4444' : rec.type === 'policy' ? '#3b82f6' : '#10b981',
                    animationDelay: `${idx * 100}ms`
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-200 text-sm font-mono tracking-tight group-hover:text-white transition-colors">
                      {rec.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-mono font-bold ${
                      rec.type === 'urgent' ? 'bg-red-500/20 text-red-400' : 
                      rec.type === 'policy' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans group-hover:text-slate-300">
                    {rec.description}
                  </p>
                </div>
              )) : (
                <p className="text-xs text-slate-500 italic">No recommendations available.</p>
              )}
            </div>

            {/* Latest News Section */}
            {news && news.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-indigo-500 font-mono text-sm">{'>'}</span>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">Latest Intelligence / News</h3>
                </div>
                <div className="space-y-3">
                  {news.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/30 p-3 rounded border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <h4 className="text-slate-200 text-xs font-bold mb-1 line-clamp-1">{item.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {item.source && (
                             <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">{item.source}</span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">{item.timeAgo}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-snug line-clamp-2">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grounding Sources Display */}
            {groundingUrls.length > 0 && (
              <div className="mt-6 pt-4 border-t border-dashed border-slate-700">
                <p className="text-[10px] font-mono text-slate-500 mb-3 uppercase flex items-center gap-1">
                   <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                   News Sources & References
                </p>
                <div className="flex flex-col gap-2">
                  {groundingUrls.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 bg-slate-800/40 p-2.5 rounded border border-slate-700/50 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all group"
                    >
                      <div className="shrink-0 w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </div>
                      <div className="min-w-0">
                         <div className="text-xs text-slate-300 font-medium truncate group-hover:text-white transition-colors">{source.title || 'Data Source'}</div>
                         <div className="text-[10px] text-slate-500 font-mono truncate">{(() => {
                            try { return new URL(source.uri).hostname } catch { return source.uri }
                         })()}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;