import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { AppCard, AppCardVariant } from '../../../components/cards';
import { AppText } from '../../../components/typography';
import { theme as defaultTheme, darkTheme, lightTheme } from '../../../theme';
import { DiscoveryItem } from '../types';
import {
  formatDiscoveryMetadataSummary,
  isDiscoverySampleContent,
  isValidDiscoveryRoute
} from '../utils/discoveryPresentation';
import { renderDiscoveryIcon } from './DiscoveryCategory';
import { DiscoverySectionLayout } from './DiscoverySection';

export interface DiscoveryCardProps {
  /**
   * Strongly typed discovery item model.
   */
  item: DiscoveryItem;

  /**
   * Visual variant controlling background, border, and elevation.
   * @default 'elevated'
   */
  variant?: AppCardVariant;

  /**
   * Explicit press callback. If provided, overrides default router navigation.
   */
  onPress?: (item: DiscoveryItem) => void;

  /**
   * Disables interaction when true.
   */
  disabled?: boolean;

  /**
   * Whether to display the sample telemetry badge when item represents sample data.
   * @default true
   */
  showSampleBadge?: boolean;

  /**
   * Presentation layout context ('horizontal' | 'vertical' | 'grid').
   * Controls responsive card sizing and layout rules.
   * @default 'horizontal'
   */
  layout?: DiscoverySectionLayout;

  /**
   * Optional custom callout / action label override (defaults to item.actionLabel).
   */
  actionLabel?: string;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Automation test identifier.
   */
  testID?: string;

  /**
   * Custom style for outer card container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom accessibility hint.
   */
  accessibilityHint?: string;
}

/**
 * DiscoveryCard — Reusable, accessible, and touch-friendly card for multimodal
 * transit corridors, hubs, vehicle modes, and passenger experiences.
 * Uses AppCard as a single non-nested touch target and strictly verifies navigation routes.
 */
export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  item,
  variant = 'elevated',
  onPress,
  disabled = false,
  showSampleBadge = true,
  layout = 'horizontal',
  actionLabel,
  themeMode,
  testID,
  style,
  accessibilityHint
}) => {
  const router = useRouter();
  const activeTheme = themeMode === 'light' ? lightTheme : darkTheme;

  const isExplicitlyDisabled = disabled || item.isEnabled === false;
  const isSample = showSampleBadge && isDiscoverySampleContent(item);
  const metaSummary = formatDiscoveryMetadataSummary(item);

  // Validate route destination
  const hasValidDestination = Boolean(
    item.actionDestination && isValidDiscoveryRoute(item.actionDestination)
  );

  // Interactive only when an explicit callback or a verified route exists, and not disabled
  const isActionable = !isExplicitlyDisabled && (Boolean(onPress) || hasValidDestination);

  const effectiveActionLabel = actionLabel ?? item.actionLabel;

  const handlePress = () => {
    if (isExplicitlyDisabled) return;

    if (onPress) {
      onPress(item);
      return;
    }

    if (hasValidDestination && item.actionDestination) {
      router.push(item.actionDestination as Href);
    }
  };

  const cardTestID = testID ?? `discovery-card-${item.id}`;

  const accessibilityParts = [item.title];
  if (item.badgeText) accessibilityParts.push(item.badgeText);
  if (metaSummary) accessibilityParts.push(metaSummary);
  if (isSample) accessibilityParts.push('Sample telemetry');
  if (isExplicitlyDisabled) accessibilityParts.push('Unavailable');

  const defaultHint = isActionable
    ? effectiveActionLabel
      ? `${effectiveActionLabel} destination`
      : 'Navigates to transit details'
    : undefined;

  return (
    <AppCard
      variant={variant}
      themeMode={themeMode}
      onPress={isActionable ? handlePress : undefined}
      disabled={isExplicitlyDisabled}
      testID={cardTestID}
      style={[
        styles.card,
        layout === 'horizontal' && styles.cardHorizontal,
        layout === 'grid' && styles.cardGrid,
        layout === 'vertical' && styles.cardVertical,
        style
      ]}
      accessibilityRole={isActionable ? 'button' : 'none'}
      accessibilityLabel={accessibilityParts.join(', ')}
      accessibilityHint={accessibilityHint ?? defaultHint}
    >
      {/* Header Row: Icon + Badges */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor:
                themeMode === 'light'
                  ? 'rgba(13, 148, 136, 0.1)'
                  : 'rgba(45, 212, 191, 0.08)'
            }
          ]}
        >
          {renderDiscoveryIcon(item.iconName, 18, activeTheme.colors.trainTeal)}
        </View>

        <View style={styles.badgeCluster}>
          {Boolean(item.badgeText) && (
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor:
                    themeMode === 'light'
                      ? 'rgba(0, 0, 0, 0.06)'
                      : 'rgba(255, 255, 255, 0.1)'
                }
              ]}
            >
              <AppText
                variant="caption"
                weight="semibold"
                color="brand"
                themeMode={themeMode}
                style={styles.badgeText}
                testID={`${cardTestID}-badge`}
              >
                {item.badgeText}
              </AppText>
            </View>
          )}

          {isSample && (
            <View
              style={[
                styles.badgePill,
                styles.samplePill,
                {
                  backgroundColor: 'rgba(255, 179, 0, 0.12)',
                  borderColor: 'rgba(255, 179, 0, 0.3)'
                }
              ]}
              testID={`${cardTestID}-sample-pill`}
            >
              <AppText
                variant="caption"
                weight="semibold"
                color="warning"
                themeMode={themeMode}
                style={styles.badgeText}
              >
                SAMPLE
              </AppText>
            </View>
          )}
        </View>
      </View>

      {/* Body: Title + Description */}
      <View style={styles.body}>
        <AppText
          variant="body"
          weight="semibold"
          color={isExplicitlyDisabled ? 'muted' : 'primary'}
          themeMode={themeMode}
          numberOfLines={2}
          testID={`${cardTestID}-title`}
        >
          {item.title}
        </AppText>

        {Boolean(item.description) && (
          <AppText
            variant="bodySmall"
            color="secondary"
            themeMode={themeMode}
            numberOfLines={2}
            style={styles.description}
            testID={`${cardTestID}-description`}
          >
            {item.description}
          </AppText>
        )}

        {Boolean(metaSummary) && (
          <View style={styles.metaRow}>
            <AppText
              variant="caption"
              color="muted"
              themeMode={themeMode}
              numberOfLines={1}
              testID={`${cardTestID}-meta`}
            >
              {metaSummary}
            </AppText>
          </View>
        )}
      </View>

      {/* Action Callout Row (Single touch target via AppCard, no nested pressables) */}
      {Boolean(effectiveActionLabel) && (
        <View
          style={[
            styles.actionRow,
            {
              borderTopColor: activeTheme.colors.borderSubtle
            }
          ]}
          testID={`${cardTestID}-action-row`}
        >
          <AppText
            variant="label"
            weight="semibold"
            color={isActionable ? 'brand' : 'muted'}
            themeMode={themeMode}
            style={styles.actionLabelText}
            numberOfLines={1}
            testID={`${cardTestID}-action-label`}
          >
            {effectiveActionLabel}
          </AppText>
          {isActionable && (
            <ChevronRight
              size={14}
              color={activeTheme.colors.trainTeal}
              style={styles.actionChevron}
            />
          )}
        </View>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: defaultTheme.spacing.md
  },
  cardHorizontal: {
    width: 280
  },
  cardVertical: {
    width: '100%'
  },
  cardGrid: {
    flexBasis: '48%',
    flexGrow: 1
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: defaultTheme.spacing.xs
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: defaultTheme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: defaultTheme.radius.pill
  },
  samplePill: {
    borderWidth: 1
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.5
  },
  body: {
    gap: 4
  },
  description: {
    marginTop: 2
  },
  metaRow: {
    marginTop: 6
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: defaultTheme.spacing.sm,
    paddingTop: defaultTheme.spacing.xs,
    borderTopWidth: 1
  },
  actionLabelText: {
    flexShrink: 1,
    letterSpacing: 0.2
  },
  actionChevron: {
    marginLeft: 4
  }
});
