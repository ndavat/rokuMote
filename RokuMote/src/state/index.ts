/**
 * State Management Module
 * Exports all state management utilities and components
 */

// Main context and provider
export {
  AppStateProvider,
  useAppState,
  useAppStateValue,
  useAppDispatch,
  useAppActions,
  useAppSelector,
  selectors,
} from './AppStateContext';

// Types
export type {
  AppState,
  AppAction,
} from './types';

export {
  AppActionType,
  DEFAULT_APP_STATE,
} from './types';

// Reducer
export { appReducer } from './reducer';

// Action creators
export { actions } from './actions';

// Persistence utilities
export {
  saveSettings,
  loadSettings,
  savePreferredDevice,
  loadPreferredDevice,
  saveConnectionPreferences,
  loadConnectionPreferences,
  clearPersistedData,
  extractPersistedSettings,
  extractConnectionPreferences,
} from './persistence';

export type {
  PersistedSettings,
  PersistedConnectionPreferences,
} from './persistence';