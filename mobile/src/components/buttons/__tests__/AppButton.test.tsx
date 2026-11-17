import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton, AppButtonVariant, AppButtonSize, AppButtonProps } from '../AppButton';
import { AppText } from '../../typography';
import { theme, lightTheme, darkTheme } from '../../../theme';

describe('AppButton Component — Task 02.3.4 Advanced Accessibility & Testing', () => {
  // TC-02.3.4-01: Button exposes the correct accessibility role
  it('TC-02.3.4-01: exposes accessibilityRole="button" by default', () => {
    const { getByRole } = render(<AppButton title="Launch Telemetry" />);
    const button = getByRole('button');
    expect(button.props.accessibilityRole).toBe('button');
  });

  // TC-02.3.4-02: Button exposes a meaningful accessible label
  it('TC-02.3.4-02: defaults accessible name to title or label text', () => {
    const { getByRole: getByRole1 } = render(<AppButton title="Confirm Trajectory" />);
    expect(getByRole1('button').props.accessibilityLabel).toBe('Confirm Trajectory');

    const { getByRole: getByRole2 } = render(<AppButton label="Dispatch Shuttle" />);
    expect(getByRole2('button').props.accessibilityLabel).toBe('Dispatch Shuttle');
  });

  // TC-02.3.4-03: Custom accessibilityLabel is supported
  it('TC-02.3.4-03: respects caller-provided custom accessibilityLabel', () => {
    const { getByRole } = render(
      <AppButton
        title="Dock"
        accessibilityLabel="Dock orbital vehicle at Platform 4"
      />
    );
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Dock orbital vehicle at Platform 4');
  });

  // TC-02.3.4-04: Custom accessibilityHint is supported
  it('TC-02.3.4-04: passes through accessibilityHint to screen readers', () => {
    const { getByRole } = render(
      <AppButton
        title="Explore Map"
        accessibilityHint="Opens regional subterranean rail map"
      />
    );
    const button = getByRole('button');
    expect(button.props.accessibilityHint).toBe('Opens regional subterranean rail map');
  });

  // TC-02.3.4-05: Disabled state is represented accurately
  it('TC-02.3.4-05: accurately exposes disabled state in accessibilityState', () => {
    const { getByRole, rerender } = render(<AppButton title="Vector" disabled />);
    const button = getByRole('button');

    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );

    rerender(<AppButton title="Vector" disabled={false} />);
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false })
    );
  });

  // TC-02.3.4-06: Loading state exposes the correct busy state
  it('TC-02.3.4-06: exposes busy: true and disabled: true during loading', () => {
    const { getByRole, rerender } = render(<AppButton title="Compute" loading />);
    const button = getByRole('button');

    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({
        busy: true,
        disabled: true
      })
    );

    rerender(<AppButton title="Compute" loading={false} />);
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({
        busy: false,
        disabled: false
      })
    );
  });

  // TC-02.3.4-07: Disabled and loading states prevent interaction
  it('TC-02.3.4-07: suppresses onPress interaction when either disabled or loading', () => {
    const onPressMock = jest.fn();
    const { getByRole, rerender } = render(
      <AppButton title="Action" disabled onPress={onPressMock} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();

    rerender(<AppButton title="Action" loading onPress={onPressMock} />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();

    rerender(<AppButton title="Action" disabled loading onPress={onPressMock} />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  // TC-02.3.4-08: All variants preserve accessible roles and labels
  describe('TC-02.3.4-08: Accessibility Across Variants', () => {
    const variants: AppButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'destructive'
    ];

    variants.forEach((variant) => {
      it(`preserves role and label for variant="${variant}"`, () => {
        const { getByRole } = render(
          <AppButton title={`Action ${variant}`} variant={variant} />
        );
        const button = getByRole('button');
        expect(button.props.accessibilityRole).toBe('button');
        expect(button.props.accessibilityLabel).toBe(`Action ${variant}`);
      });
    });
  });

  // TC-02.3.4-09: All sizes meet the minimum touch target
  describe('TC-02.3.4-09: Touch Target Dimensions Across Sizes', () => {
    const sizes: AppButtonSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`enforces touch envelope >= 44x44 for size="${size}"`, () => {
        const { getByRole } = render(
          <AppButton title={`Size ${size}`} size={size} />
        );
        const button = getByRole('button');
        const flatStyle = StyleSheet.flatten(button.props.style);

        expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
        expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  // TC-02.3.4-10: AppText font scaling remains supported
  it('TC-02.3.4-10: propagates allowFontScaling and maxFontSizeMultiplier to text', () => {
    const { getByText, rerender } = render(
      <AppButton
        title="Scalable Label"
        allowFontScaling={true}
        maxFontSizeMultiplier={2.0}
      />
    );
    const textElement = getByText('Scalable Label');
    expect(textElement.props.allowFontScaling).toBe(true);
    expect(textElement.props.maxFontSizeMultiplier).toBe(2.0);

    rerender(
      <AppButton
        title="Scalable Label"
        allowFontScaling={false}
      />
    );
    expect(getByText('Scalable Label').props.allowFontScaling).toBe(false);
  });

  // TC-02.3.4-11: Long labels do not use styles that force clipping
  it('TC-02.3.4-11: allows responsive vertical expansion without rigid height clipping', () => {
    const longTitle = 'Super long planetary commuter schedule reservation confirmation header';
    const { getByRole } = render(<AppButton title={longTitle} />);
    const button = getByRole('button');
    const flatStyle = StyleSheet.flatten(button.props.style);

    // Verifies no fixed height and no overflow: hidden that would forcibly truncate text
    expect(flatStyle.height).toBeUndefined();
    expect(flatStyle.overflow).toBeUndefined();
    expect(flatStyle.minHeight).toBeDefined();
  });

  // TC-02.3.4-12: Existing button styling works in light and dark modes
  describe('TC-02.3.4-12: Theme Styling Verification', () => {
    it('applies dark theme tokens by default', () => {
      const { getByRole, getByText } = render(<AppButton title="Dark Theme" />);
      const containerStyle = StyleSheet.flatten(getByRole('button').props.style);
      const textStyle = StyleSheet.flatten(getByText('Dark Theme').props.style);

      expect(containerStyle.backgroundColor).toBe(darkTheme.colors.beaconGold);
      expect(textStyle.color).toBe(darkTheme.colors.beaconGoldText);
    });

    it('applies light theme tokens when themeMode="light"', () => {
      const { getByRole, getByText } = render(
        <AppButton title="Light Theme" themeMode="light" />
      );
      const containerStyle = StyleSheet.flatten(getByRole('button').props.style);
      const textStyle = StyleSheet.flatten(getByText('Light Theme').props.style);

      expect(containerStyle.backgroundColor).toBe(lightTheme.colors.beaconGold);
      expect(textStyle.color).toBe(lightTheme.colors.beaconGoldText);
    });
  });

  // TC-02.3.4-13: Custom accessibility props cannot incorrectly override enforced disabled/busy state
  it('TC-02.3.4-13: prevents caller from falsely falsifying disabled or busy accessibilityState', () => {
    const { getByRole } = render(
      <AppButton
        title="Enforced State"
        disabled
        loading
        accessibilityState={{ disabled: false, busy: false }}
      />
    );
    const button = getByRole('button');

    // Caller cannot falsify internal disabled and busy states
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({
        disabled: true,
        busy: true
      })
    );
  });

  // TC-02.3.4-14: Existing loading and button variant tests remain successful
  describe('TC-02.3.4-14: Regression Suite Across Variants and Loading', () => {
    it('renders secondary variant with panelInk and border', () => {
      const { getByRole, getByText } = render(
        <AppButton title="Secondary" variant="secondary" />
      );
      const containerStyle = StyleSheet.flatten(getByRole('button').props.style);
      const textStyle = StyleSheet.flatten(getByText('Secondary').props.style);

      expect(containerStyle.backgroundColor).toBe(theme.colors.panelInk);
      expect(containerStyle.borderWidth).toBe(1);
      expect(textStyle.color).toBe(theme.colors.textPrimary);
    });

    it('renders outline variant with transparent background', () => {
      const { getByRole } = render(
        <AppButton title="Outline" variant="outline" />
      );
      const containerStyle = StyleSheet.flatten(getByRole('button').props.style);
      expect(containerStyle.backgroundColor).toBe('transparent');
      expect(containerStyle.borderWidth).toBe(1);
    });

    it('renders destructive variant with statusCritical', () => {
      const { getByRole, getByText } = render(
        <AppButton title="Destructive" variant="destructive" />
      );
      const containerStyle = StyleSheet.flatten(getByRole('button').props.style);
      const textStyle = StyleSheet.flatten(getByText('Destructive').props.style);

      expect(containerStyle.backgroundColor).toBe(theme.colors.statusCritical);
      expect(textStyle.color).toBe(theme.colors.textInverse);
    });

    it('renders loadingText and spinner correctly', () => {
      const { getByTestId, getByText } = render(
        <AppButton title="Sync" loading loadingText="Syncing..." />
      );
      expect(getByTestId('loading-indicator')).toBeTruthy();
      expect(getByText('Syncing...')).toBeTruthy();
    });

    it('renders custom children instead of title', () => {
      const { getByText, queryByText } = render(
        <AppButton title="Ignored">
          <AppText>Custom Content</AppText>
        </AppButton>
      );
      expect(getByText('Custom Content')).toBeTruthy();
      expect(queryByText('Ignored')).toBeNull();
    });
  });

  // TC-02.3.4-15: TypeScript validation confirms the public component API
  describe('TC-02.3.4-15: TypeScript Public API Validation', () => {
    it('accepts all valid props', () => {
      const validProps: AppButtonProps = {
        title: 'Full API',
        label: 'Label Alias',
        variant: 'outline',
        size: 'sm',
        loading: false,
        loadingText: 'Loading...',
        onPress: () => {},
        disabled: false,
        themeMode: 'dark',
        allowFontScaling: true,
        maxFontSizeMultiplier: 1.5,
        accessibilityLabel: 'Accessible Description',
        accessibilityHint: 'Accessibility Hint',
        testID: 'accessibility-btn',
        style: { margin: 4 },
        textStyle: { opacity: 0.9 }
      };

      const { getByTestId } = render(<AppButton {...validProps} />);
      expect(getByTestId('accessibility-btn')).toBeTruthy();
    });

    it('rejects invalid props at compile time', () => {
      // Type-level assertion:
      // @ts-expect-error Invalid prop 'invalidAccessibilityProp' should be rejected by TypeScript
      const _invalidBtn = <AppButton title="Invalid" invalidAccessibilityProp="not-valid" />;
      expect(_invalidBtn).toBeDefined();
    });
  });
});
