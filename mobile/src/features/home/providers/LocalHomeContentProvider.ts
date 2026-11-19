/**
 * Waymark 2100 — Local Home Content Provider
 * Asynchronous in-memory content provider for the Home domain.
 * Provides defensive deep copies of verified sample content with zero artificial latency.
 */

import {
  HomeScreenData,
  HomeSuggestionContent,
  HomeQuickPlaceNode
} from '../types';
import { defaultHomeContent } from '../data/homeContent';
import { isValidHomeScreenData, sanitizeHomeScreenData } from '../utils/homePresentation';
import { HomeContentProvider } from './HomeContentProvider';

/**
 * Deep clones home screen data to ensure strict defensive copy isolation across consumers.
 */
export function cloneHomeScreenData(data: HomeScreenData): HomeScreenData {
  return {
    hero: { ...data.hero },
    suggestion: data.suggestion
      ? {
          ...data.suggestion,
          transitModes: data.suggestion.transitModes ? [...data.suggestion.transitModes] : undefined
        }
      : null,
    quickPlaces: data.quickPlaces.map((place) => ({ ...place })),
    architectureStatus: data.architectureStatus
      ? {
          ...data.architectureStatus,
          modules: data.architectureStatus.modules.map((module) => ({ ...module }))
        }
      : null,
    accessibilityNotice: { ...data.accessibilityNotice },
    availability: data.availability,
    dataSource: data.dataSource,
    lastUpdatedTimestamp: data.lastUpdatedTimestamp
  };
}

/**
 * Local implementation of HomeContentProvider.
 * Serves verified local default and sample datasets while maintaining strict isolation
 * and truthful sample provenance.
 */
export class LocalHomeContentProvider implements HomeContentProvider {
  private data: HomeScreenData;

  constructor(initialData: HomeScreenData = defaultHomeContent) {
    if (!isValidHomeScreenData(initialData)) {
      this.data = cloneHomeScreenData(sanitizeHomeScreenData(initialData));
    } else {
      this.data = cloneHomeScreenData(initialData);
    }
  }

  /**
   * Retrieves the home screen dataset as a defensive clone.
   */
  async getHomeContent(): Promise<HomeScreenData> {
    return Promise.resolve(cloneHomeScreenData(this.data));
  }

  /**
   * Retrieves the suggested active route recommendation, if configured.
   */
  async getSuggestedRoute(): Promise<HomeSuggestionContent | null> {
    const content = await this.getHomeContent();
    return content.suggestion;
  }

  /**
   * Retrieves the configured quick places destination shortcuts.
   */
  async getQuickPlaces(): Promise<HomeQuickPlaceNode[]> {
    const content = await this.getHomeContent();
    return content.quickPlaces;
  }
}

/**
 * Default singleton instance of the local home provider.
 */
export const defaultHomeProvider = new LocalHomeContentProvider();
