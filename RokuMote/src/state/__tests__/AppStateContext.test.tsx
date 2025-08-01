/**
 * App State Context Tests
 * Tests for the React Context and hooks
 */

import React from 'react';
import { render, renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppStateProvider,
  useAppState,
  useAppStateValue,
  useAppDispatch,
  useAppActions,
  useAppSelector,
  selectors,
} from '../AppStateContext';
import { DEFAULT_APP_STATE } from '../types';
import { ConnectionStatus } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('AppStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('AppStateProvider', () => {
    it('should provide default state', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      expect(result.current.state).toEqual(DEFAULT_APP_STATE);
    });

    it('should provide dispatch function', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.dispatch).toBe('function');
    });

    it('should provide action creators', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      expect(result.current.actions).toBeDefined();
      expect(result.current.actions.connection).toBeDefined();
      expect(result.current.actions.ui).toBeDefined();
      expect(result.current.actions.settings).toBeDefined();
      expect(result.current.actions.reset).toBeDefined();
    });

    it('should accept initial state', () => {
      const initialState = {
        ui: {
          ...DEFAULT_APP_STATE.ui,
          currentScreen: 'settings' as const,
        },
      };

      const TestWrapperWithInitialState: React.FC<{ children: React.ReactNode }> = ({
        children,
      }) => <AppStateProvider initialState={initialState}>{children}</AppStateProvider>;

      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapperWithInitialState,
      });

      expect(result.current.state.ui.currentScreen).toBe('settings');
    });
  });

  describe('useAppState hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      try {
        renderHook(() => useAppState());
      } catch (error) {
        expect(error).toEqual(
          new Error('useAppState must be used within an AppStateProvider')
        );
      }

      console.error = originalError;
    });

    it('should allow state updates through dispatch', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.dispatch(
          result.current.actions.connection.setConnectionStatus(ConnectionStatus.CONNECTING)
        );
      });

      expect(result.current.state.connection.connectionStatus).toBe(ConnectionStatus.CONNECTING);
    });
  });

  describe('useAppStateValue hook', () => {
    it('should return only the state', () => {
      const { result } = renderHook(() => useAppStateValue(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toEqual(DEFAULT_APP_STATE);
    });
  });

  describe('useAppDispatch hook', () => {
    it('should return only the dispatch function', () => {
      const { result } = renderHook(() => useAppDispatch(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current).toBe('function');
    });
  });

  describe('useAppActions hook', () => {
    it('should return only the action creators', () => {
      const { result } = renderHook(() => useAppActions(), {
        wrapper: TestWrapper,
      });

      expect(result.current.connection).toBeDefined();
      expect(result.current.ui).toBeDefined();
      expect(result.current.settings).toBeDefined();
      expect(result.current.reset).toBeDefined();
    });
  });

  describe('useAppSelector hook', () => {
    it('should return selected state slice', () => {
      const { result } = renderHook(
        () => useAppSelector(state => state.connection.connectionStatus),
        {
          wrapper: TestWrapper,
        }
      );

      expect(result.current).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should update when selected state changes', () => {
      const { result } = renderHook(
        () => ({
          selector: useAppSelector(state => state.connection.connectionStatus),
          dispatch: useAppDispatch(),
          actions: useAppActions(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      act(() => {
        result.current.dispatch(
          result.current.actions.connection.setConnectionStatus(ConnectionStatus.CONNECTING)
        );
      });

      expect(result.current.selector).toBe(ConnectionStatus.CONNECTING);
    });
  });

  describe('Selectors', () => {
    it('should provide connection selectors', () => {
      const state = {
        ...DEFAULT_APP_STATE,
        connection: {
          ...DEFAULT_APP_STATE.connection,
          connectionStatus: ConnectionStatus.CONNECTED,
          isConnected: true,
          isScanning: false,
        },
      };

      expect(selectors.connectionStatus(state)).toBe(ConnectionStatus.CONNECTED);
      expect(selectors.isConnected(state)).toBe(true);
      expect(selectors.isScanning(state)).toBe(false);
    });

    it('should provide UI selectors', () => {
      const state = {
        ...DEFAULT_APP_STATE,
        ui: {
          ...DEFAULT_APP_STATE.ui,
          currentScreen: 'settings' as const,
          isLoading: true,
          mockMode: true,
        },
      };

      expect(selectors.currentScreen(state)).toBe('settings');
      expect(selectors.isLoading(state)).toBe(true);
      expect(selectors.mockMode(state)).toBe(true);
    });

    it('should provide settings selectors', () => {
      const state = {
        ...DEFAULT_APP_STATE,
        settings: {
          ...DEFAULT_APP_STATE.settings,
          vibrationEnabled: false,
          soundEnabled: false,
          autoReconnect: false,
        },
      };

      expect(selectors.vibrationEnabled(state)).toBe(false);
      expect(selectors.soundEnabled(state)).toBe(false);
      expect(selectors.autoReconnect(state)).toBe(false);
    });
  });

  describe('Persistence Integration', () => {
    it('should load persisted settings on mount', async () => {
      const mockSettings = {
        vibrationEnabled: false,
        soundEnabled: false,
        autoReconnect: false,
        preferredDeviceId: 'device-123',
        mockModeEnabled: true,
      };

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@RokuMote:settings') {
          return Promise.resolve(JSON.stringify(mockSettings));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Wait for async loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.state.settings.vibrationEnabled).toBe(false);
      expect(result.current.state.settings.mockModeEnabled).toBe(true);
      expect(result.current.state.ui.mockMode).toBe(true);
    });

    it('should handle persistence loading errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Wait for async loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still have default state
      expect(result.current.state).toEqual(DEFAULT_APP_STATE);
    });
  });
});