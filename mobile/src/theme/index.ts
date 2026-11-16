import { colors, darkColors, lightColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius, radii } from './radius';
import { shadows } from './shadows';

export const darkTheme = {
  mode: 'dark' as const,
  colors: darkColors,
  typography,
  spacing,
  radius,
  radii,
  shadows
} as const;

export const lightTheme = {
  mode: 'light' as const,
  colors: lightColors,
  typography,
  spacing,
  radius,
  radii,
  shadows
} as const;

/**
 * Default Waymark Mobile Theme — "Night Transit" (Dark)
 */
export const theme = {
  mode: 'dark' as const,
  colors,
  typography,
  spacing,
  radius,
  radii,
  shadows
} as const;

export type Theme = typeof theme;
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
