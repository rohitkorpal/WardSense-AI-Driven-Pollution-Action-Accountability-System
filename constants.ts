import { Ward, PollutionSeverity } from './types';

// Added location properties to all wards to match the Ward interface defined in types.ts
export const METRO_CITY_WARDS: Ward[] = [
  {
    id: 'w-101',
    name: 'Industrial Zone A',
    population: 12500,
    aqi: 312,
    pollutants: { pm25: 180, pm10: 250, no2: 80, so2: 45, co: 2.5, o3: 50 },
    primarySource: 'Industrial Emissions',
    secondarySource: 'Heavy Transport',
    coordinates: { x: 10, y: 10 },
    location: { lat: 28.75, lng: 77.10 },
    trend: [280, 290, 305, 310, 300, 315, 312]
  },
  {
    id: 'w-102',
    name: 'Downtown Central',
    population: 45000,
    aqi: 155,
    pollutants: { pm25: 65, pm10: 110, no2: 60, so2: 15, co: 3.0, o3: 35 },
    primarySource: 'Vehicular Traffic',
    secondarySource: 'Construction',
    coordinates: { x: 60, y: 20 },
    location: { lat: 28.65, lng: 77.25 },
    trend: [140, 145, 150, 160, 155, 152, 155]
  },
  {
    id: 'w-103',
    name: 'Greenwood Suburbs',
    population: 28000,
    aqi: 45,
    pollutants: { pm25: 12, pm10: 30, no2: 10, so2: 5, co: 0.5, o3: 20 },
    primarySource: 'Seasonal Pollen',
    secondarySource: 'Residential Heating',
    coordinates: { x: 20, y: 70 },
    location: { lat: 28.55, lng: 77.15 },
    trend: [40, 42, 45, 48, 44, 43, 45]
  },
  {
    id: 'w-104',
    name: 'Tech Park District',
    population: 32000,
    aqi: 110,
    pollutants: { pm25: 45, pm10: 80, no2: 40, so2: 10, co: 1.2, o3: 30 },
    primarySource: 'Vehicular Traffic',
    secondarySource: 'Diesel Generators',
    coordinates: { x: 75, y: 60 },
    location: { lat: 28.58, lng: 77.28 },
    trend: [100, 105, 110, 108, 112, 115, 110]
  },
  {
    id: 'w-105',
    name: 'Construction Hub',
    population: 8000,
    aqi: 240,
    pollutants: { pm25: 120, pm10: 300, no2: 30, so2: 10, co: 1.0, o3: 25 },
    primarySource: 'Construction Activity',
    secondarySource: 'Waste Burning',
    coordinates: { x: 40, y: 40 },
    location: { lat: 28.62, lng: 77.20 },
    trend: [210, 220, 230, 225, 235, 238, 240]
  }
];

export const getSeverity = (aqi: number): PollutionSeverity => {
  if (aqi <= 50) return PollutionSeverity.GOOD;
  if (aqi <= 100) return PollutionSeverity.MODERATE;
  if (aqi <= 150) return PollutionSeverity.UNHEALTHY_SENSITIVE;
  if (aqi <= 200) return PollutionSeverity.UNHEALTHY;
  if (aqi <= 300) return PollutionSeverity.VERY_UNHEALTHY;
  return PollutionSeverity.HAZARDOUS;
};

// Returns Hex Code for Charts and Maps
export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return '#10b981'; // Green-500
  if (aqi <= 100) return '#eab308'; // Yellow-500
  if (aqi <= 150) return '#f97316'; // Orange-500
  if (aqi <= 200) return '#ef4444'; // Red-500 (Unhealthy)
  if (aqi <= 300) return '#a855f7'; // Purple-500 (Very Unhealthy) - Fixed from Pink/Fuchsia
  return '#881337'; // Rose-900 (Hazardous/Maroon)
};

// Returns Tailwind Class for Backgrounds
export const getSeverityColor = (aqi: number): string => {
  if (aqi <= 50) return 'bg-emerald-500';
  if (aqi <= 100) return 'bg-yellow-500';
  if (aqi <= 150) return 'bg-orange-500';
  if (aqi <= 200) return 'bg-red-500';
  if (aqi <= 300) return 'bg-purple-500'; // Fixed
  return 'bg-rose-900';
};

// Returns Tailwind Class for Text
export const getSeverityTextColor = (aqi: number): string => {
  if (aqi <= 50) return 'text-emerald-400';
  if (aqi <= 100) return 'text-yellow-400';
  if (aqi <= 150) return 'text-orange-400';
  if (aqi <= 200) return 'text-red-400';
  if (aqi <= 300) return 'text-purple-400'; // Fixed
  return 'text-rose-600'; // Darker Red for Hazardous
};