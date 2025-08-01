/**
 * BLE Service Types and Interfaces
 * Defines all TypeScript interfaces for BLE communication with Roku devices
 */

// Connection status enumeration
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// BLE Error types
export enum BLEErrorType {
  BLUETOOTH_DISABLED = 'bluetooth_disabled',
  PERMISSION_DENIED = 'permission_denied',
  DEVICE_NOT_FOUND = 'device_not_found',
  CONNECTION_FAILED = 'connection_failed',
  CONNECTION_LOST = 'connection_lost',
  COMMAND_FAILED = 'command_failed',
  SERVICE_NOT_FOUND = 'service_not_found',
  CHARACTERISTIC_NOT_FOUND = 'characteristic_not_found',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

// BLE Error interface
export interface BLEError {
  type: BLEErrorType;
  message: string;
  code?: string | number;
  originalError?: Error;
}

// Roku device interface
export interface RokuDevice {
  id: string;
  name: string;
  rssi: number;
  isConnectable: boolean;
  serviceUUIDs?: string[];
  manufacturerData?: string;
  localName?: string;
}

// Remote command types
export enum RemoteCommandType {
  NAVIGATION = 'navigation',
  MEDIA = 'media',
  VOLUME = 'volume',
  UTILITY = 'utility'
}

// Navigation actions
export enum NavigationAction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  OK = 'ok',
  BACK = 'back',
  HOME = 'home'
}

// Media actions
export enum MediaAction {
  PLAY_PAUSE = 'playPause',
  REWIND = 'rewind',
  FAST_FORWARD = 'fastForward',
  REPLAY = 'replay'
}

// Volume actions
export enum VolumeAction {
  MUTE = 'mute',
  VOLUME_UP = 'volumeUp',
  VOLUME_DOWN = 'volumeDown'
}

// Utility actions
export enum UtilityAction {
  SEARCH = 'search',
  VOICE = 'voice',
  KEYBOARD = 'keyboard',
  SETTINGS = 'settings',
  GUIDE = 'guide',
  STAR = 'star',
  HEADPHONES = 'headphones',
  POWER = 'power'
}

// Remote command interface
export interface RemoteCommand {
  type: RemoteCommandType;
  action: NavigationAction | MediaAction | VolumeAction | UtilityAction;
  payload?: Record<string, any>;
  timestamp?: number;
  id?: string;
}

// Command result interface
export interface CommandResult {
  success: boolean;
  command: RemoteCommand;
  error?: BLEError;
  responseTime?: number;
}

// Connection event types
export enum ConnectionEventType {
  DEVICE_DISCOVERED = 'device_discovered',
  CONNECTION_STATE_CHANGED = 'connection_state_changed',
  DEVICE_CONNECTED = 'device_connected',
  DEVICE_DISCONNECTED = 'device_disconnected',
  ERROR_OCCURRED = 'error_occurred',
  COMMAND_SENT = 'command_sent',
  COMMAND_ACKNOWLEDGED = 'command_acknowledged'
}

// Connection event interface
export interface ConnectionEvent {
  type: ConnectionEventType;
  device?: RokuDevice;
  status?: ConnectionStatus;
  error?: BLEError;
  command?: RemoteCommand;
  timestamp: number;
}

// BLE Service configuration
export interface BLEServiceConfig {
  scanTimeout: number;
  connectionTimeout: number;
  commandTimeout: number;
  maxRetries: number;
  retryDelay: number;
  autoReconnect: boolean;
  keepAliveInterval: number;
}

// Default BLE configuration
export const DEFAULT_BLE_CONFIG: BLEServiceConfig = {
  scanTimeout: 10000, // 10 seconds
  connectionTimeout: 15000, // 15 seconds
  commandTimeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  autoReconnect: true,
  keepAliveInterval: 30000 // 30 seconds
};