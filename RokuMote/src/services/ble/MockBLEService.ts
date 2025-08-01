/**
 * Mock BLE Service Implementation
 * Simulates BLE communication with Roku devices for development and testing
 */

import {
  IBLEService,
  IMockBLEService,
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
  DEFAULT_BLE_CONFIG,
  RemoteCommandType,
  NavigationAction,
  MediaAction,
  VolumeAction,
  UtilityAction
} from '../../types/ble';

// Mock statistics interface
interface MockStats {
  commandsSent: number;
  connectionsAttempted: number;
  scanCount: number;
  connectionSuccesses: number;
  connectionFailures: number;
  commandSuccesses: number;
  commandFailures: number;
  totalScanTime: number;
  averageResponseTime: number;
}

// Mock device templates for realistic simulation
const MOCK_ROKU_DEVICES: Omit<RokuDevice, 'id'>[] = [
  {
    name: 'Bedroom Roku',
    rssi: -45,
    isConnectable: true,
    serviceUUIDs: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'],
    localName: 'Roku-Bedroom'
  },
  {
    name: 'Living Room Roku',
    rssi: -38,
    isConnectable: true,
    serviceUUIDs: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'],
    localName: 'Roku-LivingRoom'
  },
  {
    name: 'Kitchen Roku Express',
    rssi: -52,
    isConnectable: true,
    serviceUUIDs: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'],
    localName: 'Roku-Kitchen'
  },
  {
    name: 'Guest Room Roku Stick',
    rssi: -67,
    isConnectable: true,
    serviceUUIDs: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'],
    localName: 'Roku-Guest'
  },
  {
    name: 'Office Roku Ultra',
    rssi: -41,
    isConnectable: true,
    serviceUUIDs: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'],
    localName: 'Roku-Office'
  }
];

export class MockBLEService implements IMockBLEService {
  private config: BLEServiceConfig;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private currentDevice: RokuDevice | null = null;
  private lastConnectedDevice: RokuDevice | null = null;
  private eventListeners: BLEEventListener[] = [];
  private connectionHistory: ConnectionEvent[] = [];
  private lastError: BLEError | null = null;
  private _isScanning: boolean = false;
  private scanTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  
  // Mock-specific properties
  private mockDevices: RokuDevice[] = [];
  private mockDelay: number = 100;
  private shouldFailConnection: boolean = false;
  private shouldFailCommand: boolean = false;
  private connectionFailureRate: number = 0.1; // 10% failure rate by default
  private commandFailureRate: number = 0.05; // 5% failure rate by default
  private mockStats: MockStats = {
    commandsSent: 0,
    connectionsAttempted: 0,
    scanCount: 0,
    connectionSuccesses: 0,
    connectionFailures: 0,
    commandSuccesses: 0,
    commandFailures: 0,
    totalScanTime: 0,
    averageResponseTime: 0
  };
  private responseTimes: number[] = [];

  constructor(config?: Partial<BLEServiceConfig>) {
    this.config = { ...DEFAULT_BLE_CONFIG, ...config };
    this.initializeMockDevices();
  }

  // Service lifecycle
  async initialize(): Promise<void> {
    await this.simulateDelay(50);
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    
    this.emitEvent({
      type: ConnectionEventType.CONNECTION_STATE_CHANGED,
      status: ConnectionStatus.DISCONNECTED,
      timestamp: Date.now()
    });
  }

  async destroy(): Promise<void> {
    this.clearTimers();
    this.removeAllEventListeners();
    this.currentDevice = null;
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
  }

  // Device scanning and discovery
  async scanForDevices(): Promise<RokuDevice[]> {
    const scanStartTime = Date.now();
    this.mockStats.scanCount++;
    
    if (this._isScanning) {
      await this.stopScanning();
    }

    this.setConnectionStatus(ConnectionStatus.SCANNING);
    this._isScanning = true;

    // Simulate scanning delay
    await this.simulateDelay(this.mockDelay);

    return new Promise((resolve) => {
      const discoveredDevices: RokuDevice[] = [];
      let deviceIndex = 0;

      const discoverNextDevice = () => {
        if (deviceIndex >= this.mockDevices.length || !this._isScanning) {
          this._isScanning = false;
          this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
          
          const scanTime = Date.now() - scanStartTime;
          this.mockStats.totalScanTime += scanTime;
          
          resolve(discoveredDevices);
          return;
        }

        const device = this.mockDevices[deviceIndex];
        discoveredDevices.push(device);

        this.emitEvent({
          type: ConnectionEventType.DEVICE_DISCOVERED,
          device,
          timestamp: Date.now()
        });

        deviceIndex++;
        
        // Simulate realistic discovery intervals
        this.scanTimer = setTimeout(discoverNextDevice, 200 + Math.random() * 300);
      };

      // Start discovering devices
      this.scanTimer = setTimeout(discoverNextDevice, 100);
    });
  }

  async stopScanning(): Promise<void> {
    this._isScanning = false;
    this.clearTimers();
    
    if (this.connectionStatus === ConnectionStatus.SCANNING) {
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }

  isScanning(): boolean {
    return this._isScanning;
  }

  // Device connection management
  async connectToDevice(deviceId: string): Promise<boolean> {
    this.mockStats.connectionsAttempted++;
    
    if (this.connectionStatus === ConnectionStatus.CONNECTED && this.currentDevice?.id === deviceId) {
      return true;
    }

    await this.disconnect();
    this.setConnectionStatus(ConnectionStatus.CONNECTING);

    // Find the device to connect to first
    const device = this.mockDevices.find(d => d.id === deviceId);
    if (!device) {
      this.mockStats.connectionFailures++;
      const error = this.createBLEError(
        BLEErrorType.DEVICE_NOT_FOUND,
        `Mock device with ID ${deviceId} not found`
      );
      this.handleError(error);
      this.setConnectionStatus(ConnectionStatus.ERROR);
      return false;
    }

    // Simulate connection delay
    await this.simulateDelay(this.mockDelay * 2);

    // Simulate connection failure scenarios
    if (this.shouldFailConnection || Math.random() < this.connectionFailureRate) {
      this.mockStats.connectionFailures++;
      const error = this.createBLEError(
        BLEErrorType.CONNECTION_FAILED,
        'Mock connection failure - simulated network error'
      );
      this.handleError(error);
      this.setConnectionStatus(ConnectionStatus.ERROR);
      return false;
    }

    this.currentDevice = device;
    this.lastConnectedDevice = device;
    this.mockStats.connectionSuccesses++;
    this.setConnectionStatus(ConnectionStatus.CONNECTED);

    this.emitEvent({
      type: ConnectionEventType.DEVICE_CONNECTED,
      device: this.currentDevice,
      timestamp: Date.now()
    });

    return true;
  }

  async disconnect(): Promise<void> {
    const previousDevice = this.currentDevice;
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    this.currentDevice = null;

    if (previousDevice) {
      this.emitEvent({
        type: ConnectionEventType.DEVICE_DISCONNECTED,
        device: previousDevice,
        timestamp: Date.now()
      });
    }
  }

  async reconnect(): Promise<boolean> {
    const deviceToReconnect = this.currentDevice || this.lastConnectedDevice;
    if (!deviceToReconnect) {
      return false;
    }

    this.setConnectionStatus(ConnectionStatus.RECONNECTING);
    return await this.connectToDevice(deviceToReconnect.id);
  }

  // Connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getCurrentDevice(): RokuDevice | null {
    return this.currentDevice;
  }

  isConnected(): boolean {
    return this.connectionStatus === ConnectionStatus.CONNECTED && this.currentDevice !== null;
  }

  // Command transmission
  async sendCommand(command: RemoteCommand): Promise<CommandResult> {
    const startTime = Date.now();
    this.mockStats.commandsSent++;

    if (!this.isConnected()) {
      const error = this.createBLEError(BLEErrorType.CONNECTION_LOST, 'Device not connected');
      this.mockStats.commandFailures++;
      return {
        success: false,
        command,
        error,
        responseTime: Date.now() - startTime
      };
    }

    // Simulate command processing delay
    await this.simulateDelay(this.mockDelay / 2);

    // Simulate command failure scenarios
    if (this.shouldFailCommand || Math.random() < this.commandFailureRate) {
      this.mockStats.commandFailures++;
      const error = this.createBLEError(
        BLEErrorType.COMMAND_FAILED,
        `Mock command failure for ${command.type}:${command.action}`
      );
      
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.updateAverageResponseTime();
      
      this.emitEvent({
        type: ConnectionEventType.ERROR_OCCURRED,
        error,
        timestamp: Date.now()
      });
      
      return {
        success: false,
        command,
        error,
        responseTime
      };
    }

    this.mockStats.commandSuccesses++;
    const responseTime = Date.now() - startTime;
    this.responseTimes.push(responseTime);
    this.updateAverageResponseTime();

    this.emitEvent({
      type: ConnectionEventType.COMMAND_SENT,
      command,
      timestamp: Date.now()
    });

    // Simulate command acknowledgment
    setTimeout(() => {
      this.emitEvent({
        type: ConnectionEventType.COMMAND_ACKNOWLEDGED,
        command,
        timestamp: Date.now()
      });
    }, 10);

    return {
      success: true,
      command,
      responseTime
    };
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
      
      // Small delay between commands
      await this.simulateDelay(25);
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

  // Permissions and capabilities (always return true for mock)
  async checkBluetoothPermissions(): Promise<boolean> {
    await this.simulateDelay(10);
    return true;
  }

  async requestBluetoothPermissions(): Promise<boolean> {
    await this.simulateDelay(50);
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    await this.simulateDelay(10);
    return true;
  }

  async enableBluetooth(): Promise<boolean> {
    await this.simulateDelay(100);
    return true;
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

  // Mock-specific methods
  setMockDevices(devices: RokuDevice[]): void {
    this.mockDevices = devices.map(device => ({
      ...device,
      id: device.id || this.generateDeviceId()
    }));
  }

  simulateConnectionFailure(shouldFail: boolean): void {
    this.shouldFailConnection = shouldFail;
  }

  simulateCommandFailure(shouldFail: boolean): void {
    this.shouldFailCommand = shouldFail;
  }

  setMockDelay(delay: number): void {
    this.mockDelay = Math.max(0, delay);
  }

  getMockStats(): {
    commandsSent: number;
    connectionsAttempted: number;
    scanCount: number;
  } {
    return {
      commandsSent: this.mockStats.commandsSent,
      connectionsAttempted: this.mockStats.connectionsAttempted,
      scanCount: this.mockStats.scanCount
    };
  }

  // Additional mock methods for enhanced testing
  getDetailedMockStats(): MockStats {
    return { ...this.mockStats };
  }

  resetMockStats(): void {
    this.mockStats = {
      commandsSent: 0,
      connectionsAttempted: 0,
      scanCount: 0,
      connectionSuccesses: 0,
      connectionFailures: 0,
      commandSuccesses: 0,
      commandFailures: 0,
      totalScanTime: 0,
      averageResponseTime: 0
    };
    this.responseTimes = [];
  }

  setConnectionFailureRate(rate: number): void {
    this.connectionFailureRate = Math.max(0, Math.min(1, rate));
  }

  setCommandFailureRate(rate: number): void {
    this.commandFailureRate = Math.max(0, Math.min(1, rate));
  }

  simulateConnectionLoss(): void {
    if (this.isConnected()) {
      const error = this.createBLEError(
        BLEErrorType.CONNECTION_LOST,
        'Mock connection loss - simulated'
      );
      this.handleError(error);
      this.setConnectionStatus(ConnectionStatus.ERROR);
    }
  }

  simulateBluetoothDisabled(): void {
    const error = this.createBLEError(
      BLEErrorType.BLUETOOTH_DISABLED,
      'Mock Bluetooth disabled - simulated'
    );
    this.handleError(error);
    this.setConnectionStatus(ConnectionStatus.ERROR);
  }

  addMockDevice(device: Omit<RokuDevice, 'id'>): string {
    const deviceId = this.generateDeviceId();
    const newDevice: RokuDevice = {
      ...device,
      id: deviceId
    };
    this.mockDevices.push(newDevice);
    return deviceId;
  }

  removeMockDevice(deviceId: string): boolean {
    const index = this.mockDevices.findIndex(d => d.id === deviceId);
    if (index > -1) {
      this.mockDevices.splice(index, 1);
      
      // Disconnect if this was the current device
      if (this.currentDevice?.id === deviceId) {
        this.disconnect();
      }
      
      return true;
    }
    return false;
  }

  updateMockDevice(deviceId: string, updates: Partial<Omit<RokuDevice, 'id'>>): boolean {
    const device = this.mockDevices.find(d => d.id === deviceId);
    if (device) {
      Object.assign(device, updates);
      
      // Update current device if it's the same
      if (this.currentDevice?.id === deviceId) {
        Object.assign(this.currentDevice, updates);
      }
      
      return true;
    }
    return false;
  }

  // Private helper methods
  private initializeMockDevices(): void {
    this.mockDevices = MOCK_ROKU_DEVICES.map(template => ({
      ...template,
      id: this.generateDeviceId()
    }));
  }

  private generateDeviceId(): string {
    return `mock-roku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async simulateDelay(ms: number): Promise<void> {
    if (ms <= 0) return;
    return new Promise(resolve => setTimeout(resolve, ms));
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
        console.warn('Error in mock event listener:', error);
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
  }

  private clearTimers(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private updateAverageResponseTime(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
      this.mockStats.averageResponseTime = sum / this.responseTimes.length;
      
      // Keep only recent response times to prevent memory growth
      if (this.responseTimes.length > 100) {
        this.responseTimes = this.responseTimes.slice(-50);
      }
    }
  }
}