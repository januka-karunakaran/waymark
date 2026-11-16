export type TransitMode = 'bus' | 'maglev' | 'air' | 'smart_road' | 'walk';

export type TransitStatus = 'nominal' | 'advisory' | 'critical' | 'synced';

export interface TransitNode {
  id: string;
  name: string;
  code: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    altitudeMsl?: number;
  };
}

export interface TransitLeg {
  id: string;
  mode: TransitMode;
  routeNumber: string;
  departureNode: string;
  arrivalNode: string;
  durationMinutes: number;
  status: TransitStatus;
  statusLabel: string;
  stepFree: boolean;
}

export interface TransitRoute {
  id: string;
  title: string;
  origin: string;
  destination: string;
  totalDurationMinutes: number;
  targetArrivalTime: string;
  fareCredits: number;
  stepFree: boolean;
  legs: TransitLeg[];
}

export interface ComfortPreferences {
  audioGuidance: boolean;
  quietBoarding: boolean;
  informationDensity: 'Minimal' | 'Standard' | 'Detailed';
}
