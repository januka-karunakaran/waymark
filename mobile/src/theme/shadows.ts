/**
 * Waymark 2100 Elevation & Depth Tokens
 * Specifications derived from waymark_2100/DESIGN.md
 * Depth rejects heavy organic drop shadows in favor of avionics-inspired optical layering,
 * optical glow, and luminous perimeter conduits.
 *
 * Compatible with both iOS (shadow properties) and Android (elevation).
 */

export interface ShadowToken {
  readonly shadowColor: string;
  readonly shadowOffset: {
    readonly width: number;
    readonly height: number;
  };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number;
}

export const shadows = {
  none: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 1
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10
  },

  // Avionics-inspired luminous glow effects
  glowBeacon: {
    shadowColor: '#FFC629',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5
  },
  glowTeal: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  glowCritical: {
    shadowColor: '#FF5D5D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  }
} as const satisfies Record<string, ShadowToken>;

export type ThemeShadows = typeof shadows;
