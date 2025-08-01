/**
 * App State Reducer Tests
 * Tests for the main application state reducer
 */

import { appReducer } from '../reducer';
import { AppState, AppActionType, DEFAULT_APP_STATE } from '../types';
import { ConnectionStatus, BLEErrorType } from '../../types';
import { actions } from '../actions';

describe('appReducer', () => {
  let initialState: AppState;

  beforeEach(() => {
    initialState = { ...DEFAULT_APP_STATE };
  });

  describe('Connection Actions', () => {
    it('should set connection status', () => {
      const action = actions.connection.setConnectionStatus(ConnectionStatus.CONNECTING);
      const newState = appReducer(initialState, action);

      expect(newState.connection.connectionStatus).toBe(ConnectionStatus.CONNECTING);
      expect(newState.connection.isConnected).toBe(false);
    });

    it('should set connected status when status is CONNECTED', () => {
      const action = actions.connection.setConnectionStatus(ConnectionStatus.CONNECTED);
      const newState = appReducer(initialState, action);

      expect(newState.connection.connectionStatus).toBe(ConnectionStatus.CONNECTED);
      expect(newState.connection.isConnected).toBe(true);
    });

    it('should set current device', () => {
      const mockDevice = {
        id: 'device-1',
        name: 'Bedroom Roku',
        rssi: -50,
        isConnectable: true,
      };

      const action = actions.connection.setCurrentDevice(mockDevice);
      const newState = appReducer(initialState, action);

      expect(newState.connection.currentDevice).toEqual(mockDevice);
      expect(newState.connection.isConnected).toBe(true);
      expect(newState.connection.connectionStatus).toBe(ConnectionStatus.CONNECTED);
    });

    it('should clear current device when set to null', () => {
      const stateWithDevice = {
        ...initialState,
        connection: {
          ...initialState.connection,
          currentDevice: {
            id: 'device-1',
            name: 'Bedroom Roku',
            rssi: -50,
            isConnectable: true,
          },
          isConnected: true,
        },
      };

      const action = actions.connection.setCurrentDevice(null);
      const newState = appReducer(stateWithDevice, action);

      expect(newState.connection.currentDevice).toBe(null);
      expect(newState.connection.isConnected).toBe(false);
      expect(newState.connection.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should set available devices', () => {
      const mockDevices = [
        { id: 'device-1', name: 'Bedroom Roku', rssi: -50, isConnectable: true },
        { id: 'device-2', name: 'Living Room Roku', rssi: -60, isConnectable: true },
      ];

      const action = actions.connection.setAvailableDevices(mockDevices);
      const newState = appReducer(initialState, action);

      expect(newState.connection.availableDevices).toEqual(mockDevices);
    });

    it('should add available device', () => {
      const mockDevice = {
        id: 'device-1',
        name: 'Bedroom Roku',
        rssi: -50,
        isConnectable: true,
      };

      const action = actions.connection.addAvailableDevice(mockDevice);
      const newState = appReducer(initialState, action);

      expect(newState.connection.availableDevices).toContain(mockDevice);
      expect(newState.connection.availableDevices).toHaveLength(1);
    });

    it('should update existing device when adding duplicate', () => {
      const existingDevice = {
        id: 'device-1',
        name: 'Bedroom Roku',
        rssi: -50,
        isConnectable: true,
      };

      const updatedDevice = {
        id: 'device-1',
        name: 'Bedroom Roku',
        rssi: -40,
        isConnectable: true,
      };

      const stateWithDevice = {
        ...initialState,
        connection: {
          ...initialState.connection,
          availableDevices: [existingDevice],
        },
      };

      const action = actions.connection.addAvailableDevice(updatedDevice);
      const newState = appReducer(stateWithDevice, action);

      expect(newState.connection.availableDevices).toHaveLength(1);
      expect(newState.connection.availableDevices[0].rssi).toBe(-40);
    });

    it('should remove available device', () => {
      const mockDevices = [
        { id: 'device-1', name: 'Bedroom Roku', rssi: -50, isConnectable: true },
        { id: 'device-2', name: 'Living Room Roku', rssi: -60, isConnectable: true },
      ];

      const stateWithDevices = {
        ...initialState,
        connection: {
          ...initialState.connection,
          availableDevices: mockDevices,
        },
      };

      const action = actions.connection.removeAvailableDevice('device-1');
      const newState = appReducer(stateWithDevices, action);

      expect(newState.connection.availableDevices).toHaveLength(1);
      expect(newState.connection.availableDevices[0].id).toBe('device-2');
    });

    it('should set connection error', () => {
      const mockError = {
        type: BLEErrorType.CONNECTION_FAILED,
        message: 'Failed to connect to device',
      };

      const action = actions.connection.setConnectionError(mockError);
      const newState = appReducer(initialState, action);

      expect(newState.connection.lastError).toEqual(mockError);
      expect(newState.connection.connectionStatus).toBe(ConnectionStatus.ERROR);
    });

    it('should clear connection error', () => {
      const stateWithError = {
        ...initialState,
        connection: {
          ...initialState.connection,
          lastError: {
            type: BLEErrorType.CONNECTION_FAILED,
            message: 'Failed to connect to device',
          },
        },
      };

      const action = actions.connection.clearConnectionError();
      const newState = appReducer(stateWithError, action);

      expect(newState.connection.lastError).toBe(null);
    });

    it('should set scanning state', () => {
      const action = actions.connection.setScanning(true);
      const newState = appReducer(initialState, action);

      expect(newState.connection.isScanning).toBe(true);
      expect(newState.connection.connectionStatus).toBe(ConnectionStatus.SCANNING);
    });

    it('should increment connection attempts', () => {
      const action = actions.connection.incrementConnectionAttempts();
      const newState = appReducer(initialState, action);

      expect(newState.connection.connectionAttempts).toBe(1);
    });

    it('should reset connection attempts', () => {
      const stateWithAttempts = {
        ...initialState,
        connection: {
          ...initialState.connection,
          connectionAttempts: 5,
        },
      };

      const action = actions.connection.resetConnectionAttempts();
      const newState = appReducer(stateWithAttempts, action);

      expect(newState.connection.connectionAttempts).toBe(0);
    });
  });

  describe('UI Actions', () => {
    it('should set current screen', () => {
      const action = actions.ui.setCurrentScreen('settings');
      const newState = appReducer(initialState, action);

      expect(newState.ui.currentScreen).toBe('settings');
    });

    it('should set loading state', () => {
      const action = actions.ui.setLoading(true);
      const newState = appReducer(initialState, action);

      expect(newState.ui.isLoading).toBe(true);
    });

    it('should set mock mode', () => {
      const action = actions.ui.setMockMode(true);
      const newState = appReducer(initialState, action);

      expect(newState.ui.mockMode).toBe(true);
      expect(newState.ui.showMockBanner).toBe(true);
      expect(newState.settings.mockModeEnabled).toBe(true);
    });

    it('should set mock banner visibility', () => {
      const action = actions.ui.setMockBanner(false);
      const newState = appReducer(initialState, action);

      expect(newState.ui.showMockBanner).toBe(false);
    });

    it('should set loading message', () => {
      const message = 'Connecting to device...';
      const action = actions.ui.setLoadingMessage(message);
      const newState = appReducer(initialState, action);

      expect(newState.ui.loadingMessage).toBe(message);
    });
  });

  describe('Settings Actions', () => {
    it('should set vibration enabled', () => {
      const action = actions.settings.setVibrationEnabled(false);
      const newState = appReducer(initialState, action);

      expect(newState.settings.vibrationEnabled).toBe(false);
    });

    it('should set sound enabled', () => {
      const action = actions.settings.setSoundEnabled(false);
      const newState = appReducer(initialState, action);

      expect(newState.settings.soundEnabled).toBe(false);
    });

    it('should set auto reconnect', () => {
      const action = actions.settings.setAutoReconnect(false);
      const newState = appReducer(initialState, action);

      expect(newState.settings.autoReconnect).toBe(false);
    });

    it('should set preferred device', () => {
      const deviceId = 'device-123';
      const action = actions.settings.setPreferredDevice(deviceId);
      const newState = appReducer(initialState, action);

      expect(newState.settings.preferredDeviceId).toBe(deviceId);
    });

    it('should update multiple settings', () => {
      const settingsUpdate = {
        vibrationEnabled: false,
        soundEnabled: false,
        autoReconnect: false,
      };

      const action = actions.settings.updateSettings(settingsUpdate);
      const newState = appReducer(initialState, action);

      expect(newState.settings.vibrationEnabled).toBe(false);
      expect(newState.settings.soundEnabled).toBe(false);
      expect(newState.settings.autoReconnect).toBe(false);
    });
  });

  describe('Reset Actions', () => {
    it('should reset connection state', () => {
      const modifiedState = {
        ...initialState,
        connection: {
          ...initialState.connection,
          isConnected: true,
          currentDevice: { id: 'device-1', name: 'Test', rssi: -50, isConnectable: true },
          connectionAttempts: 3,
        },
      };

      const action = actions.reset.resetConnectionState();
      const newState = appReducer(modifiedState, action);

      expect(newState.connection).toEqual(DEFAULT_APP_STATE.connection);
    });

    it('should reset UI state', () => {
      const modifiedState = {
        ...initialState,
        ui: {
          ...initialState.ui,
          currentScreen: 'settings' as const,
          isLoading: true,
          mockMode: true,
        },
      };

      const action = actions.reset.resetUIState();
      const newState = appReducer(modifiedState, action);

      expect(newState.ui).toEqual(DEFAULT_APP_STATE.ui);
    });

    it('should reset all state', () => {
      const modifiedState = {
        ...initialState,
        connection: {
          ...initialState.connection,
          isConnected: true,
        },
        ui: {
          ...initialState.ui,
          isLoading: true,
        },
        settings: {
          ...initialState.settings,
          vibrationEnabled: false,
        },
      };

      const action = actions.reset.resetAllState();
      const newState = appReducer(modifiedState, action);

      expect(newState).toEqual(DEFAULT_APP_STATE);
    });
  });
});