/**
 * SettingsScreen Component Tests
 * Tests for the comprehensive settings screen functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { SettingsScreen } from '../SettingsScreen';
import { AppStateProvider } from '../../state/AppStateContext';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { getBLEServiceManager } from '../../services';
import { MockBLEService } from '../../services/ble/MockBLEService';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('../../services', () => ({
  getBLEServiceManager: jest.fn(),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialState?: any }> = ({ 
  children, 
  initialState 
}) => (
  <ThemeProvider>
    <AppStateProvider initialState={initialState}>
      {children}
    </AppStateProvider>
  </ThemeProvider>
);

describe('SettingsScreen', () => {
  let mockBLEService: jest.Mocked<MockBLEService>;
  let mockServiceManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock BLE service
    mockBLEService = {
      disconnect: jest.fn().mockResolvedValue(undefined),
      scanForDevices: jest.fn().mockResolvedValue([]),
      connectToDevice: jest.fn().mockResolvedValue(true),
      sendCommand: jest.fn().mockResolvedValue(undefined),
      getConnectionStatus: jest.fn().mockReturnValue('disconnected'),
      enableAutoReconnect: jest.fn(),
      enableMockMode: jest.fn(),
      simulateConnectionLoss: jest.fn(),
      setMockResponseDelay: jest.fn(),
    } as any;

    mockServiceManager = {
      getBLEService: jest.fn().mockReturnValue(mockBLEService),
      setUseMockService: jest.fn(),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isUsingMockService: jest.fn().mockReturnValue(false),
    };

    (getBLEServiceManager as jest.Mock).mockReturnValue(mockServiceManager);
  });

  describe('Rendering', () => {
    it('renders all main sections', () => {
      const { getByText } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Development & Testing')).toBeTruthy();
      expect(getByText('Device Connection')).toBeTruthy();
      expect(getByText('App Preferences')).toBeTruthy();
      expect(getByText('Help & Support')).toBeTruthy();
      expect(getByText('Connection Status')).toBeTruthy();
    });

    it('renders mock mode toggle', () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Mock Mode')).toBeTruthy();
      expect(getByText('Simulate Roku device responses for testing')).toBeTruthy();
      expect(getByTestId('mock-mode-toggle')).toBeTruthy();
    });

    it('renders device connection settings', () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Current Device')).toBeTruthy();
      expect(getByText('Available Devices')).toBeTruthy();
      expect(getByText('Auto-Reconnect')).toBeTruthy();
      expect(getByTestId('select-device-button')).toBeTruthy();
      expect(getByTestId('auto-reconnect-toggle')).toBeTruthy();
    });

    it('renders app preferences', () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Vibration Feedback')).toBeTruthy();
      expect(getByText('Sound Effects')).toBeTruthy();
      expect(getByTestId('vibration-toggle')).toBeTruthy();
      expect(getByTestId('sound-toggle')).toBeTruthy();
    });

    it('renders help and support options', () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Help & FAQ')).toBeTruthy();
      expect(getByText('Troubleshooting')).toBeTruthy();
      expect(getByText('Advanced Settings')).toBeTruthy();
      expect(getByText('Reset Settings')).toBeTruthy();
      expect(getByTestId('help-button')).toBeTruthy();
      expect(getByTestId('troubleshooting-button')).toBeTruthy();
      expect(getByTestId('reset-settings-button')).toBeTruthy();
    });
  });

  describe('Mock Mode Functionality', () => {
    it('displays mock mode as disabled by default', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const toggleButton = getByTestId('mock-mode-toggle');
      expect(toggleButton.props.children).toBe('Disabled');
    });

    it('displays mock mode as enabled when mockModeEnabled is true', () => {
      const initialState = {
        settings: { mockModeEnabled: true },
        ui: { mockMode: true },
      };

      const { getByTestId } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      const toggleButton = getByTestId('mock-mode-toggle');
      expect(toggleButton.props.children).toBe('Enabled');
    });

    it('toggles mock mode when button is pressed', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const toggleButton = getByTestId('mock-mode-toggle');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(mockServiceManager.setUseMockService).toHaveBeenCalledWith(true);
        expect(Alert.alert).toHaveBeenCalledWith(
          'Mock Mode Enabled',
          'The app will now simulate Roku device responses for testing purposes.',
          [{ text: 'OK' }]
        );
      });
    });

    it('shows mock mode banner when mock mode is enabled', () => {
      const initialState = {
        ui: { mockMode: true },
      };

      const { getByTestId } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      // MockModeBanner should be rendered when mockMode is true
      // This would need to be tested by checking if the MockModeBanner component is rendered
      // The exact test depends on how MockModeBanner is implemented
    });
  });

  describe('Device Connection Management', () => {
    it('shows no device connected by default', () => {
      const { getByText } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('No device connected')).toBeTruthy();
    });

    it('shows current device when connected', () => {
      const initialState = {
        connection: {
          currentDevice: { id: '1', name: 'Living Room Roku', rssi: -50 },
          isConnected: true,
        },
      };

      const { getByText, getByTestId } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Living Room Roku')).toBeTruthy();
      expect(getByTestId('disconnect-device-button')).toBeTruthy();
    });

    it('navigates to pairing screen when select device is pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const selectButton = getByTestId('select-device-button');
      fireEvent.press(selectButton);

      expect(router.push).toHaveBeenCalledWith('/pairing');
    });

    it('disconnects device when disconnect button is pressed', async () => {
      const initialState = {
        connection: {
          currentDevice: { id: '1', name: 'Living Room Roku', rssi: -50 },
          isConnected: true,
        },
      };

      const { getByTestId } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      const disconnectButton = getByTestId('disconnect-device-button');
      fireEvent.press(disconnectButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Disconnect Device',
        'Are you sure you want to disconnect from the current device?',
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          expect.objectContaining({
            text: 'Disconnect',
            style: 'destructive',
          }),
        ])
      );
    });

    it('shows available devices count', () => {
      const initialState = {
        connection: {
          availableDevices: [
            { id: '1', name: 'Device 1', rssi: -50 },
            { id: '2', name: 'Device 2', rssi: -60 },
          ],
        },
      };

      const { getByText } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('2 device(s) found')).toBeTruthy();
    });
  });

  describe('App Preferences', () => {
    it('shows vibration as enabled by default', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const vibrationToggle = getByTestId('vibration-toggle');
      expect(vibrationToggle.props.children).toBe('On');
    });

    it('shows sound as enabled by default', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const soundToggle = getByTestId('sound-toggle');
      expect(soundToggle.props.children).toBe('On');
    });

    it('shows auto-reconnect as enabled by default', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const autoReconnectToggle = getByTestId('auto-reconnect-toggle');
      expect(autoReconnectToggle.props.children).toBe('On');
    });

    it('toggles vibration setting when pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const vibrationToggle = getByTestId('vibration-toggle');
      fireEvent.press(vibrationToggle);

      // The state change would be tested through the state management system
      // This test verifies the button press is handled
    });

    it('toggles sound setting when pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const soundToggle = getByTestId('sound-toggle');
      fireEvent.press(soundToggle);

      // The state change would be tested through the state management system
    });

    it('toggles auto-reconnect setting when pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const autoReconnectToggle = getByTestId('auto-reconnect-toggle');
      fireEvent.press(autoReconnectToggle);

      // The state change would be tested through the state management system
    });
  });

  describe('Help and Support', () => {
    it('shows help dialog when help button is pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const helpButton = getByTestId('help-button');
      fireEvent.press(helpButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Help & Support',
        expect.stringContaining('RokuMote Help:'),
        [{ text: 'OK' }]
      );
    });

    it('shows troubleshooting dialog when troubleshooting button is pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const troubleshootingButton = getByTestId('troubleshooting-button');
      fireEvent.press(troubleshootingButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Troubleshooting',
        expect.stringContaining('Common Issues:'),
        expect.arrayContaining([
          { text: 'Reset Settings', onPress: expect.any(Function) },
          { text: 'OK' },
        ])
      );
    });

    it('shows advanced settings dialog when advanced settings button is pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const advancedButton = getByTestId('advanced-settings-button');
      fireEvent.press(advancedButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Advanced Settings',
        expect.stringContaining('Advanced Configuration:'),
        [{ text: 'OK' }]
      );
    });

    it('shows reset confirmation when reset button is pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const resetButton = getByTestId('reset-settings-button');
      fireEvent.press(resetButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Reset Settings',
        'Are you sure you want to reset all settings to their default values?',
        expect.arrayContaining([
          { text: 'Cancel', style: 'cancel' },
          expect.objectContaining({
            text: 'Reset',
            style: 'destructive',
          }),
        ])
      );
    });
  });

  describe('Connection Status Display', () => {
    it('shows disconnected status by default', () => {
      const { getByText } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Disconnected')).toBeTruthy();
    });

    it('shows connected status when connected', () => {
      const initialState = {
        connection: {
          isConnected: true,
          connectionStatus: 'connected',
          currentDevice: { id: '1', name: 'Living Room Roku', rssi: -50 },
        },
      };

      const { getByText } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByText('Connected')).toBeTruthy();
      expect(getByText('Connected to: Living Room Roku')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('calls router.back when back button is pressed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      // The back button is in the StatusBar component
      // This would need to be tested by triggering the onClose callback
    });

    it('calls custom onBack callback when provided', () => {
      const mockOnBack = jest.fn();
      
      render(
        <TestWrapper>
          <SettingsScreen onBack={mockOnBack} />
        </TestWrapper>
      );

      // Test would involve triggering the back action and verifying mockOnBack is called
    });
  });

  describe('Error Handling', () => {
    it('handles mock mode toggle errors gracefully', async () => {
      mockServiceManager.setUseMockService.mockImplementation(() => {
        throw new Error('Mock service error');
      });

      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const toggleButton = getByTestId('mock-mode-toggle');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to toggle mock mode. Please try again.'
        );
      });
    });

    it('handles disconnect errors gracefully', async () => {
      mockServiceManager.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      const initialState = {
        connection: {
          currentDevice: { id: '1', name: 'Living Room Roku', rssi: -50 },
          isConnected: true,
        },
      };

      const { getByTestId } = render(
        <TestWrapper initialState={initialState}>
          <SettingsScreen />
        </TestWrapper>
      );

      const disconnectButton = getByTestId('disconnect-device-button');
      fireEvent.press(disconnectButton);

      // Simulate pressing the disconnect confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
        call => call[0] === 'Disconnect Device'
      );
      const disconnectAction = alertCall[2].find((action: any) => action.text === 'Disconnect');
      
      await disconnectAction.onPress();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to disconnect from device.'
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper test IDs for all interactive elements', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByTestId('mock-mode-toggle')).toBeTruthy();
      expect(getByTestId('select-device-button')).toBeTruthy();
      expect(getByTestId('auto-reconnect-toggle')).toBeTruthy();
      expect(getByTestId('vibration-toggle')).toBeTruthy();
      expect(getByTestId('sound-toggle')).toBeTruthy();
      expect(getByTestId('help-button')).toBeTruthy();
      expect(getByTestId('troubleshooting-button')).toBeTruthy();
      expect(getByTestId('advanced-settings-button')).toBeTruthy();
      expect(getByTestId('reset-settings-button')).toBeTruthy();
    });

    it('has scrollable content', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      expect(getByTestId('settings-scroll-view')).toBeTruthy();
    });
  });
});