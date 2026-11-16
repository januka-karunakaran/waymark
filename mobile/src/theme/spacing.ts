/**
 * Waymark 2100 Spacing, Radius & Geometry Tokens
 * Specifications derived from waymark_2100/DESIGN.md
 */

export const spacing = {
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 40,

  gutter: 24,
  margin: 16,

  radii: {
    xs: 4,
    sm: 6,
    md: 8,
    button: 14,
    card: 16,
    pill: 6,
    full: 9999
  },

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
