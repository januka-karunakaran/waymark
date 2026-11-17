import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AppText } from '../typography';
import { spacing } from '../../theme';

export interface CardHeaderProps {
  /**
   * Primary title displayed prominently in the card header.
   */
  title?: string;

  /**
   * Subtitle or secondary detail string.
   */
  subtitle?: string;

  /**
   * Component rendered on the leading edge (e.g. icon or transit mode badge).
   */
  leading?: React.ReactNode;

  /**
   * Component rendered on the trailing edge (e.g. status pill or time badge).
   */
  trailing?: React.ReactNode;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Optional custom container style.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom children overriding or augmenting standard header content.
   */
  children?: React.ReactNode;

  /**
   * Unique test identifier.
   */
  testID?: string;
}

/**
 * CardHeader — Composable card header providing consistent avionics-style
 * typography hierarchy, leading visual anchors, and trailing status tags.
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  themeMode,
  style,
  children,
  testID
}) => {
  if (children) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {children}
      </View>
    );
  }

  const hasTextContent = Boolean(title || subtitle);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.contentRow}>
        {leading ? <View style={styles.leadingContainer}>{leading}</View> : null}

        {hasTextContent ? (
          <View style={styles.titleColumn}>
            {title ? (
              <AppText
                variant="h3"
                weight="semibold"
                color="primary"
                themeMode={themeMode}
                testID={testID ? `${testID}-title` : undefined}
              >
                {title}
              </AppText>
            ) : null}

            {subtitle ? (
              <AppText
                variant="caption"
                color="secondary"
                themeMode={themeMode}
                style={styles.subtitle}
                testID={testID ? `${testID}-subtitle` : undefined}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {trailing ? <View style={styles.trailingContainer}>{trailing}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.spaceSm
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  leadingContainer: {
    marginRight: spacing.spaceSm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center'
  },
  subtitle: {
    marginTop: spacing.spaceXxs
  },
  trailingContainer: {
    marginLeft: spacing.spaceSm,
    alignItems: 'flex-end',
    justifyContent: 'center'
  }
});
