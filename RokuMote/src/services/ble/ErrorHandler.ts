/**
 * BLE Error Handler Implementation
 * Provides comprehensive error handling, recovery, and logging for BLE operations
 */

import {
  BLEError,
  BLEErrorType
} from '../../types/ble';
import {
  ExtendedBLEError,
  IErrorHandler,
  ErrorRecoveryStrategy,
  ErrorStats,
  ErrorConfig,
  ErrorSeverity,
  ErrorCategory,
  BLE_ERROR_MAPPING,
  DEFAULT_ERROR_CONFIG,
  generateErrorId
} from '../../types/errors';

/**
 * Concrete implementation of the error handler interface
 */
export class ErrorHandler implements IErrorHandler {
  private config: ErrorConfig;
  private stats: ErrorStats;
  private recoveryStrategies: Map<BLEErrorType, ErrorRecoveryStrategy>;

  constructor(config: Partial<ErrorConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    this.stats = this.initializeStats();
    this.recoveryStrategies = new Map();
    this.setupRecoveryStrategies();
  }

  /**
   * Handle any error and convert it to an ExtendedBLEError
   */
  handleError(error: BLEError | Error, context?: Record<string, any>): ExtendedBLEError {
    let bleError: BLEError;

    // Handle null/undefined errors
    if (!error) {
      bleError = {
        type: BLEErrorType.UNKNOWN,
        message: 'Unknown error occurred',
      };
    }
    // Convert generic Error to BLEError if needed
    else if (error instanceof Error && !('type' in error)) {
      bleError = {
        type: BLEErrorType.UNKNOWN,
        message: error.message,
        originalError: error
      };
    } 
    // Handle malformed objects
    else if (typeof error === 'object' && !('type' in error)) {
      bleError = {
        type: BLEErrorType.UNKNOWN,
        message: (error as any).message || 'Malformed error object',
      };
    }
    else {
      bleError = error as BLEError;
    }

    const extendedError = this.createError(bleError.type, bleError.message, {
      ...context,
      originalError: bleError.originalError,
      code: bleError.code
    });

    this.updateStats(extendedError);
    this.logError(extendedError);

    return extendedError;
  }

  /**
   * Create a new ExtendedBLEError with full context
   */
  createError(type: BLEErrorType, message: string, context?: Record<string, any>): ExtendedBLEError {
    const mapping = BLE_ERROR_MAPPING[type] || BLE_ERROR_MAPPING[BLEErrorType.UNKNOWN];
    const errorId = generateErrorId();

    const extendedError: ExtendedBLEError = {
      type,
      message,
      code: context?.code,
      originalError: context?.originalError,
      severity: mapping.severity,
      category: mapping.category,
      timestamp: Date.now(),
      context: context || {},
      recoverable: mapping.recoverable,
      userMessage: mapping.userMessage,
      technicalMessage: message,
      suggestedAction: mapping.suggestedAction,
      errorId
    };

    return extendedError;
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: ExtendedBLEError): boolean {
    return error.recoverable && this.recoveryStrategies.has(error.type);
  }

  /**
   * Get suggested action for an error
   */
  getSuggestedAction(error: ExtendedBLEError): string {
    const strategy = this.recoveryStrategies.get(error.type);
    if (strategy) {
      const steps = strategy.getRecoverySteps(error);
      return steps.length > 0 ? steps[0] : error.suggestedAction || 'Please try again';
    }
    return error.suggestedAction || 'Please try again';
  }

  /**
   * Format user-friendly error message
   */
  formatUserMessage(error: ExtendedBLEError): string {
    let message = error.userMessage;
    
    if (error.context?.deviceName) {
      message = message.replace('Roku device', `${error.context.deviceName}`);
    }

    if (error.severity === ErrorSeverity.CRITICAL) {
      message = `⚠️ ${message}`;
    }

    return message;
  }

  /**
   * Log error based on configuration
   */
  logError(error: ExtendedBLEError): void {
    if (!this.config.enableLogging) {
      return;
    }

    const logData = {
      errorId: error.errorId,
      type: error.type,
      severity: error.severity,
      category: error.category,
      message: error.technicalMessage,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('[BLE Error - Critical]', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('[BLE Error - High]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[BLE Error - Medium]', logData);
        break;
      case ErrorSeverity.LOW:
        if (this.config.logLevel === 'debug') {
          console.info('[BLE Error - Low]', logData);
        }
        break;
    }
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error: ExtendedBLEError): Promise<boolean> {
    if (!this.isRecoverable(error)) {
      return false;
    }

    const strategy = this.recoveryStrategies.get(error.type);
    if (!strategy) {
      return false;
    }

    try {
      const recovered = await strategy.recover(error);
      if (recovered) {
        this.stats.recoverySuccessRate = this.calculateRecoverySuccessRate(true);
      } else {
        this.stats.recoverySuccessRate = this.calculateRecoverySuccessRate(false);
      }
      return recovered;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      this.stats.recoverySuccessRate = this.calculateRecoverySuccessRate(false);
      return false;
    }
  }

  /**
   * Get current error statistics
   */
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * Reset error statistics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorConfig {
    return { ...this.config };
  }

  /**
   * Initialize error statistics
   */
  private initializeStats(): ErrorStats {
    return {
      totalErrors: 0,
      errorsByType: Object.values(BLEErrorType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<BLEErrorType, number>),
      errorsByCategory: Object.values(ErrorCategory).reduce((acc, category) => {
        acc[category] = 0;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      errorsBySeverity: Object.values(ErrorSeverity).reduce((acc, severity) => {
        acc[severity] = 0;
        return acc;
      }, {} as Record<ErrorSeverity, number>),
      lastError: null,
      errorRate: 0,
      recoverySuccessRate: 0
    };
  } 
 /**
   * Update error statistics
   */
  private updateStats(error: ExtendedBLEError): void {
    this.stats.totalErrors++;
    this.stats.errorsByType[error.type]++;
    this.stats.errorsByCategory[error.category]++;
    this.stats.errorsBySeverity[error.severity]++;
    this.stats.lastError = error;
    
    // Calculate error rate (errors per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    // This is a simplified calculation - in a real implementation,
    // you might want to maintain a sliding window of errors
    this.stats.errorRate = this.stats.totalErrors;
  }

  /**
   * Calculate recovery success rate
   */
  private calculateRecoverySuccessRate(success: boolean): number {
    // This is a simplified calculation - in a real implementation,
    // you would track recovery attempts and successes separately
    return success ? Math.min(this.stats.recoverySuccessRate + 0.1, 1.0) : 
                    Math.max(this.stats.recoverySuccessRate - 0.1, 0.0);
  }

  /**
   * Setup recovery strategies for different error types
   */
  private setupRecoveryStrategies(): void {
    // Bluetooth disabled recovery
    this.recoveryStrategies.set(BLEErrorType.BLUETOOTH_DISABLED, {
      canRecover: (error) => true,
      recover: async (error) => {
        // In a real implementation, this would attempt to enable Bluetooth
        // For now, we just return false as this requires user action
        return false;
      },
      getRecoverySteps: (error) => [
        'Enable Bluetooth in device settings',
        'Restart the app',
        'Try connecting again'
      ]
    });

    // Permission denied recovery
    this.recoveryStrategies.set(BLEErrorType.PERMISSION_DENIED, {
      canRecover: (error) => true,
      recover: async (error) => {
        // In a real implementation, this would request permissions
        return false;
      },
      getRecoverySteps: (error) => [
        'Grant Bluetooth permissions in app settings',
        'Restart the app',
        'Try connecting again'
      ]
    });

    // Connection failed recovery
    this.recoveryStrategies.set(BLEErrorType.CONNECTION_FAILED, {
      canRecover: (error) => true,
      recover: async (error) => {
        // Implement retry logic with exponential backoff
        await this.delay(this.config.retryDelay);
        return true; // Indicate that retry should be attempted
      },
      getRecoverySteps: (error) => [
        'Move closer to the Roku device',
        'Check that the device is powered on',
        'Try connecting again'
      ]
    });

    // Connection lost recovery
    this.recoveryStrategies.set(BLEErrorType.CONNECTION_LOST, {
      canRecover: (error) => true,
      recover: async (error) => {
        if (this.config.enableAutoRecovery) {
          await this.delay(this.config.retryDelay);
          return true; // Indicate that reconnection should be attempted
        }
        return false;
      },
      getRecoverySteps: (error) => [
        'Check Bluetooth connection',
        'Move closer to the device',
        'The app will try to reconnect automatically'
      ]
    });

    // Command failed recovery
    this.recoveryStrategies.set(BLEErrorType.COMMAND_FAILED, {
      canRecover: (error) => true,
      recover: async (error) => {
        await this.delay(500); // Short delay before retry
        return true;
      },
      getRecoverySteps: (error) => [
        'Try the command again',
        'Check connection stability'
      ]
    });

    // Timeout recovery
    this.recoveryStrategies.set(BLEErrorType.TIMEOUT, {
      canRecover: (error) => true,
      recover: async (error) => {
        await this.delay(this.config.retryDelay);
        return true;
      },
      getRecoverySteps: (error) => [
        'Check connection stability',
        'Try the operation again',
        'Move closer to the device'
      ]
    });
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default error handler instance
 */
export const defaultErrorHandler = new ErrorHandler();