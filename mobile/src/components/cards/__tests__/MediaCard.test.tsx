import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MediaCard } from '../MediaCard';

describe('MediaCard Component', () => {
  const dummyImage = { uri: 'https://cdn.waymark.local/img/skyport.jpg' };

  // TC-02.5-21: MediaCard renders a supplied image
  it('TC-02.5-21: renders a supplied image successfully', () => {
    render(
      <MediaCard
        imageSource={dummyImage}
        imageAlt="Ratmalana Skyport aerial view"
        title="Ratmalana Skyport"
        testID="skyport-media"
      />
    );

    const image = screen.getByTestId('skyport-media-image');
    expect(image.props.source).toEqual(dummyImage);
    expect(screen.getByText('Ratmalana Skyport')).toBeTruthy();
  });

  // TC-02.5-22: Missing image uses fallback
  it('TC-02.5-22: missing image source renders fallback container gracefully', () => {
    render(
      <MediaCard
        title="Unknown Node"
        fallbackText="No map preview available"
        testID="missing-media"
      />
    );

    expect(screen.queryByTestId('missing-media-image')).toBeNull();
    expect(screen.getByTestId('missing-media-fallback')).toBeTruthy();
    expect(screen.getByText('No map preview available')).toBeTruthy();
  });

  // TC-02.5-23: Failed image displays fallback
  it('TC-02.5-23: switches to fallback view upon image load failure without throwing', () => {
    render(
      <MediaCard
        imageSource={{ uri: 'https://invalid-domain.example/broken.png' }}
        title="Broken Image Card"
        fallbackText="Telemetry image load failed"
        testID="broken-media"
      />
    );

    const image = screen.getByTestId('broken-media-image');
    fireEvent(image, 'error', { nativeEvent: { error: 'Network failure' } });

    expect(screen.queryByTestId('broken-media-image')).toBeNull();
    expect(screen.getByTestId('broken-media-fallback')).toBeTruthy();
    expect(screen.getByText('Telemetry image load failed')).toBeTruthy();
  });

  // TC-02.5-24: Image has an accessible description
  it('TC-02.5-24: image element preserves screen reader accessibility label', () => {
    render(
      <MediaCard
        imageSource={dummyImage}
        imageAlt="Accessible Transit Map of Sri Lanka Corridor"
        testID="alt-media"
      />
    );

    const image = screen.getByTestId('alt-media-image');
    expect(image.props.accessibilityLabel).toBe(
      'Accessible Transit Map of Sri Lanka Corridor'
    );
  });

  // TC-02.5-25: MediaCard interaction works correctly
  it('TC-02.5-25: triggers onPress callback when interactive MediaCard is pressed', () => {
    const handlePress = jest.fn();
    render(
      <MediaCard
        imageSource={dummyImage}
        title="Interactive Media"
        onPress={handlePress}
        testID="press-media"
      />
    );

    fireEvent.press(screen.getByTestId('press-media'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  // TC-02.5-28: Font scaling remains enabled
  it('TC-02.5-28: allows dynamic font scaling across titles and descriptions', () => {
    render(
      <MediaCard
        title="Scalable Route"
        description="Detailed multimodal route information"
        testID="scale-media"
      />
    );

    const titleEl = screen.getByTestId('scale-media-title');
    const descEl = screen.getByTestId('scale-media-description');

    expect(titleEl.props.allowFontScaling).toBe(true);
    expect(descEl.props.allowFontScaling).toBe(true);
  });

  it('renders badge overlay when provided', () => {
    render(
      <MediaCard
        imageSource={dummyImage}
        badge="LIVE HUD"
        testID="badge-media"
      />
    );

    expect(screen.getByTestId('badge-media-badge')).toBeTruthy();
    expect(screen.getByText('LIVE HUD')).toBeTruthy();
  });
});
