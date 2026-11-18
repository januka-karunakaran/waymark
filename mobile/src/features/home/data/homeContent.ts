/**
 * Default Home Screen Content Dataset
 * Clearly demarcates verified product content from illustrative sample telemetry.
 */

import { HomeScreenData, HomeQuickPlaceNode } from '../types';

export const DEFAULT_QUICK_PLACES: HomeQuickPlaceNode[] = [
  { id: 'place-home', label: 'Home', destination: 'Home Node', iconName: 'home' },
  { id: 'place-work', label: 'Work', destination: 'Work Hub', iconName: 'briefcase' },
  { id: 'place-kandy', label: 'Kandy', destination: 'Kandy City Centre', iconName: 'map-pin', isPopular: true },
  { id: 'place-colombo', label: 'Colombo', destination: 'Colombo Fort Central', iconName: 'compass', isPopular: true },
  { id: 'place-airport', label: 'Airport', destination: 'Bandaranaike Skyport', iconName: 'plane' },
  { id: 'place-more', label: 'More', destination: 'Network Directory', iconName: 'more-horizontal' }
];

/**
 * Standard Home Screen Data reflecting user-friendly mobile hero and foundation capabilities.
 */
export const defaultHomeContent: HomeScreenData = {
  hero: {
    eyebrow: 'Good morning, navigator',
    title: 'Where would you like to',
    titleHighlight: 'go?',
    subtitle: 'One trip. Every way to travel. Bus, train, air and smart roads, planned together.'
  },
  suggestion: {
    id: 'suggested-kdu-kandy',
    kicker: 'SUGGESTED ACTIVE ROUTE',
    badgeText: 'LEAVE NOW',
    title: 'KDU Gate → Kandy City',
    description: 'Avoids monsoon ground surge · Air Shuttle flight sync ready',
    actionLabel: 'Start this route',
    isSample: true, // Illustrative route; live GPS routing introduced in Feature 05
    transitModes: ['walk', 'bus', 'air'],
    corridorStatus: 'nominal',
    targetScreen: 'journey'
  },
  quickPlaces: DEFAULT_QUICK_PLACES,
  architectureStatus: {
    title: 'TELEMETRY FOUNDATION ARCHITECTURE',
    statusLabel: 'OPERATIONAL',
    isOperational: true,
    isDeveloperContent: true,
    modules: [
      { id: 'mod-theme', label: 'THEME & TOKENS', value: 'Night Transit (2100)', status: 'operational' },
      { id: 'mod-api', label: 'API SERVICE', value: 'Timeout & Interceptors', status: 'operational' },
      { id: 'mod-storage', label: 'STORAGE ENGINE', value: 'Hardware SecureStore', status: 'operational' },
      { id: 'mod-resilience', label: 'RESILIENCE', value: 'NetInfo + ErrorBoundary', status: 'operational' }
    ]
  },
  accessibilityNotice: {
    message: 'Universal step-free routes guaranteed across all nodes',
    isVerifiedStepFree: false, // Sample baseline statement pending native transit graph verification
    complianceStatement: 'All Waymark 2100 corridors mandate universal step-free access, elevators, and low-sensory options.',
    verificationLevel: 'informational'
  },
  availability: 'available',
  dataSource: 'sample_data'
};

/**
 * User-facing production introductory content for Home.
 * Aligns with verified Waymark 2100 branding and user experience.
 */
export const userFacingHomeIntro = {
  eyebrow: 'Good morning, navigator',
  title: 'Where would you like to',
  titleHighlight: 'go?',
  subtitle: 'One trip. Every way to travel. Bus, train, air and smart roads, planned together.'
};
