/**
 * Error Recovery Service
 * Provides comprehensive error recovery mechanisms for BLE operations
 */

import { EventEmitter } from 'events';
import { BLEError, BLEErrorType, ConnectionStatus } from '../types/ble';
import { ExtendedBLEError, ErrorSeverity, ErrorCategory } from '../types/errors';
import { defaultErrorHandler } from './ble/ErrorHandler';

export interface RecoveryAttempt {
  errorId: string;
  errorType: BLEErrorType;
  timestamp: number;
  strategy: string;
  success: boolean;
  duration: number;
  retryCount: number;
}

export interface RecoveryConfig {
  maxRetryAttempts: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  maxBackoffDelay: number;
  enableAutoRecovery: boolean;
  criticalErrorThreshold: number;
  recoveryTimeout: number;
}

export interface RecoveryStats {
  totalAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  recoveryRate: number;
  lastRecoveryAttempt: RecoveryAttempt | null;
}

export enum RecoveryEvent {
  RECOVERY_STARTED = 'recovery_started',
  RECOVERY_PROGRESS = 'recovery_progress',
  RECOVERY_SUCCESS = 'recovery_success',
  RECOVERY_FAILED = 'recovery_failed',
  RECOVERY_TIMEOUT = 'recovery_timeout',
  AUTO_RECOVERY_DISABLED = 'auto_recovery_disabled'
}

const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxRetryAttempts: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  maxBackoffDelay: 10000,
  enableAutoRecovery: true,
  criticalErrorThreshold: 5,
  recoveryTimeout: 30000
};

export class ErrorRecoveryService extends EventEmitter {
  private config: RecoveryConfig;
  private stats: RecoveryStats;
  private recoveryAttempts: Map<string, RecoveryAttempt[]>;
  private activeRecoveries: Set<string>;
  private criticalErrorCount: number;
  private lastCriticalErrorTime: number;

  constructor(config?: Partial<RecoveryConfig>) {
    super();
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.stats = this.initializeStats();
    this.recoveryAttempts = new Map();
    this.activeRecoveries = new Set();
    this.criticalErrorCount = 0;
    this.lastCriticalErrorTime = 0;
  }

  /**
   * Attempt to recover from an error with comprehensive retry logic
   */
  async recoverFromError(error: ExtendedBLEError): Promise<boolean> {
    const startTime = Date.now();
    const errorId = error.errorId;

    // Check if recovery is already in progress for this error
    if (this.activeRecoveries.has(errorId)) {
      return false;
    }

    // Check if auto-recovery is disabled due to too many critical errors
    if (!this.shouldAttemptRecovery(error)) {
      this.emit(RecoveryEvent.AUTO_RECOVERY_DISABLED, { error, reason: 'Too many critical errors' });
      return false;
    }

    this.activeRecoveries.add(errorId);
    this.emit(RecoveryEvent.RECOVERY_STARTED, { error, timestamp: startTime });

    try {
      const success = await this.executeRecoveryStrategy(error);
      const duration = Date.now() - startTime;

      const attempt: RecoveryAttempt = {
        errorId,
        errorType: error.type,
        timestamp: startTime,
        strategy: this.getRecoveryStrategy(error),
        success,
        duration,
        retryCount: this.getRetryCount(errorId)
      };

      this.recordRecoveryAttempt(attempt);

      if (success) {
        this.emit(RecoveryEvent.RECOVERY_SUCCESS, { error, attempt });
        this.resetCriticalErrorCount();
      } else {
        this.emit(RecoveryEvent.RECOVERY_FAILED, { error, attempt });
        this.handleRecoveryFailure(error);
      }

      return success;
    } catch (recoveryError) {
      const duration = Date.now() - startTime;
      const attempt: RecoveryAttempt = {
        errorId,
        errorType: error.type,
        timestamp: startTime,
        strategy: this.getRecoveryStrategy(error),
        success: false,
        duration,
        retryCount: this.getRetryCount(errorId)
      };

      this.recordRecoveryAttempt(attempt);
      this.emit(RecoveryEvent.RECOVERY_FAILED, { error, attempt, recoveryError });
      this.handleRecoveryFailure(error);

      return false;
    } finally {
      this.activeRecoveries.delete(errorId);
    }
  }

  /**
   * Execute specific recovery strategy based on error type
   */
  private async executeRecoveryStrategy(error: ExtendedBLEError): Promise<boolean> {
    const strategy = this.getRecoveryStrategy(error);
    const retryCount = this.getRetryCount(error.errorId);

    this.emit(RecoveryEvent.RECOVERY_PROGRESS, { 
      error, 
      strategy, 
      retryCount,
      maxRetries: this.config.maxRetryAttempts 
    });

    switch (error.type) {
      case BLEErrorType.BLUETOOTH_DISABLED:
        return await this.recoverFromBluetoothDisabled(error);
      
      case BLEErrorType.PERMISSION_DENIED:
        return await this.recoverFromPermissionDenied(error);
      
      case BLEErrorType.CONNECTION_FAILED:
      case BLEErrorType.CONNECTION_LOST:
        return await this.recoverFromConnectionIssue(error, retryCount);
      
      case BLEErrorType.COMMAND_FAILED:
        return await this.recoverFromCommandFailure(error, retryCount);
      
      case BLEErrorType.TIMEOUT:
        return await this.recoverFromTimeout(error, retryCount);
      
      case BLEErrorType.DEVICE_NOT_FOUND:
        return await this.recoverFromDeviceNotFound(error);
      
      case BLEErrorType.SERVICE_NOT_FOUND:
      case BLEErrorType.CHARACTERISTIC_NOT_FOUND:
        return await this.recoverFromServiceIssue(error);
      
      default:
        return await this.recoverFromUnknownError(error, retryCount);
    }
  }

  /**
   * Recovery strategy for Bluetooth disabled errors
   */
  private async recoverFromBluetoothDisabled(error: ExtendedBLEError): Promise<boolean> {
    // Cannot programmatically enable Bluetooth, but we can guide the user
    // and wait for them to enable it
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          // This would check if Bluetooth is now enabled
          // For now, we'll simulate a check
          const isEnabled = await this.checkBluetoothStatus();
          if (isEnabled) {
            clearInterval(checkInterval);
            resolve(true);
          }
        } catch (checkError) {
          // Continue checking
        }
      }, 2000);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, this.config.recoveryTimeout);
    });
  }

  /**
   * Recovery strategy for permission denied errors
   */
  private async recoverFromPermissionDenied(error: ExtendedBLEError): Promise<boolean> {
    // Similar to Bluetooth disabled, we need user action
    // We can attempt to re-request permissions
    try {
      // This would attempt to request permissions again
      const granted = await this.requestBluetoothPermissions();
      return granted;
    } catch (permissionError) {
      return false;
    }
  }

  /**
   * Recovery strategy for connection issues
   */
  private async recoverFromConnectionIssue(error: ExtendedBLEError, retryCount: number): Promise<boolean> {
    const delay = this.calculateRetryDelay(retryCount);
    
    // Wait before retrying
    await this.delay(delay);
    
    try {
      // Attempt to reconnect
      const reconnected = await this.attemptReconnection(error);
      return reconnected;
    } catch (reconnectionError) {
      return false;
    }
  }

  /**
   * Recovery strategy for command failures
   */
  private async recoverFromCommandFailure(error: ExtendedBLEError, retryCount: number): Promise<boolean> {
    const delay = Math.min(500 * (retryCount + 1), 2000); // Short delay for command retries
    
    await this.delay(delay);
    
    try {
      // Check connection status first
      const isConnected = await this.checkConnectionStatus();
      if (!isConnected) {
        // Try to reconnect first
        const reconnected = await this.attemptReconnection(error);
        if (!reconnected) {
          return false;
        }
      }
      
      // Command retry would be handled by the calling code
      return true;
    } catch (retryError) {
      return false;
    }
  }

  /**
   * Recovery strategy for timeout errors
   */
  private async recoverFromTimeout(error: ExtendedBLEError, retryCount: number): Promise<boolean> {
    const delay = this.calculateRetryDelay(retryCount);
    
    await this.delay(delay);
    
    try {
      // Check if the connection is still valid
      const isConnected = await this.checkConnectionStatus();
      if (isConnected) {
        // Connection is good, timeout was likely temporary
        return true;
      } else {
        // Connection lost, attempt to reconnect
        return await this.attemptReconnection(error);
      }
    } catch (recoveryError) {
      return false;
    }
  }

  /**
   * Recovery strategy for device not found errors
   */
  private async recoverFromDeviceNotFound(error: ExtendedBLEError): Promise<boolean> {
    try {
      // Attempt a new scan
      const devicesFound = await this.performDeviceScan();
      return devicesFound > 0;
    } catch (scanError) {
      return false;
    }
  }

  /**
   * Recovery strategy for service/characteristic issues
   */
  private async recoverFromServiceIssue(error: ExtendedBLEError): Promise<boolean> {
    try {
      // Disconnect and reconnect to refresh service discovery
      await this.disconnectDevice();
      await this.delay(1000);
      return await this.attemptReconnection(error);
    } catch (serviceRecoveryError) {
      return false;
    }
  }

  /**
   * Recovery strategy for unknown errors
   */
  private async recoverFromUnknownError(error: ExtendedBLEError, retryCount: number): Promise<boolean> {
    const delay = this.calculateRetryDelay(retryCount);
    
    await this.delay(delay);
    
    // Generic recovery: check connection and attempt reconnect if needed
    try {
      const isConnected = await this.checkConnectionStatus();
      if (!isConnected) {
        return await this.attemptReconnection(error);
      }
      return true;
    } catch (genericRecoveryError) {
      return false;
    }
  }

  /**
   * Helper methods for recovery operations
   */
  private async checkBluetoothStatus(): Promise<boolean> {
    // This would check actual Bluetooth status
    // For now, simulate a check
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.3), 100));
  }

  private async requestBluetoothPermissions(): Promise<boolean> {
    // This would request actual permissions
    // For now, simulate permission request
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.5), 500));
  }

  private async checkConnectionStatus(): Promise<boolean> {
    // This would check actual connection status
    // For now, simulate a check
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.4), 100));
  }

  private async attemptReconnection(error: ExtendedBLEError): Promise<boolean> {
    // This would attempt actual reconnection
    // For now, simulate reconnection attempt
    return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.3), 1000));
  }

  private async performDeviceScan(): Promise<number> {
    // This would perform actual device scan
    // For now, simulate scan
    return new Promise(resolve => setTimeout(() => resolve(Math.floor(Math.random() * 3)), 2000));
  }

  private async disconnectDevice(): Promise<void> {
    // This would disconnect actual device
    // For now, simulate disconnect
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Utility methods
   */
  private shouldAttemptRecovery(error: ExtendedBLEError): boolean {
    if (!this.config.enableAutoRecovery) {
      return false;
    }

    // Don't attempt recovery for non-recoverable errors
    if (!error.recoverable) {
      return false;
    }

    // Check if we've exceeded critical error threshold
    if (error.severity === ErrorSeverity.CRITICAL) {
      const now = Date.now();
      if (now - this.lastCriticalErrorTime < 60000) { // Within 1 minute
        this.criticalErrorCount++;
      } else {
        this.criticalErrorCount = 1;
      }
      this.lastCriticalErrorTime = now;

      if (this.criticalErrorCount >= this.config.criticalErrorThreshold) {
        return false;
      }
    }

    // Check retry count for this specific error
    const retryCount = this.getRetryCount(error.errorId);
    return retryCount < this.config.maxRetryAttempts;
  }

  private getRecoveryStrategy(error: ExtendedBLEError): string {
    switch (error.type) {
      case BLEErrorType.BLUETOOTH_DISABLED:
        return 'bluetooth_enable_wait';
      case BLEErrorType.PERMISSION_DENIED:
        return 'permission_request';
      case BLEErrorType.CONNECTION_FAILED:
      case BLEErrorType.CONNECTION_LOST:
        return 'reconnection_attempt';
      case BLEErrorType.COMMAND_FAILED:
        return 'command_retry';
      case BLEErrorType.TIMEOUT:
        return 'timeout_retry';
      case BLEErrorType.DEVICE_NOT_FOUND:
        return 'device_rescan';
      case BLEErrorType.SERVICE_NOT_FOUND:
      case BLEErrorType.CHARACTERISTIC_NOT_FOUND:
        return 'service_rediscovery';
      default:
        return 'generic_retry';
    }
  }

  private getRetryCount(errorId: string): number {
    const attempts = this.recoveryAttempts.get(errorId) || [];
    return attempts.length;
  }

  private calculateRetryDelay(retryCount: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelay;
    }

    const delay = this.config.retryDelay * Math.pow(2, retryCount);
    return Math.min(delay, this.config.maxBackoffDelay);
  }

  private recordRecoveryAttempt(attempt: RecoveryAttempt): void {
    const attempts = this.recoveryAttempts.get(attempt.errorId) || [];
    attempts.push(attempt);
    this.recoveryAttempts.set(attempt.errorId, attempts);

    // Update stats
    this.stats.totalAttempts++;
    if (attempt.success) {
      this.stats.successfulRecoveries++;
    } else {
      this.stats.failedRecoveries++;
    }

    this.stats.recoveryRate = this.stats.totalAttempts > 0 
      ? this.stats.successfulRecoveries / this.stats.totalAttempts 
      : 0;

    this.stats.averageRecoveryTime = this.calculateAverageRecoveryTime();
    this.stats.lastRecoveryAttempt = attempt;
  }

  private calculateAverageRecoveryTime(): number {
    let totalTime = 0;
    let count = 0;

    for (const attempts of this.recoveryAttempts.values()) {
      for (const attempt of attempts) {
        if (attempt.success) {
          totalTime += attempt.duration;
          count++;
        }
      }
    }

    return count > 0 ? totalTime / count : 0;
  }

  private handleRecoveryFailure(error: ExtendedBLEError): void {
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.criticalErrorCount++;
    }
  }

  private resetCriticalErrorCount(): void {
    this.criticalErrorCount = 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeStats(): RecoveryStats {
    return {
      totalAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      recoveryRate: 0,
      lastRecoveryAttempt: null
    };
  }

  /**
   * Public API methods
   */
  getStats(): RecoveryStats {
    return { ...this.stats };
  }

  getRecoveryHistory(errorId?: string): RecoveryAttempt[] {
    if (errorId) {
      return [...(this.recoveryAttempts.get(errorId) || [])];
    }

    const allAttempts: RecoveryAttempt[] = [];
    for (const attempts of this.recoveryAttempts.values()) {
      allAttempts.push(...attempts);
    }

    return allAttempts.sort((a, b) => b.timestamp - a.timestamp);
  }

  updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RecoveryConfig {
    return { ...this.config };
  }

  clearHistory(): void {
    this.recoveryAttempts.clear();
    this.stats = this.initializeStats();
  }

  isRecoveryInProgress(errorId?: string): boolean {
    if (errorId) {
      return this.activeRecoveries.has(errorId);
    }
    return this.activeRecoveries.size > 0;
  }
}

// Default instance
export const defaultRecoveryService = new ErrorRecoveryService();