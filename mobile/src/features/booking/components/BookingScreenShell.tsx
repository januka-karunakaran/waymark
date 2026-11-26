import React, { ReactNode } from 'react';
import { StyleSheet, View, ScrollView, ViewStyle, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../../theme';

export interface BookingScreenShellProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  testID?: string;
}

export const BookingScreenShell: React.FC<BookingScreenShellProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  testID = 'booking-screen-shell'
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]} testID={testID}>
      <StatusBar style="light" backgroundColor={theme.colors.abyssVoid} />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.contentContainer, styles.inner, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.abyssVoid
  },
  scrollView: {
    flex: 1
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.spaceLg
  },
  inner: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: theme.spacing.spaceLg
  }
});
