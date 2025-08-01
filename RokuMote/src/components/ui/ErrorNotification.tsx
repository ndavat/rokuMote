/**
 * Error Notification Component
 * Displays user-friendly error messages with recovery options
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExtendedBLEError, ErrorSeverity } from '../../types/errors';
import { defaultErrorHandler } from '../../services/ble/ErrorHandler';
import { defaultRecoveryService, RecoveryEvent } from '../../services/ErrorRecoveryService';

interface ErrorNotificationProps {
  error: ExtendedBLEError | null;
  visible: boolean;
  onDismiss: () => void;
  onRetry?: () => void;
  onRecover?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  testID?: string;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  visible,
  onDismiss,
  onRetry,
  onRecover,
  autoHide = false,
  autoHideDelay = 5000,
  testID = 'error-notification'
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState('');

  useEffect(() => {
    if (visible && error) {
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide for low severity errors
      if (autoHide && error.severity === ErrorSeverity.LOW) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, error, slideAnim, autoHide, autoHideDelay]);

  useEffect(() => {
    // Listen for recovery events
    const handleRecoveryStarted = () => {
      setIsRecovering(true);
      setRecoveryProgress('Starting recovery...');
    };

    const handleRecoveryProgress = (data: any) => {
      setRecoveryProgress(`Attempting ${data.strategy}... (${data.retryCount + 1}/${data.maxRetries})`);
    };

    const handleRecoverySuccess = () => {
      setIsRecovering(false);
      setRecoveryProgress('');
      handleDismiss();
    };

    const handleRecoveryFailed = () => {
      setIsRecovering(false);
      setRecoveryProgress('Recovery failed');
      setTimeout(() => setRecoveryProgress(''), 2000);
    };

    defaultRecoveryService.on(RecoveryEvent.RECOVERY_STARTED, handleRecoveryStarted);
    defaultRecoveryService.on(RecoveryEvent.RECOVERY_PROGRESS, handleRecoveryProgress);
    defaultRecoveryService.on(RecoveryEvent.RECOVERY_SUCCESS, handleRecoverySuccess);
    defaultRecoveryService.on(RecoveryEvent.RECOVERY_FAILED, handleRecoveryFailed);

    return () => {
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_STARTED, handleRecoveryStarted);
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_PROGRESS, handleRecoveryProgress);
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_SUCCESS, handleRecoverySuccess);
      defaultRecoveryService.off(RecoveryEvent.RECOVERY_FAILED, handleRecoveryFailed);
    };
  }, []);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    handleDismiss();
  };

  const handleRecover = async () => {
    if (!error) return;

    if (onRecover) {
      onRecover();
    } else {
      // Use default recovery service
      try {
        await defaultRecoveryService.recoverFromError(error);
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }
  };

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '#DC2626';
      case ErrorSeverity.HIGH:
        return '#EA580C';
      case ErrorSeverity.MEDIUM:
        return '#D97706';
      case ErrorSeverity.LOW:
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '⚡';
      case ErrorSeverity.LOW:
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  if (!visible || !error) {
    return null;
  }

  const userMessage = defaultErrorHandler.formatUserMessage(error);
  const isRecoverable = defaultErrorHandler.isRecoverable(error);
  const severityColor = getSeverityColor(error.severity);
  const severityIcon = getSeverityIcon(error.severity);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              borderLeftColor: severityColor,
            }
          ]}
          testID={testID}
        >
          <LinearGradient
            colors={['rgba(26, 27, 46, 0.95)', 'rgba(22, 33, 62, 0.95)']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Text style={styles.severityIcon}>{severityIcon}</Text>
              </View>
              
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {error.severity === ErrorSeverity.CRITICAL ? 'Critical Error' :
                   error.severity === ErrorSeverity.HIGH ? 'Connection Error' :
                   error.severity === ErrorSeverity.MEDIUM ? 'Warning' : 'Notice'}
                </Text>
                <Text style={styles.category}>{error.category.toUpperCase()}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleDismiss}
                testID={`${testID}-close`}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Message */}
            <Text style={styles.message}>{userMessage}</Text>

            {/* Recovery Progress */}
            {isRecovering && (
              <View style={styles.recoveryContainer}>
                <Text style={styles.recoveryText}>🔄 {recoveryProgress}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {isRecoverable && !isRecovering && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.recoverButton]}
                  onPress={handleRecover}
                  testID={`${testID}-recover`}
                >
                  <Text style={styles.actionButtonText}>Auto Fix</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton]}
                onPress={handleRetry}
                disabled={isRecovering}
                testID={`${testID}-retry`}
              >
                <Text style={styles.actionButtonText}>
                  {isRecovering ? 'Fixing...' : 'Try Again'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={handleDismiss}
                testID={`${testID}-dismiss`}
              >
                <Text style={styles.actionButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>

            {/* Error ID for support */}
            <Text style={styles.errorId}>Error ID: {error.errorId}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    marginHorizontal: 16,
    marginTop: 60,
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  severityIcon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#A0AEC0',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 16,
  },
  recoveryContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  recoveryText: {
    fontSize: 12,
    color: '#8B5CF6',
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
  },
  recoverButton: {
    backgroundColor: '#10B981',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
  },
  dismissButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorId: {
    fontSize: 9,
    color: '#718096',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
});