/**
 * Waymark 2100 — Home Navigation Targets & Safety Boundaries
 * Defines allowlisted internal navigation destinations and rigorous route validation
 * to prevent open redirects, invalid deep links, or arbitrary navigation paths.
 */

/**
 * Strictly allowlisted internal application routes accessible from the Home screen.
 */
export const VERIFIED_HOME_NAVIGATION_TARGETS = [
  '/(tabs)',
  '/(tabs)/journey',
  '/(tabs)/map',
  '/(tabs)/oracle',
  '/(tabs)/comfort'
] as const;

export type VerifiedHomeNavigationTarget = (typeof VERIFIED_HOME_NAVIGATION_TARGETS)[number];

/**
 * Known forbidden URL scheme patterns to protect against open redirects and malicious payloads.
 */
const UNSAFE_SCHEME_PATTERN = /^(https?|ftp|file|data|javascript|blob|intent|android-app):/i;

/**
 * Checks whether an unknown route target is an allowlisted, safe internal route.
 *
 * @param route The candidate route path
 * @returns boolean indicating if the route is valid and verified
 */
export function isValidHomeNavigationTarget(route: unknown): route is VerifiedHomeNavigationTarget {
  if (typeof route !== 'string' || !route.trim()) {
    return false;
  }

  const trimmed = route.trim();

  // Guard against external schemes, protocol-relative URLs, or directory traversal
  if (
    UNSAFE_SCHEME_PATTERN.test(trimmed) ||
    trimmed.startsWith('//') ||
    trimmed.includes('..') ||
    trimmed.includes('\0')
  ) {
    return false;
  }

  return (VERIFIED_HOME_NAVIGATION_TARGETS as readonly string[]).includes(trimmed);
}

/**
 * Sanitizes and validates a candidate route path against verified internal destinations.
 *
 * @param route The candidate route
 * @returns The verified route string or null if unverified / unsafe
 */
export function sanitizeNavigationRoute(route: unknown): VerifiedHomeNavigationTarget | null {
  if (isValidHomeNavigationTarget(route)) {
    return route;
  }
  return null;
}
