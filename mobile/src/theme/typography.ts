import { TextStyle } from 'react-native';

/**
 * Waymark 2100 Typography System
 * Specifications derived from waymark_2100/DESIGN.md
 * Strict enforcement of tabular figures for real-time telemetry readouts.
 */

export const fontSizes = {
  caption: 11,
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  displaySm: 24,
  displayMd: 28,
  displayLg: 36
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
} as const;

export const lineHeights = {
  caption: 14,
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 24,
  xxl: 28,
  displaySm: 32,
  displayMd: 36,
  displayLg: 44
} as const;

export const letterSpacings = {
  tight: -0.8,
  snug: -0.5,
  compressed: -0.3,
  normal: 0,
  loose: 0.8,
  extraLoose: 0.9
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System'
  },

  fontSize: fontSizes,
  fontWeight: fontWeights,
  lineHeight: lineHeights,
  letterSpacing: letterSpacings,

  styles: {
    displayLg: {
      fontSize: fontSizes.displayLg,
      lineHeight: lineHeights.displayLg,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacings.tight
    } as TextStyle,

    headlineXl: {
      fontSize: fontSizes.displayMd,
      lineHeight: lineHeights.displayMd,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.snug
    } as TextStyle,

    headlineLg: {
      fontSize: fontSizes.displaySm,
      lineHeight: lineHeights.displaySm,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.compressed
    } as TextStyle,

    headlineMd: {
      fontSize: fontSizes.xxl,
      lineHeight: lineHeights.xxl,
      fontWeight: fontWeights.semibold
    } as TextStyle,

    titleSm: {
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      fontWeight: fontWeights.medium
    } as TextStyle,

    bodyLg: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      fontWeight: fontWeights.regular
    } as TextStyle,

    bodyMd: {
      fontSize: fontSizes.md,
      lineHeight: lineHeights.md,
      fontWeight: fontWeights.regular
    } as TextStyle,

    bodySm: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      fontWeight: fontWeights.regular
    } as TextStyle,

    labelMonoMd: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.loose,
      textTransform: 'uppercase'
    } as TextStyle,

    labelMonoSm: {
      fontSize: fontSizes.caption,
      lineHeight: lineHeights.caption,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.extraLoose,
      textTransform: 'uppercase'
    } as TextStyle,

    telemetryNumber: {
      fontVariant: ['tabular-nums'],
      fontWeight: fontWeights.bold
    } as TextStyle
  }
} as const;

export type ThemeTypography = typeof typography;
export type TypographyStyles = typeof typography.styles;
