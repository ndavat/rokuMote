import React from 'react';
import { render } from '@testing-library/react-native';
import { BottomPanel } from '../BottomPanel';
import { ThemeProvider } from '../../../theme/ThemeProvider';

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('BottomPanel', () => {
  it('renders title and subtitle correctly', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    expect(getByTestId('bottom-panel-title')).toBeTruthy();
    expect(getByTestId('bottom-panel-subtitle')).toBeTruthy();
  });

  it('displays correct title text', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    const titleElement = getByTestId('bottom-panel-title');
    expect(titleElement.props.children).toBe('My Roku');
  });

  it('displays correct subtitle text', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    const subtitleElement = getByTestId('bottom-panel-subtitle');
    expect(subtitleElement.props.children).toBe('Remote Control');
  });

  it('applies correct styling to title', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    const titleElement = getByTestId('bottom-panel-title');
    expect(titleElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 20,
          fontWeight: 'bold',
          color: '#FFFFFF',
        })
      ])
    );
  });

  it('applies correct styling to subtitle', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    const subtitleElement = getByTestId('bottom-panel-subtitle');
    expect(subtitleElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 14,
          color: '#A0AEC0',
        })
      ])
    );
  });

  it('renders with custom title and subtitle', () => {
    const customTitle = 'Living Room Roku';
    const customSubtitle = 'Entertainment System';
    
    const { getByTestId } = renderWithTheme(
      <BottomPanel title={customTitle} subtitle={customSubtitle} testID="bottom-panel" />
    );

    const titleElement = getByTestId('bottom-panel-title');
    const subtitleElement = getByTestId('bottom-panel-subtitle');
    
    expect(titleElement.props.children).toBe(customTitle);
    expect(subtitleElement.props.children).toBe(customSubtitle);
  });

  it('renders container with correct styling', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    const container = getByTestId('bottom-panel');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#1A1B2E',
          paddingVertical: 20,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: '#2D3748',
        })
      ])
    );
  });

  it('centers content properly', () => {
    const { getByTestId } = renderWithTheme(
      <BottomPanel title="My Roku" subtitle="Remote Control" testID="bottom-panel" />
    );

    const container = getByTestId('bottom-panel');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alignItems: 'center',
        })
      ])
    );
  });
});