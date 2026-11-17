import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton, AppButtonProps } from '../AppButton';
import { theme, lightTheme, darkTheme } from '../../../theme';

describe('AppButton Component', () => {
  // TC-02.3.1-01: Button renders supplied title
  it('TC-02.3.1-01: renders supplied title text correctly', () => {
    const { getByText } = render(<AppButton title="Confirm Journey" />);
    expect(getByText('Confirm Journey')).toBeTruthy();
  });

  it('TC-02.3.1-01: supports label prop alias as alternative to title', () => {
    const { getByText } = render(<AppButton label="Dispatch Shuttle" />);
    expect(getByText('Dispatch Shuttle')).toBeTruthy();
  });

  // TC-02.3.1-02: Button calls onPress exactly once when pressed
  it('TC-02.3.1-02: triggers onPress handler exactly once on press', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <AppButton title="Initiate Docking" onPress={onPressMock} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  // TC-02.3.1-03: Disabled button does not call onPress
  it('TC-02.3.1-03: suppresses onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <AppButton title="Locked Vector" disabled onPress={onPressMock} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).not.toHaveBeenCalled();
  });

  // TC-02.3.1-04: Button uses correct accessibility role
  it('TC-02.3.1-04: declares accessibilityRole="button"', () => {
    const { getByRole } = render(<AppButton title="Telemetry Hub" />);
    const button = getByRole('button');

    expect(button.props.accessibilityRole).toBe('button');
  });

  // TC-02.3.1-05: Disabled state is correctly represented for accessibility
  it('TC-02.3.1-05: exposes disabled state in accessibilityState', () => {
    const { getByRole, rerender } = render(
      <AppButton title="Route Select" disabled />
    );

    const disabledButton = getByRole('button');
    expect(disabledButton.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );

    rerender(<AppButton title="Route Select" disabled={false} />);
    const enabledButton = getByRole('button');
    expect(enabledButton.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false })
    );
  });

  // TC-02.3.1-06: Button uses existing typography and theme tokens
  describe('TC-02.3.1-06: Typography and Theme Token Integration', () => {
    it('applies Waymark 2100 brand colors, radius, and padding tokens', () => {
      const { getByRole } = render(<AppButton title="Standard Action" />);
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.backgroundColor).toBe(theme.colors.beaconGold);
      expect(flatStyle.borderRadius).toBe(theme.radius.button);
      expect(flatStyle.paddingHorizontal).toBe(theme.spacing.spaceLg);
    });

    it('renders label with AppText using label typography and contrast colors', () => {
      const { getByText } = render(<AppButton title="Text Contrast Check" />);
      const textElement = getByText('Text Contrast Check');
      const flatTextStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatTextStyle.color).toBe(theme.colors.beaconGoldText);
      expect(flatTextStyle.fontWeight).toBe(theme.typography.fontWeight.bold);
    });

    it('adapts theme colors when themeMode="light" is passed', () => {
      const { getByRole, getByText } = render(
        <AppButton title="Light Action" themeMode="light" />
      );
      const button = getByRole('button');
      const flatContainerStyle = StyleSheet.flatten(button.props.style);
      const textElement = getByText('Light Action');
      const flatTextStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatContainerStyle.backgroundColor).toBe(lightTheme.colors.beaconGold);
      expect(flatTextStyle.color).toBe(lightTheme.colors.beaconGoldText);
    });

    it('adapts theme colors when themeMode="dark" is passed', () => {
      const { getByRole } = render(
        <AppButton title="Dark Action" themeMode="dark" />
      );
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.backgroundColor).toBe(darkTheme.colors.beaconGold);
    });
  });

  // TC-02.3.1-07: Button has an appropriate mobile touch target
  it('TC-02.3.1-07: enforces minimum interactive touch target dimensions (>= 44x44)', () => {
    const { getByRole } = render(<AppButton title="Touch Safe" />);
    const button = getByRole('button');
    const flatStyle = StyleSheet.flatten(button.props.style);

    expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(theme.spacing.layout.primaryButtonHeight);
  });

  // TC-02.3.1-08: Component props pass TypeScript checks
  describe('TC-02.3.1-08: TypeScript Component API Validation', () => {
    it('accepts full complement of valid typed props', () => {
      const validProps: AppButtonProps = {
        title: 'Full Props',
        label: 'Alternative Label',
        onPress: () => {},
        disabled: false,
        themeMode: 'dark',
        testID: 'full-props-btn',
        accessibilityLabel: 'Custom Accessibility Description',
        style: { margin: 8 },
        textStyle: { letterSpacing: 1 }
      };

      const { getByTestId } = render(<AppButton {...validProps} />);
      expect(getByTestId('full-props-btn')).toBeTruthy();
    });

    it('rejects invalid props at compile time', () => {
      // Type-level assertion:
      // @ts-expect-error Invalid prop 'invalidCustomProp' should be rejected by TypeScript
      const _invalidBtn = <AppButton title="Invalid" invalidCustomProp="unrecognized" />;
      expect(_invalidBtn).toBeDefined();
    });
  });
});
