import React, { useState, useEffect } from 'react';
import { UserRole, Ward, AIAnalysisResult } from './types';
import { getSeverity, getSeverityTextColor, getSeverityColor } from './constants';
import WardMap from './components/WardMap';
import PollutionChart from './components/PollutionChart';
import AIInsights from './components/AIInsights';
import WardDetails from './components/WardDetails';
import SearchBar from './components/SearchBar';
import { fetchPollutionData } from './services/pollutionService';
import { generateWardAnalysis } from './services/geminiService';

// Haversine distance helper (returns km)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CITIZEN);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapFocusTrigger, setMapFocusTrigger] = useState<number>(0);
  
  // AI State Management
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      // Default load: Entire Country (no coords passed)
      const data = await fetchPollutionData();
      
      // Sort by AQI Descending (Hazardous first)
      const sortedData = data.sort((a, b) => b.aqi - a.aqi);
      
      setWards(sortedData);
      
      // Select the worst one by default if loaded
      if (sortedData.length > 0) {
        setSelectedWard(sortedData[0]);
      }
      setLoading(false);
    };

    initData();
  }, []);

  // Fetch AI Analysis when selected ward or role changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchAI = async () => {
      if (!selectedWard) return;
      
      setLoadingAI(true);
      setAiAnalysis(null);
      
      const result = await generateWardAnalysis(selectedWard, currentRole);
      
      if (isMounted) {
        setAiAnalysis(result);
        setLoadingAI(false);
      }
    };

    fetchAI();

    return () => { isMounted = false; };
  }, [selectedWard, currentRole]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    // Enable High Accuracy for better map positioning
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const uLoc = { lat: latitude, lng: longitude };
        setUserLocation(uLoc);
        
        // Re-fetch pollution data specific to the user's location (Zoom in)
        const localData = await fetchPollutionData(latitude, longitude);
        
        setWards(prevWards => {
           // Merge Strategy: Keep global data, add/update local data
           const newWards = [...localData];
           const newIds = new Set(newWards.map(w => w.id));
           
           // Filter previous wards
           const keptOldWards = prevWards.filter(oldW => {
               if (newIds.has(oldW.id)) return false;
               
               // Check proximity to any new ward to dedupe different IDs for same location
               const isDuplicateLocation = newWards.some(newW => {
                   const d = getDistanceFromLatLonInKm(oldW.location.lat, oldW.location.lng, newW.location.lat, newW.location.lng);
                   return d < 0.5; 
               });
               
               return !isDuplicateLocation;
           });
           
           const merged = [...newWards, ...keptOldWards].sort((a, b) => b.aqi - a.aqi);
           return merged;
        });

        setIsLocating(false);

        // Find nearest ward from the LOCAL dataset to select it
        if (localData.length > 0) {
          let minDistance = Infinity;
          let nearest: Ward | null = null;

          localData.forEach(ward => {
            const dist = getDistanceFromLatLonInKm(latitude, longitude, ward.location.lat, ward.location.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = ward;
            }
          });

          if (nearest) {
            setSelectedWard(nearest);
            // Optional: force trigger map focus if location didn't change enough to trigger useEffect (edge case)
            setMapFocusTrigger(prev => prev + 1);
          } else {
            setSelectedWard(localData[0]);
          }
        }
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location. Please check permissions and ensure GPS is enabled.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSearchSelect = (searchedWard: Ward) => {
    // 1. Check if we already have this ward (by ID or close proximity)
    // We do this check against the current state before updating
    const existingWard = wards.find(w => 
      w.id === searchedWard.id || 
      getDistanceFromLatLonInKm(w.location.lat, w.location.lng, searchedWard.location.lat, searchedWard.location.lng) < 0.5
    );

    if (existingWard) {
      // Use the existing ward object to ensure ID consistency in UI
      setSelectedWard(existingWard);
      // Force map to focus (zoom) on this existing ward
      setMapFocusTrigger(prev => prev + 1);
    } else {
      // It's a new ward, add it to the list
      setWards(prev => [searchedWard, ...prev]);
      setSelectedWard(searchedWard);
      setMapFocusTrigger(prev => prev + 1);
    }
  };

  // Calculations for Dashboard
  const cityAvgAqi = wards.length > 0 
    ? Math.round(wards.reduce((acc, curr) => acc + curr.aqi, 0) / wards.length)
    : 0;

  if (loading && wards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-mono">INITIALIZING SENSOR ARRAY</h2>
          <p className="text-indigo-400 mt-2 font-mono text-sm animate-pulse">Connecting to World Air Quality Index API...</p>
        </div>
      </div>
    );
  }

  // Safe fallback if selectedWard is null
  const activeWard = selectedWard || wards[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden flex flex-col md:flex-row relative">
      
      {/* Dynamic Background Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 glass-panel border-r border-slate-800 flex flex-col shrink-0 z-20 relative backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white font-mono">WW-PAD</h1>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">SYSTEM ONLINE</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">Perspective</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setCurrentRole(UserRole.CITIZEN)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-3 group ${
                  currentRole === UserRole.CITIZEN 
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-[0_0_15px_rgba(79,70,229,0.2)]' 
                  : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Citizen Monitor
              </button>
              <button 
                onClick={() => setCurrentRole(UserRole.OFFICIAL)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-3 group ${
                  currentRole === UserRole.OFFICIAL 
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-[0_0_15px_rgba(79,70,229,0.2)]' 
                  : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                 <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Authority Dashboard
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">
              {userLocation ? 'Local Overview' : 'Country Overview'}
            </h3>
            <div className="glass-card p-5 rounded-xl border border-slate-700/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                 <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
              <p className="text-slate-400 text-xs mb-1 font-mono">AVG OBSERVED AQI</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-white tracking-tighter">{cityAvgAqi}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded mb-1 uppercase tracking-wide ${
                  cityAvgAqi > 100 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {getSeverity(cityAvgAqi)}
                </span>
              </div>
              <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                 <div 
                   className={`h-full ${getSeverityColor(cityAvgAqi)} transition-all duration-500 shadow-[0_0_10px_currentColor]`} 
                   style={{width: `${Math.min((cityAvgAqi/350)*100, 100)}%`}}
                 ></div>
              </div>
            </div>
          </div>
          
          {/* List of Wards (Top 5 worst if sorted) */}
          <div className="mt-6">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">Top Critical Zones</h3>
             <div className="space-y-2">
               {wards.slice(0, 5).map(w => (
                 <button 
                   key={w.id} 
                   onClick={() => setSelectedWard(w)}
                   className={`w-full text-left p-3 rounded-lg flex justify-between items-center text-xs transition-colors ${selectedWard?.id === w.id ? 'bg-slate-700/50 border border-indigo-500/50' : 'hover:bg-slate-800/30 border border-transparent'}`}
                 >
                   <span className="truncate text-slate-300 w-32">{w.name}</span>
                   <span className={`font-bold font-mono ${getSeverityTextColor(w.aqi)}`}>{w.aqi}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="p-4 text-[10px] text-slate-600 font-mono text-center border-t border-slate-800">
           DATA PROVIDED BY WAQI API
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative">
        {/* Top Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="shrink-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {currentRole === UserRole.CITIZEN ? (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Hyperlocal Monitor</span>
                </>
              ) : (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Command Center</span>
                </>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Real-time sensor data fusion & Gemini 2.5 predictive analysis.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <SearchBar onSelectWard={handleSearchSelect} />
            
            <div className="flex gap-3 shrink-0">
              <button 
                onClick={handleLocateMe}
                disabled={isLocating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group border border-indigo-400/30"
              >
                {isLocating ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
                {isLocating ? 'Triangulating...' : 'Locate Node'}
              </button>
              {currentRole === UserRole.OFFICIAL && (
                <button className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-rose-500/20 transition-all border border-rose-400/30 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  Issue Alert
                </button>
              )}
            </div>
          </div>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Map Area - Spans 2 cols */}
          <div className="xl:col-span-2 space-y-6">
            <WardMap 
              wards={wards} 
              selectedWard={activeWard}
              userLocation={userLocation}
              onSelectWard={setSelectedWard}
              focusTrigger={mapFocusTrigger}
            />
            
            {activeWard && <PollutionChart ward={activeWard} />}
          </div>

          {/* Sidebar Info - Spans 1 col */}
          <div className="space-y-6">
            
            {/* Ward Details Card */}
            {activeWard && (
               <WardDetails 
                 ward={activeWard} 
                 userLocation={userLocation} 
                 isNearest={!!userLocation && selectedWard?.id === activeWard.id}
                 sourceBreakdown={aiAnalysis?.sourceBreakdown}
                 loadingAI={loadingAI}
               />
            )}

            {/* AI Insights Module */}
            {activeWard && (
              <AIInsights 
                ward={activeWard} 
                role={currentRole} 
                analysis={aiAnalysis}
                loading={loadingAI}
              />
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;