/**
 * Waymark 2100 Color Palette — "Night Transit" Paradigm
 * Derived directly from waymark_2100/DESIGN.md
 * Complies with WCAG AAA 7:1 contrast ratios on critical transit telemetry.
 */

export const darkColors = {
  // Canvas Ground & Surfaces
  abyssVoid: '#070A0F',
  deckInk: '#0D1117',
  panelInk: '#151B24',
  panelInkElevated: '#1A222D',

  // Borders & Grid Lines
  hudGhost: 'rgba(184, 194, 217, 0.12)',
  hudGhostSubtle: 'rgba(184, 194, 217, 0.08)',
  hudGhostBorder: 'rgba(184, 194, 217, 0.16)',
  luminousEdge: 'rgba(255, 198, 41, 0.45)',
  divider: 'rgba(184, 194, 217, 0.08)',

  // Primary Accent (Time-critical anchors, user focus)
  beaconGold: '#FFC629',
  beaconGoldText: '#241A00',
  beaconGoldContainer: '#FFE8BB',
  beaconGoldMuted: 'rgba(255, 198, 41, 0.15)',

  // Multimodal Transit Vectors
  busCoral: '#FF7A59',
  busCoralMuted: 'rgba(255, 122, 89, 0.13)',
  busCoralBorder: 'rgba(255, 122, 89, 0.4)',

  trainTeal: '#2DD4BF',
  trainTealMuted: 'rgba(45, 212, 191, 0.13)',
  trainTealBorder: 'rgba(45, 212, 191, 0.35)',

  airSky: '#7CC4FF',
  airSkyMuted: 'rgba(124, 196, 255, 0.13)',
  airSkyBorder: 'rgba(124, 196, 255, 0.35)',

  smartRoadSilver: '#E5E7EB',
  pedestrianSlate: '#B8C2D9',

  // Operational Status
  statusNominal: '#4ADE80',
  statusNominalMuted: 'rgba(74, 222, 128, 0.12)',
  statusNominalBorder: 'rgba(74, 222, 128, 0.35)',

  statusAdvisory: '#FF9F43',
  statusAdvisoryMuted: 'rgba(255, 159, 67, 0.12)',

  statusCritical: '#FF5D5D',
  statusCriticalMuted: 'rgba(255, 93, 93, 0.12)',
  statusCriticalBorder: 'rgba(255, 93, 93, 0.4)',

  // Typography Colors
  textPrimary: '#DFE2EB',
  textSecondary: '#A9B2C3',
  textMuted: '#7E8CA7',
  textDim: '#4F5B73',
  textInverse: '#070A0F',

  // Interactive Overlays
  scrim: 'rgba(0, 0, 0, 0.75)',

  // Semantic Mappings
  background: '#070A0F',
  surface: '#0D1117',
  surfaceElevated: '#151B24',
  surfaceModal: '#1A222D',
  primary: '#FFC629',
  secondary: '#2DD4BF',
  border: 'rgba(184, 194, 217, 0.16)',
  borderSubtle: 'rgba(184, 194, 217, 0.08)',
  borderActive: 'rgba(255, 198, 41, 0.45)',
  success: '#4ADE80',
  warning: '#FF9F43',
  error: '#FF5D5D',
  info: '#7CC4FF'
} as const;

export const lightColors = {
  // Canvas Ground & Surfaces
  abyssVoid: '#F4F6F9',
  deckInk: '#FFFFFF',
  panelInk: '#F0F3F7',
  panelInkElevated: '#FFFFFF',

  // Borders & Grid Lines
  hudGhost: 'rgba(15, 23, 42, 0.08)',
  hudGhostSubtle: 'rgba(15, 23, 42, 0.05)',
  hudGhostBorder: 'rgba(15, 23, 42, 0.12)',
  luminousEdge: 'rgba(194, 142, 0, 0.5)',
  divider: 'rgba(15, 23, 42, 0.08)',

  // Primary Accent (High contrast accessible gold/amber)
  beaconGold: '#C28E00',
  beaconGoldText: '#FFFFFF',
  beaconGoldContainer: '#FEF3C7',
  beaconGoldMuted: 'rgba(194, 142, 0, 0.12)',

  // Multimodal Transit Vectors
  busCoral: '#E05330',
  busCoralMuted: 'rgba(224, 83, 48, 0.12)',
  busCoralBorder: 'rgba(224, 83, 48, 0.35)',

  trainTeal: '#0D9488',
  trainTealMuted: 'rgba(13, 148, 136, 0.12)',
  trainTealBorder: 'rgba(13, 148, 136, 0.35)',

  airSky: '#0284C7',
  airSkyMuted: 'rgba(2, 132, 199, 0.12)',
  airSkyBorder: 'rgba(2, 132, 199, 0.35)',

  smartRoadSilver: '#374151',
  pedestrianSlate: '#4B5563',

  // Operational Status
  statusNominal: '#16A34A',
  statusNominalMuted: 'rgba(22, 163, 74, 0.12)',
  statusNominalBorder: 'rgba(22, 163, 74, 0.35)',

  statusAdvisory: '#D97706',
  statusAdvisoryMuted: 'rgba(217, 119, 6, 0.12)',

  statusCritical: '#DC2626',
  statusCriticalMuted: 'rgba(220, 38, 38, 0.12)',
  statusCriticalBorder: 'rgba(220, 38, 38, 0.35)',

  // Typography Colors
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textDim: '#94A3B8',
  textInverse: '#F8FAFC',

  // Interactive Overlays
  scrim: 'rgba(0, 0, 0, 0.5)',

  // Semantic Mappings
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F3F7',
  surfaceModal: '#FFFFFF',
  primary: '#C28E00',
  secondary: '#0D9488',
  border: 'rgba(15, 23, 42, 0.12)',
  borderSubtle: 'rgba(15, 23, 42, 0.05)',
  borderActive: 'rgba(194, 142, 0, 0.5)',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0284C7'
} as const;

/**
 * Default color palette: Night Transit dark mode
 */
export const colors = darkColors;

export type ThemeColors = typeof colors;
export type ColorPalette = typeof darkColors;
export type ColorMode = 'light' | 'dark';
