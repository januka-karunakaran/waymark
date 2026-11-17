import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AppText } from '../typography';
import { spacing } from '../../theme';

export interface CardFooterProps {
  /**
   * Explanatory metadata, timestamps, or system readouts.
   */
  metadata?: string | React.ReactNode;

  /**
   * Action buttons or secondary interaction elements.
   */
  actions?: React.ReactNode;

  /**
   * Arbitrary children overriding or augmenting standard footer content.
   */
  children?: React.ReactNode;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the footer container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Unique test identifier.
   */
  testID?: string;
}

/**
 * CardFooter — Composable bottom section for card layouts aligning metadata,
 * telemetry stamps, and action triggers.
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  metadata,
  actions,
  children,
  themeMode,
  style,
  testID
}) => {
  if (children) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {children}
      </View>
    );
  }

  const hasMetadata = Boolean(metadata);
  const hasActions = Boolean(actions);

  if (!hasMetadata && !hasActions) {
    return null;
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.contentRow}>
        <View style={styles.metadataContainer}>
          {typeof metadata === 'string' ? (
            <AppText
              variant="caption"
              color="muted"
              themeMode={themeMode}
              testID={testID ? `${testID}-metadata` : undefined}
            >
              {metadata}
            </AppText>
          ) : (
            metadata
          )}
        </View>

        {actions ? <View style={styles.actionsContainer}>{actions}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: spacing.spaceSm,
    paddingTop: spacing.spaceXs
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  metadataContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.spaceSm
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  }
});
