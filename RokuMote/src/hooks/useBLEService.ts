/**
 * BLE Service Hook
 * Provides integration between BLE service and state management
 */

import { useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useAppState, useAppSelector, selectors } from '../state';
import { IBLEService, IMockBLEService } from '../services/ble/BLEServiceInterface';
import { BLEServiceFactory } from '../services/ble/BLEServiceFactory';
import { ConnectionStatus, RemoteCommand, ConnectionEvent, BLEError } from '../types';
import { CommandMapper, ButtonId } from '../utils/commandMapping';

export interface UseBLEServiceReturn {
  // Service instance
  service: IBLEService | IMockBLEService | null;
  
  // Connection methods
  scanForDevices: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Command methods
  sendCommand: (buttonId: ButtonId) => Promise<void>;
  sendRawCommand: (command: RemoteCommand) => Promise<void>;
  
  // State getters
  isConnected: boolean;
  isScanning: boolean;
  connectionStatus: ConnectionStatus;
  currentDevice: any;
  availableDevices: any[];
  mockMode: boolean;
}

export function useBLEService(): UseBLEServiceReturn {
  const { state, dispatch, actions } = useAppState();
  const serviceRef = useRef<IBLEService | IMockBLEService | null>(null);
  
  // Get state values
  const isConnected = useAppSelector(selectors.isConnected);
  const isScanning = useAppSelector(selectors.isScanning);
  const connectionStatus = useAppSelector(selectors.connectionStatus);
  const currentDevice = useAppSelector(selectors.currentDevice);
  const availableDevices = useAppSelector(selectors.availableDevices);
  const mockMode = useAppSelector(selectors.mockMode);
  const autoReconnect = useAppSelector(selectors.autoReconnect);

  // Initialize BLE service
  useEffect(() => {
    const initializeService = async () => {
      try {
        dispatch(actions.ui.setLoading(true));
        dispatch(actions.ui.setLoadingMessage('Initializing BLE service...'));

        // Create appropriate service based on mock mode
        const factory = new BLEServiceFactory();
        const service = mockMode 
          ? factory.createMockBLEService()
          : factory.createBLEService();

        // Initialize the service
        await service.initialize();
        serviceRef.current = service;

        // Set up event listeners
        service.addEventListener(handleConnectionEvent);

        dispatch(actions.ui.setLoading(false));
        dispatch(actions.ui.setLoadingMessage(null));
      } catch (error) {
        console.error('Failed to initialize BLE service:', error);
        dispatch(actions.connection.setConnectionError({
          code: 'INITIALIZATION_FAILED',
          message: 'Failed to initialize BLE service',
          details: error
        } as BLEError));
        dispatch(actions.ui.setLoading(false));
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.removeAllEventListeners();
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
    };
  }, [mockMode, dispatch, actions]);

  // Handle connection events from BLE service
  const handleConnectionEvent = useCallback((event: ConnectionEvent) => {
    switch (event.type) {
      case 'deviceDiscovered':
        if (event.device) {
          dispatch(actions.connection.addAvailableDevice(event.device));
        }
        break;

      case 'connectionStatusChanged':
        if (event.status) {
          dispatch(actions.connection.setConnectionStatus(event.status));
          
          // Update connected state based on status
          const connected = event.status === ConnectionStatus.CONNECTED;
          if (connected !== isConnected) {
            if (connected && event.device) {
              dispatch(actions.connection.setCurrentDevice(event.device));
            } else if (!connected) {
              dispatch(actions.connection.setCurrentDevice(null));
            }
          }
        }
        break;

      case 'connectionError':
        if (event.error) {
          dispatch(actions.connection.setConnectionError(event.error));
        }
        break;

      case 'scanStarted':
        dispatch(actions.connection.setScanning(true));
        dispatch(actions.connection.setAvailableDevices([]));
        break;

      case 'scanStopped':
        dispatch(actions.connection.setScanning(false));
        break;

      default:
        console.log('Unhandled connection event:', event);
    }
  }, [dispatch, actions, isConnected]);

  // Scan for devices
  const scanForDevices = useCallback(async () => {
    if (!serviceRef.current) {
      console.error('BLE service not initialized');
      return;
    }

    try {
      dispatch(actions.ui.setLoading(true));
      dispatch(actions.ui.setLoadingMessage('Scanning for devices...'));
      
      const devices = await serviceRef.current.scanForDevices();
      dispatch(actions.connection.setAvailableDevices(devices));
      
      dispatch(actions.ui.setLoading(false));
      dispatch(actions.ui.setLoadingMessage(null));
    } catch (error) {
      console.error('Failed to scan for devices:', error);
      dispatch(actions.connection.setConnectionError({
        code: 'SCAN_FAILED',
        message: 'Failed to scan for devices',
        details: error
      } as BLEError));
      dispatch(actions.ui.setLoading(false));
    }
  }, [dispatch, actions]);

  // Connect to device
  const connectToDevice = useCallback(async (deviceId: string) => {
    if (!serviceRef.current) {
      console.error('BLE service not initialized');
      return;
    }

    try {
      dispatch(actions.ui.setLoading(true));
      dispatch(actions.ui.setLoadingMessage('Connecting to device...'));
      dispatch(actions.connection.setConnectionStatus(ConnectionStatus.CONNECTING));
      dispatch(actions.connection.incrementConnectionAttempts());

      const success = await serviceRef.current.connectToDevice(deviceId);
      
      if (success) {
        const device = availableDevices.find(d => d.id === deviceId);
        if (device) {
          dispatch(actions.connection.setCurrentDevice(device));
          dispatch(actions.connection.setConnectionStatus(ConnectionStatus.CONNECTED));
          dispatch(actions.connection.resetConnectionAttempts());
        }
      } else {
        dispatch(actions.connection.setConnectionStatus(ConnectionStatus.DISCONNECTED));
        throw new Error('Connection failed');
      }

      dispatch(actions.ui.setLoading(false));
      dispatch(actions.ui.setLoadingMessage(null));
    } catch (error) {
      console.error('Failed to connect to device:', error);
      dispatch(actions.connection.setConnectionError({
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to device',
        details: error
      } as BLEError));
      dispatch(actions.connection.setConnectionStatus(ConnectionStatus.DISCONNECTED));
      dispatch(actions.ui.setLoading(false));
    }
  }, [dispatch, actions, availableDevices]);

  // Disconnect from device
  const disconnect = useCallback(async () => {
    if (!serviceRef.current) {
      console.error('BLE service not initialized');
      return;
    }

    try {
      dispatch(actions.ui.setLoading(true));
      dispatch(actions.ui.setLoadingMessage('Disconnecting...'));

      await serviceRef.current.disconnect();
      
      dispatch(actions.connection.setCurrentDevice(null));
      dispatch(actions.connection.setConnectionStatus(ConnectionStatus.DISCONNECTED));
      dispatch(actions.connection.resetConnectionAttempts());
      
      dispatch(actions.ui.setLoading(false));
      dispatch(actions.ui.setLoadingMessage(null));
    } catch (error) {
      console.error('Failed to disconnect:', error);
      dispatch(actions.ui.setLoading(false));
    }
  }, [dispatch, actions]);

  // Send command by button ID
  const sendCommand = useCallback(async (buttonId: ButtonId) => {
    if (!serviceRef.current) {
      console.error('BLE service not initialized');
      return;
    }

    if (!isConnected && !mockMode) {
      console.warn('Cannot send command: not connected');
      return;
    }

    try {
      const command = CommandMapper.getCommand(buttonId);
      const result = await serviceRef.current.sendCommand(command);
      
      if (!result.success) {
        console.error('Command failed:', result.error);
        if (result.error) {
          dispatch(actions.connection.setConnectionError(result.error));
        }
      }
    } catch (error) {
      console.error('Failed to send command:', error);
      dispatch(actions.connection.setConnectionError({
        code: 'COMMAND_FAILED',
        message: 'Failed to send command',
        details: error
      } as BLEError));
    }
  }, [serviceRef, isConnected, mockMode, dispatch, actions]);

  // Send raw command
  const sendRawCommand = useCallback(async (command: RemoteCommand) => {
    if (!serviceRef.current) {
      console.error('BLE service not initialized');
      return;
    }

    if (!isConnected && !mockMode) {
      console.warn('Cannot send command: not connected');
      return;
    }

    try {
      const result = await serviceRef.current.sendCommand(command);
      
      if (!result.success) {
        console.error('Command failed:', result.error);
        if (result.error) {
          dispatch(actions.connection.setConnectionError(result.error));
        }
      }
    } catch (error) {
      console.error('Failed to send raw command:', error);
      dispatch(actions.connection.setConnectionError({
        code: 'COMMAND_FAILED',
        message: 'Failed to send command',
        details: error
      } as BLEError));
    }
  }, [serviceRef, isConnected, mockMode, dispatch, actions]);

  // Auto-reconnect logic
  useEffect(() => {
    if (autoReconnect && connectionStatus === ConnectionStatus.DISCONNECTED && currentDevice) {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting auto-reconnect...');
        connectToDevice(currentDevice.id);
      }, 3000); // Wait 3 seconds before reconnecting

      return () => clearTimeout(reconnectTimer);
    }
  }, [autoReconnect, connectionStatus, currentDevice, connectToDevice]);

  return {
    service: serviceRef.current,
    scanForDevices,
    connectToDevice,
    disconnect,
    sendCommand,
    sendRawCommand,
    isConnected,
    isScanning,
    connectionStatus,
    currentDevice,
    availableDevices,
    mockMode,
  };
}