/**
 * Mock Mode Banner Component
 * Shows a banner indicating that the app is in mock mode
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export interface MockModeBannerProps {
  visible: boolean;
  onDismiss?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const MockModeBanner: React.FC<MockModeBannerProps> = ({
  visible,
  onDismiss,
  style,
  testID = 'mock-mode-banner',
}) => {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  const bannerStyles = [
    styles.banner,
    {
      backgroundColor: theme.colors.status.warning,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      flex: 1,
    },
  ];

  return (
    <View style={bannerStyles} testID={testID}>
      <Ionicons
        name="warning"
        size={theme.icons.size.md}
        color={theme.colors.text.primary}
        style={styles.icon}
      />
      
      <Text
        style={textStyles}
        accessibilityRole="text"
        accessibilityLabel="Mock mode is active. Commands will be simulated."
        testID={`${testID}-text`}
      >
        Mock Mode Active - Commands are simulated
      </Text>

      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss mock mode banner"
          accessibilityHint="Hides the mock mode banner"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={`${testID}-dismiss`}
        >
          <Ionicons
            name="close"
            size={theme.icons.size.sm}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    textAlign: 'left',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
  },
});