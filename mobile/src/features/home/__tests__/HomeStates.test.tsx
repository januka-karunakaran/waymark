import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import * as networkHook from '../../../hooks/useNetworkStatus';
import { HomeContent } from '../components/HomeContent';
import { defaultHomeContent } from '../data/homeContent';
import { HomeScreenData } from '../types';
import HomeScreen from '../../../../app/(tabs)/index';

describe('Home States, Reliability & QA (Task 3.1.4)', () => {
  describe('Loading State Verification', () => {
    it('renders accessible LoadingIndicator when isLoading is true', () => {
      render(
        <HomeContent
          isLoading={true}
          loadingMessage="Calibrating transit telemetry..."
          testID="home-test"
        />
      );

      expect(screen.getByTestId('home-test-loading')).toBeTruthy();
      expect(screen.getByTestId('home-test-loading-indicator')).toBeTruthy();
      expect(screen.getByText('Calibrating transit telemetry...')).toBeTruthy();
      expect(screen.queryByTestId('home-hero')).toBeNull();
    });

    it('renders loading state when data availability is "loading"', () => {
      const loadingData: HomeScreenData = {
        ...defaultHomeContent,
        availability: 'loading'
      };

      render(<HomeContent data={loadingData} testID="avail-loading" />);
      expect(screen.getByTestId('avail-loading-loading')).toBeTruthy();
      expect(
        screen.getByText('Synchronizing transit telemetry...')
      ).toBeTruthy();
    });

    it('provides accessibilityRole="progressbar" on the loading component', () => {
      render(<HomeContent isLoading={true} testID="a11y-loading" />);
      const indicator = screen.getByTestId('a11y-loading-loading-indicator');
      expect(indicator.props.accessibilityRole).toBe('progressbar');
    });
  });

  describe('Error State Verification', () => {
    it('renders user-friendly ErrorState without exposing technical stack traces', () => {
      render(
        <HomeContent
          isError={true}
          errorMessage="Network corridor temporarily unreachable. Operating with cached departures."
          testID="home-test"
        />
      );

      expect(screen.getByTestId('home-test-error')).toBeTruthy();
      expect(screen.getByText('Telemetry Sync Disrupted')).toBeTruthy();
      expect(
        screen.getByText(
          'Network corridor temporarily unreachable. Operating with cached departures.'
        )
      ).toBeTruthy();
      expect(screen.queryByTestId('home-hero')).toBeNull();
    });

    it('renders retry button only when onRetry handler is supplied', () => {
      const handleRetry = jest.fn();
      const { rerender } = render(
        <HomeContent
          isError={true}
          onRetry={handleRetry}
          testID="retry-test"
        />
      );

      const retryButton = screen.getByText('Retry Transmission');
      expect(retryButton).toBeTruthy();
      fireEvent.press(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);

      // Re-render without onRetry: retry button should not appear
      rerender(<HomeContent isError={true} testID="retry-test" />);
      expect(screen.queryByText('Retry Transmission')).toBeNull();
    });

    it('renders error state when data availability is "error"', () => {
      const errorData: HomeScreenData = {
        ...defaultHomeContent,
        availability: 'error'
      };

      render(<HomeContent data={errorData} testID="avail-error" />);
      expect(screen.getByTestId('avail-error-error')).toBeTruthy();
      expect(screen.getByText('Telemetry Sync Disrupted')).toBeTruthy();
    });
  });

  describe('Empty State Verification', () => {
    it('renders EmptyState with helpful guidance when isEmpty is true', () => {
      render(
        <HomeContent
          isEmpty={true}
          emptyTitle="No Active Corridors"
          emptyMessage="No transit departures match current filters."
          testID="home-test"
        />
      );

      expect(screen.getByTestId('home-test-empty')).toBeTruthy();
      expect(screen.getByText('No Active Corridors')).toBeTruthy();
      expect(
        screen.getByText('No transit departures match current filters.')
      ).toBeTruthy();
      expect(screen.queryByTestId('home-hero')).toBeNull();
    });

    it('renders empty state when data availability is "empty"', () => {
      const emptyData: HomeScreenData = {
        ...defaultHomeContent,
        availability: 'empty'
      };

      render(<HomeContent data={emptyData} testID="avail-empty" />);
      expect(screen.getByTestId('avail-empty-empty')).toBeTruthy();
      expect(screen.getByText('No Transit Vectors Found')).toBeTruthy();
    });

    it('triggers optional action on empty state when provided', () => {
      const handleRefresh = jest.fn();
      render(
        <HomeContent
          isEmpty={true}
          onRetry={handleRefresh}
          testID="empty-action-test"
        />
      );

      const refreshBtn = screen.getByText('Refresh Network');
      expect(refreshBtn).toBeTruthy();
      fireEvent.press(refreshBtn);
      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Malformed & Corrupted Data Resilience', () => {
    it('gracefully handles null or undefined data without throwing uncaught exceptions', () => {
      const { toJSON } = render(<HomeContent data={null} testID="null-data" />);
      expect(toJSON()).toBeTruthy();
      // Should fall back to guaranteed default content
      expect(screen.getByTestId('home-hero')).toBeTruthy();
    });

    it('sanitizes partially missing fields and renders safe defaults', () => {
      const corruptedData = {
        hero: {
          eyebrow: 'CORRUPTED RECORD',
          title: 'Partial Corridor',
          subtitle: 'Missing rest of data structure'
        }
      } as unknown as HomeScreenData;

      const { toJSON } = render(<HomeContent data={corruptedData} />);
      expect(toJSON()).toBeTruthy();
      expect(screen.getByText('CORRUPTED RECORD')).toBeTruthy();
      expect(screen.getByText(/Partial Corridor/)).toBeTruthy();
      expect(
        screen.getByText('Universal step-free routes guaranteed across all nodes')
      ).toBeTruthy();
    });
  });

  describe('Sample Data & Truthful Presentation', () => {
    it('clearly demarcates simulated route recommendations with sample badge', () => {
      render(<HomeContent data={defaultHomeContent} />);

      // Must display simulated corridor disclaimer
      expect(
        screen.getByText('SIMULATED CORRIDOR · LIVE TELEMETRY IN FEATURE 05')
      ).toBeTruthy();
      expect(screen.getByTestId('home-suggestion-sample-tag')).toBeTruthy();
    });

    it('displays informational baseline notice for accessibility guarantees', () => {
      render(<HomeContent data={defaultHomeContent} />);

      expect(
        screen.getByText('Universal step-free routes guaranteed across all nodes')
      ).toBeTruthy();
      expect(screen.getByTestId('home-accessibility-level')).toBeTruthy();
      expect(
        screen.getByText(
          'Informational baseline · Corridors mandate universal step-free access'
        )
      ).toBeTruthy();
    });
  });

  describe('Theme and Accessibility Scaling', () => {
    it('renders with light theme mode without errors', () => {
      const { toJSON } = render(
        <HomeContent data={defaultHomeContent} themeMode="light" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with dark theme mode without errors', () => {
      const { toJSON } = render(
        <HomeContent data={defaultHomeContent} themeMode="dark" />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Network State Handling & Offline Banner', () => {
    it('displays offline network banner when transit link is disconnected', () => {
      const spy = jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none'
      });

      render(<HomeScreen />);

      expect(
        screen.getByText(
          'TRANSIT LINK OFFLINE · RUNNING ON LOCAL TELEMETRY CACHE'
        )
      ).toBeTruthy();

      // Ensure local content remains completely accessible while offline
      expect(screen.getByText('Good morning, navigator')).toBeTruthy();
      expect(screen.getByText('KDU Gate → Kandy City')).toBeTruthy();

      spy.mockRestore();
    });
  });
});
