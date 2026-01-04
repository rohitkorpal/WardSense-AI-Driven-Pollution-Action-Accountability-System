import React, { useState, useEffect, useRef } from 'react';
import { Ward } from '../types';
import { searchStations } from '../services/pollutionService';
import { getAQIColor } from '../constants';

interface SearchBarProps {
  onSelectWard: (ward: Ward) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectWard }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 3) {
        setLoading(true);
        const data = await searchStations(query);
        setResults(data);
        setLoading(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (ward: Ward) => {
    onSelectWard(ward);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full md:w-80 lg:w-96 z-50">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all shadow-lg backdrop-blur-sm"
          placeholder="Search city or station..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute mt-1 w-full bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto backdrop-blur-md custom-scrollbar">
          {results.map((ward) => (
            <li
              key={ward.id}
              className="cursor-pointer select-none relative py-3 pl-3 pr-9 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0"
              onClick={() => handleSelect(ward)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                   <span className="block text-slate-200 text-sm font-medium truncate">{ward.name}</span>
                   <span className="block text-slate-500 text-[10px] font-mono truncate mt-0.5">ID: {ward.id.replace('waqi-', '')}</span>
                </div>
                <div className="flex items-center gap-2 mr-2 shrink-0">
                   <span className="text-xs font-mono font-bold" style={{ color: getAQIColor(ward.aqi) }}>{ward.aqi}</span>
                   <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: getAQIColor(ward.aqi), color: getAQIColor(ward.aqi) }}></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && results.length === 0 && !loading && (
        <div className="absolute mt-1 w-full bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl p-4 text-center backdrop-blur-md">
            <p className="text-sm text-slate-500">No sensors found.</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;