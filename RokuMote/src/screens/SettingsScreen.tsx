/**
 * Settings Screen Component
 * Comprehensive settings screen with mock mode toggle, device management,
 * app preferences, and help sections
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppState, useAppActions, selectors } from '../state/AppStateContext';
import { useTheme } from '../theme/ThemeProvider';
import { Button, StatusBar, MockModeBanner } from '../components';
import { getBLEServiceManager } from '../services';
import { ConnectionStatus } from '../types/ble';

export interface SettingsScreenProps {
  onBack?: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { state } = useAppState();
  const actions = useAppActions();
  const { theme } = useTheme();

  // Extract state values using selectors
  const mockMode = selectors.mockMode(state);
  const mockModeEnabled = selectors.mockModeEnabled(state);
  const vibrationEnabled = selectors.vibrationEnabled(state);
  const soundEnabled = selectors.soundEnabled(state);
  const autoReconnect = selectors.autoReconnect(state);
  const currentDevice = selectors.currentDevice(state);
  const availableDevices = selectors.availableDevices(state);
  const connectionStatus = selectors.connectionStatus(state);
  const isConnected = selectors.isConnected(state);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleMockModeToggle = async () => {
    const newMockMode = !mockModeEnabled;
    
    try {
      // Update settings
      actions.settings.setMockModeEnabled(newMockMode);
      actions.ui.setMockMode(newMockMode);
      actions.ui.setMockBanner(newMockMode);

      // Get BLE service manager and switch service type
      const serviceManager = getBLEServiceManager();
      serviceManager.setUseMockService(newMockMode);
      
      actions.connection.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      actions.connection.setCurrentDevice(null);

      Alert.alert(
        'Mock Mode ' + (newMockMode ? 'Enabled' : 'Disabled'),
        newMockMode 
          ? 'The app will now simulate Roku device responses for testing purposes.'
          : 'The app will now attempt to connect to real Roku devices via Bluetooth.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to toggle mock mode:', error);
      Alert.alert('Error', 'Failed to toggle mock mode. Please try again.');
    }
  };

  const handleVibrationToggle = () => {
    actions.settings.setVibrationEnabled(!vibrationEnabled);
  };

  const handleSoundToggle = () => {
    actions.settings.setSoundEnabled(!soundEnabled);
  };

  const handleAutoReconnectToggle = () => {
    actions.settings.setAutoReconnect(!autoReconnect);
  };

  const handleDeviceSelection = () => {
    // Navigate to device pairing screen
    router.push('/pairing');
  };

  const handleDisconnectDevice = async () => {
    Alert.alert(
      'Disconnect Device',
      'Are you sure you want to disconnect from the current device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const serviceManager = getBLEServiceManager();
              await serviceManager.disconnect();
              
              actions.connection.setConnectionStatus(ConnectionStatus.DISCONNECTED);
              actions.connection.setCurrentDevice(null);
            } catch (error) {
              console.error('Failed to disconnect:', error);
              Alert.alert('Error', 'Failed to disconnect from device.');
            }
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            actions.settings.updateSettings({
              vibrationEnabled: true,
              soundEnabled: true,
              autoReconnect: true,
              preferredDeviceId: null,
              mockModeEnabled: false,
            });
            actions.ui.setMockMode(false);
            actions.ui.setMockBanner(false);
            
            Alert.alert('Settings Reset', 'All settings have been reset to their default values.');
          }
        }
      ]
    );
  };

  const handleHelpAndSupport = () => {
    Alert.alert(
      'Help & Support',
      'RokuMote Help:\n\n' +
      '• Ensure Bluetooth is enabled on your device\n' +
      '• Make sure your Roku device supports BLE remote control\n' +
      '• Keep your phone within 30 feet of your Roku device\n' +
      '• Use Mock Mode for testing without a physical device\n\n' +
      'For additional support, please check the app documentation.',
      [{ text: 'OK' }]
    );
  };

  const handleTroubleshooting = () => {
    Alert.alert(
      'Troubleshooting',
      'Common Issues:\n\n' +
      '• Connection Failed: Try restarting Bluetooth and the app\n' +
      '• Device Not Found: Ensure your Roku supports BLE remotes\n' +
      '• Commands Not Working: Check connection status and retry\n' +
      '• App Crashes: Try enabling Mock Mode for testing\n\n' +
      'If issues persist, try resetting your settings.',
      [
        { text: 'Reset Settings', onPress: handleResetSettings },
        { text: 'OK' }
      ]
    );
  };

  const handleAdvancedSettings = () => {
    Alert.alert(
      'Advanced Settings',
      'Advanced Configuration:\n\n' +
      '• Connection Timeout: 30 seconds\n' +
      '• Auto-reconnect Attempts: 3\n' +
      '• Command Retry Count: 2\n' +
      '• BLE Scan Duration: 10 seconds\n\n' +
      'These settings are optimized for best performance.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        deviceName="Settings"
        isConnected={false}
        onClose={handleBack}
        onPowerToggle={() => {}}
      />
      
      {mockMode && <MockModeBanner visible={mockMode} />}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="settings-scroll-view"
      >
        {/* Mock Mode Section */}
        <View style={[styles.section, { borderBottomColor: theme.colors.surface.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Development & Testing
          </Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Mock Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Simulate Roku device responses for testing
              </Text>
            </View>
            <Button
              title={mockModeEnabled ? 'Enabled' : 'Disabled'}
              onPress={handleMockModeToggle}
              variant={mockModeEnabled ? 'primary' : 'secondary'}
              style={styles.toggleButton}
              testID="mock-mode-toggle"
            />
          </View>
        </View>

        {/* Device Connection Section */}
        <View style={[styles.section, { borderBottomColor: theme.colors.surface.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Device Connection
          </Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Current Device
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                {currentDevice ? currentDevice.name : 'No device connected'}
              </Text>
            </View>
            {currentDevice && isConnected && (
              <Button
                title="Disconnect"
                onPress={handleDisconnectDevice}
                variant="secondary"
                style={styles.actionButton}
                testID="disconnect-device-button"
              />
            )}
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Available Devices
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                {availableDevices.length} device(s) found
              </Text>
            </View>
            <Button
              title="Select Device"
              onPress={handleDeviceSelection}
              variant="primary"
              style={styles.actionButton}
              testID="select-device-button"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Auto-Reconnect
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Automatically reconnect to preferred device
              </Text>
            </View>
            <Button
              title={autoReconnect ? 'On' : 'Off'}
              onPress={handleAutoReconnectToggle}
              variant={autoReconnect ? 'primary' : 'secondary'}
              style={styles.toggleButton}
              testID="auto-reconnect-toggle"
            />
          </View>
        </View>

        {/* App Preferences Section */}
        <View style={[styles.section, { borderBottomColor: theme.colors.surface.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            App Preferences
          </Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Vibration Feedback
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Haptic feedback when pressing buttons
              </Text>
            </View>
            <Button
              title={vibrationEnabled ? 'On' : 'Off'}
              onPress={handleVibrationToggle}
              variant={vibrationEnabled ? 'primary' : 'secondary'}
              style={styles.toggleButton}
              testID="vibration-toggle"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Sound Effects
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Audio feedback for button presses
              </Text>
            </View>
            <Button
              title={soundEnabled ? 'On' : 'Off'}
              onPress={handleSoundToggle}
              variant={soundEnabled ? 'primary' : 'secondary'}
              style={styles.toggleButton}
              testID="sound-toggle"
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={[styles.section, { borderBottomColor: theme.colors.surface.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Help & Support
          </Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Help & FAQ
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Get help with using RokuMote
              </Text>
            </View>
            <Button
              title="View"
              onPress={handleHelpAndSupport}
              variant="secondary"
              style={styles.actionButton}
              testID="help-button"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Troubleshooting
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Fix common connection and app issues
              </Text>
            </View>
            <Button
              title="View"
              onPress={handleTroubleshooting}
              variant="secondary"
              style={styles.actionButton}
              testID="troubleshooting-button"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.surface.button }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Advanced Settings
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                View advanced configuration options
              </Text>
            </View>
            <Button
              title="View"
              onPress={handleAdvancedSettings}
              variant="secondary"
              style={styles.actionButton}
              testID="advanced-settings-button"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                Reset Settings
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                Reset all settings to default values
              </Text>
            </View>
            <Button
              title="Reset"
              onPress={handleResetSettings}
              variant="secondary"
              style={styles.resetButton}
              testID="reset-settings-button"
            />
          </View>
        </View>

        {/* Connection Status Info */}
        <View style={styles.statusSection}>
          <Text style={[styles.statusTitle, { color: theme.colors.text.secondary }]}>
            Connection Status
          </Text>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isConnected ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={isConnected ? theme.colors.status.connected : theme.colors.status.disconnected} 
            />
            <Text style={[styles.statusText, { color: theme.colors.text.secondary }]}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </Text>
          </View>
          {currentDevice && (
            <Text style={[styles.deviceInfo, { color: theme.colors.text.secondary }]}>
              Connected to: {currentDevice.name}
            </Text>
          )}
        </View>

        {/* App Information Section */}
        <View style={styles.statusSection}>
          <Text style={[styles.statusTitle, { color: theme.colors.text.secondary }]}>
            App Information
          </Text>
          <Text style={[styles.appInfo, { color: theme.colors.text.secondary }]}>
            RokuMote v1.0.0
          </Text>
          <Text style={[styles.appInfo, { color: theme.colors.text.secondary }]}>
            React Native Expo App
          </Text>
          <Text style={[styles.appInfo, { color: theme.colors.text.secondary }]}>
            Mock Mode: {mockModeEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleButton: {
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  deviceInfo: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  appInfo: {
    fontSize: 12,
    marginBottom: 2,
  },
  resetButton: {
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});