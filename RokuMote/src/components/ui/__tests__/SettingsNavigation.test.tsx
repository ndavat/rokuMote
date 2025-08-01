/**
 * Settings Navigation Integration Test
 * Tests the navigation flow from QuickAccessButtons to Settings screen
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ConnectedRemoteScreen } from '../../../screens/ConnectedRemoteScreen';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { AppStateProvider } from '../../../state/AppStateContext';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock BLE service
jest.mock('../../../services', () => ({
  getBLEServiceFactory: () => ({
    getBLEService: () => ({
      sendCommand: jest.fn(),
      isConnected: () => false,
      getConnectionStatus: () => 'disconnected',
      getCurrentDevice: () => null,
    }),
    createService: () => ({
      sendCommand: jest.fn(),
    }),
  }),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size: number) => size,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AppStateProvider>
        {component}
      </AppStateProvider>
    </ThemeProvider>
  );
};

describe('Settings Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to settings screen when settings button is pressed', async () => {
    const { getByTestId } = renderWithProviders(
      <ConnectedRemoteScreen testID="connected-remote" />
    );

    // Find the settings button in the QuickAccessButtons component
    const settingsButton = getByTestId('connected-remote-quick-access-settings');
    
    // Press the settings button
    fireEvent.press(settingsButton);

    // Verify that router.push was called with the correct route
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('provides haptic feedback when settings button is pressed', async () => {
    const { Haptics } = require('expo-haptics');
    
    const { getByTestId } = renderWithProviders(
      <ConnectedRemoteScreen testID="connected-remote" />
    );

    // Find the settings button
    const settingsButton = getByTestId('connected-remote-quick-access-settings');
    
    // Press the settings button
    fireEvent.press(settingsButton);

    // Verify haptic feedback was triggered
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does not send BLE command for settings button press', async () => {
    const mockSendCommand = jest.fn();
    
    // Mock the BLE service to track command calls
    jest.doMock('../../../services', () => ({
      getBLEServiceFactory: () => ({
        getBLEService: () => ({
          sendCommand: mockSendCommand,
          isConnected: () => true,
          getConnectionStatus: () => 'connected',
          getCurrentDevice: () => ({ name: 'Test Device' }),
        }),
        createService: () => ({
          sendCommand: mockSendCommand,
        }),
      }),
    }));

    const { getByTestId } = renderWithProviders(
      <ConnectedRemoteScreen testID="connected-remote" />
    );

    // Find the settings button
    const settingsButton = getByTestId('connected-remote-quick-access-settings');
    
    // Press the settings button
    fireEvent.press(settingsButton);

    // Verify that no BLE command was sent (settings is navigation-only)
    expect(mockSendCommand).not.toHaveBeenCalled();
    
    // But navigation should still occur
    expect(router.push).toHaveBeenCalledWith('/settings');
  });
});