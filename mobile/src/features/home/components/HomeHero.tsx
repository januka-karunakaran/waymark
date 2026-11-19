import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions
} from 'react-native';
import { AppText } from '../../../components/typography';
import { theme as defaultTheme, darkTheme, lightTheme } from '../../../theme';
import { HomeHeroContent } from '../types';
import { userFacingHomeIntro } from '../data/homeContent';

export interface HomeHeroProps {
  /**
   * Hero text content model.
   * If omitted or partially specified, defaults to verified Waymark branding.
   */
  content?: Partial<HomeHeroContent>;

  /**
   * Optional custom container style override.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Optional test identifier for automated tests.
   * @default 'home-hero'
   */
  testID?: string;

  /**
   * Explicit theme mode override ('light' | 'dark').
   * Defaults to active theme mode ('dark' in Waymark 2100).
   */
  themeMode?: 'light' | 'dark';

  /**
   * Optional trailing accessory or status badge node in the eyebrow row.
   */
  accessory?: React.ReactNode;
}

/**
 * HomeHero — Reusable, accessible, mobile-first hero component for Waymark Home.
 *
 * Implements verified Waymark 2100 branding, clear visual hierarchy, accessible header roles,
 * dynamic text scaling, and theme responsiveness without duplicating top screen navigation headers.
 */
const HomeHeroBase: React.FC<HomeHeroProps> = ({
  content,
  style,
  testID = 'home-hero',
  themeMode,
  accessory
}) => {
  const { width } = useWindowDimensions();
  const isCompactDevice = width > 0 && width < 360;

  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const eyebrow = content?.eyebrow ?? userFacingHomeIntro.eyebrow;
  const title = content?.title ?? userFacingHomeIntro.title;
  const titleHighlight = content?.titleHighlight ?? userFacingHomeIntro.titleHighlight;
  const subtitle = content?.subtitle ?? userFacingHomeIntro.subtitle;

  // Responsive heading variant: h1 on compact devices, display on standard/large
  const headingVariant = isCompactDevice ? 'h1' : 'display';

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: isCompactDevice
            ? activeTheme.spacing.xs
            : activeTheme.spacing.sm
        },
        style
      ]}
      testID={testID}
      accessibilityRole="none"
    >
      {/* Eyebrow / Kicker */}
      {Boolean(eyebrow) && (
        <View style={styles.eyebrowRow}>
          <AppText
            variant="caption"
            color="muted"
            themeMode={themeMode}
            testID={`${testID}-eyebrow`}
            style={styles.eyebrow}
          >
            {eyebrow}
          </AppText>
          {accessory}
        </View>
      )}

      {/* Primary Headline Greeting */}
      <AppText
        variant={headingVariant}
        color="primary"
        themeMode={themeMode}
        accessibilityRole="header"
        testID={`${testID}-title`}
        style={styles.title}
      >
        {title}
        {Boolean(titleHighlight) && (
          <AppText
            variant={headingVariant}
            color="brand"
            weight="bold"
            themeMode={themeMode}
            accessibilityRole="none"
            testID={`${testID}-highlight`}
          >
            {` ${titleHighlight}`}
          </AppText>
        )}
      </AppText>

      {/* Supporting Description */}
      {Boolean(subtitle) && (
        <AppText
          variant="body"
          color="secondary"
          themeMode={themeMode}
          testID={`${testID}-subtitle`}
          style={styles.subtitle}
        >
          {subtitle}
        </AppText>
      )}
    </View>
  );
};

export const HomeHero = React.memo(HomeHeroBase);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: defaultTheme.spacing.spaceSm
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: defaultTheme.spacing.spaceXs
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  title: {
    flexWrap: 'wrap'
  },
  subtitle: {
    marginTop: defaultTheme.spacing.spaceSm,
    lineHeight: 22
  }
});
