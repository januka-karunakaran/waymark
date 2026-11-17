import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
  StyleProp
} from 'react-native';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  ThemeColors
} from '../../theme';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label';

export type TextSemanticColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'dim'
  | 'inverse'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export type TextColorProp =
  | TextSemanticColor
  | keyof ThemeColors
  | string;

export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface AppTextProps extends RNTextProps {
  /**
   * Typography variant defined by Waymark 2100 design system.
   * @default 'body'
   */
  variant?: TypographyVariant;

  /**
   * Semantic color token, theme palette key, or custom color string.
   * @default 'primary'
   */
  color?: TextColorProp;

  /**
   * Text alignment shortcut.
   */
  align?: TextAlign;

  /**
   * Font weight override matching Waymark typography tokens.
   */
  weight?: TextWeight;

  /**
   * Enable monospace tabular figures for numbers/telemetry.
   */
  tabularNums?: boolean;

  /**
   * Explicit theme mode override ('light' | 'dark').
   * If omitted, defaults to Waymark Night Transit theme.
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style overrides.
   */
  style?: StyleProp<TextStyle>;

  /**
   * Children nodes to render.
   */
  children?: React.ReactNode;
}

type ActiveColors = typeof darkTheme.colors | typeof lightTheme.colors;

/**
 * Resolve semantic color tokens or palette keys against active theme.
 */
function resolveTextColor(
  color: TextColorProp,
  activeColors: ActiveColors
): string {
  switch (color) {
    case 'primary':
      return activeColors.textPrimary;
    case 'secondary':
      return activeColors.textSecondary;
    case 'muted':
      return activeColors.textMuted;
    case 'dim':
      return activeColors.textDim;
    case 'inverse':
      return activeColors.textInverse;
    case 'brand':
    case 'accent':
      return activeColors.beaconGold;
    case 'success':
      return activeColors.statusNominal;
    case 'warning':
      return activeColors.statusAdvisory;
    case 'error':
      return activeColors.statusCritical;
    case 'info':
      return activeColors.airSky;
    default:
      if (color in activeColors) {
        return (activeColors as unknown as Record<string, string>)[color];
      }
      return color;
  }
}

/**
 * Get base typography style for a given variant from design tokens.
 */
function getVariantStyle(
  variant: TypographyVariant,
  typographyTheme: typeof defaultTheme.typography
): TextStyle {
  switch (variant) {
    case 'display':
      return typographyTheme.styles.displayLg;
    case 'h1':
      return typographyTheme.styles.headlineXl;
    case 'h2':
      return typographyTheme.styles.headlineLg;
    case 'h3':
      return typographyTheme.styles.headlineMd;
    case 'body':
      return typographyTheme.styles.bodyMd;
    case 'bodySmall':
      return typographyTheme.styles.bodySm;
    case 'caption':
      return typographyTheme.styles.labelMonoSm;
    case 'label':
      return typographyTheme.styles.labelMonoMd;
    default:
      return typographyTheme.styles.bodyMd;
  }
}

/**
 * AppText — Reusable, strongly typed, accessible typography component
 * for Waymark Android and iOS mobile applications.
 *
 * Adheres strictly to Waymark 2100 "Night Transit" design specifications,
 * accessibility font scaling, and theme tokens.
 */
export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'primary',
  align,
  weight,
  tabularNums = false,
  themeMode,
  style,
  children,
  allowFontScaling = true,
  accessibilityRole,
  ...restProps
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const baseVariantStyle = getVariantStyle(variant, activeTheme.typography);
  const resolvedColor = resolveTextColor(color, activeTheme.colors);

  const isHeading =
    variant === 'display' ||
    variant === 'h1' ||
    variant === 'h2' ||
    variant === 'h3';

  const defaultRole = accessibilityRole ?? (isHeading ? 'header' : undefined);

  const computedStyle: StyleProp<TextStyle> = [
    baseVariantStyle,
    { color: resolvedColor },
    align ? { textAlign: align } : null,
    weight ? { fontWeight: activeTheme.typography.fontWeight[weight] } : null,
    tabularNums ? activeTheme.typography.styles.telemetryNumber : null,
    style
  ];

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      accessibilityRole={defaultRole}
      style={computedStyle}
      {...restProps}
    >
      {children}
    </RNText>
  );
};
