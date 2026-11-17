import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton, AppButtonVariant, AppButtonSize } from '../AppButton';
import { AppText } from '../../typography';
import { theme, lightTheme, darkTheme } from '../../../theme';

describe('AppButton Component — Task 02.3.2 Variants & Sizes', () => {
  // Existing Base functionality (backward compatibility)
  describe('Base Functionality & Regressions', () => {
    it('renders supplied title text correctly', () => {
      const { getByText } = render(<AppButton title="Confirm Journey" />);
      expect(getByText('Confirm Journey')).toBeTruthy();
    });

    it('supports label prop alias as alternative to title', () => {
      const { getByText } = render(<AppButton label="Dispatch Shuttle" />);
      expect(getByText('Dispatch Shuttle')).toBeTruthy();
    });

    it('declares accessibilityRole="button"', () => {
      const { getByRole } = render(<AppButton title="Telemetry Hub" />);
      const button = getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');
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
  });

  // TC-02.3.2-01: Primary variant renders and uses correct design tokens
  it('TC-02.3.2-01: renders primary variant with beacon gold and high-contrast text', () => {
    const { getByRole, getByText } = render(
      <AppButton title="Primary Action" variant="primary" />
    );
    const button = getByRole('button');
    const flatContainerStyle = StyleSheet.flatten(button.props.style);
    const textElement = getByText('Primary Action');
    const flatTextStyle = StyleSheet.flatten(textElement.props.style);

    expect(flatContainerStyle.backgroundColor).toBe(theme.colors.beaconGold);
    expect(flatContainerStyle.borderWidth).toBe(0);
    expect(flatTextStyle.color).toBe(theme.colors.beaconGoldText);
    expect(flatTextStyle.fontWeight).toBe(theme.typography.fontWeight.bold);
  });

  // TC-02.3.2-02: Secondary variant renders correctly
  it('TC-02.3.2-02: renders secondary variant with panel ink surface and hud ghost border', () => {
    const { getByRole, getByText } = render(
      <AppButton title="Secondary Action" variant="secondary" />
    );
    const button = getByRole('button');
    const flatContainerStyle = StyleSheet.flatten(button.props.style);
    const textElement = getByText('Secondary Action');
    const flatTextStyle = StyleSheet.flatten(textElement.props.style);

    expect(flatContainerStyle.backgroundColor).toBe(theme.colors.panelInk);
    expect(flatContainerStyle.borderColor).toBe(theme.colors.hudGhostBorder);
    expect(flatContainerStyle.borderWidth).toBe(1);
    expect(flatTextStyle.color).toBe(theme.colors.textPrimary);
  });

  // TC-02.3.2-03: Outline variant applies the correct border
  it('TC-02.3.2-03: renders outline variant with transparent background and visible border', () => {
    const { getByRole, getByText } = render(
      <AppButton title="Outline Action" variant="outline" />
    );
    const button = getByRole('button');
    const flatContainerStyle = StyleSheet.flatten(button.props.style);
    const textElement = getByText('Outline Action');
    const flatTextStyle = StyleSheet.flatten(textElement.props.style);

    expect(flatContainerStyle.backgroundColor).toBe('transparent');
    expect(flatContainerStyle.borderColor).toBe(theme.colors.hudGhostBorder);
    expect(flatContainerStyle.borderWidth).toBe(1);
    expect(flatTextStyle.color).toBe(theme.colors.textPrimary);
  });

  // TC-02.3.2-04: Ghost variant renders correctly
  it('TC-02.3.2-04: renders ghost variant with minimal background and borderless styling', () => {
    const { getByRole, getByText } = render(
      <AppButton title="Ghost Action" variant="ghost" />
    );
    const button = getByRole('button');
    const flatContainerStyle = StyleSheet.flatten(button.props.style);
    const textElement = getByText('Ghost Action');
    const flatTextStyle = StyleSheet.flatten(textElement.props.style);

    expect(flatContainerStyle.backgroundColor).toBe('transparent');
    expect(flatContainerStyle.borderWidth).toBe(0);
    expect(flatTextStyle.color).toBe(theme.colors.textSecondary);
  });

  // TC-02.3.2-05: Destructive variant uses semantic danger styling
  it('TC-02.3.2-05: renders destructive variant with statusCritical danger tokens', () => {
    const { getByRole, getByText } = render(
      <AppButton title="Abort Transit" variant="destructive" />
    );
    const button = getByRole('button');
    const flatContainerStyle = StyleSheet.flatten(button.props.style);
    const textElement = getByText('Abort Transit');
    const flatTextStyle = StyleSheet.flatten(textElement.props.style);

    expect(flatContainerStyle.backgroundColor).toBe(theme.colors.statusCritical);
    expect(flatContainerStyle.borderWidth).toBe(0);
    expect(flatTextStyle.color).toBe(theme.colors.textInverse);
  });

  // TC-02.3.2-06: Small, medium, and large sizes use correct theme sizing
  describe('TC-02.3.2-06: Button Sizes', () => {
    it('applies compact styling for size="sm"', () => {
      const { getByRole } = render(
        <AppButton title="Compact" size="sm" />
      );
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.minHeight).toBe(44);
      expect(flatStyle.paddingHorizontal).toBe(theme.spacing.spaceMd);
      expect(flatStyle.paddingVertical).toBe(theme.spacing.spaceXs);
      expect(flatStyle.borderRadius).toBe(theme.radius.md);
    });

    it('applies standard styling for size="md" (default)', () => {
      const { getByRole } = render(
        <AppButton title="Standard" size="md" />
      );
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.minHeight).toBeGreaterThanOrEqual(theme.spacing.layout.primaryButtonHeight);
      expect(flatStyle.paddingHorizontal).toBe(theme.spacing.spaceLg);
      expect(flatStyle.paddingVertical).toBe(theme.spacing.spaceSm);
      expect(flatStyle.borderRadius).toBe(theme.radius.button);
    });

    it('applies prominent styling for size="lg"', () => {
      const { getByRole } = render(
        <AppButton title="Prominent CTA" size="lg" />
      );
      const button = getByRole('button');
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.minHeight).toBe(64);
      expect(flatStyle.paddingHorizontal).toBe(theme.spacing.spaceLg);
      expect(flatStyle.paddingVertical).toBe(theme.spacing.spaceMd);
      expect(flatStyle.borderRadius).toBe(theme.radius.card);
    });
  });

  // TC-02.3.2-07: Default button behavior remains backward-compatible
  it('TC-02.3.2-07: preserves backward compatibility when variant and size are omitted', () => {
    const { getByRole, getByText } = render(
      <AppButton title="Legacy Standard Button" />
    );
    const button = getByRole('button');
    const flatContainerStyle = StyleSheet.flatten(button.props.style);
    const textElement = getByText('Legacy Standard Button');
    const flatTextStyle = StyleSheet.flatten(textElement.props.style);

    // Matches primary variant
    expect(flatContainerStyle.backgroundColor).toBe(theme.colors.beaconGold);
    expect(flatTextStyle.color).toBe(theme.colors.beaconGoldText);
    // Matches md size
    expect(flatContainerStyle.minHeight).toBeGreaterThanOrEqual(theme.spacing.layout.primaryButtonHeight);
    expect(flatContainerStyle.borderRadius).toBe(theme.radius.button);
    expect(flatContainerStyle.paddingHorizontal).toBe(theme.spacing.spaceLg);
  });

  // TC-02.3.2-08: Disabled behavior works across variants
  describe('TC-02.3.2-08: Disabled Behavior Across Variants', () => {
    const variants: AppButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'destructive'
    ];

    variants.forEach((variant) => {
      it(`disables interaction and exposes disabled state for ${variant} variant`, () => {
        const onPressMock = jest.fn();
        const { getByRole } = render(
          <AppButton
            title={`Disabled ${variant}`}
            variant={variant}
            disabled
            onPress={onPressMock}
          />
        );

        const button = getByRole('button');
        fireEvent.press(button);

        expect(onPressMock).not.toHaveBeenCalled();
        expect(button.props.accessibilityState).toEqual(
          expect.objectContaining({ disabled: true })
        );
      });
    });
  });

  // TC-02.3.2-09: onPress behavior remains functional across variants
  describe('TC-02.3.2-09: onPress Functional Across Variants', () => {
    const variants: AppButtonVariant[] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'destructive'
    ];

    variants.forEach((variant) => {
      it(`triggers onPress handler for ${variant} variant`, () => {
        const onPressMock = jest.fn();
        const { getByRole } = render(
          <AppButton
            title={`Active ${variant}`}
            variant={variant}
            onPress={onPressMock}
          />
        );

        const button = getByRole('button');
        fireEvent.press(button);

        expect(onPressMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  // TC-02.3.2-10: Light and dark theme styles resolve correctly
  describe('TC-02.3.2-10: Theme Integration (Light / Dark)', () => {
    it('resolves light theme colors for primary and secondary variants', () => {
      const { getByText: getPrimary, getByRole: getPrimaryBtn } = render(
        <AppButton title="Light Primary" variant="primary" themeMode="light" />
      );
      const primaryContainerStyle = StyleSheet.flatten(getPrimaryBtn('button').props.style);
      const primaryTextStyle = StyleSheet.flatten(getPrimary('Light Primary').props.style);

      expect(primaryContainerStyle.backgroundColor).toBe(lightTheme.colors.beaconGold);
      expect(primaryTextStyle.color).toBe(lightTheme.colors.beaconGoldText);

      const { getByRole: getSecondaryBtn } = render(
        <AppButton title="Light Secondary" variant="secondary" themeMode="light" />
      );
      const secondaryContainerStyle = StyleSheet.flatten(getSecondaryBtn('button').props.style);
      expect(secondaryContainerStyle.backgroundColor).toBe(lightTheme.colors.panelInk);
    });

    it('resolves dark theme colors for primary and destructive variants', () => {
      const { getByText: getDestructive, getByRole: getDestructiveBtn } = render(
        <AppButton title="Dark Destructive" variant="destructive" themeMode="dark" />
      );
      const destructiveContainerStyle = StyleSheet.flatten(getDestructiveBtn('button').props.style);
      const destructiveTextStyle = StyleSheet.flatten(getDestructive('Dark Destructive').props.style);

      expect(destructiveContainerStyle.backgroundColor).toBe(darkTheme.colors.statusCritical);
      expect(destructiveTextStyle.color).toBe(darkTheme.colors.textInverse);
    });
  });

  // TC-02.3.2-11: All sizes preserve minimum accessible touch targets
  describe('TC-02.3.2-11: Minimum Touch Targets Across Sizes', () => {
    const sizes: AppButtonSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`enforces touch target >= 44x44 for size="${size}"`, () => {
        const { getByRole } = render(
          <AppButton title={`Touch Target ${size}`} size={size} />
        );
        const button = getByRole('button');
        const flatStyle = StyleSheet.flatten(button.props.style);

        expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
        expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  // TC-02.3.2-12: TypeScript rejects invalid variants and sizes
  describe('TC-02.3.2-12: TypeScript Variant & Size Type Safety', () => {
    it('accepts valid variant and size union values', () => {
      const validProps: { variant: AppButtonVariant; size: AppButtonSize } = {
        variant: 'destructive',
        size: 'lg'
      };

      const { getByRole } = render(
        <AppButton title="Valid Props" {...validProps} />
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('rejects invalid variant strings at compile time', () => {
      // Type-level assertion:
      // @ts-expect-error Type '"super-primary"' is not assignable to type 'AppButtonVariant | undefined'
      const _invalidVariant = <AppButton title="Invalid" variant="super-primary" />;
      expect(_invalidVariant).toBeDefined();
    });

    it('rejects invalid size strings at compile time', () => {
      // Type-level assertion:
      // @ts-expect-error Type '"xl"' is not assignable to type 'AppButtonSize | undefined'
      const _invalidSize = <AppButton title="Invalid" size="xl" />;
      expect(_invalidSize).toBeDefined();
    });
  });
});
