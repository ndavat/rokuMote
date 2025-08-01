/**
 * State Persistence Utilities
 * Handles saving and loading user preferences to/from AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from './types';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: '@RokuMote:settings',
  PREFERRED_DEVICE: '@RokuMote:preferredDevice',
  CONNECTION_PREFERENCES: '@RokuMote:connectionPreferences',
} as const;

// Settings that should be persisted
export interface PersistedSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  autoReconnect: boolean;
  preferredDeviceId: string | null;
  mockModeEnabled: boolean;
}

// Connection preferences that should be persisted
export interface PersistedConnectionPreferences {
  autoReconnect: boolean;
  preferredDeviceId: string | null;
  connectionTimeout: number;
  maxRetries: number;
}

/**
 * Save user settings to AsyncStorage
 */
export async function saveSettings(settings: PersistedSettings): Promise<void> {
  try {
    const settingsJson = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, settingsJson);
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save user settings');
  }
}

/**
 * Load user settings from AsyncStorage
 */
export async function loadSettings(): Promise<PersistedSettings | null> {
  try {
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsJson) {
      return JSON.parse(settingsJson) as PersistedSettings;
    }
    return null;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

/**
 * Save preferred device ID
 */
export async function savePreferredDevice(deviceId: string | null): Promise<void> {
  try {
    if (deviceId) {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_DEVICE, deviceId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.PREFERRED_DEVICE);
    }
  } catch (error) {
    console.error('Failed to save preferred device:', error);
    throw new Error('Failed to save preferred device');
  }
}

/**
 * Load preferred device ID
 */
export async function loadPreferredDevice(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_DEVICE);
  } catch (error) {
    console.error('Failed to load preferred device:', error);
    return null;
  }
}

/**
 * Save connection preferences
 */
export async function saveConnectionPreferences(
  preferences: PersistedConnectionPreferences
): Promise<void> {
  try {
    const preferencesJson = JSON.stringify(preferences);
    await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_PREFERENCES, preferencesJson);
  } catch (error) {
    console.error('Failed to save connection preferences:', error);
    throw new Error('Failed to save connection preferences');
  }
}

/**
 * Load connection preferences
 */
export async function loadConnectionPreferences(): Promise<PersistedConnectionPreferences | null> {
  try {
    const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION_PREFERENCES);
    if (preferencesJson) {
      return JSON.parse(preferencesJson) as PersistedConnectionPreferences;
    }
    return null;
  } catch (error) {
    console.error('Failed to load connection preferences:', error);
    return null;
  }
}

/**
 * Clear all persisted data
 */
export async function clearPersistedData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.PREFERRED_DEVICE,
      STORAGE_KEYS.CONNECTION_PREFERENCES,
    ]);
  } catch (error) {
    console.error('Failed to clear persisted data:', error);
    throw new Error('Failed to clear persisted data');
  }
}

/**
 * Get all storage keys for debugging
 */
export async function getAllStorageKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Failed to get storage keys:', error);
    return [];
  }
}

/**
 * Extract persistable settings from app state
 */
export function extractPersistedSettings(state: AppState): PersistedSettings {
  return {
    vibrationEnabled: state.settings.vibrationEnabled,
    soundEnabled: state.settings.soundEnabled,
    autoReconnect: state.settings.autoReconnect,
    preferredDeviceId: state.settings.preferredDeviceId,
    mockModeEnabled: state.settings.mockModeEnabled,
  };
}

/**
 * Extract persistable connection preferences from app state
 */
export function extractConnectionPreferences(state: AppState): PersistedConnectionPreferences {
  return {
    autoReconnect: state.settings.autoReconnect,
    preferredDeviceId: state.settings.preferredDeviceId,
    connectionTimeout: 15000, // Default value
    maxRetries: 3, // Default value
  };
}