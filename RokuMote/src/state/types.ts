/**
 * App State Management Types
 * Defines the global application state structure and action types
 */

import { RokuDevice, ConnectionStatus, BLEError } from '../types';

// App state interface based on design document
export interface AppState {
  connection: {
    isConnected: boolean;
    currentDevice: RokuDevice | null;
    availableDevices: RokuDevice[];
    connectionStatus: ConnectionStatus;
    lastError: BLEError | null;
    isScanning: boolean;
    connectionAttempts: number;
  };
  ui: {
    currentScreen: 'remote' | 'settings' | 'pairing';
    isLoading: boolean;
    mockMode: boolean;
    showMockBanner: boolean;
    loadingMessage: string | null;
  };
  settings: {
    vibrationEnabled: boolean;
    soundEnabled: boolean;
    autoReconnect: boolean;
    preferredDeviceId: string | null;
    mockModeEnabled: boolean;
  };
}

// Action types for state management
export enum AppActionType {
  // Connection actions
  SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS',
  SET_CURRENT_DEVICE = 'SET_CURRENT_DEVICE',
  SET_AVAILABLE_DEVICES = 'SET_AVAILABLE_DEVICES',
  ADD_AVAILABLE_DEVICE = 'ADD_AVAILABLE_DEVICE',
  REMOVE_AVAILABLE_DEVICE = 'REMOVE_AVAILABLE_DEVICE',
  SET_CONNECTION_ERROR = 'SET_CONNECTION_ERROR',
  CLEAR_CONNECTION_ERROR = 'CLEAR_CONNECTION_ERROR',
  SET_SCANNING = 'SET_SCANNING',
  INCREMENT_CONNECTION_ATTEMPTS = 'INCREMENT_CONNECTION_ATTEMPTS',
  RESET_CONNECTION_ATTEMPTS = 'RESET_CONNECTION_ATTEMPTS',
  
  // UI actions
  SET_CURRENT_SCREEN = 'SET_CURRENT_SCREEN',
  SET_LOADING = 'SET_LOADING',
  SET_MOCK_MODE = 'SET_MOCK_MODE',
  SET_MOCK_BANNER = 'SET_MOCK_BANNER',
  SET_LOADING_MESSAGE = 'SET_LOADING_MESSAGE',
  
  // Settings actions
  SET_VIBRATION_ENABLED = 'SET_VIBRATION_ENABLED',
  SET_SOUND_ENABLED = 'SET_SOUND_ENABLED',
  SET_AUTO_RECONNECT = 'SET_AUTO_RECONNECT',
  SET_PREFERRED_DEVICE = 'SET_PREFERRED_DEVICE',
  SET_MOCK_MODE_ENABLED = 'SET_MOCK_MODE_ENABLED',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  
  // Reset actions
  RESET_CONNECTION_STATE = 'RESET_CONNECTION_STATE',
  RESET_UI_STATE = 'RESET_UI_STATE',
  RESET_ALL_STATE = 'RESET_ALL_STATE'
}

// Action interfaces
export interface SetConnectionStatusAction {
  type: AppActionType.SET_CONNECTION_STATUS;
  payload: ConnectionStatus;
}

export interface SetCurrentDeviceAction {
  type: AppActionType.SET_CURRENT_DEVICE;
  payload: RokuDevice | null;
}

export interface SetAvailableDevicesAction {
  type: AppActionType.SET_AVAILABLE_DEVICES;
  payload: RokuDevice[];
}

export interface AddAvailableDeviceAction {
  type: AppActionType.ADD_AVAILABLE_DEVICE;
  payload: RokuDevice;
}

export interface RemoveAvailableDeviceAction {
  type: AppActionType.REMOVE_AVAILABLE_DEVICE;
  payload: string; // device ID
}

export interface SetConnectionErrorAction {
  type: AppActionType.SET_CONNECTION_ERROR;
  payload: BLEError;
}

export interface ClearConnectionErrorAction {
  type: AppActionType.CLEAR_CONNECTION_ERROR;
}

export interface SetScanningAction {
  type: AppActionType.SET_SCANNING;
  payload: boolean;
}

export interface IncrementConnectionAttemptsAction {
  type: AppActionType.INCREMENT_CONNECTION_ATTEMPTS;
}

export interface ResetConnectionAttemptsAction {
  type: AppActionType.RESET_CONNECTION_ATTEMPTS;
}

export interface SetCurrentScreenAction {
  type: AppActionType.SET_CURRENT_SCREEN;
  payload: 'remote' | 'settings' | 'pairing';
}

export interface SetLoadingAction {
  type: AppActionType.SET_LOADING;
  payload: boolean;
}

export interface SetMockModeAction {
  type: AppActionType.SET_MOCK_MODE;
  payload: boolean;
}

export interface SetMockBannerAction {
  type: AppActionType.SET_MOCK_BANNER;
  payload: boolean;
}

export interface SetLoadingMessageAction {
  type: AppActionType.SET_LOADING_MESSAGE;
  payload: string | null;
}

export interface SetVibrationEnabledAction {
  type: AppActionType.SET_VIBRATION_ENABLED;
  payload: boolean;
}

export interface SetSoundEnabledAction {
  type: AppActionType.SET_SOUND_ENABLED;
  payload: boolean;
}

export interface SetAutoReconnectAction {
  type: AppActionType.SET_AUTO_RECONNECT;
  payload: boolean;
}

export interface SetPreferredDeviceAction {
  type: AppActionType.SET_PREFERRED_DEVICE;
  payload: string | null;
}

export interface SetMockModeEnabledAction {
  type: AppActionType.SET_MOCK_MODE_ENABLED;
  payload: boolean;
}

export interface UpdateSettingsAction {
  type: AppActionType.UPDATE_SETTINGS;
  payload: Partial<AppState['settings']>;
}

export interface ResetConnectionStateAction {
  type: AppActionType.RESET_CONNECTION_STATE;
}

export interface ResetUIStateAction {
  type: AppActionType.RESET_UI_STATE;
}

export interface ResetAllStateAction {
  type: AppActionType.RESET_ALL_STATE;
}

// Union type for all actions
export type AppAction =
  | SetConnectionStatusAction
  | SetCurrentDeviceAction
  | SetAvailableDevicesAction
  | AddAvailableDeviceAction
  | RemoveAvailableDeviceAction
  | SetConnectionErrorAction
  | ClearConnectionErrorAction
  | SetScanningAction
  | IncrementConnectionAttemptsAction
  | ResetConnectionAttemptsAction
  | SetCurrentScreenAction
  | SetLoadingAction
  | SetMockModeAction
  | SetMockBannerAction
  | SetLoadingMessageAction
  | SetVibrationEnabledAction
  | SetSoundEnabledAction
  | SetAutoReconnectAction
  | SetPreferredDeviceAction
  | SetMockModeEnabledAction
  | UpdateSettingsAction
  | ResetConnectionStateAction
  | ResetUIStateAction
  | ResetAllStateAction;

// Default state values
export const DEFAULT_APP_STATE: AppState = {
  connection: {
    isConnected: false,
    currentDevice: null,
    availableDevices: [],
    connectionStatus: ConnectionStatus.DISCONNECTED,
    lastError: null,
    isScanning: false,
    connectionAttempts: 0,
  },
  ui: {
    currentScreen: 'remote',
    isLoading: false,
    mockMode: false,
    showMockBanner: false,
    loadingMessage: null,
  },
  settings: {
    vibrationEnabled: true,
    soundEnabled: true,
    autoReconnect: true,
    preferredDeviceId: null,
    mockModeEnabled: false,
  },
};