import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton, AppButtonVariant, AppButtonSize, AppButtonProps } from '../AppButton';
import { AppText } from '../../typography';
import { theme, lightTheme, darkTheme } from '../../../theme';

describe('AppButton Component — Task 02.3.3 Loading & Interaction States', () => {
  // TC-02.3.3-01: Normal button renders correctly when loading is false
  it('TC-02.3.3-01: renders normal title and does not show spinner when loading is false', () => {
    const { getByText, queryByTestId } = render(
      <AppButton title="Initiate Docking" loading={false} />
    );

    expect(getByText('Initiate Docking')).toBeTruthy();
    expect(queryByTestId('loading-indicator')).toBeNull();
  });

  // TC-02.3.3-02: ActivityIndicator renders when loading is true
  it('TC-02.3.3-02: renders ActivityIndicator spinner when loading is true', () => {
    const { getByTestId, queryByText } = render(
      <AppButton title="Initiate Docking" loading />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
    expect(queryByText('Initiate Docking')).toBeNull();
  });

  // TC-02.3.3-03: Loading button prevents onPress
  it('TC-02.3.3-03: suppresses onPress callback when loading is true', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <AppButton title="Save State" loading onPress={onPressMock} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  // TC-02.3.3-04: Normal button executes onPress correctly
  it('TC-02.3.3-04: executes onPress exactly once on normal button press', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <AppButton title="Confirm Trajectory" onPress={onPressMock} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  // TC-02.3.3-05: Disabled button continues to prevent onPress
  it('TC-02.3.3-05: suppresses onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <AppButton title="Locked Vector" disabled onPress={onPressMock} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  // TC-02.3.3-06: Loading changes back to false and normal behavior resumes
  it('TC-02.3.3-06: resumes normal interaction when loading toggles from true to false', () => {
    const onPressMock = jest.fn();
    const { getByRole, queryByTestId, getByTestId, getByText, rerender } = render(
      <AppButton title="Async Operation" loading onPress={onPressMock} />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();

    // Toggle loading to false
    rerender(
      <AppButton title="Async Operation" loading={false} onPress={onPressMock} />
    );

    expect(queryByTestId('loading-indicator')).toBeNull();
    expect(getByText('Async Operation')).toBeTruthy();

    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  // TC-02.3.3-07: Loading text renders correctly
  it('TC-02.3.3-07: renders loadingText alongside ActivityIndicator spinner', () => {
    const { getByTestId, getByText } = render(
      <AppButton
        title="Sync Telemetry"
        loading
        loadingText="Synchronizing..."
      />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
    expect(getByText('Synchronizing...')).toBeTruthy();
  });

  // TC-02.3.3-08: Loading state reports accessibility busy and disabled
  it('TC-02.3.3-08: exposes busy: true and disabled: true to accessibilityState during loading', () => {
    const { getByRole, rerender } = render(
      <AppButton title="Submit Telemetry" loading />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({
        busy: true,
        disabled: true
      })
    );

    rerender(<AppButton title="Submit Telemetry" loading={false} />);
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({
        busy: false,
        disabled: false
      })
    );
  });

  // TC-02.3.3-09: Loading works across all button variants
  describe('TC-02.3.3-09: Loading State Across Variants', () => {
    const variants: AppButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'destructive'
    ];

    variants.forEach((variant) => {
      it(`renders loading indicator and suppresses press for ${variant} variant`, () => {
        const onPressMock = jest.fn();
        const { getByRole, getByTestId } = render(
          <AppButton
            title={`Action ${variant}`}
            variant={variant}
            loading
            onPress={onPressMock}
          />
        );

        expect(getByTestId('loading-indicator')).toBeTruthy();
        fireEvent.press(getByRole('button'));
        expect(onPressMock).not.toHaveBeenCalled();
      });
    });
  });

  // TC-02.3.3-10: Loading works across small, medium, and large buttons
  describe('TC-02.3.3-10: Loading State Across Sizes', () => {
    const sizes: AppButtonSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`renders loading state and preserves touch dimensions for size="${size}"`, () => {
        const { getByRole, getByTestId } = render(
          <AppButton title={`Size ${size}`} size={size} loading />
        );

        const button = getByRole('button');
        const flatStyle = StyleSheet.flatten(button.props.style);

        expect(getByTestId('loading-indicator')).toBeTruthy();
        expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
        expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  // TC-02.3.3-11: Light and dark theme styling works
  describe('TC-02.3.3-11: Theme Aware Loading Colors', () => {
    it('uses light theme contrast color for spinner in light mode', () => {
      const { getByTestId } = render(
        <AppButton title="Light Loading" variant="primary" loading themeMode="light" />
      );

      const spinner = getByTestId('loading-indicator');
      expect(spinner.props.color).toBe(lightTheme.colors.beaconGoldText);
    });

    it('uses dark theme contrast color for spinner in dark mode', () => {
      const { getByTestId } = render(
        <AppButton title="Dark Loading" variant="primary" loading themeMode="dark" />
      );

      const spinner = getByTestId('loading-indicator');
      expect(spinner.props.color).toBe(darkTheme.colors.beaconGoldText);
    });
  });

  // TC-02.3.3-12: Existing custom styles and accessibility props remain compatible
  it('TC-02.3.3-12: preserves custom style overrides and accessibilityHint', () => {
    const { getByRole } = render(
      <AppButton
        title="Styled Loading"
        loading
        style={{ borderWidth: 2 }}
        accessibilityHint="Navigates to planetary map"
      />
    );

    const button = getByRole('button');
    const flatStyle = StyleSheet.flatten(button.props.style);

    expect(flatStyle.borderWidth).toBe(2);
    expect(button.props.accessibilityHint).toBe('Navigates to planetary map');
  });

  // TC-02.3.3-13: Loading prevents repeated press actions
  it('TC-02.3.3-13: prevents duplicate submissions on multiple rapid presses while loading', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <AppButton title="Submit Telemetry" loading onPress={onPressMock} />
    );

    const button = getByRole('button');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(0);
  });

  // TC-02.3.3-14: Previous button tests remain successful (backward compatibility regression suite)
  describe('TC-02.3.3-14: Previous Button Tests & Invariants', () => {
    it('renders label prop alias correctly', () => {
      const { getByText } = render(<AppButton label="Dispatch Shuttle" />);
      expect(getByText('Dispatch Shuttle')).toBeTruthy();
    });

    it('renders custom children instead of title when provided', () => {
      const { getByText, queryByText } = render(
        <AppButton title="Ignored Title">
          <AppText>Custom Child Content</AppText>
        </AppButton>
      );
      expect(getByText('Custom Child Content')).toBeTruthy();
      expect(queryByText('Ignored Title')).toBeNull();
    });

    it('renders secondary variant with panelInk and ghost border', () => {
      const { getByRole, getByText } = render(
        <AppButton title="Secondary Action" variant="secondary" />
      );
      const button = getByRole('button');
      const flatContainerStyle = StyleSheet.flatten(button.props.style);
      const textElement = getByText('Secondary Action');
      const flatTextStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatContainerStyle.backgroundColor).toBe(theme.colors.panelInk);
      expect(flatContainerStyle.borderColor).toBe(theme.colors.hudGhostBorder);
      expect(flatTextStyle.color).toBe(theme.colors.textPrimary);
    });

    it('renders outline variant with transparent background', () => {
      const { getByRole } = render(
        <AppButton title="Outline Action" variant="outline" />
      );
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);
      expect(flatStyle.backgroundColor).toBe('transparent');
      expect(flatStyle.borderWidth).toBe(1);
    });

    it('renders destructive variant with statusCritical', () => {
      const { getByRole } = render(
        <AppButton title="Abort Transit" variant="destructive" />
      );
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);
      expect(flatStyle.backgroundColor).toBe(theme.colors.statusCritical);
    });
  });

  // TC-02.3.3-15: TypeScript accepts the new props and rejects invalid types
  describe('TC-02.3.3-15: TypeScript Props Validation', () => {
    it('accepts loading and loadingText typed props', () => {
      const validProps: AppButtonProps = {
        title: 'Full Loading Props',
        loading: true,
        loadingText: 'Calibrating...',
        variant: 'primary',
        size: 'lg'
      };

      const { getByRole } = render(<AppButton {...validProps} />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('rejects invalid loading prop types at compile time', () => {
      // Type-level assertion:
      // @ts-expect-error Type 'string' is not assignable to type 'boolean | undefined'
      const _invalidBtn = <AppButton title="Invalid" loading="not-a-boolean" />;
      expect(_invalidBtn).toBeDefined();
    });
  });
});
