import React from 'react';
import { StyleSheet, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppHeader } from '../AppHeader';
import { HeaderAction } from '../HeaderAction';
import { BackButton } from '../BackButton';

describe('AppHeader Component', () => {
  // TC-02.7-01: Header renders supplied title
  it('TC-02.7-01: renders the supplied screen title', () => {
    render(<AppHeader title="Mission Control" testID="custom-header" />);
    expect(screen.getByText('Mission Control')).toBeTruthy();
  });

  // TC-02.7-02: Optional subtitle renders correctly
  it('TC-02.7-02: renders optional subtitle when provided', () => {
    render(
      <AppHeader
        title="Live Map"
        subtitle="Multimodal Telemetry Radar"
        testID="subtitle-header"
      />
    );
    expect(screen.getByText('Live Map')).toBeTruthy();
    expect(screen.getByText('Multimodal Telemetry Radar')).toBeTruthy();
  });

  // TC-02.7-03: Default header variant renders correctly
  it('TC-02.7-03: default header variant renders 64px height and brand mark', () => {
    render(<AppHeader variant="default" testID="default-header" />);
    const header = screen.getByTestId('default-header');
    const flatStyle = StyleSheet.flatten(header.props.style);
    expect(flatStyle.height).toBe(64);
    expect(screen.getByTestId('default-header-brand-mark')).toBeTruthy();
  });

  // TC-02.7-04: Compact header variant renders correctly
  it('TC-02.7-04: compact header variant renders 52px height without brand mark', () => {
    render(
      <AppHeader
        title="Compact Mode"
        variant="compact"
        testID="compact-header"
      />
    );
    const header = screen.getByTestId('compact-header');
    const flatStyle = StyleSheet.flatten(header.props.style);
    expect(flatStyle.height).toBe(52);
    expect(screen.queryByTestId('compact-header-brand-mark')).toBeNull();
  });

  // TC-02.7-05: Detail header variant renders correctly
  it('TC-02.7-05: detail header variant automatically displays contextual back button', () => {
    render(
      <AppHeader
        title="Station Details"
        variant="detail"
        testID="detail-header"
      />
    );
    expect(screen.getByTestId('detail-header-back-btn')).toBeTruthy();
    expect(screen.queryByTestId('detail-header-brand-mark')).toBeNull();
  });

  // TC-02.7-06: Back button appears when enabled
  it('TC-02.7-06: shows back button when showBackButton is explicitly true', () => {
    render(
      <AppHeader
        title="Custom Route"
        showBackButton={true}
        testID="explicit-back-header"
      />
    );
    expect(screen.getByTestId('explicit-back-header-back-btn')).toBeTruthy();
  });

  // TC-02.7-07: Back button invokes the correct navigation action
  it('TC-02.7-07: back button calls custom onBack callback when clicked', () => {
    const handleBack = jest.fn();
    render(
      <BackButton
        onPress={handleBack}
        testID="standalone-back-button"
      />
    );

    const btn = screen.getByTestId('standalone-back-button');
    fireEvent.press(btn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  // TC-02.7-08: Root tab screens do not show unnecessary back buttons
  it('TC-02.7-08: root tab headers do not display back button by default', () => {
    render(
      <AppHeader
        title="Home"
        variant="default"
        testID="root-tab-header"
      />
    );
    expect(screen.queryByTestId('root-tab-header-back-btn')).toBeNull();
  });

  // TC-02.7-09: Back navigation handles unavailable history safely
  it('TC-02.7-09: back button does not throw or crash when no history exists', () => {
    expect(() => {
      render(<BackButton testID="safe-back-btn" />);
      fireEvent.press(screen.getByTestId('safe-back-btn'));
    }).not.toThrow();
  });

  // TC-02.7-10: Repeated interaction does not cause unintended navigation
  it('TC-02.7-10: disabled back button prevents repeated rapid clicks', () => {
    const handleBack = jest.fn();
    render(
      <BackButton
        onPress={handleBack}
        disabled={true}
        testID="disabled-back-btn"
      />
    );

    const btn = screen.getByTestId('disabled-back-btn');
    fireEvent.press(btn);
    fireEvent.press(btn);
    expect(handleBack).not.toHaveBeenCalled();
  });

  // TC-02.7-11: Optional header action renders correctly
  it('TC-02.7-11: renders optional trailing header action with icon', () => {
    render(
      <AppHeader
        title="Settings Screen"
        trailingActions={
          <HeaderAction
            icon={<View testID="settings-icon" />}
            label="Open Settings"
            onPress={() => {}}
            testID="settings-action"
          />
        }
        testID="action-header"
      />
    );

    expect(screen.getByTestId('settings-action')).toBeTruthy();
    expect(screen.getByTestId('settings-icon')).toBeTruthy();
  });

  // TC-02.7-12: Header action invokes its callback
  it('TC-02.7-12: header action invokes onPress callback upon touch', () => {
    const handleAction = jest.fn();
    render(
      <HeaderAction
        icon={<View />}
        label="Refresh HUD"
        onPress={handleAction}
        testID="refresh-action"
      />
    );

    fireEvent.press(screen.getByTestId('refresh-action'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  // TC-02.7-13: Disabled action prevents interaction
  it('TC-02.7-13: disabled header action blocks onPress execution', () => {
    const handleAction = jest.fn();
    render(
      <HeaderAction
        icon={<View />}
        label="Disabled Action"
        onPress={handleAction}
        disabled={true}
        testID="disabled-action"
      />
    );

    fireEvent.press(screen.getByTestId('disabled-action'));
    expect(handleAction).not.toHaveBeenCalled();
  });

  // TC-02.7-14: Actions without behavior are not misleadingly interactive
  it('TC-02.7-14: action without onPress callback is not interactive', () => {
    render(
      <HeaderAction
        icon={<View />}
        label="Static Display Item"
        testID="static-action"
      />
    );

    const actionBtn = screen.getByTestId('static-action');
    expect(actionBtn.props.accessibilityState.disabled).toBe(true);
  });

  // TC-02.7-22: Title exposes appropriate heading semantics
  it('TC-02.7-22: title element exposes accessibilityRole="header"', () => {
    render(<AppHeader title="Accessible Title" testID="accessible-header" />);
    const titleEl = screen.getByTestId('accessible-header-title');
    expect(titleEl.props.accessibilityRole).toBe('header');
  });

  // TC-02.7-23: Back button has a meaningful accessible label
  it('TC-02.7-23: back button provides meaningful accessible label', () => {
    render(<BackButton accessibilityLabel="Return to Route Planner" testID="labeled-back" />);
    const btn = screen.getByTestId('labeled-back');
    expect(btn.props.accessibilityLabel).toBe('Return to Route Planner');
  });

  // TC-02.7-24: Header actions have accessible names
  it('TC-02.7-24: header actions enforce accessible names', () => {
    render(
      <HeaderAction
        icon={<View />}
        label="Search Transit Nodes"
        onPress={() => {}}
        testID="search-action"
      />
    );
    const actionEl = screen.getByTestId('search-action');
    expect(actionEl.props.accessibilityLabel).toBe('Search Transit Nodes');
  });

  // TC-02.7-25: Touch targets meet minimum sizing requirements
  it('TC-02.7-25: touch targets meet >= 44x44 pt minimum requirement', () => {
    render(
      <View>
        <BackButton testID="touch-back" />
        <HeaderAction icon={<View />} label="Action" onPress={() => {}} testID="touch-action" />
      </View>
    );

    const backBtn = screen.getByTestId('touch-back');
    const flatBack = StyleSheet.flatten(backBtn.props.style);
    expect(flatBack.minWidth).toBeGreaterThanOrEqual(44);
    expect(flatBack.minHeight).toBeGreaterThanOrEqual(44);

    const actionBtn = screen.getByTestId('touch-action');
    const flatAction = StyleSheet.flatten(actionBtn.props.style);
    expect(flatAction.minWidth).toBeGreaterThanOrEqual(44);
    expect(flatAction.minHeight).toBeGreaterThanOrEqual(44);
  });

  // TC-02.7-26: Larger font settings are supported
  it('TC-02.7-26: header text supports allowFontScaling', () => {
    render(
      <AppHeader
        title="Scalable Title"
        subtitle="Scalable Subtitle"
        testID="scaled-header"
      />
    );
    const title = screen.getByTestId('scaled-header-title');
    const subtitle = screen.getByTestId('scaled-header-subtitle');
    expect(title.props.allowFontScaling).toBe(true);
    expect(subtitle.props.allowFontScaling).toBe(true);
  });

  // TC-02.7-27: Light/dark theme styling resolves correctly
  it('TC-02.7-27: resolves background color correctly across dark and light themes', () => {
    const { rerender } = render(
      <AppHeader title="Theme Test" themeMode="dark" testID="theme-header" />
    );
    let header = screen.getByTestId('theme-header');
    let flatStyle = StyleSheet.flatten(header.props.style);
    expect(flatStyle.backgroundColor).toBe('#070A0F'); // abyssVoid

    rerender(
      <AppHeader title="Theme Test" themeMode="light" testID="theme-header" />
    );
    header = screen.getByTestId('theme-header');
    flatStyle = StyleSheet.flatten(header.props.style);
    expect(flatStyle.backgroundColor).toBe('#FFFFFF'); // lightTheme.colors.surface
  });
});
