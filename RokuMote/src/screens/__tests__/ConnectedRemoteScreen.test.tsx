/**
 * ConnectedRemoteScreen Unit Tests
 * Tests for the ConnectedRemoteScreen component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConnectedRemoteScreen } from '../ConnectedRemoteScreen';
import { AppStateProvider } from '../../state/AppStateContext';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ConnectionStatus } from '../../types';
import { useBLEService } from '../../hooks/useBLEService';

// Mock the BLE service hook
jest.mock('../../hooks/useBLEService');
const mockUseBLEService = useBLEService as jest.MockedFunction<typeof useBLEService>;

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
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AppStateProvider>
      {children}
    </AppStateProvider>
  </ThemeProvider>
);

describe('ConnectedRemoteScreen', () => {
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

  it('should render correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    expect(getByTestId('connected-remote-screen')).toBeTruthy();
  });

  it('should use device name from current device', () => {
    const { getByText } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    expect(getByText('Test Roku')).toBeTruthy();
  });

  it('should use default device name when no current device', () => {
    mockUseBLEService.mockReturnValue({
      ...mockBLEService,
      currentDevice: null,
    });

    const { getByText } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    expect(getByText('Roku Device')).toBeTruthy();
  });

  it('should pass correct props to EnhancedRemoteScreen', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen testID="test-screen" />
      </TestWrapper>
    );

    expect(getByTestId('test-screen')).toBeTruthy();
  });

  it('should handle all button press types', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ConnectedRemoteScreen />
      </TestWrapper>
    );

    // Test directional buttons
    const directions = ['up', 'down', 'left', 'right'];
    for (const direction of directions) {
      const button = getByTestId(`connected-remote-screen-dpad-${direction}`);
      fireEvent.press(button);
      expect(mockSendCommand).toHaveBeenCalledWith(direction);
    }

    // Test OK button
    const okButton = getByTestId('connected-remote-screen-dpad-ok');
    fireEvent.press(okButton);
    expect(mockSendCommand).toHaveBeenCalledWith('ok');

    // Test volume buttons
    const volumeButtons = ['mute', 'volumeDown', 'volumeUp'];
    for (const button of volumeButtons) {
      const volumeButton = getByTestId(`connected-remote-screen-volume-controls-${button}`);
      fireEvent.press(volumeButton);
      expect(mockSendCommand).toHaveBeenCalledWith(button);
    }
  });
});