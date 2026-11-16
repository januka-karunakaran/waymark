/**
 * Waymark 2100 Color Palette — "Night Transit" Paradigm
 * Derived directly from waymark_2100/DESIGN.md
 * Complies with WCAG AAA 7:1 contrast ratios on critical transit telemetry.
 */

export const colors = {
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

  // Interactive Overlays
  scrim: 'rgba(0, 0, 0, 0.75)'
} as const;

export type ThemeColors = typeof colors;
