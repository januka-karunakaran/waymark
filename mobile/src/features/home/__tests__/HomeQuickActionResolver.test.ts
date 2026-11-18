import {
  isValidHomeNavigationTarget,
  sanitizeNavigationRoute,
  VERIFIED_HOME_NAVIGATION_TARGETS,
  resolveHomeQuickAction,
  resolveQuickActionIntent,
  createQuickActionIntent,
  UNCONFIGURED_LOCATIONS_MESSAGE,
  UNKNOWN_SHORTCUT_MESSAGE,
  INVALID_DESTINATION_MESSAGE,
  HomeQuickPlaceNode
} from '../index';

describe('Home Quick Action Architecture & Navigation Safety', () => {
  describe('Navigation Target Allowlist & Safety Verification', () => {
    it('verifies all expected internal tab routes are allowlisted', () => {
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/journey');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/map');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/oracle');
      expect(VERIFIED_HOME_NAVIGATION_TARGETS).toContain('/(tabs)/comfort');
    });

    it('validates allowed internal routes correctly with isValidHomeNavigationTarget', () => {
      expect(isValidHomeNavigationTarget('/(tabs)/journey')).toBe(true);
      expect(isValidHomeNavigationTarget('/(tabs)/map')).toBe(true);
      expect(isValidHomeNavigationTarget('/(tabs)')).toBe(true);
    });

    it('rejects external URL schemes and open redirect attempts', () => {
      expect(isValidHomeNavigationTarget('https://malicious.com')).toBe(false);
      expect(isValidHomeNavigationTarget('http://phishing.org/journey')).toBe(false);
      expect(isValidHomeNavigationTarget('javascript:alert(1)')).toBe(false);
      expect(isValidHomeNavigationTarget('data:text/html,<script>')).toBe(false);
      expect(isValidHomeNavigationTarget('//cdn.evil.com/exploit')).toBe(false);
      expect(isValidHomeNavigationTarget('intent://action')).toBe(false);
    });

    it('rejects directory traversal and non-string inputs', () => {
      expect(isValidHomeNavigationTarget('../secret')).toBe(false);
      expect(isValidHomeNavigationTarget('/(tabs)/../secret')).toBe(false);
      expect(isValidHomeNavigationTarget('')).toBe(false);
      expect(isValidHomeNavigationTarget('   ')).toBe(false);
      expect(isValidHomeNavigationTarget(null)).toBe(false);
      expect(isValidHomeNavigationTarget(undefined)).toBe(false);
      expect(isValidHomeNavigationTarget(12345)).toBe(false);
      expect(isValidHomeNavigationTarget({ route: '/(tabs)/journey' })).toBe(false);
    });

    it('sanitizes valid and invalid routes with sanitizeNavigationRoute', () => {
      expect(sanitizeNavigationRoute('/(tabs)/journey')).toBe('/(tabs)/journey');
      expect(sanitizeNavigationRoute('https://evil.com')).toBeNull();
      expect(sanitizeNavigationRoute(null)).toBeNull();
    });
  });

  describe('resolveHomeQuickAction', () => {
    const kandyNode: HomeQuickPlaceNode = {
      id: 'place-kandy',
      label: 'Kandy',
      destination: 'Kandy City Centre',
      iconName: 'map-pin',
      isPopular: true
    };

    const colomboNode: HomeQuickPlaceNode = {
      id: 'place-colombo',
      label: 'Colombo',
      destination: 'Colombo Fort Central',
      iconName: 'compass',
      isPopular: true
    };

    const airportNode: HomeQuickPlaceNode = {
      id: 'place-airport',
      label: 'Airport',
      destination: 'Bandaranaike Skyport',
      iconName: 'plane'
    };

    const homeNode: HomeQuickPlaceNode = {
      id: 'place-home',
      label: 'Home',
      destination: 'Home Node',
      iconName: 'home'
    };

    const workNode: HomeQuickPlaceNode = {
      id: 'place-work',
      label: 'Work',
      destination: 'Work Hub',
      iconName: 'briefcase'
    };

    const moreNode: HomeQuickPlaceNode = {
      id: 'place-more',
      label: 'More',
      destination: 'Network Directory',
      iconName: 'more-horizontal'
    };

    describe('Known destination shortcuts', () => {
      it('resolves place-kandy to journey route with safe contextual payload', () => {
        const resolved = resolveHomeQuickAction(kandyNode);

        expect(resolved.type).toBe('navigate');
        expect(resolved.actionId).toBe('place-kandy');
        expect(resolved.targetRoute).toBe('/(tabs)/journey');
        expect(resolved.isVerifiedTarget).toBe(true);
        expect(resolved.sourceType).toBe('sample_data');
        expect(resolved.destinationContext).toEqual({
          destinationId: 'dest-kandy',
          destinationName: 'Kandy City Centre',
          arrivalHubId: 'hub-kandy-central',
          suggestedModes: ['maglev', 'bus'],
          isSampleTarget: true
        });
      });

      it('resolves place-colombo to journey route with fort hub payload', () => {
        const resolved = resolveHomeQuickAction(colomboNode);

        expect(resolved.type).toBe('navigate');
        expect(resolved.actionId).toBe('place-colombo');
        expect(resolved.targetRoute).toBe('/(tabs)/journey');
        expect(resolved.isVerifiedTarget).toBe(true);
        expect(resolved.destinationContext?.arrivalHubId).toBe('hub-colombo-fort');
      });

      it('resolves place-airport with aviation transit mode suggestion', () => {
        const resolved = resolveHomeQuickAction(airportNode);

        expect(resolved.type).toBe('navigate');
        expect(resolved.actionId).toBe('place-airport');
        expect(resolved.targetRoute).toBe('/(tabs)/journey');
        expect(resolved.isVerifiedTarget).toBe(true);
        expect(resolved.destinationContext?.suggestedModes).toContain('air');
      });
    });

    describe('Private unconfigured destinations', () => {
      it('resolves place-home as unconfigured when no saved address exists', () => {
        const resolved = resolveHomeQuickAction(homeNode);

        expect(resolved.type).toBe('unconfigured');
        expect(resolved.actionId).toBe('place-home');
        expect(resolved.targetRoute).toBeUndefined();
        expect(resolved.isVerifiedTarget).toBe(false);
        expect(resolved.userMessage).toBe(UNCONFIGURED_LOCATIONS_MESSAGE);
      });

      it('resolves place-work as unconfigured when no saved address exists', () => {
        const resolved = resolveHomeQuickAction(workNode);

        expect(resolved.type).toBe('unconfigured');
        expect(resolved.actionId).toBe('place-work');
        expect(resolved.targetRoute).toBeUndefined();
        expect(resolved.isVerifiedTarget).toBe(false);
        expect(resolved.userMessage).toBe(UNCONFIGURED_LOCATIONS_MESSAGE);
      });

      it('resolves place-home as navigate when saved home address is provided in options', () => {
        const resolved = resolveHomeQuickAction(homeNode, {
          savedAddresses: { 'place-home': 'No 42, Temple Road, Jaffna' }
        });

        expect(resolved.type).toBe('navigate');
        expect(resolved.actionId).toBe('place-home');
        expect(resolved.targetRoute).toBe('/(tabs)/journey');
        expect(resolved.isVerifiedTarget).toBe(true);
        expect(resolved.sourceType).toBe('user_preference');
        expect(resolved.destinationContext).toEqual({
          destinationId: 'dest-saved-home',
          destinationName: 'No 42, Temple Road, Jaffna',
          isSampleTarget: false
        });
      });

      it('resolves place-work as navigate when saved work address is provided in options', () => {
        const resolved = resolveHomeQuickAction(workNode, {
          savedAddresses: { work: 'Technology Park, Colombo 03' }
        });

        expect(resolved.type).toBe('navigate');
        expect(resolved.actionId).toBe('place-work');
        expect(resolved.targetRoute).toBe('/(tabs)/journey');
        expect(resolved.isVerifiedTarget).toBe(true);
        expect(resolved.sourceType).toBe('user_preference');
        expect(resolved.destinationContext).toEqual({
          destinationId: 'dest-saved-work',
          destinationName: 'Technology Park, Colombo 03',
          isSampleTarget: false
        });
      });
    });

    describe('In-page exploratory shortcuts', () => {
      it('resolves place-more to in-page focus on discovery group', () => {
        const resolved = resolveHomeQuickAction(moreNode);

        expect(resolved.type).toBe('in_page_focus');
        expect(resolved.actionId).toBe('place-more');
        expect(resolved.targetSectionId).toBe('home-discovery-group');
        expect(resolved.targetRoute).toBeUndefined();
        expect(resolved.isVerifiedTarget).toBe(true);
      });
    });

    describe('Unsupported, unknown, or malformed nodes', () => {
      it('safely handles unknown action identifiers', () => {
        const unknownNode: HomeQuickPlaceNode = {
          id: 'place-moon-base',
          label: 'Moon Base',
          destination: 'Lunar Crater',
          iconName: 'compass'
        };

        const resolved = resolveHomeQuickAction(unknownNode);

        expect(resolved.type).toBe('unsupported');
        expect(resolved.actionId).toBe('place-moon-base');
        expect(resolved.targetRoute).toBeUndefined();
        expect(resolved.isVerifiedTarget).toBe(false);
        expect(resolved.userMessage).toBe(UNKNOWN_SHORTCUT_MESSAGE);
      });

      it('safely handles null or undefined nodes', () => {
        const resolvedNull = resolveHomeQuickAction(null);
        expect(resolvedNull.type).toBe('unsupported');
        expect(resolvedNull.userMessage).toBe(INVALID_DESTINATION_MESSAGE);
        expect(resolvedNull.isVerifiedTarget).toBe(false);

        const resolvedUndefined = resolveHomeQuickAction(undefined);
        expect(resolvedUndefined.type).toBe('unsupported');
        expect(resolvedUndefined.userMessage).toBe(INVALID_DESTINATION_MESSAGE);
      });

      it('safely handles malformed node objects lacking an id', () => {
        const malformed = { label: 'Nowhere' } as unknown as HomeQuickPlaceNode;
        const resolved = resolveHomeQuickAction(malformed);
        expect(resolved.type).toBe('unsupported');
        expect(resolved.userMessage).toBe(INVALID_DESTINATION_MESSAGE);
      });
    });
  });

  describe('Intent Decoupling & Resolution', () => {
    it('creates a decoupled QuickActionIntent from a UI node', () => {
      const node: HomeQuickPlaceNode = {
        id: 'place-kandy',
        label: 'Kandy',
        destination: 'Kandy City Centre',
        iconName: 'map-pin'
      };

      const intent = createQuickActionIntent(node);

      expect(intent).toEqual({
        actionId: 'place-kandy',
        label: 'Kandy',
        rawDestination: 'Kandy City Centre',
        sourceType: 'sample_data'
      });
    });

    it('resolves decoupled QuickActionIntent with identical safety semantics', () => {
      const intent = createQuickActionIntent({
        id: 'place-colombo',
        label: 'Colombo',
        destination: 'Colombo Fort Central',
        iconName: 'compass'
      });

      const resolved = resolveQuickActionIntent(intent);

      expect(resolved.type).toBe('navigate');
      expect(resolved.actionId).toBe('place-colombo');
      expect(resolved.targetRoute).toBe('/(tabs)/journey');
      expect(resolved.isVerifiedTarget).toBe(true);
    });
  });
});
