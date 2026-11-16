import { TextStyle } from 'react-native';

/**
 * Waymark 2100 Typography System
 * Specifications derived from waymark_2100/DESIGN.md
 * Strict enforcement of tabular figures for real-time telemetry readouts.
 */

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System'
  },

  styles: {
    displayLg: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700',
      letterSpacing: -0.8
    } as TextStyle,

    headlineXl: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '600',
      letterSpacing: -0.5
    } as TextStyle,

    headlineLg: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      letterSpacing: -0.3
    } as TextStyle,

    headlineMd: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600'
    } as TextStyle,

    titleSm: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '500'
    } as TextStyle,

    bodyLg: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400'
    } as TextStyle,

    bodyMd: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400'
    } as TextStyle,

    bodySm: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400'
    } as TextStyle,

    labelMonoMd: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase'
    } as TextStyle,

    labelMonoSm: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      letterSpacing: 0.9,
      textTransform: 'uppercase'
    } as TextStyle,

    telemetryNumber: {
      fontVariant: ['tabular-nums'],
      fontWeight: '700'
    } as TextStyle
  }
} as const;

export type ThemeTypography = typeof typography;
