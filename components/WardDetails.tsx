import React from 'react';
import { Ward, PollutionSeverity, AISourceAttribution } from '../types';
import { getSeverity, getSeverityTextColor } from '../constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface WardDetailsProps {
  ward: Ward;
  userLocation: { lat: number; lng: number } | null;
  isNearest: boolean;
  sourceBreakdown?: AISourceAttribution[];
  loadingAI: boolean;
}

const WardDetails: React.FC<WardDetailsProps> = ({ ward, userLocation, isNearest, sourceBreakdown, loadingAI }) => {
  
  // Prepare data for Radar Chart
  const radarData = [
    { subject: 'PM2.5', value: ward.pollutants.pm25, fullMark: 500 },
    { subject: 'PM10', value: ward.pollutants.pm10, fullMark: 500 },
    { subject: 'NO2', value: ward.pollutants.no2, fullMark: 200 },
    { subject: 'SO2', value: ward.pollutants.so2, fullMark: 100 },
    { subject: 'O3', value: ward.pollutants.o3, fullMark: 200 },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 shadow-2xl relative overflow-hidden transition-all duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">{ward.name}</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">ID: {ward.id}</p>
          {isNearest && (
             <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
               Nearest Node
             </span>
          )}
        </div>
        <div className="text-center">
           <div className={`text-4xl font-black ${getSeverityTextColor(ward.aqi)}`}>{ward.aqi}</div>
           <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">AQI INDEX</div>
        </div>
      </div>

      {/* Heuristic/Static Sources */}
      <div className="space-y-4 relative z-10 mb-6">
        <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-1">
          Initial Vector Assessment
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono mb-1">PRIMARY</div>
                <div className="font-bold text-slate-200 text-xs truncate" title={ward.primarySource}>{ward.primarySource}</div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 h-1 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]" style={{width: '75%'}}></div>
                </div>
            </div>
            <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono mb-1">SECONDARY</div>
                <div className="font-bold text-slate-200 text-xs truncate" title={ward.secondarySource}>{ward.secondarySource}</div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
                    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-1 rounded-full" style={{width: '45%'}}></div>
                </div>
            </div>
        </div>
      </div>

      {/* Pollutant Composition Radar */}
      <div className="relative z-10 mb-6">
        <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">
          Pollutant Signature
        </h4>
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '6px', border: '1px solid #475569', color: '#f8fafc', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#818cf8', padding: 0 }}
                        formatter={(value: number) => [`${value} µg/m³`, 'Concentration']}
                        labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem', fontWeight: 'bold' }}
                    />
                    <Radar
                        name="Concentration"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.3}
                        isAnimationActive={true}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* AI Forensic Analysis */}
      <div className="relative z-10">
        <h4 className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest border-b border-indigo-900/50 pb-1 mb-3 flex justify-between items-center">
          <span>AI Forensic Breakdown</span>
          {loadingAI && <span className="animate-pulse">ANALYZING...</span>}
        </h4>
        
        {loadingAI ? (
           <div className="space-y-2">
             <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
             <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse delay-75"></div>
             <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse delay-150"></div>
           </div>
        ) : sourceBreakdown && sourceBreakdown.length > 0 ? (
           <div className="space-y-3">
              {sourceBreakdown.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-1">
                       <span className="text-xs text-slate-300 font-medium">{item.source}</span>
                       <div className="flex items-center gap-2">
                          {item.confidence === 'High' && <span className="text-[9px] text-emerald-500 font-mono bg-emerald-500/10 px-1 rounded">HIGH CONF</span>}
                          <span className="text-xs font-mono font-bold text-indigo-300">{item.percentage}%</span>
                       </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors duration-300 relative" 
                         style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                       >
                         {/* Shimmer effect */}
                         <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                       </div>
                    </div>
                  </div>
              ))}
           </div>
        ) : (
           <div className="p-3 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
             Detailed source data unavailable.
           </div>
        )}
      </div>

      {/* Population & Condition Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
         <div className="text-center p-2 rounded hover:bg-slate-800/50 transition-colors">
            <p className="text-[10px] text-slate-500 font-mono uppercase">Population Risk</p>
            <p className="font-bold text-white text-lg">{ward.population.toLocaleString()}</p>
         </div>
         <div className="text-center p-2 rounded hover:bg-slate-800/50 transition-colors">
            <p className="text-[10px] text-slate-500 font-mono uppercase">Condition</p>
            <p className={`font-bold text-lg ${getSeverityTextColor(ward.aqi)}`}>
              {getSeverity(ward.aqi)}
            </p>
         </div>
      </div>
    </div>
  );
};

export default WardDetails;