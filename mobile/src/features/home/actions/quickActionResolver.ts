/**
 * Waymark 2100 — Home Quick Action Resolver
 * Evaluates quick action nodes and intents, returning safe, strongly typed resolution
 * objects that govern navigation, in-page focusing, or unconfigured state messaging.
 */

import { HomeQuickPlaceNode } from '../types';
import {
  HomeQuickActionId,
  QuickActionIntent,
  QuickActionResolverOptions,
  ResolvedQuickAction
} from './types';
import { isValidHomeNavigationTarget } from './navigationTargets';
import {
  MAX_PARAM_STRING_LENGTH,
  UNSAFE_PARAM_PATTERN
} from './journeyParams';

export const UNCONFIGURED_LOCATIONS_MESSAGE =
  'Home and Work locations have not been saved yet. Custom locations will be available in profile settings.';

export const UNKNOWN_SHORTCUT_MESSAGE = 'Destination shortcut not recognized.';
export const INVALID_DESTINATION_MESSAGE = 'Invalid quick destination.';

/**
 * Validates saved custom location strings to guard against injection or oversized inputs.
 */
function isValidSavedAddress(address: unknown): address is string {
  if (typeof address !== 'string' || !address.trim()) return false;
  const trimmed = address.trim();
  if (trimmed.length > MAX_PARAM_STRING_LENGTH) return false;
  if (UNSAFE_PARAM_PATTERN.test(trimmed)) return false;
  if (
    trimmed.includes('..') ||
    trimmed.includes('\0') ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    return false;
  }
  return true;
}

/**
 * Creates a decoupled intent representation from a UI node.
 */
export function createQuickActionIntent(node: HomeQuickPlaceNode): QuickActionIntent {
  return {
    actionId: node.id as HomeQuickActionId,
    label: node.label,
    rawDestination: node.destination,
    sourceType: 'sample_data'
  };
}

/**
 * Evaluates a Quick Action node and safely produces a resolved action plan.
 *
 * @param node The quick place node clicked by the user
 * @param options Optional configuration including saved user addresses
 * @returns Fully resolved action describing destination, safety verification, and user guidance
 */
export function resolveHomeQuickAction(
  node?: HomeQuickPlaceNode | null,
  options?: QuickActionResolverOptions
): ResolvedQuickAction {
  if (!node || typeof node !== 'object' || !node.id || typeof node.id !== 'string') {
    return {
      actionId: (node && typeof node.id === 'string' ? node.id : '') as HomeQuickActionId,
      type: 'unsupported',
      userMessage: INVALID_DESTINATION_MESSAGE,
      sourceType: 'sample_data',
      isVerifiedTarget: false
    };
  }

  const { id } = node;

  switch (id) {
    case 'place-home': {
      const savedHome = options?.savedAddresses?.['place-home'] || options?.savedAddresses?.home;
      if (isValidSavedAddress(savedHome)) {
        const target = '/(tabs)/journey';
        return {
          actionId: 'place-home',
          type: 'navigate',
          targetRoute: target,
          destinationContext: {
            destinationId: 'dest-saved-home',
            destinationName: savedHome.trim(),
            isSampleTarget: false
          },
          sourceType: 'user_preference',
          isVerifiedTarget: isValidHomeNavigationTarget(target)
        };
      }
      return {
        actionId: 'place-home',
        type: 'unconfigured',
        userMessage: UNCONFIGURED_LOCATIONS_MESSAGE,
        sourceType: 'sample_data',
        isVerifiedTarget: false
      };
    }

    case 'place-work': {
      const savedWork = options?.savedAddresses?.['place-work'] || options?.savedAddresses?.work;
      if (isValidSavedAddress(savedWork)) {
        const target = '/(tabs)/journey';
        return {
          actionId: 'place-work',
          type: 'navigate',
          targetRoute: target,
          destinationContext: {
            destinationId: 'dest-saved-work',
            destinationName: savedWork.trim(),
            isSampleTarget: false
          },
          sourceType: 'user_preference',
          isVerifiedTarget: isValidHomeNavigationTarget(target)
        };
      }
      return {
        actionId: 'place-work',
        type: 'unconfigured',
        userMessage: UNCONFIGURED_LOCATIONS_MESSAGE,
        sourceType: 'sample_data',
        isVerifiedTarget: false
      };
    }

    case 'place-kandy': {
      const target = '/(tabs)/journey';
      return {
        actionId: 'place-kandy',
        type: 'navigate',
        targetRoute: target,
        destinationContext: {
          destinationId: 'dest-kandy',
          destinationName: node.destination || 'Kandy City Centre',
          arrivalHubId: 'hub-kandy-central',
          suggestedModes: ['maglev', 'bus'],
          isSampleTarget: true
        },
        sourceType: 'sample_data',
        isVerifiedTarget: isValidHomeNavigationTarget(target)
      };
    }

    case 'place-colombo': {
      const target = '/(tabs)/journey';
      return {
        actionId: 'place-colombo',
        type: 'navigate',
        targetRoute: target,
        destinationContext: {
          destinationId: 'dest-colombo',
          destinationName: node.destination || 'Colombo Fort Central',
          arrivalHubId: 'hub-colombo-fort',
          suggestedModes: ['maglev', 'bus'],
          isSampleTarget: true
        },
        sourceType: 'sample_data',
        isVerifiedTarget: isValidHomeNavigationTarget(target)
      };
    }

    case 'place-airport': {
      const target = '/(tabs)/journey';
      return {
        actionId: 'place-airport',
        type: 'navigate',
        targetRoute: target,
        destinationContext: {
          destinationId: 'dest-airport',
          destinationName: node.destination || 'Bandaranaike Skyport',
          arrivalHubId: 'hub-bia-skyport',
          suggestedModes: ['air', 'bus'],
          isSampleTarget: true
        },
        sourceType: 'sample_data',
        isVerifiedTarget: isValidHomeNavigationTarget(target)
      };
    }

    case 'place-more': {
      return {
        actionId: 'place-more',
        type: 'in_page_focus',
        targetSectionId: 'home-discovery-group',
        userMessage: 'Explore Transit Network',
        sourceType: 'sample_data',
        isVerifiedTarget: true
      };
    }

    default: {
      return {
        actionId: id as HomeQuickActionId,
        type: 'unsupported',
        userMessage: UNKNOWN_SHORTCUT_MESSAGE,
        sourceType: 'sample_data',
        isVerifiedTarget: false
      };
    }
  }
}

/**
 * Resolves a decoupled QuickActionIntent into a concrete action plan.
 */
export function resolveQuickActionIntent(
  intent: QuickActionIntent,
  options?: QuickActionResolverOptions
): ResolvedQuickAction {
  const syntheticNode: HomeQuickPlaceNode = {
    id: intent.actionId,
    label: intent.label,
    destination: intent.rawDestination || intent.label,
    iconName: 'map-pin'
  };

  return resolveHomeQuickAction(syntheticNode, options);
}
