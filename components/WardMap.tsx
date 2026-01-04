import React, { useEffect, useRef } from 'react';
import { Ward } from '../types';
import { getAQIColor } from '../constants';

// We access Leaflet from the global scope since we loaded it via CDN in index.html
declare global {
  interface Window {
    L: any;
  }
}

interface WardMapProps {
  wards: Ward[];
  selectedWard: Ward | null; // Changed from ID to full object for better coordinate access
  userLocation: { lat: number; lng: number } | null;
  onSelectWard: (ward: Ward) => void;
  focusTrigger?: number; // Increment this to force map to recenter on selectedWard
}

const WardMap: React.FC<WardMapProps> = ({ wards, selectedWard, userLocation, onSelectWard, focusTrigger = 0 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  
  // Track previous state to determine what triggered the update
  const prevSelectedIdRef = useRef<string | null>(null);
  const prevUserLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevFocusTriggerRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  // 1. Initialize Map (Run once)
  useEffect(() => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return;

    // Default view on India (Zoomed out)
    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([20.5937, 78.9629], 5);

    // Add Zoom control to bottom right
    window.L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Dark Matter Tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix for map rendering issues in some layouts (run once shortly after init)
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Markers & Handle Navigation (Run on prop changes)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    const L = window.L;

    // --- MARKER UPDATE ---
    
    // Clear existing ward markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Add new ward markers
    wards.forEach(ward => {
      const color = getAQIColor(ward.aqi);
      const isSelected = selectedWard?.id === ward.id;
      const baseSize = isSelected ? 40 : 20; 
      
      const iconHtml = `
        <div class="aqi-marker-container">
          <div class="pulse-ring" style="background-color: ${color};"></div>
          <div class="aqi-marker" style="background-color: ${color}; width: ${baseSize}px; height: ${baseSize}px; border-color: ${isSelected ? '#fff' : 'rgba(255,255,255,0.6)'}; font-size: ${isSelected ? '12px' : '0px'};">
            ${isSelected ? ward.aqi : ''}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-aqi-icon',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([ward.location.lat, ward.location.lng], { icon: icon })
        .addTo(map)
        .on('click', () => {
          onSelectWard(ward);
          // Fly to on click is handled by the prop update usually, but redundant safety helps UI responsiveness
          map.flyTo([ward.location.lat, ward.location.lng], 12, { animate: true, duration: 1.2 });
        });
        
      marker.bindTooltip(`<b>${ward.name}</b><br>AQI: ${ward.aqi}`, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.9,
          className: 'glass-tooltip'
      });
      
      // Ensure selected marker is on top
      if (isSelected) {
        marker.setZIndexOffset(1000);
      }

      markersRef.current.push(marker);
    });

    // Handle User Location Marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `<div style="position: relative; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;">
                <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #3b82f6; opacity: 0.8; animation: spin 4s linear infinite;"></div>
                <div style="width: 8px; height: 8px; background-color: #60a5fa; border-radius: 50%; box-shadow: 0 0 10px #3b82f6;"></div>
               </div>
               <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup('<span class="text-slate-900 font-bold">Your Location</span>');
    }

    // --- NAVIGATION / ZOOM LOGIC ---

    const userLocChanged = userLocation && (
        !prevUserLocRef.current || 
        userLocation.lat !== prevUserLocRef.current.lat || 
        userLocation.lng !== prevUserLocRef.current.lng
    );

    const selectedWardId = selectedWard?.id;
    const selectedWardChanged = selectedWardId !== prevSelectedIdRef.current;
    const focusTriggered = focusTrigger !== prevFocusTriggerRef.current;
    
    // Priority 1: User Location changed (Locate Me)
    if (userLocChanged && userLocation) {
        map.flyTo([userLocation.lat, userLocation.lng], 13, { animate: true, duration: 1.5 });
    }
    // Priority 2: Forced Focus Trigger (Search)
    else if (focusTriggered && selectedWard) {
         // Direct access to coordinates ensures we don't rely on list lookup race conditions
         map.flyTo([selectedWard.location.lat, selectedWard.location.lng], 12, { animate: true, duration: 1.5 });
    }
    // Priority 3: Selected Ward changed (Click)
    else if (selectedWard && selectedWardChanged) {
        map.flyTo([selectedWard.location.lat, selectedWard.location.lng], 12, { animate: true, duration: 1.5 });
    }
    // Priority 4: Initial Load (Fit bounds)
    else if (wards.length > 0 && !isInitializedRef.current && !selectedWard) {
        const group = new L.featureGroup(markersRef.current);
        if (group.getLayers().length > 0) {
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
        isInitializedRef.current = true;
    }

    // Update Refs
    prevSelectedIdRef.current = selectedWardId || null;
    prevUserLocRef.current = userLocation;
    prevFocusTriggerRef.current = focusTrigger;

  }, [wards, selectedWard, userLocation, onSelectWard, focusTrigger]);

  return (
    <div className="w-full h-[500px] glass-panel rounded-2xl overflow-hidden relative shadow-2xl border border-slate-700/50">
       <div ref={mapRef} className="w-full h-full z-0" style={{ background: '#0f172a' }} />
       
       <div className="absolute top-4 left-4 glass-card backdrop-blur-md p-3 rounded-lg shadow-lg text-xs z-[400] border-l-4 border-indigo-500 max-w-[200px]">
        <p className="font-bold text-slate-200 font-mono tracking-wide mb-1">LIVE SENSOR FEED</p>
        <p className="text-slate-400">Real-time particulate matter monitoring across wards.</p>
      </div>

       <div className="absolute bottom-6 right-6 flex gap-2 text-[10px] glass-card p-2 rounded-lg shadow-lg z-[400] backdrop-blur-md">
         <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span><span className="text-slate-400 text-[9px]">Good</span></div>
         <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(250,204,21,0.6)]"></span><span className="text-slate-400 text-[9px]">Mod</span></div>
         <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]"></span><span className="text-slate-400 text-[9px]">Sens</span></div>
         <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span><span className="text-slate-400 text-[9px]">Unhealth</span></div>
         <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]"></span><span className="text-slate-400 text-[9px]">Very Un</span></div>
         <div className="flex flex-col items-center gap-1 min-w-[30px]"><span className="w-2.5 h-2.5 rounded-full bg-rose-900 shadow-[0_0_6px_rgba(136,19,55,0.6)]"></span><span className="text-slate-400 text-[9px]">Hazard</span></div>
      </div>
    </div>
  );
};

export default WardMap;