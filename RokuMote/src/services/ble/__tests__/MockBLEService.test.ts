/**
 * MockBLEService Unit Tests
 * Comprehensive tests for mock BLE service functionality
 */

import { MockBLEService } from '../MockBLEService';
import {
  ConnectionStatus,
  ConnectionEventType,
  BLEErrorType,
  RemoteCommandType,
  NavigationAction,
  MediaAction,
  VolumeAction,
  UtilityAction,
  RokuDevice,
  RemoteCommand,
  ConnectionEvent,
  BLEServiceConfig
} from '../../../types/ble';

describe('MockBLEService', () => {
  let mockService: MockBLEService;
  let eventListener: jest.Mock;

  beforeEach(() => {
    mockService = new MockBLEService();
    // Reset failure rates to ensure predictable test behavior
    mockService.setConnectionFailureRate(0);
    mockService.setCommandFailureRate(0);
    mockService.simulateConnectionFailure(false);
    mockService.simulateCommandFailure(false);
    eventListener = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await mockService.destroy();
  });

  describe('Service Lifecycle', () => {
    test('should initialize with disconnected status', async () => {
      await mockService.initialize();
      expect(mockService.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    test('should emit connection state changed event on initialization', async () => {
      mockService.addEventListener(eventListener);
      await mockService.initialize();
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.CONNECTION_STATE_CHANGED,
          status: ConnectionStatus.DISCONNECTED
        })
      );
    });

    test('should clean up resources on destroy', async () => {
      mockService.addEventListener(eventListener);
      await mockService.initialize();
      await mockService.destroy();
      
      expect(mockService.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      expect(mockService.getCurrentDevice()).toBeNull();
    });
  });

  describe('Device Scanning', () => {
    test('should discover mock Roku devices', async () => {
      const devices = await mockService.scanForDevices();
      
      expect(devices).toHaveLength(5); // Default mock devices
      expect(devices[0]).toMatchObject({
        name: 'Bedroom Roku',
        rssi: -45,
        isConnectable: true
      });
    });

    test('should emit device discovered events during scanning', async () => {
      mockService.addEventListener(eventListener);
      
      await mockService.scanForDevices();
      
      const deviceDiscoveredEvents = eventListener.mock.calls
        .map(call => call[0])
        .filter(event => event.type === ConnectionEventType.DEVICE_DISCOVERED);
      
      expect(deviceDiscoveredEvents).toHaveLength(5);
      expect(deviceDiscoveredEvents[0]).toMatchObject({
        type: ConnectionEventType.DEVICE_DISCOVERED,
        device: expect.objectContaining({
          name: 'Bedroom Roku'
        })
      });
    });

    test('should set scanning status during device discovery', async () => {
      expect(mockService.isScanning()).toBe(false);
      
      const scanPromise = mockService.scanForDevices();
      expect(mockService.isScanning()).toBe(true);
      
      await scanPromise;
      expect(mockService.isScanning()).toBe(false);
    });

    test('should stop scanning when requested', async () => {
      const scanPromise = mockService.scanForDevices();
      expect(mockService.isScanning()).toBe(true);
      
      await mockService.stopScanning();
      expect(mockService.isScanning()).toBe(false);
      
      await scanPromise; // Wait for scan to complete
    });

    test('should track scan statistics', async () => {
      const initialStats = mockService.getMockStats();
      expect(initialStats.scanCount).toBe(0);
      
      await mockService.scanForDevices();
      
      const updatedStats = mockService.getMockStats();
      expect(updatedStats.scanCount).toBe(1);
    });
  });

  describe('Device Connection', () => {
    let testDevice: RokuDevice;

    beforeEach(async () => {
      const devices = await mockService.scanForDevices();
      testDevice = devices[0];
    });

    test('should successfully connect to a discovered device', async () => {
      const connected = await mockService.connectToDevice(testDevice.id);
      
      expect(connected).toBe(true);
      expect(mockService.isConnected()).toBe(true);
      expect(mockService.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED);
      expect(mockService.getCurrentDevice()).toEqual(testDevice);
    });

    test('should emit device connected event on successful connection', async () => {
      mockService.addEventListener(eventListener);
      
      await mockService.connectToDevice(testDevice.id);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.DEVICE_CONNECTED,
          device: testDevice
        })
      );
    });

    test('should fail to connect to non-existent device', async () => {
      const connected = await mockService.connectToDevice('non-existent-id');
      
      expect(connected).toBe(false);
      expect(mockService.isConnected()).toBe(false);
      expect(mockService.getConnectionStatus()).toBe(ConnectionStatus.ERROR);
    });

    test('should disconnect from current device', async () => {
      await mockService.connectToDevice(testDevice.id);
      expect(mockService.isConnected()).toBe(true);
      
      mockService.addEventListener(eventListener);
      await mockService.disconnect();
      
      expect(mockService.isConnected()).toBe(false);
      expect(mockService.getCurrentDevice()).toBeNull();
      expect(mockService.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.DEVICE_DISCONNECTED,
          device: testDevice
        })
      );
    });

    test('should reconnect to previously connected device', async () => {
      await mockService.connectToDevice(testDevice.id);
      await mockService.disconnect();
      
      const reconnected = await mockService.reconnect();
      
      expect(reconnected).toBe(true);
      expect(mockService.isConnected()).toBe(true);
      expect(mockService.getCurrentDevice()?.id).toBe(testDevice.id);
    });

    test('should track connection statistics', async () => {
      const initialStats = mockService.getDetailedMockStats();
      expect(initialStats.connectionsAttempted).toBe(0);
      expect(initialStats.connectionSuccesses).toBe(0);
      
      await mockService.connectToDevice(testDevice.id);
      
      const updatedStats = mockService.getDetailedMockStats();
      expect(updatedStats.connectionsAttempted).toBe(1);
      expect(updatedStats.connectionSuccesses).toBe(1);
    });
  });

  describe('Command Transmission', () => {
    let testDevice: RokuDevice;
    let testCommand: RemoteCommand;

    beforeEach(async () => {
      const devices = await mockService.scanForDevices();
      testDevice = devices[0];
      await mockService.connectToDevice(testDevice.id);
      
      testCommand = {
        type: RemoteCommandType.NAVIGATION,
        action: NavigationAction.UP,
        timestamp: Date.now(),
        id: 'test-command-1'
      };
    });

    test('should successfully send command when connected', async () => {
      const result = await mockService.sendCommand(testCommand);
      
      expect(result.success).toBe(true);
      expect(result.command).toEqual(testCommand);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    test('should fail to send command when not connected', async () => {
      await mockService.disconnect();
      
      const result = await mockService.sendCommand(testCommand);
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe(BLEErrorType.CONNECTION_LOST);
    });

    test('should emit command sent event on successful transmission', async () => {
      mockService.addEventListener(eventListener);
      
      await mockService.sendCommand(testCommand);
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.COMMAND_SENT,
          command: testCommand
        })
      );
    });

    test('should emit command acknowledged event after transmission', async () => {
      mockService.addEventListener(eventListener);
      
      await mockService.sendCommand(testCommand);
      
      // Wait for acknowledgment event
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.COMMAND_ACKNOWLEDGED,
          command: testCommand
        })
      );
    });

    test('should send batch of commands successfully', async () => {
      // Disable random failures for this test
      mockService.setCommandFailureRate(0);
      
      const commands: RemoteCommand[] = [
        {
          type: RemoteCommandType.NAVIGATION,
          action: NavigationAction.UP,
          id: 'cmd-1'
        },
        {
          type: RemoteCommandType.MEDIA,
          action: MediaAction.PLAY_PAUSE,
          id: 'cmd-2'
        },
        {
          type: RemoteCommandType.VOLUME,
          action: VolumeAction.VOLUME_UP,
          id: 'cmd-3'
        }
      ];
      
      const results = await mockService.sendCommandBatch(commands);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    test('should track command statistics', async () => {
      const initialStats = mockService.getMockStats();
      expect(initialStats.commandsSent).toBe(0);
      
      await mockService.sendCommand(testCommand);
      
      const updatedStats = mockService.getMockStats();
      expect(updatedStats.commandsSent).toBe(1);
    });

    test('should handle different command types', async () => {
      // Disable random failures for this test
      mockService.setCommandFailureRate(0);
      
      const commands: RemoteCommand[] = [
        {
          type: RemoteCommandType.NAVIGATION,
          action: NavigationAction.OK,
          id: 'nav-cmd'
        },
        {
          type: RemoteCommandType.MEDIA,
          action: MediaAction.REWIND,
          id: 'media-cmd'
        },
        {
          type: RemoteCommandType.VOLUME,
          action: VolumeAction.MUTE,
          id: 'volume-cmd'
        },
        {
          type: RemoteCommandType.UTILITY,
          action: UtilityAction.SEARCH,
          id: 'utility-cmd'
        }
      ];
      
      for (const command of commands) {
        const result = await mockService.sendCommand(command);
        expect(result.success).toBe(true);
        expect(result.command.type).toBe(command.type);
        expect(result.command.action).toBe(command.action);
      }
    });
  });

  describe('Mock-Specific Functionality', () => {
    test('should allow setting custom mock devices', () => {
      const customDevices: RokuDevice[] = [
        {
          id: 'custom-1',
          name: 'Custom Roku 1',
          rssi: -30,
          isConnectable: true
        },
        {
          id: 'custom-2',
          name: 'Custom Roku 2',
          rssi: -50,
          isConnectable: true
        }
      ];
      
      mockService.setMockDevices(customDevices);
      
      return mockService.scanForDevices().then(devices => {
        expect(devices).toHaveLength(2);
        expect(devices[0].name).toBe('Custom Roku 1');
        expect(devices[1].name).toBe('Custom Roku 2');
      });
    });

    test('should simulate connection failures when configured', async () => {
      const devices = await mockService.scanForDevices();
      const testDevice = devices[0];
      
      mockService.simulateConnectionFailure(true);
      
      const connected = await mockService.connectToDevice(testDevice.id);
      expect(connected).toBe(false);
      expect(mockService.getConnectionStatus()).toBe(ConnectionStatus.ERROR);
    });

    test('should simulate command failures when configured', async () => {
      const devices = await mockService.scanForDevices();
      await mockService.connectToDevice(devices[0].id);
      
      mockService.simulateCommandFailure(true);
      
      const command: RemoteCommand = {
        type: RemoteCommandType.NAVIGATION,
        action: NavigationAction.UP,
        id: 'test-cmd'
      };
      
      const result = await mockService.sendCommand(command);
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe(BLEErrorType.COMMAND_FAILED);
    });

    test('should allow configuring mock delay', async () => {
      mockService.setMockDelay(500);
      
      const startTime = Date.now();
      await mockService.scanForDevices();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThan(400); // Account for processing time
    });

    test('should simulate connection loss', async () => {
      const devices = await mockService.scanForDevices();
      await mockService.connectToDevice(devices[0].id);
      
      expect(mockService.isConnected()).toBe(true);
      
      mockService.addEventListener(eventListener);
      mockService.simulateConnectionLoss();
      
      expect(mockService.isConnected()).toBe(false);
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.ERROR_OCCURRED,
          error: expect.objectContaining({
            type: BLEErrorType.CONNECTION_LOST
          })
        })
      );
    });

    test('should allow adding and removing mock devices', async () => {
      // Set faster mock delay for this test
      mockService.setMockDelay(10);
      
      const initialDevices = await mockService.scanForDevices();
      const initialCount = initialDevices.length;
      
      const newDeviceId = mockService.addMockDevice({
        name: 'New Test Roku',
        rssi: -40,
        isConnectable: true
      });
      
      const devicesAfterAdd = await mockService.scanForDevices();
      expect(devicesAfterAdd).toHaveLength(initialCount + 1);
      
      const removed = mockService.removeMockDevice(newDeviceId);
      expect(removed).toBe(true);
      
      const devicesAfterRemove = await mockService.scanForDevices();
      expect(devicesAfterRemove).toHaveLength(initialCount);
    }, 10000);

    test('should allow updating mock device properties', async () => {
      const devices = await mockService.scanForDevices();
      const deviceId = devices[0].id;
      
      const updated = mockService.updateMockDevice(deviceId, {
        name: 'Updated Roku Name',
        rssi: -25
      });
      
      expect(updated).toBe(true);
      
      const updatedDevices = await mockService.scanForDevices();
      const updatedDevice = updatedDevices.find(d => d.id === deviceId);
      
      expect(updatedDevice?.name).toBe('Updated Roku Name');
      expect(updatedDevice?.rssi).toBe(-25);
    });

    test('should reset mock statistics', async () => {
      // Generate some activity
      await mockService.scanForDevices();
      const devices = await mockService.scanForDevices();
      await mockService.connectToDevice(devices[0].id);
      
      const statsBeforeReset = mockService.getDetailedMockStats();
      expect(statsBeforeReset.scanCount).toBeGreaterThan(0);
      expect(statsBeforeReset.connectionsAttempted).toBeGreaterThan(0);
      
      mockService.resetMockStats();
      
      const statsAfterReset = mockService.getDetailedMockStats();
      expect(statsAfterReset.scanCount).toBe(0);
      expect(statsAfterReset.connectionsAttempted).toBe(0);
      expect(statsAfterReset.connectionSuccesses).toBe(0);
    });

    test('should configure connection and command failure rates', async () => {
      mockService.setConnectionFailureRate(0.5); // 50% failure rate
      mockService.setCommandFailureRate(0.3); // 30% failure rate
      
      const devices = await mockService.scanForDevices();
      const testDevice = devices[0];
      
      // Test multiple connections to verify failure rate
      let connectionFailures = 0;
      const connectionAttempts = 10;
      
      for (let i = 0; i < connectionAttempts; i++) {
        await mockService.disconnect();
        const connected = await mockService.connectToDevice(testDevice.id);
        if (!connected) {
          connectionFailures++;
        }
      }
      
      // Should have some failures but not all (due to randomness, exact count may vary)
      expect(connectionFailures).toBeGreaterThan(0);
      expect(connectionFailures).toBeLessThan(connectionAttempts);
    });
  });

  describe('Permissions and Capabilities', () => {
    test('should always return true for Bluetooth permissions (mock)', async () => {
      const hasPermissions = await mockService.checkBluetoothPermissions();
      expect(hasPermissions).toBe(true);
    });

    test('should always grant Bluetooth permissions (mock)', async () => {
      const granted = await mockService.requestBluetoothPermissions();
      expect(granted).toBe(true);
    });

    test('should always report Bluetooth as enabled (mock)', async () => {
      const enabled = await mockService.isBluetoothEnabled();
      expect(enabled).toBe(true);
    });

    test('should always successfully enable Bluetooth (mock)', async () => {
      const enabled = await mockService.enableBluetooth();
      expect(enabled).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    test('should allow updating service configuration', () => {
      const newConfig: Partial<BLEServiceConfig> = {
        scanTimeout: 5000,
        connectionTimeout: 8000,
        autoReconnect: false
      };
      
      mockService.updateConfig(newConfig);
      
      const updatedConfig = mockService.getConfig();
      expect(updatedConfig.scanTimeout).toBe(5000);
      expect(updatedConfig.connectionTimeout).toBe(8000);
      expect(updatedConfig.autoReconnect).toBe(false);
    });

    test('should preserve existing config values when partially updating', () => {
      const originalConfig = mockService.getConfig();
      
      mockService.updateConfig({ scanTimeout: 7000 });
      
      const updatedConfig = mockService.getConfig();
      expect(updatedConfig.scanTimeout).toBe(7000);
      expect(updatedConfig.connectionTimeout).toBe(originalConfig.connectionTimeout);
      expect(updatedConfig.autoReconnect).toBe(originalConfig.autoReconnect);
    });
  });

  describe('Event Handling', () => {
    test('should manage event listeners correctly', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      mockService.addEventListener(listener1);
      mockService.addEventListener(listener2);
      
      // Trigger an event
      await mockService.initialize();
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      mockService.removeEventListener(listener1);
      
      // Clear previous calls
      listener1.mockClear();
      listener2.mockClear();
      
      // Trigger another event by starting a scan
      await mockService.scanForDevices();
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    test('should remove all event listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      mockService.addEventListener(listener1);
      mockService.addEventListener(listener2);
      
      mockService.removeAllEventListeners();
      
      await mockService.initialize();
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    test('should maintain connection history', async () => {
      const devices = await mockService.scanForDevices();
      await mockService.connectToDevice(devices[0].id);
      
      const history = mockService.getConnectionHistory();
      
      expect(history.length).toBeGreaterThan(0);
      expect(history.some(event => event.type === ConnectionEventType.DEVICE_DISCOVERED)).toBe(true);
      expect(history.some(event => event.type === ConnectionEventType.DEVICE_CONNECTED)).toBe(true);
    });

    test('should clear connection history', async () => {
      await mockService.scanForDevices();
      
      expect(mockService.getConnectionHistory().length).toBeGreaterThan(0);
      
      mockService.clearConnectionHistory();
      
      expect(mockService.getConnectionHistory().length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should track last error', async () => {
      expect(mockService.getLastError()).toBeNull();
      
      // Trigger an error by connecting to non-existent device
      await mockService.connectToDevice('non-existent');
      
      const lastError = mockService.getLastError();
      expect(lastError).not.toBeNull();
      expect(lastError?.type).toBe(BLEErrorType.DEVICE_NOT_FOUND);
    });

    test('should emit error events', async () => {
      mockService.addEventListener(eventListener);
      
      await mockService.connectToDevice('non-existent');
      
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ConnectionEventType.ERROR_OCCURRED,
          error: expect.objectContaining({
            type: BLEErrorType.DEVICE_NOT_FOUND
          })
        })
      );
    });

    test('should handle event listener errors gracefully', async () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      mockService.addEventListener(faultyListener);
      
      // Should not throw despite faulty listener
      await expect(mockService.initialize()).resolves.not.toThrow();
      
      expect(faultyListener).toHaveBeenCalled();
    });
  });
});