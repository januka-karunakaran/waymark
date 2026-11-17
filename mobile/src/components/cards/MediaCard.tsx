import React, { useState } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent
} from 'react-native';
import { AppCard, AppCardVariant } from './AppCard';
import { AppText } from '../typography';
import {
  theme as defaultTheme,
  darkTheme,
  lightTheme,
  spacing,
  radius
} from '../../theme';

export interface MediaCardProps {
  /**
   * Source for the media image.
   */
  imageSource?: ImageSourcePropType;

  /**
   * Screen reader accessible description of the image content.
   */
  imageAlt?: string;

  /**
   * Aspect ratio for the media viewport (width / height).
   * @default 16 / 9
   */
  aspectRatio?: number;

  /**
   * Card headline title.
   */
  title?: string;

  /**
   * Secondary subtitle.
   */
  subtitle?: string;

  /**
   * Extended descriptive narrative.
   */
  description?: string;

  /**
   * Optional floating or header badge (e.g. 'LIVE HUD', 'SKYPORT').
   */
  badge?: string;

  /**
   * Fallback text displayed when image fails to load or is absent.
   */
  fallbackText?: string;

  /**
   * Optional interaction callback.
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Disables card interaction when true.
   */
  disabled?: boolean;

  /**
   * Visual variant controlling background depth.
   * @default 'default'
   */
  variant?: AppCardVariant;

  /**
   * Theme mode override ('light' | 'dark').
   */
  themeMode?: 'light' | 'dark';

  /**
   * Custom style for the card container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Unique test identifier.
   */
  testID?: string;
}

/**
 * MediaCard — Responsive media showcase component handling image rendering,
 * graceful fallbacks, accessible descriptions, and Waymark typography overlays.
 */
export const MediaCard: React.FC<MediaCardProps> = ({
  imageSource,
  imageAlt = 'Transit route media preview',
  aspectRatio = 16 / 9,
  title,
  subtitle,
  description,
  badge,
  fallbackText = 'Image unavailable',
  onPress,
  disabled = false,
  variant = 'default',
  themeMode,
  style,
  testID = 'media-card'
}) => {
  const [hasError, setHasError] = useState(false);

  const effectiveMode = themeMode ?? defaultTheme.mode;
  const activeTheme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const isImageValid = Boolean(imageSource) && !hasError;

  return (
    <AppCard
      variant={variant}
      onPress={onPress}
      disabled={disabled}
      themeMode={themeMode}
      contentStyle={styles.cardContent}
      style={style}
      testID={testID}
      accessibilityLabel={`${title ? `${title}. ` : ''}${imageAlt}`}
    >
      <View style={[styles.imageContainer, { aspectRatio }]}>
        {isImageValid ? (
          <Image
            source={imageSource as ImageSourcePropType}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={imageAlt}
            accessible={true}
            onError={() => setHasError(true)}
            testID={`${testID}-image`}
          />
        ) : (
          <View
            style={[
              styles.fallbackContainer,
              {
                backgroundColor:
                  effectiveMode === 'light'
                    ? activeTheme.colors.abyssVoid
                    : activeTheme.colors.deckInk
              }
            ]}
            accessible={true}
            accessibilityLabel={imageAlt}
            testID={`${testID}-fallback`}
          >
            <AppText
              variant="caption"
              color="muted"
              themeMode={themeMode}
              testID={`${testID}-fallback-text`}
            >
              {fallbackText}
            </AppText>
          </View>
        )}

        {badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: activeTheme.colors.beaconGold,
                borderColor: activeTheme.colors.luminousEdge
              }
            ]}
            testID={`${testID}-badge`}
          >
            <AppText
              variant="caption"
              weight="bold"
              style={{ color: activeTheme.colors.textInverse }}
              themeMode={themeMode}
            >
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>

      {title || subtitle || description ? (
        <View style={styles.textContainer}>
          {title ? (
            <AppText
              variant="h3"
              weight="semibold"
              color="primary"
              themeMode={themeMode}
              testID={`${testID}-title`}
            >
              {title}
            </AppText>
          ) : null}

          {subtitle ? (
            <AppText
              variant="caption"
              color="secondary"
              themeMode={themeMode}
              style={styles.subtitle}
              testID={`${testID}-subtitle`}
            >
              {subtitle}
            </AppText>
          ) : null}

          {description ? (
            <AppText
              variant="body"
              color="secondary"
              themeMode={themeMode}
              style={styles.description}
              testID={`${testID}-description`}
            >
              {description}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    padding: 0 // Allow image to bleed to edges within the rounded container
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.spaceMd
  },
  badge: {
    position: 'absolute',
    top: spacing.spaceSm,
    right: spacing.spaceSm,
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1
  },
  textContainer: {
    padding: spacing.spaceMd
  },
  subtitle: {
    marginTop: spacing.spaceXxs
  },
  description: {
    marginTop: spacing.spaceXs,
    lineHeight: 20
  }
});
