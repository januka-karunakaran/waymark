import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { AppCard } from '../../../components/cards';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { AppText } from '../../../components/typography';
import { theme as defaultTheme } from '../../../theme';
import type {
  DiscoveryCategory as DiscoveryCategoryType,
  DiscoveryItem,
  DiscoverySectionData
} from '../types';
import {
  isDiscoverySampleContent
} from '../utils/discoveryPresentation';
import {
  DiscoveryCategoryBadge
} from './DiscoveryCategory';
import { DiscoveryCard } from './DiscoveryCard';

export type DiscoverySectionLayout = 'horizontal' | 'vertical' | 'grid';

export interface DiscoverySectionProps {
  /**
   * Strongly typed discovery section data model (category, eyebrow, title, description, items, availability).
   */
  section: DiscoverySectionData;

  /**
   * Presentation layout for section items.
   * - 'horizontal': Swipeable carousel with no nested scroll traps.
   * - 'vertical': Stacked vertical list.
   * - 'grid': Multi-column wrapping grid for wide screens / tablets.
   * @default 'horizontal'
   */
  layout?: DiscoverySectionLayout;

  /**
   * Custom action button label (e.g., 'View all', 'Explore network').
   */
  actionLabel?: string;

  /**
   * Callback fired when the section header action button is pressed.
   */
  onAction?: (category: DiscoveryCategoryType) => void;

  /**
   * Custom item renderer. If omitted, renders responsive default discovery cards.
   */
  renderItem?: (item: DiscoveryItem, index: number) => React.ReactNode;

  /**
   * Optional custom children rendered beneath or within the section content.
   */
  children?: React.ReactNode;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Automation test identifier.
   */
  testID?: string;

  /**
   * Custom style for the outer section container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the items container / scroll content.
   */
  contentContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Whether to display a simulated/sample telemetry badge when items represent sample data.
   * @default true
   */
  showSampleBadge?: boolean;

  /**
   * Custom message displayed when the section has no discoverable items.
   */
  emptyMessage?: string;
}

/**
 * DiscoverySection — Reusable, accessible, and responsive container for categorized
 * Waymark 2100 transit discovery content. Reuses AppCard and AppText with zero nested scroll traps.
 */
export const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  section,
  layout = 'horizontal',
  actionLabel,
  onAction,
  renderItem,
  children,
  themeMode,
  testID = 'discovery-section',
  style,
  contentContainerStyle,
  showSampleBadge = true,
  emptyMessage = 'No active transit vectors found in this corridor.'
}) => {
  const { category, eyebrow, title, description, items, availability } = section;

  // Determine if this section is composed of simulated/sample content
  const hasSampleData =
    showSampleBadge &&
    items.some((item) => isDiscoverySampleContent(item));

  /**
   * Default card renderer for discovery items when custom renderItem is not provided.
   */
  const defaultRenderItem = (item: DiscoveryItem, index: number) => {
    return (
      <DiscoveryCard
        key={item.id || `disc-item-${index}`}
        item={item}
        layout={layout}
        themeMode={themeMode}
        testID={`${testID}-card-${item.id}`}
        showSampleBadge={showSampleBadge}
      />
    );
  };

  /**
   * Render section body depending on availability and items.
   */
  const renderContent = () => {
    if (availability === 'loading') {
      return (
        <AppCard
          variant="subtle"
          themeMode={themeMode}
          style={styles.stateCard}
          testID={`${testID}-loading`}
        >
          <LoadingIndicator
            size="small"
            message={`Synchronizing ${title.toLowerCase()} telemetry...`}
          />
        </AppCard>
      );
    }

    if (availability === 'error') {
      return (
        <AppCard
          variant="outlined"
          themeMode={themeMode}
          style={[styles.stateCard, styles.errorCard]}
          testID={`${testID}-error`}
        >
          <AppText
            variant="bodySmall"
            color="danger"
            weight="medium"
            themeMode={themeMode}
          >
            Telemetry synchronization unavailable for this section.
          </AppText>
        </AppCard>
      );
    }

    if (items.length === 0 || availability === 'empty') {
      return (
        <AppCard
          variant="subtle"
          themeMode={themeMode}
          style={styles.stateCard}
          testID={`${testID}-empty`}
        >
          <AppText
            variant="bodySmall"
            color="muted"
            themeMode={themeMode}
            align="center"
          >
            {emptyMessage}
          </AppText>
        </AppCard>
      );
    }

    // Render items via custom renderItem or default card renderer
    const renderedItems = items.map((item, index) =>
      renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
    );

    if (layout === 'horizontal') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={[styles.horizontalScrollContent, contentContainerStyle]}
          testID={`${testID}-horizontal-scroll`}
        >
          {renderedItems}
        </ScrollView>
      );
    }

    if (layout === 'grid') {
      return (
        <View style={[styles.gridContainer, contentContainerStyle]}>
          {renderedItems}
        </View>
      );
    }

    return (
      <View style={[styles.verticalContainer, contentContainerStyle]}>
        {renderedItems}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="none"
      accessibilityLabel={`${title}, ${items.length} items`}
    >
      {/* Header section with accessible title, eyebrow, and actions */}
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <View style={styles.eyebrowRow}>
            {Boolean(eyebrow) && (
              <AppText
                variant="caption"
                color="muted"
                themeMode={themeMode}
                testID={`${testID}-eyebrow`}
                style={styles.eyebrow}
              >
                {eyebrow}
              </AppText>
            )}
            <DiscoveryCategoryBadge
              category={category}
              themeMode={themeMode}
              testID={`${testID}-category-badge`}
            />
            {hasSampleData && (
              <View
                style={styles.telemetrySampleBadge}
                accessibilityRole="text"
                accessibilityLabel="Notice: Illustrative sample telemetry"
              >
                <AppText
                  variant="caption"
                  color="warning"
                  weight="semibold"
                  themeMode={themeMode}
                  style={styles.sampleBadgeText}
                  testID={`${testID}-sample-badge`}
                >
                  SIMULATED TELEMETRY
                </AppText>
              </View>
            )}
          </View>

          <AppText
            variant="h3"
            color="primary"
            accessibilityRole="header"
            themeMode={themeMode}
            testID={`${testID}-title`}
            style={styles.title}
          >
            {title}
          </AppText>

          {Boolean(description) && (
            <AppText
              variant="bodySmall"
              color="secondary"
              themeMode={themeMode}
              testID={`${testID}-description`}
              style={styles.description}
            >
              {description}
            </AppText>
          )}
        </View>

        {Boolean(actionLabel && onAction) && (
          <Pressable
            onPress={() => onAction?.(category)}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} for ${title}`}
            testID={`${testID}-action`}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed
            ]}
          >
            <AppText
              variant="label"
              color="brand"
              weight="semibold"
              themeMode={themeMode}
            >
              {actionLabel}
            </AppText>
          </Pressable>
        )}
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Children slot */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: defaultTheme.spacing.sm
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: defaultTheme.spacing.md,
    marginBottom: defaultTheme.spacing.sm
  },
  titleColumn: {
    flex: 1,
    gap: 4
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  telemetrySampleBadge: {
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderColor: 'rgba(255, 179, 0, 0.25)',
    borderWidth: 1,
    borderRadius: defaultTheme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  sampleBadgeText: {
    fontSize: 9,
    letterSpacing: 0.5
  },
  title: {
    letterSpacing: -0.2
  },
  description: {
    marginTop: 2
  },
  actionButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: defaultTheme.spacing.xs,
    marginLeft: defaultTheme.spacing.sm
  },
  actionButtonPressed: {
    opacity: 0.7
  },
  content: {
    width: '100%'
  },
  horizontalScrollContent: {
    paddingHorizontal: defaultTheme.spacing.md,
    gap: defaultTheme.spacing.sm
  },
  verticalContainer: {
    paddingHorizontal: defaultTheme.spacing.md,
    gap: defaultTheme.spacing.sm
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: defaultTheme.spacing.md,
    gap: defaultTheme.spacing.sm
  },
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: defaultTheme.spacing.xs
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: defaultTheme.radius.sm,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardBadgeCluster: {
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
  cardBody: {
    gap: 4
  },
  cardDescription: {
    marginTop: 2
  },
  metaRow: {
    marginTop: 6
  },
  stateCard: {
    marginHorizontal: defaultTheme.spacing.md,
    padding: defaultTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: defaultTheme.spacing.xs
  },
  errorCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)'
  }
});
