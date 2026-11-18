import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ShieldCheck, Zap } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { defaultHomeContent, HomeHero } from '../../src/features/home';
import { theme } from '../../src/theme';

export default function HomeScreen() {
  const content = defaultHomeContent;

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User-Friendly Home Hero */}
        <HomeHero content={content.hero} />

        {/* Suggestion Card */}
        {content.suggestion && (
          <View style={styles.suggestionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardKickerGroup}>
                <Zap size={14} color={theme.colors.abyssVoid} />
                <Text style={styles.cardKickerText}>{content.suggestion.kicker}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{content.suggestion.badgeText}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{content.suggestion.title}</Text>
            <Text style={styles.cardDescription}>{content.suggestion.description}</Text>
          </View>
        )}

        {/* Foundation Modules Status Panel */}
        {content.architectureStatus && (
          <View style={styles.panel}>
            <View style={styles.panelTitleRow}>
              <Text style={styles.panelTitle}>{content.architectureStatus.title}</Text>
              <Text style={styles.panelStatus}>{content.architectureStatus.statusLabel}</Text>
            </View>

            <View style={styles.moduleGrid}>
              {content.architectureStatus.modules.map((item) => (
                <View style={styles.moduleItem} key={item.id}>
                  <Text style={styles.moduleLabel}>{item.label}</Text>
                  <Text style={styles.moduleValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Accessibility Guarantee Banner */}
        <View style={styles.accessibilityRow}>
          <ShieldCheck size={18} color={theme.colors.trainTeal} />
          <Text style={styles.accessibilityText}>
            {content.accessibilityNotice.message}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.margin,
    gap: theme.spacing.spaceMd
  },
  suggestionCard: {
    backgroundColor: theme.colors.beaconGold,
    borderRadius: theme.spacing.radii.card,
    padding: theme.spacing.spaceLg
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.spaceSm
  },
  cardKickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cardKickerText: {
    ...theme.typography.styles.labelMonoSm,
    color: theme.colors.beaconGoldText,
    fontWeight: '700'
  },
  badge: {
    backgroundColor: 'rgba(36, 26, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  badgeText: {
    ...theme.typography.styles.labelMonoSm,
    fontSize: 9,
    color: theme.colors.beaconGoldText,
    fontWeight: '700'
  },
  cardTitle: {
    ...theme.typography.styles.headlineMd,
    color: theme.colors.beaconGoldText,
    marginVertical: theme.spacing.spaceXs
  },
  cardDescription: {
    ...theme.typography.styles.bodySm,
    color: '#614900'
  },
  panel: {
    backgroundColor: theme.colors.deckInk,
    borderRadius: theme.spacing.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostBorder,
    padding: theme.spacing.spaceLg
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hudGhostSubtle,
    paddingBottom: theme.spacing.spaceSm,
    marginBottom: theme.spacing.spaceMd
  },
  panelTitle: {
    ...theme.typography.styles.labelMonoSm,
    color: theme.colors.beaconGoldContainer
  },
  panelStatus: {
    ...theme.typography.styles.labelMonoSm,
    color: theme.colors.statusNominal,
    fontSize: 9
  },
  moduleGrid: {
    gap: theme.spacing.spaceSm
  },
  moduleItem: {
    backgroundColor: theme.colors.abyssVoid,
    borderRadius: theme.spacing.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.hudGhostSubtle,
    padding: theme.spacing.spaceMd,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  moduleLabel: {
    ...theme.typography.styles.labelMonoSm,
    color: theme.colors.textMuted
  },
  moduleValue: {
    ...theme.typography.styles.bodySm,
    color: theme.colors.textPrimary,
    fontWeight: '500'
  },
  accessibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.spaceSm,
    padding: theme.spacing.spaceMd,
    borderRadius: theme.spacing.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.trainTealBorder,
    backgroundColor: theme.colors.trainTealMuted
  },
  accessibilityText: {
    ...theme.typography.styles.bodySm,
    color: theme.colors.textSecondary,
    flex: 1
  }
});
