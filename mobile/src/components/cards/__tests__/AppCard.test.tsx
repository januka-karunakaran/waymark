import React from 'react';
import { StyleSheet, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppCard } from '../AppCard';
import { AppText } from '../../typography';

describe('AppCard Component', () => {
  // TC-02.5-01: Card renders children correctly
  it('TC-02.5-01: renders children correctly', () => {
    render(
      <AppCard testID="test-card">
        <AppText testID="child-text">Waymark Transit Block</AppText>
      </AppCard>
    );

    expect(screen.getByTestId('child-text')).toBeTruthy();
    expect(screen.getByText('Waymark Transit Block')).toBeTruthy();
  });

  // TC-02.5-02: Default variant uses theme tokens
  it('TC-02.5-02: default variant applies theme tokens (deckInk background in dark mode)', () => {
    render(
      <AppCard variant="default" themeMode="dark" testID="test-card">
        <View />
      </AppCard>
    );

    const card = screen.getByTestId('test-card');
    const flatStyle = StyleSheet.flatten(card.props.style);
    expect(flatStyle.backgroundColor).toBe('#0D1117'); // deckInk
    expect(flatStyle.borderRadius).toBe(16); // radius.card
  });

  // TC-02.5-03: Outlined variant displays correct border
  it('TC-02.5-03: outlined variant displays 1px border and transparent/abyssVoid surface', () => {
    render(
      <AppCard variant="outlined" themeMode="dark" testID="test-card">
        <View />
      </AppCard>
    );

    const card = screen.getByTestId('test-card');
    const flatStyle = StyleSheet.flatten(card.props.style);
    expect(flatStyle.borderWidth).toBe(1);
    expect(flatStyle.borderColor).toBe('rgba(184, 194, 217, 0.16)'); // border
    expect(flatStyle.backgroundColor).toBe('#070A0F'); // abyssVoid
  });

  // TC-02.5-04: Elevated variant applies the intended styling
  it('TC-02.5-04: elevated variant applies panel background and shadow', () => {
    render(
      <AppCard variant="elevated" themeMode="dark" testID="test-card">
        <View />
      </AppCard>
    );

    const card = screen.getByTestId('test-card');
    const flatStyle = StyleSheet.flatten(card.props.style);
    expect(flatStyle.backgroundColor).toBe('#151B24'); // panelInk
    expect(flatStyle.elevation).toBe(3); // shadows.md elevation
  });

  // TC-02.5-05: Subtle variant displays correctly
  it('TC-02.5-05: subtle variant displays elevated panel styling', () => {
    render(
      <AppCard variant="subtle" themeMode="dark" testID="test-card">
        <View />
      </AppCard>
    );

    const card = screen.getByTestId('test-card');
    const flatStyle = StyleSheet.flatten(card.props.style);
    expect(flatStyle.backgroundColor).toBe('#1A222D'); // panelInkElevated
  });

  // TC-02.5-06: Pressable card calls onPress
  it('TC-02.5-06: pressable card calls onPress callback when clicked', () => {
    const handlePress = jest.fn();
    render(
      <AppCard onPress={handlePress} testID="pressable-card">
        <AppText>Clickable</AppText>
      </AppCard>
    );

    const card = screen.getByTestId('pressable-card');
    fireEvent.press(card);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  // TC-02.5-07: Disabled card prevents onPress
  it('TC-02.5-07: disabled card prevents interaction and sets accessibility state', () => {
    const handlePress = jest.fn();
    render(
      <AppCard onPress={handlePress} disabled={true} testID="disabled-card">
        <AppText>Disabled</AppText>
      </AppCard>
    );

    const card = screen.getByTestId('disabled-card');
    fireEvent.press(card);
    expect(handlePress).not.toHaveBeenCalled();
    expect(card.props.accessibilityState.disabled).toBe(true);
  });

  // TC-02.5-08: Noninteractive card does not expose button semantics
  it('TC-02.5-08: non-interactive card does not expose button role', () => {
    render(
      <AppCard testID="static-card">
        <AppText>Static Content</AppText>
      </AppCard>
    );

    const card = screen.getByTestId('static-card');
    expect(card.props.accessibilityRole).toBeUndefined();
  });

  // TC-02.5-26: Interactive cards expose the correct accessibility role
  it('TC-02.5-26: interactive card defaults to button role', () => {
    render(
      <AppCard onPress={() => {}} testID="button-card">
        <AppText>Action Card</AppText>
      </AppCard>
    );

    const card = screen.getByTestId('button-card');
    expect(card.props.accessibilityRole).toBe('button');
  });

  // TC-02.5-27: Disabled cards expose their state
  it('TC-02.5-27: disabled static card exposes opacity reduction', () => {
    render(
      <AppCard disabled={true} testID="static-disabled-card">
        <AppText>Disabled Static</AppText>
      </AppCard>
    );

    const card = screen.getByTestId('static-disabled-card');
    const flatStyle = StyleSheet.flatten(card.props.style);
    expect(flatStyle.opacity).toBe(0.6);
  });

  // TC-02.5-29: Light/dark theme rendering resolves correctly
  it('TC-02.5-29: resolves light theme surface correctly', () => {
    render(
      <AppCard variant="default" themeMode="light" testID="light-card">
        <AppText>Light Theme Card</AppText>
      </AppCard>
    );

    const card = screen.getByTestId('light-card');
    const flatStyle = StyleSheet.flatten(card.props.style);
    expect(flatStyle.backgroundColor).toBe('#FFFFFF'); // lightTheme.colors.surface
  });

  it('renders loading indicator when loading is true', () => {
    render(
      <AppCard loading={true} loadingMessage="Fetching telemetries..." testID="loading-card">
        <AppText>Will not show</AppText>
      </AppCard>
    );

    expect(screen.getByTestId('loading-card-loading')).toBeTruthy();
    expect(screen.queryByText('Will not show')).toBeNull();
  });
});
