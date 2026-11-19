import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { AppText } from '../../../components/typography';
import { theme as defaultTheme, darkTheme, lightTheme } from '../../../theme';

export interface HomeSectionProps {
  /**
   * Primary title of the section.
   */
  title?: string;

  /**
   * Small uppercase telemetry / category label above the title.
   */
  eyebrow?: string;

  /**
   * Action button or link label displayed in the section header.
   */
  actionLabel?: string;

  /**
   * Callback fired when action label is pressed.
   */
  onAction?: () => void;

  /**
   * Content rendered inside the section.
   */
  children: React.ReactNode;

  /**
   * Custom style for the outer section container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier for automation.
   */
  testID?: string;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Accessibility label for the section container.
   */
  accessibilityLabel?: string;
}

/**
 * HomeSection — Reusable, accessible section wrapper for Waymark Home screen.
 * Provides consistent heading hierarchy, category eyebrows, and responsive spacing.
 */
const HomeSectionBase: React.FC<HomeSectionProps> = ({
  title,
  eyebrow,
  actionLabel,
  onAction,
  children,
  style,
  testID = 'home-section',
  themeMode,
  accessibilityLabel
}) => {
  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const hasHeader = Boolean(title || eyebrow || (actionLabel && onAction));

  return (
    <View
      style={[
        styles.container,
        {
          gap: activeTheme.spacing.sm
        },
        style
      ]}
      testID={testID}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {hasHeader && (
        <View style={styles.headerRow}>
          <View style={styles.titleColumn}>
            {Boolean(eyebrow) && (
              <AppText
                variant="caption"
                color="muted"
                themeMode={themeMode}
                testID={`${testID}-eyebrow`}
                style={styles.eyebrow}
              >
                {eyebrow}
              </AppText>
            )}
            {Boolean(title) && (
              <AppText
                variant="h3"
                color="primary"
                accessibilityRole="header"
                themeMode={themeMode}
                testID={`${testID}-title`}
                style={styles.title}
              >
                {title}
              </AppText>
            )}
          </View>
          {Boolean(actionLabel && onAction) && (
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              testID={`${testID}-action`}
              style={styles.actionPressable}
            >
              <AppText
                variant="label"
                color="brand"
                weight="semibold"
                themeMode={themeMode}
              >
                {actionLabel}
              </AppText>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export const HomeSection = React.memo(HomeSectionBase);

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: defaultTheme.spacing.spaceXs
  },
  titleColumn: {
    flex: 1,
    gap: 2
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  title: {
    letterSpacing: -0.2
  },
  actionPressable: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: defaultTheme.spacing.spaceXs
  },
  content: {
    width: '100%'
  }
});
