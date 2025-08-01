/**
 * App State Context
 * Provides global state management using React Context and useReducer
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction, DEFAULT_APP_STATE } from './types';
import { appReducer } from './reducer';
import { actions } from './actions';
import {
  loadSettings,
  saveSettings,
  extractPersistedSettings,
  loadConnectionPreferences,
  saveConnectionPreferences,
  extractConnectionPreferences,
} from './persistence';

// Context interface
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: typeof actions;
}

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider props
interface AppStateProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

/**
 * App State Provider Component
 * Wraps the app with global state management
 */
export function AppStateProvider({ children, initialState }: AppStateProviderProps) {
  // Initialize state with defaults and any provided initial state
  const [state, dispatch] = useReducer(
    appReducer,
    initialState ? { ...DEFAULT_APP_STATE, ...initialState } : DEFAULT_APP_STATE
  );

  // Load persisted settings on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Load user settings
        const persistedSettings = await loadSettings();
        if (persistedSettings) {
          dispatch(actions.settings.updateSettings(persistedSettings));
          
          // Apply mock mode if it was enabled
          if (persistedSettings.mockModeEnabled) {
            dispatch(actions.ui.setMockMode(true));
          }
        }

        // Load connection preferences
        const connectionPreferences = await loadConnectionPreferences();
        if (connectionPreferences) {
          dispatch(actions.settings.setAutoReconnect(connectionPreferences.autoReconnect));
          dispatch(actions.settings.setPreferredDevice(connectionPreferences.preferredDeviceId));
        }
      } catch (error) {
        console.error('Failed to load persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    const saveCurrentSettings = async () => {
      try {
        const settingsToSave = extractPersistedSettings(state);
        await saveSettings(settingsToSave);
        
        const connectionPreferences = extractConnectionPreferences(state);
        await saveConnectionPreferences(connectionPreferences);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    // Only save if we're not in the initial state (to avoid saving defaults immediately)
    if (state !== DEFAULT_APP_STATE) {
      saveCurrentSettings();
    }
  }, [state.settings]);

  // Context value
  const contextValue: AppStateContextType = {
    state,
    dispatch,
    actions,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * Hook to use app state context
 * Provides access to global state and actions
 */
export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

/**
 * Hook to use only the state (read-only)
 */
export function useAppStateValue(): AppState {
  const { state } = useAppState();
  return state;
}

/**
 * Hook to use only the dispatch function
 */
export function useAppDispatch(): React.Dispatch<AppAction> {
  const { dispatch } = useAppState();
  return dispatch;
}

/**
 * Hook to use only the action creators
 */
export function useAppActions(): typeof actions {
  const { actions: appActions } = useAppState();
  return appActions;
}

/**
 * Selector hook for specific state slices
 * Helps prevent unnecessary re-renders
 */
export function useAppSelector<T>(selector: (state: AppState) => T): T {
  const { state } = useAppState();
  return selector(state);
}

// Convenience selectors
export const selectors = {
  // Connection selectors
  connectionStatus: (state: AppState) => state.connection.connectionStatus,
  currentDevice: (state: AppState) => state.connection.currentDevice,
  availableDevices: (state: AppState) => state.connection.availableDevices,
  isConnected: (state: AppState) => state.connection.isConnected,
  isScanning: (state: AppState) => state.connection.isScanning,
  connectionError: (state: AppState) => state.connection.lastError,
  connectionAttempts: (state: AppState) => state.connection.connectionAttempts,

  // UI selectors
  currentScreen: (state: AppState) => state.ui.currentScreen,
  isLoading: (state: AppState) => state.ui.isLoading,
  mockMode: (state: AppState) => state.ui.mockMode,
  showMockBanner: (state: AppState) => state.ui.showMockBanner,
  loadingMessage: (state: AppState) => state.ui.loadingMessage,

  // Settings selectors
  vibrationEnabled: (state: AppState) => state.settings.vibrationEnabled,
  soundEnabled: (state: AppState) => state.settings.soundEnabled,
  autoReconnect: (state: AppState) => state.settings.autoReconnect,
  preferredDeviceId: (state: AppState) => state.settings.preferredDeviceId,
  mockModeEnabled: (state: AppState) => state.settings.mockModeEnabled,
};