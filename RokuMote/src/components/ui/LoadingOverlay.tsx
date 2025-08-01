/**
 * Loading Overlay Component
 * Shows loading state with spinner and optional message
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  transparent = true,
  style,
  testID = 'loading-overlay',
}) => {
  const { theme } = useTheme();

  const overlayStyles = [
    styles.overlay,
    {
      backgroundColor: transparent 
        ? 'rgba(0, 0, 0, 0.5)' 
        : theme.colors.background.primary,
    },
    style,
  ];

  const containerStyles = [
    styles.container,
    {
      backgroundColor: theme.colors.surface.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
    },
  ];

  const messageStyles = [
    styles.message,
    {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      marginTop: theme.spacing.md,
    },
  ];

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      testID={testID}
    >
      <View style={overlayStyles}>
        <View style={containerStyles}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary.purple}
            testID={`${testID}-spinner`}
          />
          {message && (
            <Text
              style={messageStyles}
              accessibilityRole="text"
              accessibilityLabel={message}
              testID={`${testID}-message`}
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
    maxWidth: 300,
  },
  message: {
    textAlign: 'center',
    maxWidth: 250,
  },
});