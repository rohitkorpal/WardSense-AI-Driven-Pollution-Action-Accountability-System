export enum UserRole {
  CITIZEN = 'Citizen',
  OFFICIAL = 'Government Official'
}

export enum PollutionSeverity {
  GOOD = 'Good',
  MODERATE = 'Moderate',
  UNHEALTHY_SENSITIVE = 'Unhealthy for Sensitive Groups',
  UNHEALTHY = 'Unhealthy',
  VERY_UNHEALTHY = 'Very Unhealthy',
  HAZARDOUS = 'Hazardous'
}

export interface PollutantData {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface Ward {
  id: string;
  name: string;
  population: number;
  aqi: number;
  pollutants: PollutantData;
  primarySource: string;
  secondarySource: string;
  coordinates: { x: number; y: number }; // Kept for backward compatibility if needed, but we use location now
  location: { lat: number; lng: number };
  trend: number[]; // Last 7 days AQI
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'urgent' | 'advisory' | 'policy';
}

export interface AISourceAttribution {
  source: string;
  percentage: number;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface NewsItem {
  title: string;
  summary: string;
  timeAgo: string;
  source?: string; // Publisher Name (e.g., BBC, Times of India)
}

export interface AIAnalysisResult {
  recommendations: AIRecommendation[];
  groundingUrls: Array<{ title: string; uri: string }>;
  trendAnalysis?: string;
  sourceBreakdown?: AISourceAttribution[];
  news?: NewsItem[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}