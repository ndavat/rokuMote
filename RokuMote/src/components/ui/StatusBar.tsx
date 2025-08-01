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
import { useAppSelector, selectors } from '../../state';
import { ConnectionStatus } from '../../types';

export interface StatusBarProps {
  deviceName?: string;
  isConnected?: boolean;
  onClose?: () => void;
  onPowerToggle?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  deviceName: propDeviceName,
  isConnected: propIsConnected,
  onClose,
  onPowerToggle,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  
  // Get connection state from global state, with props as fallback
  const currentDevice = useAppSelector(selectors.currentDevice);
  const connectionStatus = useAppSelector(selectors.connectionStatus);
  const mockMode = useAppSelector(selectors.mockMode);
  
  // Determine final values
  const deviceName = propDeviceName || currentDevice?.name || 'Roku Device';
  const isConnected = propIsConnected ?? (connectionStatus === ConnectionStatus.CONNECTED);
  
  // Determine connection indicator color based on status
  const getConnectionColor = () => {
    if (mockMode) {
      return theme.colors.status.warning;
    }
    
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return theme.colors.status.connected;
      case ConnectionStatus.CONNECTING:
        return theme.colors.status.warning;
      case ConnectionStatus.DISCONNECTED:
      case ConnectionStatus.ERROR:
      default:
        return theme.colors.status.disconnected;
    }
  };

  const containerStyles = [
    styles.container,
    {
      flexDirection: theme.components.statusBar.container.flexDirection as any,
      justifyContent: theme.components.statusBar.container.justifyContent as any,
      alignItems: theme.components.statusBar.container.alignItems as any,
      paddingHorizontal: theme.components.statusBar.container.paddingHorizontal,
      paddingVertical: theme.components.statusBar.container.paddingVertical,
      backgroundColor: theme.components.statusBar.container.backgroundColor,
    },
    style,
  ];

  const deviceNameStyles: TextStyle = {
    fontSize: theme.components.statusBar.deviceName.fontSize,
    fontWeight: theme.components.statusBar.deviceName.fontWeight as any,
    color: theme.components.statusBar.deviceName.color,
  };

  const connectionStatusStyles = [
    styles.connectionStatus,
    {
      width: theme.components.statusBar.connectionStatus.width,
      height: theme.components.statusBar.connectionStatus.height,
      borderRadius: theme.components.statusBar.connectionStatus.borderRadius,
      backgroundColor: getConnectionColor(),
    },
  ];

  return (
    <View style={containerStyles} testID={testID}>
      {/* Left side - Close button */}
      <TouchableOpacity
        onPress={onClose}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Close remote"
        accessibilityHint="Closes the remote control interface"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={`${testID}-close-button`}
      >
        <Ionicons 
          name="close" 
          size={theme.icons.size.lg} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>

      {/* Center - Device name and connection status */}
      <View style={styles.centerSection}>
        <Text 
          style={deviceNameStyles}
          accessibilityRole="text"
          accessibilityLabel={`${isConnected ? 'Connected to' : 'Not connected to'} ${deviceName}${mockMode ? ' (Mock Mode)' : ''}`}
          testID={`${testID}-device-name`}
        >
          {deviceName}
        </Text>
        <View 
          style={connectionStatusStyles}
          accessibilityRole="image"
          accessibilityLabel={
            mockMode 
              ? 'Mock mode active' 
              : connectionStatus === ConnectionStatus.CONNECTING 
                ? 'Connecting' 
                : isConnected 
                  ? 'Connected' 
                  : 'Disconnected'
          }
          testID={`${testID}-connection-status`}
        />
      </View>

      {/* Right side - Power button */}
      <TouchableOpacity
        onPress={onPowerToggle}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Power toggle"
        accessibilityHint="Toggles the power state of the Roku device"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={`${testID}-power-button`}
      >
        <Ionicons 
          name="power" 
          size={theme.icons.size.lg} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles - theme styles will override these
  },
  centerSection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  connectionStatus: {
    // Base styles - theme styles will override these
  },
});