import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import { Ward } from '../types';
import { getAQIColor } from '../constants';

interface PollutionChartProps {
  ward: Ward;
}

const PollutionChart: React.FC<PollutionChartProps> = ({ ward }) => {
  // Helper to generate dynamic day labels (e.g., Today, Yest, Mon)
  const getDayLabel = (daysAgo: number) => {
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yest';
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const trendData = ward.trend.map((val, idx) => ({
    day: getDayLabel(6 - idx), // idx 6 is Today (0 days ago), idx 0 is 6 days ago
    aqi: val
  }));

  // Helper to determine color based on value thresholds similar to AQI
  // We approximate severity for individual pollutants since standard breakpoints vary per pollutant.
  const getPollutantColor = (value: number, type: string) => {
     // Simplistic scaling relative to standard limits
     // PM2.5 > 60 is Unhealthy
     // PM10 > 100 is Unhealthy
     // NO2 > 80 is Unhealthy
     let normalizedAQI = value; 
     if (type === 'PM2.5') normalizedAQI = value * 2; 
     if (type === 'PM10') normalizedAQI = value * 1; 
     if (type === 'NO2') normalizedAQI = value * 2;
     
     return getAQIColor(normalizedAQI);
  };

  const pollutantData = [
    { name: 'PM2.5', value: ward.pollutants.pm25, color: getPollutantColor(ward.pollutants.pm25, 'PM2.5') },
    { name: 'PM10', value: ward.pollutants.pm10, color: getPollutantColor(ward.pollutants.pm10, 'PM10') },
    { name: 'NO2', value: ward.pollutants.no2, color: getPollutantColor(ward.pollutants.no2, 'NO2') },
    { name: 'SO2', value: ward.pollutants.so2, color: getPollutantColor(ward.pollutants.so2, 'SO2') },
  ];

  const currentAqiColor = getAQIColor(ward.aqi);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 rounded-xl shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 font-mono">7-Day Trend Analysis</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentAqiColor} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={currentAqiColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}
                itemStyle={{ color: currentAqiColor }}
              />
              <Area 
                type="monotone" 
                dataKey="aqi" 
                stroke={currentAqiColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAqi)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5 rounded-xl shadow-lg relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 font-mono">Pollutant Breakdown (µg/m³)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pollutantData} layout="vertical" barSize={28} margin={{ right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={45} 
                tick={{fontSize: 11, fill: '#e2e8f0', fontWeight: 600}} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <LabelList 
                  dataKey="value" 
                  position="insideLeft" 
                  offset={10} 
                  fill="#ffffff" 
                  fontSize={11} 
                  fontWeight="bold" 
                  style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
                />
                {pollutantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PollutionChart;