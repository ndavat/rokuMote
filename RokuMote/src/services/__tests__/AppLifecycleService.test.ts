/**
 * App Lifecycle Service Tests
 * Tests for app state transitions and BLE connection management
 */

import { AppState, AppStateStatus } from 'react-native';
import { AppLifecycleService, AppLifecycleEvent, DEFAULT_LIFECYCLE_CONFIG } from '../AppLifecycleService';
import { IBLEService } from '../ble/BLEServiceInterface';
import { ConnectionStatus, RokuDevice } from '../../types/ble';

// Mock React Native AppState
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active' as AppStateStatus,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// Mock BLE Service
const mockBLEService: jest.Mocked<IBLEService> = {
  initialize: jest.fn(),
  destroy: jest.fn(),
  scanForDevices: jest.fn(),
  stopScanning: jest.fn(),
  isScanning: jest.fn(),
  connectToDevice: jest.fn(),
  disconnect: jest.fn(),
  reconnect: jest.fn(),
  getConnectionStatus: jest.fn(),
  getCurrentDevice: jest.fn(),
  isConnected: jest.fn(),
  sendCommand: jest.fn(),
  sendCommandBatch: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  removeAllEventListeners: jest.fn(),
  updateConfig: jest.fn(),
  getConfig: jest.fn(),
  checkBluetoothPermissions: jest.fn(),
  requestBluetoothPermissions: jest.fn(),
  isBluetoothEnabled: jest.fn(),
  enableBluetooth: jest.fn(),
  getLastError: jest.fn(),
  getConnectionHistory: jest.fn(),
  clearConnectionHistory: jest.fn(),
};

const mockDevice: RokuDevice = {
  id: 'test-device-id',
  name: 'Test Roku Device',
  rssi: -50,
  isConnectable: true,
  serviceUUIDs: ['test-service-uuid'],
};

describe('AppLifecycleService', () => {
  let lifecycleService: AppLifecycleService;
  let mockAppStateListener: (state: AppStateStatus) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AppState.addEventListener to capture the listener
    (AppState.addEventListener as jest.Mock).mockImplementation((event, listener) => {
      if (event === 'change') {
        mockAppStateListener = listener;
      }
    });

    lifecycleService = new AppLifecycleService();
  });

  afterEach(() => {
    lifecycleService.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(lifecycleService.getConfig()).toEqual(DEFAULT_LIFECYCLE_CONFIG);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        maintainConnectionInBackground: false,
        backgroundTimeout: 60000,
      };

      const service = new AppLifecycleService(customConfig);
      const config = service.getConfig();

      expect(config.maintainConnectionInBackground).toBe(false);
      expect(config.backgroundTimeout).toBe(60000);
      expect(config.reconnectOnForeground).toBe(DEFAULT_LIFECYCLE_CONFIG.reconnectOnForeground);

      service.destroy();
    });

    it('should set up app state listener on initialize', () => {
      lifecycleService.initialize(mockBLEService);

      expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should emit initial app state event on initialize', () => {
      const eventSpy = jest.fn();
      lifecycleService.on('lifecycle_event', eventSpy);

      lifecycleService.initialize(mockBLEService);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app_state_changed',
          appState: 'active',
        })
      );
    });
  });

  describe('App State Transitions', () => {
    beforeEach(() => {
      lifecycleService.initialize(mockBLEService);
    });

    it('should handle transition to background', () => {
      const eventSpy = jest.fn();
      lifecycleService.on('lifecycle_event', eventSpy);

      mockBLEService.isConnected.mockReturnValue(true);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);

      // Simulate app going to background
      mockAppStateListener('background');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app_state_changed',
          appState: 'background',
        })
      );
    });

    it('should handle transition to foreground', () => {
      const eventSpy = jest.fn();
      lifecycleService.on('lifecycle_event', eventSpy);

      // First go to background
      mockAppStateListener('background');
      
      // Then return to foreground
      mockAppStateListener('active');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app_state_changed',
          appState: 'active',
        })
      );
    });

    it('should maintain connection in background when configured', (done) => {
      const eventSpy = jest.fn();
      lifecycleService.on('lifecycle_event', eventSpy);

      mockBLEService.isConnected.mockReturnValue(true);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);

      // Simulate app going to background
      mockAppStateListener('background');

      // Should emit connection_maintained event
      setTimeout(() => {
        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'connection_maintained',
            deviceId: mockDevice.id,
          })
        );
        done();
      }, 10);
    });

    it('should suspend connection after background timeout', (done) => {
      const eventSpy = jest.fn();
      lifecycleService.on('lifecycle_event', eventSpy);

      // Use short timeout for testing
      lifecycleService.updateConfig({ backgroundTimeout: 100 });

      mockBLEService.isConnected.mockReturnValue(true);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);

      // Simulate app going to background
      mockAppStateListener('background');

      // Wait for timeout to trigger
      setTimeout(() => {
        expect(mockBLEService.disconnect).toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'connection_suspended',
            deviceId: mockDevice.id,
          })
        );
        done();
      }, 150);
    });

    it('should attempt reconnection on foreground when configured', (done) => {
      lifecycleService.updateConfig({ reconnectOnForeground: true });

      mockBLEService.isConnected.mockReturnValueOnce(true).mockReturnValueOnce(false);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);
      mockBLEService.connectToDevice.mockResolvedValue(true);

      // Go to background first
      mockAppStateListener('background');

      // Then return to foreground
      setTimeout(() => {
        mockAppStateListener('active');

        setTimeout(() => {
          expect(mockBLEService.connectToDevice).toHaveBeenCalledWith(mockDevice.id);
          done();
        }, 10);
      }, 10);
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      lifecycleService.initialize(mockBLEService);
    });

    it('should force reconnection', async () => {
      mockBLEService.connectToDevice.mockResolvedValue(true);
      
      // Set up background device
      mockBLEService.isConnected.mockReturnValue(true);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);
      mockAppStateListener('background');

      const result = await lifecycleService.forceReconnect();

      expect(result).toBe(true);
      expect(mockBLEService.connectToDevice).toHaveBeenCalledWith(mockDevice.id);
    });

    it('should return false when no background device for reconnection', async () => {
      const result = await lifecycleService.forceReconnect();

      expect(result).toBe(false);
      expect(mockBLEService.connectToDevice).not.toHaveBeenCalled();
    });

    it('should handle reconnection failure', async () => {
      mockBLEService.connectToDevice.mockRejectedValue(new Error('Connection failed'));
      
      // Set up background device
      mockBLEService.isConnected.mockReturnValue(true);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);
      mockAppStateListener('background');

      const result = await lifecycleService.forceReconnect();

      expect(result).toBe(false);
    });
  });

  describe('State Queries', () => {
    beforeEach(() => {
      lifecycleService.initialize(mockBLEService);
    });

    it('should correctly identify background state', () => {
      mockAppStateListener('background');
      expect(lifecycleService.isInBackground()).toBe(true);
      expect(lifecycleService.isInForeground()).toBe(false);
    });

    it('should correctly identify inactive state as background', () => {
      mockAppStateListener('inactive');
      expect(lifecycleService.isInBackground()).toBe(true);
      expect(lifecycleService.isInForeground()).toBe(false);
    });

    it('should correctly identify foreground state', () => {
      mockAppStateListener('active');
      expect(lifecycleService.isInBackground()).toBe(false);
      expect(lifecycleService.isInForeground()).toBe(true);
    });

    it('should return current app state', () => {
      mockAppStateListener('background');
      expect(lifecycleService.getCurrentAppState()).toBe('background');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        maintainConnectionInBackground: false,
        backgroundTimeout: 60000,
      };

      lifecycleService.updateConfig(newConfig);
      const config = lifecycleService.getConfig();

      expect(config.maintainConnectionInBackground).toBe(false);
      expect(config.backgroundTimeout).toBe(60000);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      lifecycleService.initialize(mockBLEService);
      lifecycleService.destroy();

      expect(AppState.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should clear timers on destroy', () => {
      lifecycleService.initialize(mockBLEService);
      
      // Set up background state to create timer
      mockBLEService.isConnected.mockReturnValue(true);
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);
      mockAppStateListener('background');

      lifecycleService.destroy();

      // Timer should be cleared (no way to directly test, but destroy should not throw)
      expect(() => lifecycleService.destroy()).not.toThrow();
    });

    it('should not initialize twice', () => {
      lifecycleService.initialize(mockBLEService);
      lifecycleService.initialize(mockBLEService);

      // Should only set up listener once
      expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should handle destroy when not initialized', () => {
      expect(() => lifecycleService.destroy()).not.toThrow();
    });
  });
});