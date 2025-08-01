/**
 * App State Action Creators
 * Provides convenient functions for creating state actions
 */

import { RokuDevice, ConnectionStatus, BLEError } from '../types';
import {
  AppAction,
  AppActionType,
  AppState,
} from './types';

// Connection action creators
export const connectionActions = {
  setConnectionStatus: (status: ConnectionStatus): AppAction => ({
    type: AppActionType.SET_CONNECTION_STATUS,
    payload: status,
  }),

  setCurrentDevice: (device: RokuDevice | null): AppAction => ({
    type: AppActionType.SET_CURRENT_DEVICE,
    payload: device,
  }),

  setAvailableDevices: (devices: RokuDevice[]): AppAction => ({
    type: AppActionType.SET_AVAILABLE_DEVICES,
    payload: devices,
  }),

  addAvailableDevice: (device: RokuDevice): AppAction => ({
    type: AppActionType.ADD_AVAILABLE_DEVICE,
    payload: device,
  }),

  removeAvailableDevice: (deviceId: string): AppAction => ({
    type: AppActionType.REMOVE_AVAILABLE_DEVICE,
    payload: deviceId,
  }),

  setConnectionError: (error: BLEError): AppAction => ({
    type: AppActionType.SET_CONNECTION_ERROR,
    payload: error,
  }),

  clearConnectionError: (): AppAction => ({
    type: AppActionType.CLEAR_CONNECTION_ERROR,
  }),

  setScanning: (isScanning: boolean): AppAction => ({
    type: AppActionType.SET_SCANNING,
    payload: isScanning,
  }),

  incrementConnectionAttempts: (): AppAction => ({
    type: AppActionType.INCREMENT_CONNECTION_ATTEMPTS,
  }),

  resetConnectionAttempts: (): AppAction => ({
    type: AppActionType.RESET_CONNECTION_ATTEMPTS,
  }),
};

// UI action creators
export const uiActions = {
  setCurrentScreen: (screen: 'remote' | 'settings' | 'pairing'): AppAction => ({
    type: AppActionType.SET_CURRENT_SCREEN,
    payload: screen,
  }),

  setLoading: (isLoading: boolean): AppAction => ({
    type: AppActionType.SET_LOADING,
    payload: isLoading,
  }),

  setMockMode: (enabled: boolean): AppAction => ({
    type: AppActionType.SET_MOCK_MODE,
    payload: enabled,
  }),

  setMockBanner: (show: boolean): AppAction => ({
    type: AppActionType.SET_MOCK_BANNER,
    payload: show,
  }),

  setLoadingMessage: (message: string | null): AppAction => ({
    type: AppActionType.SET_LOADING_MESSAGE,
    payload: message,
  }),
};

// Settings action creators
export const settingsActions = {
  setVibrationEnabled: (enabled: boolean): AppAction => ({
    type: AppActionType.SET_VIBRATION_ENABLED,
    payload: enabled,
  }),

  setSoundEnabled: (enabled: boolean): AppAction => ({
    type: AppActionType.SET_SOUND_ENABLED,
    payload: enabled,
  }),

  setAutoReconnect: (enabled: boolean): AppAction => ({
    type: AppActionType.SET_AUTO_RECONNECT,
    payload: enabled,
  }),

  setPreferredDevice: (deviceId: string | null): AppAction => ({
    type: AppActionType.SET_PREFERRED_DEVICE,
    payload: deviceId,
  }),

  setMockModeEnabled: (enabled: boolean): AppAction => ({
    type: AppActionType.SET_MOCK_MODE_ENABLED,
    payload: enabled,
  }),

  updateSettings: (settings: Partial<AppState['settings']>): AppAction => ({
    type: AppActionType.UPDATE_SETTINGS,
    payload: settings,
  }),
};

// Reset action creators
export const resetActions = {
  resetConnectionState: (): AppAction => ({
    type: AppActionType.RESET_CONNECTION_STATE,
  }),

  resetUIState: (): AppAction => ({
    type: AppActionType.RESET_UI_STATE,
  }),

  resetAllState: (): AppAction => ({
    type: AppActionType.RESET_ALL_STATE,
  }),
};

// Combined action creators for convenience
export const actions = {
  connection: connectionActions,
  ui: uiActions,
  settings: settingsActions,
  reset: resetActions,
};