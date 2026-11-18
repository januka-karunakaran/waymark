import React from 'react';
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { HomeHero } from '../components/HomeHero';
import { userFacingHomeIntro } from '../data/homeContent';
import { darkTheme, lightTheme } from '../../../theme';
import HomeScreen from '../../../../app/(tabs)/index';

describe('HomeHero Component (Task 3.1.2)', () => {
  describe('Branding & Content Verification', () => {
    it('displays verified default Waymark branding when content is omitted', () => {
      render(<HomeHero />);

      expect(screen.getByText(userFacingHomeIntro.eyebrow)).toBeTruthy();
      expect(screen.getByText(/Where would you like to/)).toBeTruthy();
      expect(screen.getByTestId('home-hero-highlight')).toBeTruthy();
      expect(screen.getByText(userFacingHomeIntro.subtitle)).toBeTruthy();
    });

    it('renders custom hero content when supplied via props', () => {
      const customContent = {
        eyebrow: 'CUSTOM TELEMETRY',
        title: 'Explore the City',
        titleHighlight: 'Together',
        subtitle: 'Autonomous multimodal routes synced across the metropolitan core.'
      };

      render(<HomeHero content={customContent} testID="custom-hero" />);

      expect(screen.getByText('CUSTOM TELEMETRY')).toBeTruthy();
      expect(screen.getByText(/Explore the City/)).toBeTruthy();
      expect(screen.getByText(/Together/)).toBeTruthy();
      expect(
        screen.getByText('Autonomous multimodal routes synced across the metropolitan core.')
      ).toBeTruthy();
    });

    it('gracefully falls back to default values for missing partial content', () => {
      render(<HomeHero content={{ title: 'Only Title' }} testID="partial-hero" />);

      expect(screen.getByText(/Only Title/)).toBeTruthy();
      expect(screen.getByText(userFacingHomeIntro.eyebrow)).toBeTruthy();
      expect(screen.getByText(userFacingHomeIntro.subtitle)).toBeTruthy();
    });

    it('renders optional trailing accessory badge in eyebrow row', () => {
      render(
        <HomeHero
          accessory={<View testID="status-badge" />}
          testID="accessory-hero"
        />
      );

      expect(screen.getByTestId('status-badge')).toBeTruthy();
    });
  });

  describe('Accessibility & Semantics', () => {
    it('provides accessibilityRole="header" on primary headline', () => {
      render(<HomeHero testID="a11y-hero" />);

      const titleNode = screen.getByTestId('a11y-hero-title');
      expect(titleNode.props.accessibilityRole).toBe('header');
    });

    it('enables dynamic font scaling by default across all text nodes', () => {
      render(<HomeHero testID="scaling-hero" />);

      const eyebrowNode = screen.getByTestId('scaling-hero-eyebrow');
      const titleNode = screen.getByTestId('scaling-hero-title');
      const subtitleNode = screen.getByTestId('scaling-hero-subtitle');

      expect(eyebrowNode.props.allowFontScaling).toBe(true);
      expect(titleNode.props.allowFontScaling).toBe(true);
      expect(subtitleNode.props.allowFontScaling).toBe(true);
    });

    it('handles long content without clipping or throwing', () => {
      const longTitle = 'A'.repeat(250);
      const longSubtitle = 'B'.repeat(500);

      const { toJSON } = render(
        <HomeHero
          content={{
            title: longTitle,
            subtitle: longSubtitle
          }}
          testID="long-text-hero"
        />
      );

      expect(toJSON()).toBeTruthy();
      expect(screen.getByText(new RegExp(longTitle))).toBeTruthy();
      expect(screen.getByText(longSubtitle)).toBeTruthy();
    });
  });

  describe('Theme Resolution & Styling', () => {
    it('applies dark theme brand color for title highlight by default', () => {
      render(<HomeHero testID="theme-hero" />);

      const highlightNode = screen.getByTestId('theme-hero-highlight');
      expect(highlightNode).toBeTruthy();
      // Brand color in dark theme is beaconGold (#FFC629)
      const flattenedStyle = [highlightNode.props.style].flat();
      const colorStyle = flattenedStyle.find((s) => s && s.color);
      expect(colorStyle?.color).toBe(darkTheme.colors.beaconGold);
    });

    it('supports explicit light theme mode override', () => {
      render(<HomeHero themeMode="light" testID="light-hero" />);

      const highlightNode = screen.getByTestId('light-hero-highlight');
      expect(highlightNode).toBeTruthy();
      const flattenedStyle = [highlightNode.props.style].flat();
      const colorStyle = flattenedStyle.find((s) => s && s.color);
      expect(colorStyle?.color).toBe(lightTheme.colors.beaconGold);
    });
  });

  describe('Home Screen Integration & Header Isolation', () => {
    it('renders inside HomeScreen without duplicating top screen navigation headers', () => {
      render(<HomeScreen />);

      // Top avionics bar from ScreenWrapper
      expect(screen.getByText('WAYMARK 2100')).toBeTruthy();
      expect(screen.getByText('PLANETARY TRANSIT NETWORK')).toBeTruthy();

      // In-screen hero from HomeHero
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText(/Where would you like to/)).toBeTruthy();
      expect(screen.getByText(/go\?/)).toBeTruthy();
      expect(screen.getByText(/One trip\. Every way to travel\./)).toBeTruthy();

      // Ensure HomeHero testID is mounted in tree
      expect(screen.getByTestId('home-hero')).toBeTruthy();
    });
  });
});
