import {
  theme,
  darkTheme,
  lightTheme,
  colors,
  darkColors,
  lightColors,
  spacing,
  radius,
  radii,
  shadows,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings
} from '../index';

describe('Waymark Design Tokens', () => {
  describe('Theme Token Exports', () => {
    it('exports all core theme modules', () => {
      expect(theme).toBeDefined();
      expect(darkTheme).toBeDefined();
      expect(lightTheme).toBeDefined();
      expect(colors).toBeDefined();
      expect(darkColors).toBeDefined();
      expect(lightColors).toBeDefined();
      expect(spacing).toBeDefined();
      expect(radius).toBeDefined();
      expect(radii).toBeDefined();
      expect(shadows).toBeDefined();
      expect(typography).toBeDefined();
    });

    it('sets correct theme modes', () => {
      expect(theme.mode).toBe('dark');
      expect(darkTheme.mode).toBe('dark');
      expect(lightTheme.mode).toBe('light');
    });

    it('defaults theme to darkColors for Night Transit paradigm', () => {
      expect(theme.colors).toEqual(darkColors);
    });
  });

  describe('Color Tokens', () => {
    const hexOrRgbaRegex = /^(#[0-9A-Fa-f]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\))$/;

    it('defines primary and secondary brand colors', () => {
      expect(colors.beaconGold).toBe('#FFC629');
      expect(colors.trainTeal).toBe('#2DD4BF');
      expect(colors.busCoral).toBe('#FF7A59');
      expect(colors.airSky).toBe('#7CC4FF');
      expect(colors.smartRoadSilver).toBe('#E5E7EB');
      expect(colors.pedestrianSlate).toBe('#B8C2D9');
    });

    it('defines semantic surface and background colors', () => {
      expect(colors.abyssVoid).toBe('#070A0F');
      expect(colors.deckInk).toBe('#0D1117');
      expect(colors.panelInk).toBe('#151B24');
      expect(colors.panelInkElevated).toBe('#1A222D');
    });

    it('defines semantic text colors', () => {
      expect(colors.textPrimary).toBe('#DFE2EB');
      expect(colors.textSecondary).toBe('#A9B2C3');
      expect(colors.textMuted).toBe('#7E8CA7');
      expect(colors.textDim).toBe('#4F5B73');
      expect(colors.textInverse).toBe('#070A0F');
    });

    it('defines operational status colors', () => {
      expect(colors.statusNominal).toBe('#4ADE80');
      expect(colors.statusAdvisory).toBe('#FF9F43');
      expect(colors.statusCritical).toBe('#FF5D5D');
    });

    it('defines border and divider tokens', () => {
      expect(colors.hudGhost).toBe('rgba(184, 194, 217, 0.12)');
      expect(colors.hudGhostSubtle).toBe('rgba(184, 194, 217, 0.08)');
      expect(colors.hudGhostBorder).toBe('rgba(184, 194, 217, 0.16)');
      expect(colors.luminousEdge).toBe('rgba(255, 198, 41, 0.45)');
      expect(colors.divider).toBe('rgba(184, 194, 217, 0.08)');
    });

    it('validates color format across dark palette', () => {
      Object.entries(darkColors).forEach(([, value]) => {
        expect(value).toMatch(hexOrRgbaRegex);
      });
    });

    it('validates color format across light palette', () => {
      Object.entries(lightColors).forEach(([, value]) => {
        expect(value).toMatch(hexOrRgbaRegex);
      });
    });

    it('guarantees identical key coverage between dark and light themes', () => {
      const darkKeys = Object.keys(darkColors).sort();
      const lightKeys = Object.keys(lightColors).sort();
      expect(darkKeys).toEqual(lightKeys);
    });

    it('exposes standard semantic shortcuts', () => {
      expect(colors.primary).toBe(colors.beaconGold);
      expect(colors.secondary).toBe(colors.trainTeal);
      expect(colors.background).toBe(colors.abyssVoid);
      expect(colors.surface).toBe(colors.deckInk);
      expect(colors.success).toBe(colors.statusNominal);
      expect(colors.warning).toBe(colors.statusAdvisory);
      expect(colors.error).toBe(colors.statusCritical);
    });
  });

  describe('Spacing Scale', () => {
    it('contains positive standard step values', () => {
      const steps = [
        spacing.xxs,
        spacing.xs,
        spacing.sm,
        spacing.md,
        spacing.lg,
        spacing.xl,
        spacing.xxl,
        spacing.xxxl
      ];

      steps.forEach((val) => {
        expect(typeof val).toBe('number');
        expect(val).toBeGreaterThan(0);
      });
    });

    it('enforces monotonic scaling on spacing steps', () => {
      expect(spacing.xxs).toBeLessThan(spacing.xs);
      expect(spacing.xs).toBeLessThan(spacing.sm);
      expect(spacing.sm).toBeLessThan(spacing.md);
      expect(spacing.md).toBeLessThan(spacing.lg);
      expect(spacing.lg).toBeLessThan(spacing.xl);
      expect(spacing.xl).toBeLessThan(spacing.xxl);
      expect(spacing.xxl).toBeLessThan(spacing.xxxl);
    });

    it('preserves backwards-compatible space tokens', () => {
      expect(spacing.spaceXs).toBe(4);
      expect(spacing.spaceSm).toBe(8);
      expect(spacing.spaceMd).toBe(16);
      expect(spacing.spaceLg).toBe(24);
      expect(spacing.spaceXl).toBe(40);
    });

    it('defines positive margins and gutters', () => {
      expect(spacing.margin).toBeGreaterThan(0);
      expect(spacing.gutter).toBeGreaterThan(0);
      expect(spacing.marginMobile).toBeGreaterThan(0);
      expect(spacing.gutterMobile).toBeGreaterThan(0);
    });

    it('enforces mobile-first touch target minimums', () => {
      expect(spacing.layout.minTouchTarget).toBeGreaterThanOrEqual(48);
      expect(spacing.layout.primaryButtonHeight).toBeGreaterThanOrEqual(48);
      expect(spacing.layout.secondaryButtonHeight).toBeGreaterThanOrEqual(48);
      expect(spacing.layout.inputHeight).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Radius Tokens', () => {
    it('defines non-negative numeric radius values', () => {
      Object.entries(radius).forEach(([, value]) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });

    it('matches Waymark 2100 engineered geometric specifications', () => {
      expect(radius.button).toBe(14);
      expect(radius.card).toBe(16);
      expect(radius.pill).toBe(6);
      expect(radius.input).toBe(12);
      expect(radius.full).toBe(9999);
    });

    it('provides alias radii matching radius', () => {
      expect(radii).toEqual(radius);
      expect(spacing.radii).toEqual(radius);
    });
  });

  describe('Shadow / Elevation Tokens', () => {
    it('provides cross-platform shadow definitions', () => {
      const shadowKeys = ['none', 'sm', 'md', 'lg', 'xl', 'glowBeacon', 'glowTeal', 'glowCritical'] as const;

      shadowKeys.forEach((key) => {
        const shadow = shadows[key];
        expect(shadow).toBeDefined();
        expect(typeof shadow.shadowColor).toBe('string');
        expect(typeof shadow.shadowOffset.width).toBe('number');
        expect(typeof shadow.shadowOffset.height).toBe('number');
        expect(typeof shadow.shadowRadius).toBe('number');
        expect(typeof shadow.shadowOpacity).toBe('number');
        expect(typeof shadow.elevation).toBe('number');
        expect(shadow.shadowOpacity).toBeGreaterThanOrEqual(0);
        expect(shadow.shadowOpacity).toBeLessThanOrEqual(1);
        expect(shadow.elevation).toBeGreaterThanOrEqual(0);
      });
    });

    it('sets none elevation to 0', () => {
      expect(shadows.none.elevation).toBe(0);
      expect(shadows.none.shadowOpacity).toBe(0);
    });
  });

  describe('Typography Scale and Styles', () => {
    it('defines font scales', () => {
      expect(fontSizes.displayLg).toBe(36);
      expect(fontSizes.caption).toBe(11);
      expect(fontWeights.bold).toBe('700');
      expect(lineHeights.displayLg).toBe(44);
      expect(letterSpacings.tight).toBeLessThan(0);
    });

    it('defines all required typography style keys', () => {
      const expectedKeys = [
        'displayLg',
        'headlineXl',
        'headlineLg',
        'headlineMd',
        'titleSm',
        'bodyLg',
        'bodyMd',
        'bodySm',
        'labelMonoMd',
        'labelMonoSm',
        'telemetryNumber'
      ];

      expectedKeys.forEach((key) => {
        expect(typography.styles).toHaveProperty(key);
      });
    });

    it('enforces positive fontSize and lineHeight where applicable', () => {
      Object.entries(typography.styles).forEach(([, style]) => {
        if ('fontSize' in style && typeof style.fontSize === 'number') {
          expect(style.fontSize).toBeGreaterThan(0);
        }
        if ('lineHeight' in style && typeof style.lineHeight === 'number') {
          expect(style.lineHeight).toBeGreaterThan(0);
          if ('fontSize' in style && typeof style.fontSize === 'number') {
            expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
          }
        }
      });
    });

    it('mandates tabular-nums for telemetry readouts', () => {
      expect(typography.styles.telemetryNumber.fontVariant).toContain('tabular-nums');
    });
  });

  describe('Theme Structure Integration', () => {
    it('contains all required token systems in darkTheme', () => {
      expect(darkTheme).toHaveProperty('mode', 'dark');
      expect(darkTheme).toHaveProperty('colors');
      expect(darkTheme).toHaveProperty('typography');
      expect(darkTheme).toHaveProperty('spacing');
      expect(darkTheme).toHaveProperty('radius');
      expect(darkTheme).toHaveProperty('shadows');
    });

    it('contains all required token systems in lightTheme', () => {
      expect(lightTheme).toHaveProperty('mode', 'light');
      expect(lightTheme).toHaveProperty('colors');
      expect(lightTheme).toHaveProperty('typography');
      expect(lightTheme).toHaveProperty('spacing');
      expect(lightTheme).toHaveProperty('radius');
      expect(lightTheme).toHaveProperty('shadows');
    });

    it('provides opposing background polarities for accessibility', () => {
      expect(darkTheme.colors.background).toBe('#070A0F');
      expect(lightTheme.colors.background).toBe('#F4F6F9');
    });
  });
});
