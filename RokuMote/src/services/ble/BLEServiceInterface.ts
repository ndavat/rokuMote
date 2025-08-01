/**
 * BLE Service Interface
 * Defines the contract for BLE communication with Roku devices
 */

import {
  RokuDevice,
  RemoteCommand,
  CommandResult,
  ConnectionStatus,
  ConnectionEvent,
  BLEError,
  BLEServiceConfig
} from '../../types/ble';

// Event listener type
export type BLEEventListener = (event: ConnectionEvent) => void;

// BLE Service Interface
export interface IBLEService {
  // Device scanning and discovery
  scanForDevices(): Promise<RokuDevice[]>;
  stopScanning(): Promise<void>;
  isScanning(): boolean;

  // Device connection management
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnect(): Promise<void>;
  reconnect(): Promise<boolean>;
  
  // Connection status
  getConnectionStatus(): ConnectionStatus;
  getCurrentDevice(): RokuDevice | null;
  isConnected(): boolean;

  // Command transmission
  sendCommand(command: RemoteCommand): Promise<CommandResult>;
  sendCommandBatch(commands: RemoteCommand[]): Promise<CommandResult[]>;

  // Event handling
  addEventListener(listener: BLEEventListener): void;
  removeEventListener(listener: BLEEventListener): void;
  removeAllEventListeners(): void;

  // Configuration
  updateConfig(config: Partial<BLEServiceConfig>): void;
  getConfig(): BLEServiceConfig;

  // Service lifecycle
  initialize(): Promise<void>;
  destroy(): Promise<void>;

  // Permissions and capabilities
  checkBluetoothPermissions(): Promise<boolean>;
  requestBluetoothPermissions(): Promise<boolean>;
  isBluetoothEnabled(): Promise<boolean>;
  enableBluetooth(): Promise<boolean>;

  // Diagnostics and debugging
  getLastError(): BLEError | null;
  getConnectionHistory(): ConnectionEvent[];
  clearConnectionHistory(): void;
}

// Mock BLE Service Interface (for development and testing)
export interface IMockBLEService extends IBLEService {
  // Mock-specific methods
  setMockDevices(devices: RokuDevice[]): void;
  simulateConnectionFailure(shouldFail: boolean): void;
  simulateCommandFailure(shouldFail: boolean): void;
  setMockDelay(delay: number): void;
  getMockStats(): {
    commandsSent: number;
    connectionsAttempted: number;
    scanCount: number;
  };
}

// BLE Service Factory interface
export interface IBLEServiceFactory {
  createBLEService(config?: Partial<BLEServiceConfig>): IBLEService;
  createMockBLEService(config?: Partial<BLEServiceConfig>): IMockBLEService;
}