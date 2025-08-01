/**
 * Error Handling Hook
 * Provides comprehensive error handling capabilities for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { BLEError, BLEErrorType } from '../types/ble';
import { ExtendedBLEError, ErrorSeverity, ErrorCategory } from '../types/errors';
import { defaultErrorHandler } from '../services/ble/ErrorHandler';
import { defaultRecoveryService, RecoveryEvent } from '../services/ErrorRecoveryService';

export interface ErrorHandlingState {
  currentError: ExtendedBLEError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  showNotification: boolean;
  errorHistory: ExtendedBLEError[];
}

export interface ErrorHandlingOptions {
  enableAutoRecovery?: boolean;
  enableNotifications?: boolean;
  maxErrorHistory?: number;
  autoHideNotifications?: boolean;
  notificationDuration?: number;
  onError?: (error: ExtendedBLEError) => void;
  onRecovery?: (error: ExtendedBLEError, success: boolean) => void;
}

export interface ErrorHandlingActions {
  handleError: (error: BLEError | Error, context?: Record<string, any>) => ExtendedBLEError;
  clearError: () => void;
  retryLastOperation: () => Promise<boolean>;
  recoverFromError: (error?: ExtendedBLEError) => Promise<boolean>;
  showErrorDialog: (error: ExtendedBLEError) => void;
  dismissNotification: () => void;
  getErrorStats: () => any;
  clearErrorHistory: () => void;
}

const DEFAULT_OPTIONS: Required<ErrorHandlingOptions> = {
  enableAutoRecovery: true,
  enableNotifications: true,
  maxErrorHistory: 50,
  autoHideNotifications: true,
  notificationDuration: 5000,
  onError: () => {},
  onRecovery: () => {},
};

export function useErrorHandling(options: ErrorHandlingOptions = {}): [ErrorHandlingState, ErrorHandlingActions] {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<ErrorHandlingState>({
    currentError: null,
    isRecovering: false,
    recoveryAttempts: 0,
    showNotification: false,
    errorHistory: [],
  });

  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle recovery events
  useEffect(() => {
    const handleRecoveryStarted = (data: any) => {
      setState(prev => ({
        ...prev,
        isRecovering: true,
      }));
    };

    const handleRecoverySuccess = (data: any) => {
      setState(prev => ({
        ...prev,
        isRecovering: false,
        currentError: null,
        showNotification: false,
        recoveryAttempts: 0,
      }));

      config.onRecovery(data.error, true);
    };

    const handleRecoveryFailed = (data: any) => {
      setState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryAttempts: prev.recoveryAttempts + 1,
      }));

      config.onRecovery(data.error, false);
    };

    defaultRecoveryService.on(RecoveryEvent.RECOVERY_STARTED, handleRecoveryStarted);
    defaultRecoveryService.on(RecoveryEvent.RECOVERY_SUCCESS, handleRecoverySuccess);
    defaultRecoveryService.on(RecoveryEvent.RECOVERY_FAILED, handleRecoveryFailed);

    return () => {
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_STARTED, handleRecoveryStarted);
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_SUCCESS, handleRecoverySuccess);
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_FAILED, handleRecoveryFailed);
    };
  }, [config]);

  // Auto-hide notifications
  useEffect(() => {
    if (state.showNotification && config.autoHideNotifications && state.currentError) {
      // Only auto-hide low severity errors
      if (state.currentError.severity === ErrorSeverity.LOW) {
        notificationTimerRef.current = setTimeout(() => {
          dismissNotification();
        }, config.notificationDuration);
      }
    }

    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, [state.showNotification, state.currentError, config]);

  const handleError = useCallback((
    error: BLEError | Error, 
    context?: Record<string, any>
  ): ExtendedBLEError => {
    const extendedError = defaultErrorHandler.handleError(error, context);

    setState(prev => {
      const newHistory = [extendedError, ...prev.errorHistory].slice(0, config.maxErrorHistory);
      
      return {
        ...prev,
        currentError: extendedError,
        showNotification: config.enableNotifications,
        errorHistory: newHistory,
        recoveryAttempts: 0,
      };
    });

    // Call error callback
    config.onError(extendedError);

    // Attempt auto-recovery for recoverable errors
    if (config.enableAutoRecovery && defaultErrorHandler.isRecoverable(extendedError)) {
      // Don't await this to avoid blocking the UI
      recoverFromError(extendedError).catch(recoveryError => {
        console.error('Auto-recovery failed:', recoveryError);
      });
    }

    return extendedError;
  }, [config]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentError: null,
      showNotification: false,
      isRecovering: false,
      recoveryAttempts: 0,
    }));

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const retryLastOperation = useCallback(async (): Promise<boolean> => {
    if (!lastOperationRef.current) {
      return false;
    }

    try {
      await lastOperationRef.current();
      clearError();
      return true;
    } catch (error) {
      handleError(error as Error);
      return false;
    }
  }, [handleError, clearError]);

  const recoverFromError = useCallback(async (error?: ExtendedBLEError): Promise<boolean> => {
    const targetError = error || state.currentError;
    if (!targetError) {
      return false;
    }

    try {
      const success = await defaultRecoveryService.recoverFromError(targetError);
      
      if (success) {
        clearError();
      }
      
      return success;
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return false;
    }
  }, [state.currentError, clearError]);

  const showErrorDialog = useCallback((error: ExtendedBLEError) => {
    const userMessage = defaultErrorHandler.formatUserMessage(error);
    const suggestedAction = defaultErrorHandler.getSuggestedAction(error);
    const isRecoverable = defaultErrorHandler.isRecoverable(error);

    const buttons: any[] = [
      { text: 'Dismiss', style: 'cancel' },
    ];

    if (isRecoverable) {
      buttons.unshift({
        text: 'Auto Fix',
        onPress: () => recoverFromError(error),
      });
    }

    buttons.unshift({
      text: 'Try Again',
      onPress: () => retryLastOperation(),
    });

    Alert.alert(
      'Error Occurred',
      `${userMessage}\n\n${suggestedAction}`,
      buttons
    );
  }, [recoverFromError, retryLastOperation]);

  const dismissNotification = useCallback(() => {
    setState(prev => ({
      ...prev,
      showNotification: false,
    }));

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const getErrorStats = useCallback(() => {
    const recoveryStats = defaultRecoveryService.getStats();
    const errorStats = defaultErrorHandler.getStats();

    return {
      recovery: recoveryStats,
      errors: errorStats,
      currentSession: {
        totalErrors: state.errorHistory.length,
        currentError: state.currentError,
        isRecovering: state.isRecovering,
        recoveryAttempts: state.recoveryAttempts,
      },
    };
  }, [state]);

  const clearErrorHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      errorHistory: [],
    }));
  }, []);

  // Store last operation for retry functionality
  const setLastOperation = useCallback((operation: () => Promise<any>) => {
    lastOperationRef.current = operation;
  }, []);

  const actions: ErrorHandlingActions = {
    handleError,
    clearError,
    retryLastOperation,
    recoverFromError,
    showErrorDialog,
    dismissNotification,
    getErrorStats,
    clearErrorHistory,
  };

  return [state, actions];
}

/**
 * Hook for handling specific BLE operations with error handling
 */
export function useBLEOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: ErrorHandlingOptions = {}
) {
  const [errorState, errorActions] = useErrorHandling(options);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<R | null>(null);

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    setIsLoading(true);
    errorActions.clearError();

    try {
      const operationResult = await operation(...args);
      setResult(operationResult);
      return operationResult;
    } catch (error) {
      const extendedError = errorActions.handleError(error as Error, {
        operation: operation.name,
        arguments: args,
      });
      
      // Store operation for retry
      const retryOperation = () => operation(...args);
      (errorActions as any).setLastOperation = retryOperation;
      
      throw extendedError;
    } finally {
      setIsLoading(false);
    }
  }, [operation, errorActions]);

  const retry = useCallback(async (): Promise<R | null> => {
    return await errorActions.retryLastOperation() ? result : null;
  }, [errorActions, result]);

  return {
    execute,
    retry,
    isLoading,
    result,
    error: errorState.currentError,
    isRecovering: errorState.isRecovering,
    ...errorActions,
  };
}

/**
 * Hook for handling connection-specific errors
 */
export function useConnectionErrorHandling(options: ErrorHandlingOptions = {}) {
  const connectionOptions = {
    ...options,
    enableAutoRecovery: options.enableAutoRecovery ?? true,
    onError: (error: ExtendedBLEError) => {
      // Log connection-specific errors
      console.log(`Connection error [${error.category}]:`, error.userMessage);
      options.onError?.(error);
    },
  };

  return useErrorHandling(connectionOptions);
}

/**
 * Hook for handling command-specific errors
 */
export function useCommandErrorHandling(options: ErrorHandlingOptions = {}) {
  const commandOptions = {
    ...options,
    enableAutoRecovery: options.enableAutoRecovery ?? true,
    autoHideNotifications: options.autoHideNotifications ?? true,
    notificationDuration: options.notificationDuration ?? 3000,
    onError: (error: ExtendedBLEError) => {
      // Log command-specific errors
      console.log(`Command error [${error.type}]:`, error.userMessage);
      options.onError?.(error);
    },
  };

  return useErrorHandling(commandOptions);
}