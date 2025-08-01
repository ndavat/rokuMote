/**
 * App State Reducer
 * Handles all state updates for the RokuMote application
 */

import { ConnectionStatus } from '../types';
import { AppState, AppAction, AppActionType, DEFAULT_APP_STATE } from './types';

/**
 * Main app state reducer
 * Handles all state transitions based on dispatched actions
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Connection actions
    case AppActionType.SET_CONNECTION_STATUS:
      return {
        ...state,
        connection: {
          ...state.connection,
          connectionStatus: action.payload,
          isConnected: action.payload === ConnectionStatus.CONNECTED,
        },
      };

    case AppActionType.SET_CURRENT_DEVICE:
      return {
        ...state,
        connection: {
          ...state.connection,
          currentDevice: action.payload,
          isConnected: action.payload !== null,
          connectionStatus: action.payload 
            ? ConnectionStatus.CONNECTED 
            : ConnectionStatus.DISCONNECTED,
        },
      };

    case AppActionType.SET_AVAILABLE_DEVICES:
      return {
        ...state,
        connection: {
          ...state.connection,
          availableDevices: action.payload,
        },
      };

    case AppActionType.ADD_AVAILABLE_DEVICE:
      // Avoid duplicates by checking if device already exists
      const existingDeviceIndex = state.connection.availableDevices.findIndex(
        device => device.id === action.payload.id
      );
      
      if (existingDeviceIndex >= 0) {
        // Update existing device
        const updatedDevices = [...state.connection.availableDevices];
        updatedDevices[existingDeviceIndex] = action.payload;
        return {
          ...state,
          connection: {
            ...state.connection,
            availableDevices: updatedDevices,
          },
        };
      } else {
        // Add new device
        return {
          ...state,
          connection: {
            ...state.connection,
            availableDevices: [...state.connection.availableDevices, action.payload],
          },
        };
      }

    case AppActionType.REMOVE_AVAILABLE_DEVICE:
      return {
        ...state,
        connection: {
          ...state.connection,
          availableDevices: state.connection.availableDevices.filter(
            device => device.id !== action.payload
          ),
        },
      };

    case AppActionType.SET_CONNECTION_ERROR:
      return {
        ...state,
        connection: {
          ...state.connection,
          lastError: action.payload,
          connectionStatus: ConnectionStatus.ERROR,
        },
      };

    case AppActionType.CLEAR_CONNECTION_ERROR:
      return {
        ...state,
        connection: {
          ...state.connection,
          lastError: null,
        },
      };

    case AppActionType.SET_SCANNING:
      return {
        ...state,
        connection: {
          ...state.connection,
          isScanning: action.payload,
          connectionStatus: action.payload 
            ? ConnectionStatus.SCANNING 
            : state.connection.connectionStatus,
        },
      };

    case AppActionType.INCREMENT_CONNECTION_ATTEMPTS:
      return {
        ...state,
        connection: {
          ...state.connection,
          connectionAttempts: state.connection.connectionAttempts + 1,
        },
      };

    case AppActionType.RESET_CONNECTION_ATTEMPTS:
      return {
        ...state,
        connection: {
          ...state.connection,
          connectionAttempts: 0,
        },
      };

    // UI actions
    case AppActionType.SET_CURRENT_SCREEN:
      return {
        ...state,
        ui: {
          ...state.ui,
          currentScreen: action.payload,
        },
      };

    case AppActionType.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload,
        },
      };

    case AppActionType.SET_MOCK_MODE:
      return {
        ...state,
        ui: {
          ...state.ui,
          mockMode: action.payload,
          showMockBanner: action.payload,
        },
        settings: {
          ...state.settings,
          mockModeEnabled: action.payload,
        },
      };

    case AppActionType.SET_MOCK_BANNER:
      return {
        ...state,
        ui: {
          ...state.ui,
          showMockBanner: action.payload,
        },
      };

    case AppActionType.SET_LOADING_MESSAGE:
      return {
        ...state,
        ui: {
          ...state.ui,
          loadingMessage: action.payload,
        },
      };

    // Settings actions
    case AppActionType.SET_VIBRATION_ENABLED:
      return {
        ...state,
        settings: {
          ...state.settings,
          vibrationEnabled: action.payload,
        },
      };

    case AppActionType.SET_SOUND_ENABLED:
      return {
        ...state,
        settings: {
          ...state.settings,
          soundEnabled: action.payload,
        },
      };

    case AppActionType.SET_AUTO_RECONNECT:
      return {
        ...state,
        settings: {
          ...state.settings,
          autoReconnect: action.payload,
        },
      };

    case AppActionType.SET_PREFERRED_DEVICE:
      return {
        ...state,
        settings: {
          ...state.settings,
          preferredDeviceId: action.payload,
        },
      };

    case AppActionType.SET_MOCK_MODE_ENABLED:
      return {
        ...state,
        settings: {
          ...state.settings,
          mockModeEnabled: action.payload,
        },
        ui: {
          ...state.ui,
          mockMode: action.payload,
          showMockBanner: action.payload,
        },
      };

    case AppActionType.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    // Reset actions
    case AppActionType.RESET_CONNECTION_STATE:
      return {
        ...state,
        connection: DEFAULT_APP_STATE.connection,
      };

    case AppActionType.RESET_UI_STATE:
      return {
        ...state,
        ui: DEFAULT_APP_STATE.ui,
      };

    case AppActionType.RESET_ALL_STATE:
      return DEFAULT_APP_STATE;

    default:
      return state;
  }
}