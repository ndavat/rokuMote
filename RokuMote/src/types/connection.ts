/**
 * Connection State Management Types
 * Defines interfaces for managing BLE connection state
 */

import { RokuDevice, ConnectionStatus, BLEError, RemoteCommand, CommandResult } from './ble';

// Connection state interface
export interface ConnectionState {
  status: ConnectionStatus;
  currentDevice: RokuDevice | null;
  availableDevices: RokuDevice[];
  lastConnectedDevice: RokuDevice | null;
  connectionAttempts: number;
  lastError: BLEError | null;
  isScanning: boolean;
  lastScanTime: number | null;
  connectionStartTime: number | null;
  connectionDuration: number;
  signalStrength: number | null;
}

// Connection statistics
export interface ConnectionStats {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageResponseTime: number;
  uptime: number;
  lastConnectionTime: number | null;
}

// Connection preferences
export interface ConnectionPreferences {
  autoReconnect: boolean;
  preferredDevice: string | null;
  connectionTimeout: number;
  maxRetries: number;
  scanDuration: number;
  keepAliveEnabled: boolean;
  backgroundConnectionEnabled: boolean;
}

// Command queue item
export interface QueuedCommand {
  command: RemoteCommand;
  timestamp: number;
  retryCount: number;
  resolve: (result: CommandResult) => void;
  reject: (error: BLEError) => void;
  timeoutId?: NodeJS.Timeout;
}

// Command queue state
export interface CommandQueueState {
  queue: QueuedCommand[];
  processing: boolean;
  maxQueueSize: number;
  currentCommand: QueuedCommand | null;
}

// Connection manager interface
export interface IConnectionManager {
  // State management
  getState(): ConnectionState;
  updateState(updates: Partial<ConnectionState>): void;
  resetState(): void;

  // Statistics
  getStats(): ConnectionStats;
  updateStats(updates: Partial<ConnectionStats>): void;
  resetStats(): void;

  // Preferences
  getPreferences(): ConnectionPreferences;
  updatePreferences(updates: Partial<ConnectionPreferences>): void;
  savePreferences(): Promise<void>;
  loadPreferences(): Promise<void>;

  // Command queue management
  getQueueState(): CommandQueueState;
  enqueueCommand(command: RemoteCommand): Promise<CommandResult>;
  dequeueCommand(): QueuedCommand | null;
  clearQueue(): void;
  getQueueSize(): number;

  // Event emission
  emit(event: string, data?: any): void;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
}

// Connection manager events
export enum ConnectionManagerEvent {
  STATE_CHANGED = 'state_changed',
  DEVICE_DISCOVERED = 'device_discovered',
  CONNECTION_ESTABLISHED = 'connection_established',
  CONNECTION_LOST = 'connection_lost',
  COMMAND_QUEUED = 'command_queued',
  COMMAND_PROCESSED = 'command_processed',
  ERROR_OCCURRED = 'error_occurred',
  STATS_UPDATED = 'stats_updated'
}

// Default connection state
export const DEFAULT_CONNECTION_STATE: ConnectionState = {
  status: ConnectionStatus.DISCONNECTED,
  currentDevice: null,
  availableDevices: [],
  lastConnectedDevice: null,
  connectionAttempts: 0,
  lastError: null,
  isScanning: false,
  lastScanTime: null,
  connectionStartTime: null,
  connectionDuration: 0,
  signalStrength: null
};

// Default connection preferences
export const DEFAULT_CONNECTION_PREFERENCES: ConnectionPreferences = {
  autoReconnect: true,
  preferredDevice: null,
  connectionTimeout: 15000,
  maxRetries: 3,
  scanDuration: 10000,
  keepAliveEnabled: true,
  backgroundConnectionEnabled: false
};

// Default command queue state
export const DEFAULT_COMMAND_QUEUE_STATE: CommandQueueState = {
  queue: [],
  processing: false,
  maxQueueSize: 50,
  currentCommand: null
};