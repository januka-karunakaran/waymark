import React from 'react';
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { CardHeader } from '../CardHeader';
import { CardBody } from '../CardBody';
import { CardFooter } from '../CardFooter';
import { AppText } from '../../typography';
import { AppButton } from '../../buttons';

describe('Card Layout Components (Header, Body, Footer)', () => {
  // TC-02.5-09: CardHeader renders title and subtitle
  it('TC-02.5-09: CardHeader renders title and subtitle correctly', () => {
    render(
      <CardHeader
        title="Bus B12 Transit"
        subtitle="Arrives in 4 minutes"
        testID="test-header"
      />
    );

    expect(screen.getByText('Bus B12 Transit')).toBeTruthy();
    expect(screen.getByText('Arrives in 4 minutes')).toBeTruthy();
  });

  it('CardHeader renders leading visual and trailing content', () => {
    render(
      <CardHeader
        title="Flight Corridor"
        leading={<View testID="leading-icon" />}
        trailing={<View testID="trailing-badge" />}
        testID="full-header"
      />
    );

    expect(screen.getByTestId('leading-icon')).toBeTruthy();
    expect(screen.getByTestId('trailing-badge')).toBeTruthy();
    expect(screen.getByText('Flight Corridor')).toBeTruthy();
  });

  // TC-02.5-10: CardBody renders children
  it('TC-02.5-10: CardBody renders arbitrary children within layout', () => {
    render(
      <CardBody testID="test-body">
        <AppText testID="body-paragraph">
          Avoids monsoon ground surge · Air Shuttle flight sync ready
        </AppText>
      </CardBody>
    );

    expect(screen.getByTestId('body-paragraph')).toBeTruthy();
    expect(screen.getByText(/Avoids monsoon ground surge/)).toBeTruthy();
  });

  // TC-02.5-11: CardFooter renders metadata or actions
  it('TC-02.5-11: CardFooter renders metadata string and action button', () => {
    render(
      <CardFooter
        metadata="Updated 2s ago"
        actions={<AppButton title="View Route" size="sm" testID="route-btn" />}
        testID="test-footer"
      />
    );

    expect(screen.getByText('Updated 2s ago')).toBeTruthy();
    expect(screen.getByTestId('route-btn')).toBeTruthy();
  });

  // TC-02.5-12: Optional content is handled safely
  it('TC-02.5-12: CardHeader and CardFooter handle absent optional content gracefully', () => {
    const { unmount } = render(
      <CardHeader testID="empty-header" />
    );
    expect(screen.getByTestId('empty-header')).toBeTruthy();
    unmount();

    const { toJSON } = render(
      <CardFooter testID="empty-footer" />
    );
    expect(toJSON()).toBeNull();
  });
});
