/**
 * State Persistence Tests
 * Tests for AsyncStorage persistence utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveSettings,
  loadSettings,
  savePreferredDevice,
  loadPreferredDevice,
  saveConnectionPreferences,
  loadConnectionPreferences,
  clearPersistedData,
  extractPersistedSettings,
  extractConnectionPreferences,
  PersistedSettings,
  PersistedConnectionPreferences,
} from '../persistence';
import { DEFAULT_APP_STATE } from '../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('State Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings Persistence', () => {
    const mockSettings: PersistedSettings = {
      vibrationEnabled: false,
      soundEnabled: false,
      autoReconnect: false,
      preferredDeviceId: 'device-123',
      mockModeEnabled: true,
    };

    it('should save settings to AsyncStorage', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await saveSettings(mockSettings);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@RokuMote:settings',
        JSON.stringify(mockSettings)
      );
    });

    it('should load settings from AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSettings));

      const result = await loadSettings();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@RokuMote:settings');
      expect(result).toEqual(mockSettings);
    });

    it('should return null when no settings exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await loadSettings();

      expect(result).toBe(null);
    });

    it('should handle save settings error', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(saveSettings(mockSettings)).rejects.toThrow('Failed to save user settings');
    });

    it('should handle load settings error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await loadSettings();

      expect(result).toBe(null);
    });
  });

  describe('Preferred Device Persistence', () => {
    it('should save preferred device ID', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await savePreferredDevice('device-123');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@RokuMote:preferredDevice',
        'device-123'
      );
    });

    it('should remove preferred device when null', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await savePreferredDevice(null);

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RokuMote:preferredDevice');
    });

    it('should load preferred device ID', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('device-123');

      const result = await loadPreferredDevice();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@RokuMote:preferredDevice');
      expect(result).toBe('device-123');
    });

    it('should return null when no preferred device exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await loadPreferredDevice();

      expect(result).toBe(null);
    });

    it('should handle save preferred device error', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(savePreferredDevice('device-123')).rejects.toThrow(
        'Failed to save preferred device'
      );
    });

    it('should handle load preferred device error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await loadPreferredDevice();

      expect(result).toBe(null);
    });
  });

  describe('Connection Preferences Persistence', () => {
    const mockPreferences: PersistedConnectionPreferences = {
      autoReconnect: false,
      preferredDeviceId: 'device-123',
      connectionTimeout: 20000,
      maxRetries: 5,
    };

    it('should save connection preferences', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await saveConnectionPreferences(mockPreferences);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@RokuMote:connectionPreferences',
        JSON.stringify(mockPreferences)
      );
    });

    it('should load connection preferences', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockPreferences));

      const result = await loadConnectionPreferences();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@RokuMote:connectionPreferences');
      expect(result).toEqual(mockPreferences);
    });

    it('should return null when no connection preferences exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await loadConnectionPreferences();

      expect(result).toBe(null);
    });

    it('should handle save connection preferences error', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(saveConnectionPreferences(mockPreferences)).rejects.toThrow(
        'Failed to save connection preferences'
      );
    });

    it('should handle load connection preferences error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await loadConnectionPreferences();

      expect(result).toBe(null);
    });
  });

  describe('Clear Persisted Data', () => {
    it('should clear all persisted data', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();

      await clearPersistedData();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@RokuMote:settings',
        '@RokuMote:preferredDevice',
        '@RokuMote:connectionPreferences',
      ]);
    });

    it('should handle clear data error', async () => {
      mockAsyncStorage.multiRemove.mockRejectedValue(new Error('Storage error'));

      await expect(clearPersistedData()).rejects.toThrow('Failed to clear persisted data');
    });
  });

  describe('State Extraction Utilities', () => {
    it('should extract persisted settings from app state', () => {
      const mockAppState = {
        ...DEFAULT_APP_STATE,
        settings: {
          vibrationEnabled: false,
          soundEnabled: false,
          autoReconnect: false,
          preferredDeviceId: 'device-123',
          mockModeEnabled: true,
        },
      };

      const result = extractPersistedSettings(mockAppState);

      expect(result).toEqual({
        vibrationEnabled: false,
        soundEnabled: false,
        autoReconnect: false,
        preferredDeviceId: 'device-123',
        mockModeEnabled: true,
      });
    });

    it('should extract connection preferences from app state', () => {
      const mockAppState = {
        ...DEFAULT_APP_STATE,
        settings: {
          ...DEFAULT_APP_STATE.settings,
          autoReconnect: false,
          preferredDeviceId: 'device-123',
        },
      };

      const result = extractConnectionPreferences(mockAppState);

      expect(result).toEqual({
        autoReconnect: false,
        preferredDeviceId: 'device-123',
        connectionTimeout: 15000,
        maxRetries: 3,
      });
    });
  });
});