/**
 * Concrete BLE Service Implementation
 * Implements IBLEService using react-native-ble-plx for Roku device communication
 */

import { BleManager, Device, Subscription, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  IBLEService,
  BLEEventListener
} from './BLEServiceInterface';
import {
  RokuDevice,
  RemoteCommand,
  CommandResult,
  ConnectionStatus,
  ConnectionEvent,
  ConnectionEventType,
  BLEError,
  BLEErrorType,
  BLEServiceConfig,
  DEFAULT_BLE_CONFIG
} from '../../types/ble';

// Roku BLE service and characteristic UUIDs (these would be specific to Roku devices)
const ROKU_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const ROKU_COMMAND_CHARACTERISTIC_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const ROKU_RESPONSE_CHARACTERISTIC_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

export class BLEService implements IBLEService {
  private bleManager: BleManager;
  private config: BLEServiceConfig;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private currentDevice: RokuDevice | null = null;
  private connectedDevice: Device | null = null;
  private eventListeners: BLEEventListener[] = [];
  private connectionHistory: ConnectionEvent[] = [];
  private lastError: BLEError | null = null;
  private scanSubscription: Subscription | null = null;
  private stateSubscription: Subscription | null = null;
  private _isScanning: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<BLEServiceConfig>) {
    this.bleManager = new BleManager();
    this.config = { ...DEFAULT_BLE_CONFIG, ...config };
    this.setupBluetoothStateListener();
  }

  // Service lifecycle
  async initialize(): Promise<void> {
    try {
      const state = await this.bleManager.state();
      if (state !== State.PoweredOn) {
        await this.enableBluetooth();
      }
      
      this.emitEvent({
        type: ConnectionEventType.CONNECTION_STATE_CHANGED,
        status: ConnectionStatus.DISCONNECTED,
        timestamp: Date.now()
      });
    } catch (error) {
      const bleError = this.createBLEError(BLEErrorType.UNKNOWN, 'Failed to initialize BLE service', error);
      this.handleError(bleError);
      throw bleError;
    }
  }

  async destroy(): Promise<void> {
    try {
      await this.disconnect();
      this.stopScanning();
      this.clearTimers();
      
      if (this.stateSubscription) {
        this.stateSubscription.remove();
        this.stateSubscription = null;
      }
      
      this.removeAllEventListeners();
      this.bleManager.destroy();
    } catch (error) {
      console.warn('Error during BLE service destruction:', error);
    }
  }

  // Device scanning and discovery
  async scanForDevices(): Promise<RokuDevice[]> {
    try {
      if (this._isScanning) {
        await this.stopScanning();
      }

      const hasPermissions = await this.checkBluetoothPermissions();
      if (!hasPermissions) {
        const granted = await this.requestBluetoothPermissions();
        if (!granted) {
          throw this.createBLEError(BLEErrorType.PERMISSION_DENIED, 'Bluetooth permissions not granted');
        }
      }

      const isEnabled = await this.isBluetoothEnabled();
      if (!isEnabled) {
        throw this.createBLEError(BLEErrorType.BLUETOOTH_DISABLED, 'Bluetooth is not enabled');
      }

      this.setConnectionStatus(ConnectionStatus.SCANNING);
      this._isScanning = true;
      
      const discoveredDevices: RokuDevice[] = [];
      const deviceIds = new Set<string>();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.stopScanning();
          resolve(discoveredDevices);
        }, this.config.scanTimeout);

        this.bleManager.startDeviceScan(
          [ROKU_SERVICE_UUID],
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              clearTimeout(timeout);
              this._isScanning = false;
              const bleError = this.createBLEError(BLEErrorType.UNKNOWN, 'Device scan failed', error);
              this.handleError(bleError);
              reject(bleError);
              return;
            }

            if (device && !deviceIds.has(device.id)) {
              deviceIds.add(device.id);
              const rokuDevice: RokuDevice = {
                id: device.id,
                name: device.name || device.localName || 'Unknown Roku Device',
                rssi: device.rssi || -100,
                isConnectable: device.isConnectable || true,
                serviceUUIDs: device.serviceUUIDs || [],
                manufacturerData: device.manufacturerData || undefined,
                localName: device.localName || undefined
              };

              discoveredDevices.push(rokuDevice);
              
              this.emitEvent({
                type: ConnectionEventType.DEVICE_DISCOVERED,
                device: rokuDevice,
                timestamp: Date.now()
              });
            }
          }
        );
      });
    } catch (error) {
      this._isScanning = false;
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (this.scanSubscription) {
      this.scanSubscription.remove();
      this.scanSubscription = null;
    }
    
    this.bleManager.stopDeviceScan();
    this._isScanning = false;
    
    if (this.connectionStatus === ConnectionStatus.SCANNING) {
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }

  isScanning(): boolean {
    return this._isScanning;
  }

  // Device connection management
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      if (this.connectionStatus === ConnectionStatus.CONNECTED && this.currentDevice?.id === deviceId) {
        return true;
      }

      await this.disconnect();
      this.setConnectionStatus(ConnectionStatus.CONNECTING);

      const device = await this.bleManager.connectToDevice(deviceId, {
        timeout: this.config.connectionTimeout
      });

      await device.discoverAllServicesAndCharacteristics();
      
      // Verify that the device has the required Roku service
      const services = await device.services();
      const hasRokuService = services.some(service => service.uuid === ROKU_SERVICE_UUID);
      
      if (!hasRokuService) {
        await device.cancelConnection();
        throw this.createBLEError(BLEErrorType.SERVICE_NOT_FOUND, 'Roku service not found on device');
      }

      this.connectedDevice = device;
      this.currentDevice = {
        id: device.id,
        name: device.name || device.localName || 'Unknown Roku Device',
        rssi: 0, // RSSI not available after connection
        isConnectable: true,
        serviceUUIDs: services.map(s => s.uuid)
      };

      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      this.startKeepAlive();

      this.emitEvent({
        type: ConnectionEventType.DEVICE_CONNECTED,
        device: this.currentDevice,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      this.setConnectionStatus(ConnectionStatus.ERROR);
      const bleError = this.createBLEError(BLEErrorType.CONNECTION_FAILED, 'Failed to connect to device', error);
      this.handleError(bleError);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.clearTimers();
      
      if (this.connectedDevice) {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
      }

      const previousDevice = this.currentDevice;
      this.currentDevice = null;
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);

      if (previousDevice) {
        this.emitEvent({
          type: ConnectionEventType.DEVICE_DISCONNECTED,
          device: previousDevice,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('Error during disconnect:', error);
    }
  }

  async reconnect(): Promise<boolean> {
    if (!this.currentDevice) {
      return false;
    }

    this.setConnectionStatus(ConnectionStatus.RECONNECTING);
    return await this.connectToDevice(this.currentDevice.id);
  }

  // Connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getCurrentDevice(): RokuDevice | null {
    return this.currentDevice;
  }

  isConnected(): boolean {
    return this.connectionStatus === ConnectionStatus.CONNECTED && this.connectedDevice !== null;
  }

  // Command transmission
  async sendCommand(command: RemoteCommand): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isConnected() || !this.connectedDevice) {
        throw this.createBLEError(BLEErrorType.CONNECTION_LOST, 'Device not connected');
      }

      // Convert command to BLE data format
      const commandData = this.serializeCommand(command);
      
      // Send command to device
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        ROKU_SERVICE_UUID,
        ROKU_COMMAND_CHARACTERISTIC_UUID,
        commandData
      );

      const result: CommandResult = {
        success: true,
        command,
        responseTime: Date.now() - startTime
      };

      this.emitEvent({
        type: ConnectionEventType.COMMAND_SENT,
        command,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const bleError = this.createBLEError(BLEErrorType.COMMAND_FAILED, 'Failed to send command', error);
      this.handleError(bleError);
      
      return {
        success: false,
        command,
        error: bleError,
        responseTime: Date.now() - startTime
      };
    }
  }

  async sendCommandBatch(commands: RemoteCommand[]): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    
    for (const command of commands) {
      const result = await this.sendCommand(command);
      results.push(result);
      
      // If a command fails and we're not connected, stop processing
      if (!result.success && !this.isConnected()) {
        break;
      }
      
      // Small delay between commands to avoid overwhelming the device
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }

  // Event handling
  addEventListener(listener: BLEEventListener): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: BLEEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  removeAllEventListeners(): void {
    this.eventListeners = [];
  }

  // Configuration
  updateConfig(config: Partial<BLEServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): BLEServiceConfig {
    return { ...this.config };
  }

  // Permissions and capabilities
  async checkBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ];

      for (const permission of permissions) {
        const granted = await PermissionsAndroid.check(permission);
        if (!granted) {
          return false;
        }
      }
    }
    
    return true;
  }

  async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      return Object.values(results).every(result => result === PermissionsAndroid.RESULTS.GRANTED);
    }
    
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.bleManager.state();
    return state === State.PoweredOn;
  }

  async enableBluetooth(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      if (state === State.PoweredOn) {
        return true;
      }
      
      // On Android, we can't programmatically enable Bluetooth
      // The user needs to enable it manually
      return false;
    } catch (error) {
      return false;
    }
  }

  // Diagnostics and debugging
  getLastError(): BLEError | null {
    return this.lastError;
  }

  getConnectionHistory(): ConnectionEvent[] {
    return [...this.connectionHistory];
  }

  clearConnectionHistory(): void {
    this.connectionHistory = [];
  }

  // Private helper methods
  private setupBluetoothStateListener(): void {
    this.stateSubscription = this.bleManager.onStateChange((state) => {
      if (state !== State.PoweredOn && this.isConnected()) {
        this.handleConnectionLoss();
      }
    }, true);
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emitEvent({
        type: ConnectionEventType.CONNECTION_STATE_CHANGED,
        status,
        timestamp: Date.now()
      });
    }
  }

  private emitEvent(event: ConnectionEvent): void {
    this.connectionHistory.push(event);
    
    // Keep history size manageable
    if (this.connectionHistory.length > 100) {
      this.connectionHistory = this.connectionHistory.slice(-50);
    }

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('Error in event listener:', error);
      }
    });
  }

  private createBLEError(type: BLEErrorType, message: string, originalError?: any): BLEError {
    return {
      type,
      message,
      code: originalError?.code || originalError?.errorCode,
      originalError: originalError instanceof Error ? originalError : undefined
    };
  }

  private handleError(error: BLEError): void {
    this.lastError = error;
    this.emitEvent({
      type: ConnectionEventType.ERROR_OCCURRED,
      error,
      timestamp: Date.now()
    });

    // Handle specific error types
    if (error.type === BLEErrorType.CONNECTION_LOST && this.config.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  private handleConnectionLoss(): void {
    const error = this.createBLEError(BLEErrorType.CONNECTION_LOST, 'Connection to device lost');
    this.setConnectionStatus(ConnectionStatus.ERROR);
    this.handleError(error);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      if (this.currentDevice && this.config.autoReconnect) {
        await this.reconnect();
      }
    }, this.config.retryDelay);
  }

  private startKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
    }

    this.keepAliveTimer = setTimeout(() => {
      if (this.isConnected()) {
        // Send a simple ping command to keep connection alive
        // This would be a no-op command that doesn't affect the Roku device
        this.startKeepAlive();
      }
    }, this.config.keepAliveInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private serializeCommand(command: RemoteCommand): string {
    // Convert the command to a format that the Roku device expects
    // This would be specific to the Roku BLE protocol
    const commandPayload = {
      type: command.type,
      action: command.action,
      payload: command.payload || {},
      timestamp: command.timestamp,
      id: command.id
    };

    return Buffer.from(JSON.stringify(commandPayload)).toString('base64');
  }
}