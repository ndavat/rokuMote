/**
 * BLE Error Boundary Component
 * Specialized error boundary for BLE-related errors with recovery mechanisms
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BLEError, BLEErrorType } from '../types/ble';
import { ExtendedBLEError, ErrorSeverity } from '../types/errors';
import { defaultErrorHandler } from '../services/ble/ErrorHandler';

interface BLEErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: ExtendedBLEError) => void;
  onRecovery?: () => void;
  fallback?: (error: ExtendedBLEError, retry: () => void, recover: () => void) => ReactNode;
  testID?: string;
}

interface BLEErrorBoundaryState {
  hasError: boolean;
  error: ExtendedBLEError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
}

export class BLEErrorBoundary extends Component<BLEErrorBoundaryProps, BLEErrorBoundaryState> {
  private recoveryTimer: NodeJS.Timeout | null = null;

  constructor(props: BLEErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
      maxRecoveryAttempts: 3,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BLEErrorBoundaryState> {
    // Check if this is a BLE-related error
    const isBLEError = error.name?.includes('BLE') || 
                      error.message?.toLowerCase().includes('bluetooth') ||
                      error.message?.toLowerCase().includes('ble');

    if (isBLEError) {
      return {
        hasError: true,
      };
    }

    // Let other error boundaries handle non-BLE errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Convert to BLE error and handle
    const bleError: BLEError = {
      type: this.determineBLEErrorType(error),
      message: error.message,
      originalError: error
    };

    const extendedError = defaultErrorHandler.handleError(bleError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'BLEErrorBoundary'
    });

    this.setState({
      error: extendedError,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(extendedError);
    }

    // Attempt automatic recovery for recoverable errors
    if (defaultErrorHandler.isRecoverable(extendedError) && 
        this.state.recoveryAttempts < this.state.maxRecoveryAttempts) {
      this.attemptAutomaticRecovery(extendedError);
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }

  private determineBLEErrorType(error: Error): BLEErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('bluetooth') && message.includes('disabled')) {
      return BLEErrorType.BLUETOOTH_DISABLED;
    }
    if (message.includes('permission')) {
      return BLEErrorType.PERMISSION_DENIED;
    }
    if (message.includes('connection')) {
      return BLEErrorType.CONNECTION_FAILED;
    }
    if (message.includes('timeout')) {
      return BLEErrorType.TIMEOUT;
    }
    
    return BLEErrorType.UNKNOWN;
  }

  private attemptAutomaticRecovery = async (error: ExtendedBLEError) => {
    if (this.state.isRecovering) {
      return;
    }

    this.setState({ isRecovering: true });

    try {
      const recovered = await defaultErrorHandler.attemptRecovery(error);
      
      if (recovered) {
        this.handleSuccessfulRecovery();
      } else {
        this.handleFailedRecovery();
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      this.handleFailedRecovery();
    }
  };

  private handleSuccessfulRecovery = () => {
    this.setState({
      hasError: false,
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
    });

    if (this.props.onRecovery) {
      this.props.onRecovery();
    }
  };

  private handleFailedRecovery = () => {
    this.setState(prevState => ({
      isRecovering: false,
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
    });
  };

  private handleManualRecovery = () => {
    if (this.state.error) {
      this.attemptAutomaticRecovery(this.state.error);
    }
  };

  private showRecoverySteps = () => {
    if (!this.state.error) return;

    const steps = defaultErrorHandler.getSuggestedAction(this.state.error);
    const recoverySteps = steps.split('\n').filter(step => step.trim());

    Alert.alert(
      'Recovery Steps',
      recoverySteps.join('\n\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: this.handleManualRecovery }
      ]
    );
  };

  private renderDefaultFallback = () => {
    const { error, isRecovering, recoveryAttempts, maxRecoveryAttempts } = this.state;

    if (!error) return null;

    const userMessage = defaultErrorHandler.formatUserMessage(error);
    const canRetry = recoveryAttempts < maxRecoveryAttempts;
    const isRecoverable = defaultErrorHandler.isRecoverable(error);

    return (
      <LinearGradient
        colors={['#1A1B2E', '#16213E']}
        style={styles.container}
        testID={`${this.props.testID}-ble-error-boundary`}
      >
        <View style={styles.content}>
          {/* Error Icon based on severity */}
          <Text style={styles.errorIcon}>
            {error.severity === ErrorSeverity.CRITICAL ? '🚨' : 
             error.severity === ErrorSeverity.HIGH ? '⚠️' : 
             error.severity === ErrorSeverity.MEDIUM ? '⚡' : '💡'}
          </Text>
          
          <Text style={styles.title}>Bluetooth Connection Issue</Text>
          
          <Text style={styles.message}>
            {userMessage}
          </Text>

          {/* Recovery status */}
          {isRecovering && (
            <View style={styles.recoveryStatus}>
              <Text style={styles.recoveryText}>
                🔄 Attempting to recover... ({recoveryAttempts + 1}/{maxRecoveryAttempts})
              </Text>
            </View>
          )}

          {/* Error details (collapsible) */}
          <View style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Technical Details:</Text>
            <Text style={styles.errorText} numberOfLines={2}>
              {error.technicalMessage}
            </Text>
            <Text style={styles.errorId}>
              Error ID: {error.errorId}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            {isRecoverable && canRetry && !isRecovering && (
              <TouchableOpacity
                style={[styles.button, styles.recoveryButton]}
                onPress={this.handleManualRecovery}
                testID={`${this.props.testID}-recovery-button`}
              >
                <Text style={styles.buttonText}>Auto Recover</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={this.handleManualRetry}
              disabled={isRecovering}
              testID={`${this.props.testID}-retry-button`}
            >
              <Text style={styles.buttonText}>
                {isRecovering ? 'Recovering...' : 'Try Again'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.helpButton]}
              onPress={this.showRecoverySteps}
              testID={`${this.props.testID}-help-button`}
            >
              <Text style={styles.buttonText}>Show Help</Text>
            </TouchableOpacity>
          </View>

          {/* Recovery attempts indicator */}
          {recoveryAttempts > 0 && (
            <Text style={styles.attemptsText}>
              Recovery attempts: {recoveryAttempts}/{maxRecoveryAttempts}
            </Text>
          )}

          <Text style={styles.helpText}>
            If this problem persists, try restarting the app or check your Bluetooth settings.
          </Text>
        </View>
      </LinearGradient>
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(
          this.state.error,
          this.handleManualRetry,
          this.handleManualRecovery
        );
      }

      return this.renderDefaultFallback();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  recoveryStatus: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  recoveryText: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#A0AEC0',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  errorId: {
    fontSize: 9,
    color: '#718096',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
  },
  recoveryButton: {
    backgroundColor: '#10B981',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
  },
  helpButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 12,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
});