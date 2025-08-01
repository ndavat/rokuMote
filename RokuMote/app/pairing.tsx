import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppState, useAppActions, selectors } from '../src/state/AppStateContext';
import { useTheme } from '../src/theme/ThemeProvider';
import { Button, StatusBar, MockModeBanner } from '../src/components';
import { getBLEServiceFactory } from '../src/services';
import { RokuDevice } from '../src/types';

export default function PairingScreen() {
  const { state } = useAppState();
  const actions = useAppActions();
  const { theme } = useTheme();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Extract state values using selectors
  const mockMode = selectors.mockMode(state);
  const availableDevices = selectors.availableDevices(state);
  const currentDevice = selectors.currentDevice(state);
  const connectionStatus = selectors.connectionStatus(state);

  const handleBack = () => {
    router.back();
  };

  const startDeviceScan = async () => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      actions.connection.setScanning(true);
      actions.connection.setAvailableDevices([]);
      
      const factory = getBLEServiceFactory();
      const bleService = factory.getBLEService();
      
      // Start scanning for devices
      const devices = await bleService.scanForDevices();
      
      actions.connection.setAvailableDevices(devices);
      
      if (devices.length === 0) {
        setScanError('No Roku devices found. Make sure your Roku device supports BLE remote control and is nearby.');
      }
    } catch (error) {
      console.error('Device scan failed:', error);
      setScanError('Failed to scan for devices. Please check your Bluetooth settings and try again.');
    } finally {
      setIsScanning(false);
      actions.connection.setScanning(false);
    }
  };

  const connectToDevice = async (device: RokuDevice) => {
    try {
      actions.connection.setConnectionStatus('connecting');
      actions.ui.setLoadingMessage(`Connecting to ${device.name}...`);
      
      const factory = getBLEServiceFactory();
      const bleService = factory.getBLEService();
      
      const success = await bleService.connectToDevice(device.id);
      
      if (success) {
        actions.connection.setCurrentDevice(device);
        actions.connection.setConnectionStatus('connected');
        actions.settings.setPreferredDevice(device.id);
        
        Alert.alert(
          'Connected',
          `Successfully connected to ${device.name}`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        actions.connection.setConnectionStatus('error');
        Alert.alert('Connection Failed', `Failed to connect to ${device.name}. Please try again.`);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      actions.connection.setConnectionStatus('error');
      Alert.alert('Connection Error', 'An error occurred while connecting to the device.');
    } finally {
      actions.ui.setLoadingMessage(null);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      const factory = getBLEServiceFactory();
      const bleService = factory.getBLEService();
      
      await bleService.disconnect();
      
      actions.connection.setCurrentDevice(null);
      actions.connection.setConnectionStatus('disconnected');
      
      Alert.alert('Disconnected', 'Successfully disconnected from device.');
    } catch (error) {
      console.error('Disconnect failed:', error);
      Alert.alert('Disconnect Error', 'Failed to disconnect from device.');
    }
  };

  // Auto-scan on mount
  useEffect(() => {
    startDeviceScan();
  }, []);

  const renderDeviceItem = (device: RokuDevice) => {
    const isCurrentDevice = currentDevice?.id === device.id;
    const isConnected = isCurrentDevice && connectionStatus === 'connected';
    const isConnecting = isCurrentDevice && connectionStatus === 'connecting';

    return (
      <View key={device.id} style={[styles.deviceItem, { backgroundColor: theme.colors.surface.card }]}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Text style={[styles.deviceName, { color: theme.colors.text.primary }]}>
              {device.name}
            </Text>
            {isConnected && (
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={theme.colors.status.connected} 
              />
            )}
          </View>
          <Text style={[styles.deviceId, { color: theme.colors.text.secondary }]}>
            ID: {device.id}
          </Text>
          {device.rssi && (
            <Text style={[styles.deviceSignal, { color: theme.colors.text.secondary }]}>
              Signal: {device.rssi} dBm
            </Text>
          )}
        </View>
        
        <View style={styles.deviceActions}>
          {isConnecting ? (
            <ActivityIndicator size="small" color={theme.colors.primary.purple} />
          ) : isConnected ? (
            <Button
              title="Disconnect"
              onPress={disconnectFromDevice}
              variant="secondary"
              style={styles.deviceButton}
            />
          ) : (
            <Button
              title="Connect"
              onPress={() => connectToDevice(device)}
              variant="primary"
              style={styles.deviceButton}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        deviceName="Device Pairing"
        isConnected={false}
        onClose={handleBack}
        onPowerToggle={() => {}}
      />
      
      {mockMode && <MockModeBanner />}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scan Controls */}
        <View style={styles.scanSection}>
          <View style={styles.scanHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Available Devices
            </Text>
            <Button
              title={isScanning ? 'Scanning...' : 'Scan'}
              onPress={startDeviceScan}
              variant="primary"
              disabled={isScanning}
              style={styles.scanButton}
            />
          </View>
          
          {isScanning && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary.purple} />
              <Text style={[styles.scanningText, { color: theme.colors.text.secondary }]}>
                Scanning for Roku devices...
              </Text>
            </View>
          )}
          
          {scanError && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.disconnected + '20' }]}>
              <Ionicons name="warning" size={20} color={theme.colors.status.disconnected} />
              <Text style={[styles.errorText, { color: theme.colors.status.disconnected }]}>
                {scanError}
              </Text>
            </View>
          )}
        </View>

        {/* Device List */}
        <View style={styles.deviceList}>
          {availableDevices.length > 0 ? (
            availableDevices.map(renderDeviceItem)
          ) : !isScanning && !scanError ? (
            <View style={styles.emptyState}>
              <Ionicons name="bluetooth" size={48} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No Devices Found
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                Make sure your Roku device supports BLE remote control and is nearby.
              </Text>
              <Button
                title="Scan Again"
                onPress={startDeviceScan}
                variant="primary"
                style={styles.scanAgainButton}
              />
            </View>
          ) : null}
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { borderTopColor: theme.colors.surface.card }]}>
          <Text style={[styles.helpTitle, { color: theme.colors.text.primary }]}>
            Connection Tips
          </Text>
          <View style={styles.helpTips}>
            <Text style={[styles.helpTip, { color: theme.colors.text.secondary }]}>
              • Ensure Bluetooth is enabled on your device
            </Text>
            <Text style={[styles.helpTip, { color: theme.colors.text.secondary }]}>
              • Keep your phone within 30 feet of your Roku device
            </Text>
            <Text style={[styles.helpTip, { color: theme.colors.text.secondary }]}>
              • Make sure your Roku supports BLE remote control
            </Text>
            <Text style={[styles.helpTip, { color: theme.colors.text.secondary }]}>
              • Try restarting Bluetooth if devices don't appear
            </Text>
            {mockMode && (
              <Text style={[styles.helpTip, { color: theme.colors.status.warning }]}>
                • Mock mode is enabled - simulated devices will appear
              </Text>
            )}
          </View>
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
  scanSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scanButton: {
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scanningText: {
    marginLeft: 12,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  deviceList: {
    paddingHorizontal: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  deviceId: {
    fontSize: 12,
    marginBottom: 2,
  },
  deviceSignal: {
    fontSize: 12,
  },
  deviceActions: {
    minWidth: 100,
  },
  deviceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  scanAgainButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  helpSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  helpTips: {
    gap: 8,
  },
  helpTip: {
    fontSize: 14,
    lineHeight: 20,
  },
});