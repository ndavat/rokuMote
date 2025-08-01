/**
 * ConnectedRemoteScreen Integration Tests
 * Tests the integration between ConnectedRemoteScreen, state management, and BLE service
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ConnectedRemoteScreen } from '../ConnectedRemoteScreen';
import { AppStateProvider } from '../../state/AppStateContext';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ConnectionStatus, BLEErrorType } from '../../types';
import { useBLEService } from '../../hooks/useBLEService';

// Mock the BLE service hook
jest.mock('../../hooks/useBLEService');
const mockUseBLEService = useBLEService as jest.MockedFunction<typeof useBLEService>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Haptics
jest.mock('expo-haptics', () => ({
  Haptics: {
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: {
      Light: 'light',
      Medium: 'medium',
      Heavy: 'heavy',
    },
  },
}));

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode; initialState?: any }> = ({
  children,
  initialState,
}) => (
  <ThemeProvider>
    <AppStateProvider initialState={initialState}>
      {children}
    </AppStateProvider>
  </ThemeProvider>
);

describe('ConnectedRemoteScreen Integration', () => {
  const mockSendCommand = jest.fn();
  const mockScanForDevices = jest.fn();
  const mockConnectToDevice = jest.fn();
  const mockDisconnect = jest.fn();
  const mockSendRawCommand = jest.fn();
  
  const mockBLEService = {
    service: null,
    sendCommand: mockSendCommand,
    sendRawCommand: mockSendRawCommand,
    scanForDevices: mockScanForDevices,
    connectToDevice: mockConnectToDevice,
    disconnect: mockDisconnect,
    isConnected: true,
    isScanning: false,
    connectionStatus: ConnectionStatus.CONNECTED,
    currentDevice: {
      id: 'device-1',
      name: 'Test Roku',
      rssi: -50,
      isConnectable: true,
    },
    availableDevices: [],
    mockMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBLEService.mockReturnValue(mockBLEService);
    mockSendCommand.mockResolvedValue(undefined);
  });

  it('should render with connected state', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    expect(getByTestId('connected-remote-screen')).toBeTruthy();
  });

  it('should send directional commands when buttons are pressed', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const upButton = getByTestId('connected-remote-screen-dpad-up');
    fireEvent.press(upButton);

    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('up');
    });
  });

  it('should send OK command when center button is pressed', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const okButton = getByTestId('connected-remote-screen-dpad-ok');
    fireEvent.press(okButton);

    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('ok');
    });
  });

  it('should send volume commands when volume buttons are pressed', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const volumeUpButton = getByTestId('connected-remote-screen-volume-controls-volumeUp');
    fireEvent.press(volumeUpButton);

    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('volumeUp');
    });
  });

  it('should disable controls when not connected', () => {
    mockUseBLEService.mockReturnValue({
      ...mockBLEService,
      isConnected: false,
      connectionStatus: ConnectionStatus.DISCONNECTED,
    });

    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const upButton = getByTestId('connected-remote-screen-dpad-up');
    fireEvent.press(upButton);

    expect(mockSendCommand).not.toHaveBeenCalled();
  });

  it('should show error alert when connection error occurs', async () => {
    const initialState = {
      connection: {
        lastError: {
          type: BLEErrorType.CONNECTION_FAILED,
          message: 'Failed to connect to device',
        },
      },
    };

    render(
      <TestWrapper initialState={initialState}>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Error',
        'Failed to connect to device',
        expect.any(Array)
      );
    });
  });

  it('should handle command errors gracefully', async () => {
    mockSendCommand.mockRejectedValue(new Error('Command failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const upButton = getByTestId('connected-remote-screen-dpad-up');
    fireEvent.press(upButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send up command:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should provide haptic feedback when vibration is enabled', async () => {
    const hapticsMock = await import('expo-haptics');
    
    const initialState = {
      settings: {
        vibrationEnabled: true,
      },
    };

    const { getByTestId } = render(
      <TestWrapper initialState={initialState}>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const upButton = getByTestId('connected-remote-screen-dpad-up');
    fireEvent.press(upButton);

    await waitFor(() => {
      expect(hapticsMock.impactAsync).toHaveBeenCalledWith(hapticsMock.ImpactFeedbackStyle.Light);
    });
  });

  it('should not provide haptic feedback when vibration is disabled', async () => {
    const hapticsMock = await import('expo-haptics');
    
    const initialState = {
      settings: {
        vibrationEnabled: false,
      },
    };

    const { getByTestId } = render(
      <TestWrapper initialState={initialState}>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    const upButton = getByTestId('connected-remote-screen-dpad-up');
    fireEvent.press(upButton);

    await waitFor(() => {
      expect(mockSendCommand).toHaveBeenCalledWith('up');
    });

    expect(hapticsMock.impactAsync).not.toHaveBeenCalled();
  });
});