/**
 * Home Presentation Utilities
 * Formats, sanitizes, and ensures safe fallbacks for Home screen data.
 */

import {
  HomeScreenData,
  HomeHeroContent,
  HomeSuggestionContent,
  HomeAccessibilityNotice
} from '../types';
import { defaultHomeContent } from '../data/homeContent';

/**
 * Validates whether a home data payload has required structural fields.
 */
export function isValidHomeScreenData(data: unknown): data is HomeScreenData {
  if (!data || typeof data !== 'object') return false;

  const candidate = data as Partial<HomeScreenData>;
  return (
    typeof candidate.hero?.title === 'string' &&
    typeof candidate.hero?.subtitle === 'string' &&
    Array.isArray(candidate.quickPlaces) &&
    typeof candidate.accessibilityNotice?.message === 'string' &&
    typeof candidate.availability === 'string'
  );
}

/**
 * Safely sanitizes partial or undefined Home data, falling back to guaranteed defaults.
 * Prevents missing fields from crashing UI components.
 */
export function sanitizeHomeScreenData(
  partialData?: Partial<HomeScreenData> | null
): HomeScreenData {
  if (!partialData) {
    return defaultHomeContent;
  }

  const hero: HomeHeroContent = {
    eyebrow: partialData.hero?.eyebrow ?? defaultHomeContent.hero.eyebrow,
    title: partialData.hero?.title ?? defaultHomeContent.hero.title,
    titleHighlight: partialData.hero?.titleHighlight ?? defaultHomeContent.hero.titleHighlight,
    subtitle: partialData.hero?.subtitle ?? defaultHomeContent.hero.subtitle
  };

  const suggestion: HomeSuggestionContent | null = partialData.suggestion
    ? {
        id: partialData.suggestion.id ?? 'default-suggestion',
        kicker: partialData.suggestion.kicker ?? 'RECOMMENDED ROUTE',
        badgeText: partialData.suggestion.badgeText ?? 'NOW',
        title: partialData.suggestion.title ?? 'Selected Route',
        description: partialData.suggestion.description ?? '',
        actionLabel: partialData.suggestion.actionLabel ?? 'View Details',
        isSample: partialData.suggestion.isSample ?? true,
        transitModes: partialData.suggestion.transitModes ?? ['bus'],
        corridorStatus: partialData.suggestion.corridorStatus ?? 'nominal',
        targetScreen: partialData.suggestion.targetScreen ?? 'journey'
      }
    : null;

  const accessibilityNotice: HomeAccessibilityNotice = {
    message:
      partialData.accessibilityNotice?.message ??
      defaultHomeContent.accessibilityNotice.message,
    isVerifiedStepFree: Boolean(partialData.accessibilityNotice?.isVerifiedStepFree),
    complianceStatement:
      partialData.accessibilityNotice?.complianceStatement ??
      defaultHomeContent.accessibilityNotice.complianceStatement,
    verificationLevel:
      partialData.accessibilityNotice?.verificationLevel ?? 'informational'
  };

  return {
    hero,
    suggestion,
    quickPlaces: Array.isArray(partialData.quickPlaces)
      ? partialData.quickPlaces
      : defaultHomeContent.quickPlaces,
    architectureStatus: partialData.architectureStatus ?? null,
    accessibilityNotice,
    availability: partialData.availability ?? 'available',
    dataSource: partialData.dataSource ?? 'sample_data',
    lastUpdatedTimestamp: partialData.lastUpdatedTimestamp ?? Date.now()
  };
}

/**
 * Generates an appropriate time-of-day greeting for user-facing headers.
 */
export function formatTimeOfDayGreeting(date: Date = new Date()): string {
  const hours = date.getHours();
  if (hours < 12) return 'Good morning';
  if (hours < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Checks whether content is marked as sample / demo data.
 */
export function isSampleContent(
  suggestion?: HomeSuggestionContent | null,
  dataSource?: string
): boolean {
  if (suggestion?.isSample) return true;
  return dataSource === 'sample_data';
}
