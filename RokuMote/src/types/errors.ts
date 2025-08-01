/**
 * Error Handling Types and Utilities
 * Defines comprehensive error handling for BLE operations
 */

import { BLEError, BLEErrorType } from './ble';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error category for grouping related errors
export enum ErrorCategory {
  BLUETOOTH = 'bluetooth',
  PERMISSION = 'permission',
  CONNECTION = 'connection',
  COMMUNICATION = 'communication',
  DEVICE = 'device',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  SYSTEM = 'system'
}

// Extended error interface with additional context
export interface ExtendedBLEError extends BLEError {
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: number;
  context?: Record<string, any>;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
  suggestedAction?: string;
  errorId: string;
}

// Error handler interface
export interface IErrorHandler {
  handleError(error: BLEError | Error, context?: Record<string, any>): ExtendedBLEError;
  createError(type: BLEErrorType, message: string, context?: Record<string, any>): ExtendedBLEError;
  isRecoverable(error: ExtendedBLEError): boolean;
  getSuggestedAction(error: ExtendedBLEError): string;
  formatUserMessage(error: ExtendedBLEError): string;
  logError(error: ExtendedBLEError): void;
}

// Error recovery strategy
export interface ErrorRecoveryStrategy {
  canRecover(error: ExtendedBLEError): boolean;
  recover(error: ExtendedBLEError): Promise<boolean>;
  getRecoverySteps(error: ExtendedBLEError): string[];
}

// Error statistics
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<BLEErrorType, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  lastError: ExtendedBLEError | null;
  errorRate: number;
  recoverySuccessRate: number;
}

// Error configuration
export interface ErrorConfig {
  enableLogging: boolean;
  enableUserNotifications: boolean;
  enableAutoRecovery: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Error mapping for BLE error types
export const BLE_ERROR_MAPPING: Record<BLEErrorType, {
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoverable: boolean;
  userMessage: string;
  suggestedAction: string;
}> = {
  [BLEErrorType.BLUETOOTH_DISABLED]: {
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.BLUETOOTH,
    recoverable: true,
    userMessage: 'Bluetooth is disabled. Please enable Bluetooth to use the remote.',
    suggestedAction: 'Go to Settings and enable Bluetooth'
  },
  [BLEErrorType.PERMISSION_DENIED]: {
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.PERMISSION,
    recoverable: true,
    userMessage: 'Bluetooth permissions are required to connect to your Roku device.',
    suggestedAction: 'Grant Bluetooth permissions in app settings'
  },
  [BLEErrorType.DEVICE_NOT_FOUND]: {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.DEVICE,
    recoverable: true,
    userMessage: 'No Roku devices found nearby. Make sure your Roku is on and discoverable.',
    suggestedAction: 'Check that your Roku device is powered on and try scanning again'
  },
  [BLEErrorType.CONNECTION_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.CONNECTION,
    recoverable: true,
    userMessage: 'Failed to connect to Roku device. Please try again.',
    suggestedAction: 'Move closer to your Roku device and try reconnecting'
  },
  [BLEErrorType.CONNECTION_LOST]: {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.CONNECTION,
    recoverable: true,
    userMessage: 'Connection to Roku device was lost.',
    suggestedAction: 'The app will try to reconnect automatically'
  },
  [BLEErrorType.COMMAND_FAILED]: {
    severity: ErrorSeverity.LOW,
    category: ErrorCategory.COMMUNICATION,
    recoverable: true,
    userMessage: 'Command failed to send. Please try again.',
    suggestedAction: 'Try pressing the button again'
  },
  [BLEErrorType.SERVICE_NOT_FOUND]: {
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.DEVICE,
    recoverable: false,
    userMessage: 'This device does not support remote control functionality.',
    suggestedAction: 'Make sure you are connecting to a compatible Roku device'
  },
  [BLEErrorType.CHARACTERISTIC_NOT_FOUND]: {
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.DEVICE,
    recoverable: false,
    userMessage: 'Device communication error. This may not be a compatible Roku device.',
    suggestedAction: 'Try connecting to a different Roku device'
  },
  [BLEErrorType.TIMEOUT]: {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.TIMEOUT,
    recoverable: true,
    userMessage: 'Operation timed out. Please try again.',
    suggestedAction: 'Check your connection and try again'
  },
  [BLEErrorType.UNKNOWN]: {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.SYSTEM,
    recoverable: true,
    userMessage: 'An unexpected error occurred. Please try again.',
    suggestedAction: 'Restart the app if the problem persists'
  }
};

// Default error configuration
export const DEFAULT_ERROR_CONFIG: ErrorConfig = {
  enableLogging: true,
  enableUserNotifications: true,
  enableAutoRecovery: true,
  maxRetryAttempts: 3,
  retryDelay: 1000,
  logLevel: 'error'
};

// Utility function to generate unique error IDs
export const generateErrorId = (): string => {
  return `ble_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};