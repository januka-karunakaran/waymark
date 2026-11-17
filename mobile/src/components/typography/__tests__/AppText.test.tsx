import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppText, TypographyVariant } from '../AppText';
import { theme, darkTheme, lightTheme } from '../../../theme';

describe('AppText Component', () => {
  // TC-02.2-01: AppText renders supplied content
  it('TC-02.2-01: renders supplied text content correctly', () => {
    const textContent = 'Waymark 2100 Transit Telemetry';
    const { getByText } = render(<AppText>{textContent}</AppText>);

    expect(getByText(textContent)).toBeTruthy();
  });

  // TC-02.2-02: Default body typography works
  it('TC-02.2-02: applies default body typography and primary text color', () => {
    const { getByText } = render(<AppText>Default Body Text</AppText>);
    const textElement = getByText('Default Body Text');
    const flatStyle = StyleSheet.flatten(textElement.props.style);

    expect(flatStyle.fontSize).toBe(theme.typography.styles.bodyMd.fontSize);
    expect(flatStyle.lineHeight).toBe(theme.typography.styles.bodyMd.lineHeight);
    expect(flatStyle.fontWeight).toBe(theme.typography.styles.bodyMd.fontWeight);
    expect(flatStyle.color).toBe(theme.colors.textPrimary);
  });

  // TC-02.2-03: Heading variants apply the correct theme styles
  describe('TC-02.2-03: Typography Variants', () => {
    it('applies display variant styles and header accessibility role', () => {
      const { getByText } = render(
        <AppText variant="display">Display Title</AppText>
      );
      const textElement = getByText('Display Title');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.displayLg.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.displayLg.lineHeight);
      expect(flatStyle.fontWeight).toBe(theme.typography.styles.displayLg.fontWeight);
      expect(textElement.props.accessibilityRole).toBe('header');
    });

    it('applies h1 variant styles and header accessibility role', () => {
      const { getByText } = render(<AppText variant="h1">Heading 1</AppText>);
      const textElement = getByText('Heading 1');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.headlineXl.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.headlineXl.lineHeight);
      expect(flatStyle.fontWeight).toBe(theme.typography.styles.headlineXl.fontWeight);
      expect(textElement.props.accessibilityRole).toBe('header');
    });

    it('applies h2 variant styles and header accessibility role', () => {
      const { getByText } = render(<AppText variant="h2">Heading 2</AppText>);
      const textElement = getByText('Heading 2');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.headlineLg.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.headlineLg.lineHeight);
      expect(flatStyle.fontWeight).toBe(theme.typography.styles.headlineLg.fontWeight);
      expect(textElement.props.accessibilityRole).toBe('header');
    });

    it('applies h3 variant styles and header accessibility role', () => {
      const { getByText } = render(<AppText variant="h3">Heading 3</AppText>);
      const textElement = getByText('Heading 3');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.headlineMd.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.headlineMd.lineHeight);
      expect(flatStyle.fontWeight).toBe(theme.typography.styles.headlineMd.fontWeight);
      expect(textElement.props.accessibilityRole).toBe('header');
    });

    it('applies bodySmall variant styles', () => {
      const { getByText } = render(
        <AppText variant="bodySmall">Small Body Text</AppText>
      );
      const textElement = getByText('Small Body Text');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.bodySm.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.bodySm.lineHeight);
      expect(flatStyle.fontWeight).toBe(theme.typography.styles.bodySm.fontWeight);
    });

    it('applies caption variant styles', () => {
      const { getByText } = render(
        <AppText variant="caption">Telemetry Caption</AppText>
      );
      const textElement = getByText('Telemetry Caption');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.labelMonoSm.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.labelMonoSm.lineHeight);
      expect(flatStyle.textTransform).toBe('uppercase');
    });

    it('applies label variant styles', () => {
      const { getByText } = render(<AppText variant="label">Platform Tag</AppText>);
      const textElement = getByText('Platform Tag');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontSize).toBe(theme.typography.styles.labelMonoMd.fontSize);
      expect(flatStyle.lineHeight).toBe(theme.typography.styles.labelMonoMd.lineHeight);
      expect(flatStyle.textTransform).toBe('uppercase');
    });
  });

  // TC-02.2-04: Semantic text colors use existing tokens
  describe('TC-02.2-04: Semantic Colors', () => {
    it('resolves semantic color tokens to correct theme values', () => {
      const colorCases = [
        { color: 'primary' as const, expected: theme.colors.textPrimary },
        { color: 'secondary' as const, expected: theme.colors.textSecondary },
        { color: 'muted' as const, expected: theme.colors.textMuted },
        { color: 'dim' as const, expected: theme.colors.textDim },
        { color: 'inverse' as const, expected: theme.colors.textInverse },
        { color: 'brand' as const, expected: theme.colors.beaconGold },
        { color: 'accent' as const, expected: theme.colors.beaconGold },
        { color: 'success' as const, expected: theme.colors.statusNominal },
        { color: 'warning' as const, expected: theme.colors.statusAdvisory },
        { color: 'error' as const, expected: theme.colors.statusCritical },
        { color: 'info' as const, expected: theme.colors.airSky },
        { color: 'trainTeal' as const, expected: theme.colors.trainTeal },
        { color: 'busCoral' as const, expected: theme.colors.busCoral }
      ];

      colorCases.forEach(({ color, expected }) => {
        const { getByText } = render(
          <AppText color={color}>{`Color-${color}`}</AppText>
        );
        const textElement = getByText(`Color-${color}`);
        const flatStyle = StyleSheet.flatten(textElement.props.style);
        expect(flatStyle.color).toBe(expected);
      });
    });

    it('supports direct custom color strings', () => {
      const customHex = '#FF00AA';
      const { getByText } = render(
        <AppText color={customHex}>Custom Colored</AppText>
      );
      const textElement = getByText('Custom Colored');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.color).toBe(customHex);
    });
  });

  // TC-02.2-05: Multiline text and normal Text props are supported
  describe('TC-02.2-05: Normal Text Props & Modifiers', () => {
    it('passes standard Text props like numberOfLines and ellipsizeMode', () => {
      const { getByText } = render(
        <AppText numberOfLines={2} ellipsizeMode="tail" testID="multiline-text">
          Long multiline transit alert that needs to be truncated with ellipsis
        </AppText>
      );
      const textElement = getByText(
        'Long multiline transit alert that needs to be truncated with ellipsis'
      );

      expect(textElement.props.numberOfLines).toBe(2);
      expect(textElement.props.ellipsizeMode).toBe('tail');
      expect(textElement.props.testID).toBe('multiline-text');
    });

    it('supports onPress callback handler', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <AppText onPress={onPressMock}>Pressable Action</AppText>
      );

      fireEvent.press(getByText('Pressable Action'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('supports text alignment modifier', () => {
      const { getByText } = render(
        <AppText align="center">Centered Text</AppText>
      );
      const textElement = getByText('Centered Text');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.textAlign).toBe('center');
    });

    it('supports weight override modifier', () => {
      const { getByText } = render(
        <AppText variant="body" weight="bold">
          Bold Body
        </AppText>
      );
      const textElement = getByText('Bold Body');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontWeight).toBe(theme.typography.fontWeight.bold);
    });

    it('supports tabular figures modifier for telemetry readouts', () => {
      const { getByText } = render(
        <AppText tabularNums>12:45:00</AppText>
      );
      const textElement = getByText('12:45:00');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.fontVariant).toContain('tabular-nums');
    });

    it('allows custom style overrides to take precedence', () => {
      const { getByText } = render(
        <AppText style={{ letterSpacing: 2, textDecorationLine: 'underline' }}>
          Custom Styled
        </AppText>
      );
      const textElement = getByText('Custom Styled');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.letterSpacing).toBe(2);
      expect(flatStyle.textDecorationLine).toBe('underline');
    });
  });

  // TC-02.2-06: Accessibility font scaling is not unintentionally disabled
  describe('TC-02.2-06: Accessibility Font Scaling', () => {
    it('enables allowFontScaling by default', () => {
      const { getByText } = render(<AppText>Accessible Text</AppText>);
      const textElement = getByText('Accessible Text');

      expect(textElement.props.allowFontScaling).toBe(true);
    });

    it('passes through maxFontSizeMultiplier when provided', () => {
      const { getByText } = render(
        <AppText maxFontSizeMultiplier={2.5}>Capped Text Scaling</AppText>
      );
      const textElement = getByText('Capped Text Scaling');

      expect(textElement.props.maxFontSizeMultiplier).toBe(2.5);
    });

    it('permits explicitly disabling font scaling if needed', () => {
      const { getByText } = render(
        <AppText allowFontScaling={false}>Fixed Metric</AppText>
      );
      const textElement = getByText('Fixed Metric');

      expect(textElement.props.allowFontScaling).toBe(false);
    });
  });

  // TC-02.2-07: Text variants work with existing theme configurations
  describe('TC-02.2-07: Light & Dark Theme Configurations', () => {
    it('resolves dark theme colors in dark mode', () => {
      const { getByText } = render(
        <AppText themeMode="dark" color="primary">
          Dark Mode Primary
        </AppText>
      );
      const textElement = getByText('Dark Mode Primary');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.color).toBe(darkTheme.colors.textPrimary);
    });

    it('resolves light theme colors in light mode', () => {
      const { getByText } = render(
        <AppText themeMode="light" color="primary">
          Light Mode Primary
        </AppText>
      );
      const textElement = getByText('Light Mode Primary');
      const flatStyle = StyleSheet.flatten(textElement.props.style);

      expect(flatStyle.color).toBe(lightTheme.colors.textPrimary);
    });

    it('resolves brand accent color appropriately in both themes', () => {
      const { getByText: getDark } = render(
        <AppText themeMode="dark" color="brand">
          Dark Accent
        </AppText>
      );
      const { getByText: getLight } = render(
        <AppText themeMode="light" color="brand">
          Light Accent
        </AppText>
      );

      const darkStyle = StyleSheet.flatten(getDark('Dark Accent').props.style);
      const lightStyle = StyleSheet.flatten(getLight('Light Accent').props.style);

      expect(darkStyle.color).toBe(darkTheme.colors.beaconGold);
      expect(lightStyle.color).toBe(lightTheme.colors.beaconGold);
      expect(darkStyle.color).not.toBe(lightStyle.color);
    });
  });

  // TC-02.2-08: Invalid typography variant types are rejected by TypeScript
  describe('TC-02.2-08: TypeScript Variant Type Safety', () => {
    it('verifies valid variants compile and are recognized', () => {
      const validVariants: TypographyVariant[] = [
        'display',
        'h1',
        'h2',
        'h3',
        'body',
        'bodySmall',
        'caption',
        'label'
      ];

      validVariants.forEach((variant) => {
        const { getByText } = render(
          <AppText variant={variant}>{`Variant-${variant}`}</AppText>
        );
        expect(getByText(`Variant-${variant}`)).toBeTruthy();
      });
    });

    it('proves type safety rejects invalid variant strings at compile time', () => {
      // Type-level assertion:
      // Passing an invalid variant triggers TypeScript compilation error:
      // @ts-expect-error Type '"nonexistent-variant"' is not assignable to type 'TypographyVariant | undefined'
      const _invalidElement = <AppText variant="nonexistent-variant">Invalid</AppText>;
      expect(_invalidElement).toBeDefined();
    });
  });
});
