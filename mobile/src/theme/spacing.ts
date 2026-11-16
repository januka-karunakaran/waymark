import { radius, radii } from './radius';

/**
 * Waymark 2100 Spacing, Radius & Geometry Tokens
 * Specifications derived from waymark_2100/DESIGN.md
 * Mobile-first telemetry layout with strict touch boundaries (>= 48px).
 */

export const spacing = {
  none: 0,
  spaceXxs: 2,
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 40,
  spaceXxl: 48,

  // Standard step scale
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,

  // Layout metrics
  gutter: 24,
  gutterMobile: 12,
  margin: 16,
  marginMobile: 16,

  // Re-export radius tokens for backwards compatibility
  radii,
  radius,

  layout: {
    minTouchTarget: 48,
    primaryButtonHeight: 56,
    secondaryButtonHeight: 48,
    inputHeight: 52,
    chipHeight: 32,
    headerHeight: 64,
    bottomNavHeight: 68
  }
} as const;

export type ThemeSpacing = typeof spacing;
