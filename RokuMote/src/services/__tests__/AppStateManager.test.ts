/**
 * App State Manager Tests
 * Tests for coordinated app lifecycle and deep linking management
 */

import { AppStateManager } from '../AppStateManager';
import { AppLifecycleService } from '../AppLifecycleService';
import { DeepLinkingService } from '../DeepLinkingService';
import { IBLEService } from '../ble/BLEServiceInterface';
import { RemoteCommand, RokuDevice } from '../../types/ble';

// Mock the services
jest.mock('../AppLifecycleService');
jest.mock('../DeepLinkingService');

const MockAppLifecycleService = AppLifecycleService as jest.MockedClass<typeof AppLifecycleService>;
const MockDeepLinkingService = DeepLinkingService as jest.MockedClass<typeof DeepLinkingService>;

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

describe('AppStateManager', () => {
  let appStateManager: AppStateManager;
  let mockLifecycleService: jest.Mocked<AppLifecycleService>;
  let mockDeepLinkingService: jest.Mocked<DeepLinkingService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockLifecycleService = {
      initialize: jest.fn(),
      destroy: jest.fn(),
      updateConfig: jest.fn(),
      getConfig: jest.fn(),
      getCurrentAppState: jest.fn(),
      isInBackground: jest.fn(),
      isInForeground: jest.fn(),
      forceReconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
    } as any;

    mockDeepLinkingService = {
      initialize: jest.fn(),
      destroy: jest.fn(),
      updateConfig: jest.fn(),
      getConfig: jest.fn(),
      parseDeepLink: jest.fn(),
      createDeepLink: jest.fn(),
      createRemoteLink: jest.fn(),
      createSettingsLink: jest.fn(),
      createConnectLink: jest.fn(),
      createCommandLink: jest.fn(),
      createNavigationLink: jest.fn(),
      canHandleURL: jest.fn(),
      openURL: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
    } as any;

    MockAppLifecycleService.mockImplementation(() => mockLifecycleService);
    MockDeepLinkingService.mockImplementation(() => mockDeepLinkingService);

    appStateManager = new AppStateManager();
  });

  afterEach(() => {
    appStateManager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize both services', async () => {
      await appStateManager.initialize(mockBLEService);

      expect(mockLifecycleService.initialize).toHaveBeenCalledWith(mockBLEService);
      expect(mockDeepLinkingService.initialize).toHaveBeenCalled();
    });

    it('should set up event listeners', async () => {
      await appStateManager.initialize(mockBLEService);

      expect(mockLifecycleService.on).toHaveBeenCalledWith('lifecycle_event', expect.any(Function));
      expect(mockDeepLinkingService.on).toHaveBeenCalledWith('deep_link', expect.any(Function));
      expect(mockDeepLinkingService.on).toHaveBeenCalledWith('command_requested', expect.any(Function));
      expect(mockDeepLinkingService.on).toHaveBeenCalledWith('navigation_requested', expect.any(Function));
      expect(mockDeepLinkingService.on).toHaveBeenCalledWith('connect_requested', expect.any(Function));
      expect(mockDeepLinkingService.on).toHaveBeenCalledWith('remote_requested', expect.any(Function));
      expect(mockDeepLinkingService.on).toHaveBeenCalledWith('settings_requested', expect.any(Function));
    });

    it('should handle initialization error', async () => {
      mockDeepLinkingService.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(appStateManager.initialize(mockBLEService)).rejects.toThrow('Init failed');
    });

    it('should not initialize twice', async () => {
      await appStateManager.initialize(mockBLEService);
      await appStateManager.initialize(mockBLEService);

      expect(mockLifecycleService.initialize).toHaveBeenCalledTimes(1);
      expect(mockDeepLinkingService.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service Access', () => {
    it('should provide access to lifecycle service', () => {
      const service = appStateManager.getLifecycleService();
      expect(service).toBe(mockLifecycleService);
    });

    it('should provide access to deep linking service', () => {
      const service = appStateManager.getDeepLinkingService();
      expect(service).toBe(mockDeepLinkingService);
    });
  });

  describe('Configuration Updates', () => {
    it('should update lifecycle configuration', () => {
      const config = { maintainConnectionInBackground: false };
      appStateManager.updateLifecycleConfig(config);

      expect(mockLifecycleService.updateConfig).toHaveBeenCalledWith(config);
    });

    it('should update deep linking configuration', () => {
      const config = { enableCommandLinks: false };
      appStateManager.updateDeepLinkingConfig(config);

      expect(mockDeepLinkingService.updateConfig).toHaveBeenCalledWith(config);
    });
  });

  describe('Deep Link Navigation Handling', () => {
    beforeEach(async () => {
      await appStateManager.initialize(mockBLEService);
    });

    it('should handle remote access deep link', async () => {
      const parsedLink = {
        action: 'remote' as const,
        params: { deviceId: 'test123' },
        isValid: true,
      };

      mockBLEService.connectToDevice.mockResolvedValue(true);

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(true);
      expect(mockBLEService.connectToDevice).toHaveBeenCalledWith('test123');
    });

    it('should handle settings navigation deep link', async () => {
      const parsedLink = {
        action: 'settings' as const,
        params: { section: 'bluetooth' },
        isValid: true,
      };

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(true);
    });

    it('should handle device connection deep link', async () => {
      const parsedLink = {
        action: 'connect' as const,
        params: { deviceId: 'test123', deviceName: 'Test Device' },
        isValid: true,
      };

      mockBLEService.connectToDevice.mockResolvedValue(true);

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(true);
      expect(mockBLEService.connectToDevice).toHaveBeenCalledWith('test123');
    });

    it('should handle command execution deep link', async () => {
      const parsedLink = {
        action: 'command' as const,
        params: { type: 'navigation', action: 'up', payload: { test: 'value' } },
        isValid: true,
      };

      mockBLEService.sendCommand.mockResolvedValue({ success: true } as any);

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(true);
      expect(mockBLEService.sendCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigation',
          action: 'up',
          payload: { test: 'value' },
        })
      );
    });

    it('should handle screen navigation deep link', async () => {
      const parsedLink = {
        action: 'navigate' as const,
        params: { screen: 'settings', tab: 'bluetooth' },
        isValid: true,
      };

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(true);
    });

    it('should reject invalid deep link', async () => {
      const parsedLink = {
        action: 'remote' as const,
        params: {},
        isValid: false,
        error: 'Invalid link',
      };

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(false);
    });

    it('should handle unknown action', async () => {
      const parsedLink = {
        action: 'unknown' as any,
        params: {},
        isValid: true,
      };

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(false);
    });

    it('should handle connection failure', async () => {
      const parsedLink = {
        action: 'connect' as const,
        params: { deviceId: 'test123' },
        isValid: true,
      };

      mockBLEService.connectToDevice.mockRejectedValue(new Error('Connection failed'));

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(false);
    });

    it('should handle command execution failure', async () => {
      const parsedLink = {
        action: 'command' as const,
        params: { type: 'navigation', action: 'up' },
        isValid: true,
      };

      mockBLEService.sendCommand.mockRejectedValue(new Error('Command failed'));

      const result = await appStateManager.handleDeepLinkNavigation(parsedLink);

      expect(result).toBe(false);
    });
  });

  describe('State Link Creation', () => {
    beforeEach(async () => {
      await appStateManager.initialize(mockBLEService);
    });

    it('should create link for current state with device', () => {
      mockBLEService.getCurrentDevice.mockReturnValue(mockDevice);
      mockDeepLinkingService.createRemoteLink.mockReturnValue('rokumote://remote?deviceId=test-device-id');

      const link = appStateManager.createCurrentStateLink();

      expect(link).toBe('rokumote://remote?deviceId=test-device-id');
      expect(mockDeepLinkingService.createRemoteLink).toHaveBeenCalledWith('test-device-id');
    });

    it('should create link for current state without device', () => {
      mockBLEService.getCurrentDevice.mockReturnValue(null);
      mockDeepLinkingService.createRemoteLink.mockReturnValue('rokumote://remote');

      const link = appStateManager.createCurrentStateLink();

      expect(link).toBe('rokumote://remote');
      expect(mockDeepLinkingService.createRemoteLink).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Lifecycle Delegation', () => {
    beforeEach(async () => {
      await appStateManager.initialize(mockBLEService);
    });

    it('should delegate force reconnect to lifecycle service', async () => {
      mockLifecycleService.forceReconnect.mockResolvedValue(true);

      const result = await appStateManager.forceReconnect();

      expect(result).toBe(true);
      expect(mockLifecycleService.forceReconnect).toHaveBeenCalled();
    });

    it('should delegate background state check to lifecycle service', () => {
      mockLifecycleService.isInBackground.mockReturnValue(true);

      const result = appStateManager.isInBackground();

      expect(result).toBe(true);
      expect(mockLifecycleService.isInBackground).toHaveBeenCalled();
    });

    it('should delegate foreground state check to lifecycle service', () => {
      mockLifecycleService.isInForeground.mockReturnValue(true);

      const result = appStateManager.isInForeground();

      expect(result).toBe(true);
      expect(mockLifecycleService.isInForeground).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await appStateManager.initialize(mockBLEService);
    });

    it('should emit app state events for lifecycle events', () => {
      const eventSpy = jest.fn();
      appStateManager.on('app_state_event', eventSpy);

      // Simulate lifecycle event
      const lifecycleEventHandler = mockLifecycleService.on.mock.calls.find(
        call => call[0] === 'lifecycle_event'
      )?.[1];

      const lifecycleEvent = {
        type: 'app_state_changed',
        appState: 'background',
        timestamp: Date.now(),
      };

      lifecycleEventHandler?.(lifecycleEvent);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'lifecycle_event',
        data: lifecycleEvent,
        timestamp: expect.any(Number),
      });
    });

    it('should emit app state events for deep link events', () => {
      const eventSpy = jest.fn();
      appStateManager.on('app_state_event', eventSpy);

      // Simulate deep link event
      const deepLinkEventHandler = mockDeepLinkingService.on.mock.calls.find(
        call => call[0] === 'deep_link'
      )?.[1];

      const deepLinkEvent = {
        type: 'link_received',
        url: 'rokumote://remote',
        params: {},
        timestamp: Date.now(),
      };

      deepLinkEventHandler?.(deepLinkEvent);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'deep_link_event',
        data: deepLinkEvent,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Cleanup', () => {
    it('should destroy both services', async () => {
      await appStateManager.initialize(mockBLEService);
      appStateManager.destroy();

      expect(mockLifecycleService.destroy).toHaveBeenCalled();
      expect(mockDeepLinkingService.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when not initialized', () => {
      expect(() => appStateManager.destroy()).not.toThrow();
    });
  });
});