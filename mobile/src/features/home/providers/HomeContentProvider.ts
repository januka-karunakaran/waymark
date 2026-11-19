/**
 * Waymark 2100 — Home Content Provider Contract
 * Defines strongly typed asynchronous provider interfaces for Home screen content,
 * decoupling presentation components from static fixtures and supporting future remote services.
 */

import {
  HomeScreenData,
  HomeSuggestionContent,
  HomeQuickPlaceNode
} from '../types';

/**
 * Asynchronous content provider contract for the Waymark Home domain.
 * Consuming components and state hooks depend on this interface rather than
 * static fixtures, enabling local sample, cached, or remote telemetry implementations.
 */
export interface HomeContentProvider {
  /**
   * Retrieves the complete strongly typed home screen dataset.
   */
  getHomeContent(): Promise<HomeScreenData>;

  /**
   * Optional convenience method to retrieve only the suggested active route.
   */
  getSuggestedRoute?(): Promise<HomeSuggestionContent | null>;

  /**
   * Optional convenience method to retrieve configured quick places shortcuts.
   */
  getQuickPlaces?(): Promise<HomeQuickPlaceNode[]>;
}
