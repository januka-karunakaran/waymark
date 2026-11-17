import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { spacing } from '../../theme';

export interface CardBodyProps {
  /**
   * Main content of the card body.
   */
  children?: React.ReactNode;

  /**
   * Custom style for the body wrapper.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Unique test identifier.
   */
  testID?: string;
}

/**
 * CardBody — Composable middle section for card layouts ensuring
 * consistent padding and flexible child positioning.
 */
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  style,
  testID
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.spaceXs
  }
});
