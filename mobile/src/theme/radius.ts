/**
 * Waymark 2100 Radius Tokens
 * Specifications derived from waymark_2100/DESIGN.md
 * Geometric architecture favors engineered roundedness over soft pills.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,

  // Semantic component radii from DESIGN.md
  pill: 6,
  status: 6,
  chip: 6,
  input: 12,
  button: 14,
  card: 16
} as const;

export const radii = radius;

export type ThemeRadius = typeof radius;
