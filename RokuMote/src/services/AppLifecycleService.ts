/**
 * App Lifecycle Service
 * Manages app state transitions and maintains BLE connections across app states
 */

import { AppState, AppStateStatus } from 'react-native';
import { EventEmitter } from 'events';
import { IBLEService } from './ble/BLEServiceInterface';
import { ConnectionStatus } from '../types/ble';

export interface AppLifecycleEvent {
  type: 'app_state_changed' | 'connection_maintained' | 'connection_restored' | 'connection_suspended';
  appState: AppStateStatus;
  timestamp: number;
  connectionStatus?: ConnectionStatus;
  deviceId?: string;
}

export interface AppLifecycleConfig {
  maintainConnectionInBackground: boolean;
  reconnectOnForeground: boolean;
  backgroundTimeout: number; // milliseconds before suspending connection
  maxReconnectAttempts: number;
  reconnectDelay: number;
}

export const DEFAULT_LIFECYCLE_CONFIG: AppLifecycleConfig = {
  maintainConnectionInBackground: true,
  reconnectOnForeground: true,
  backgroundTimeout: 30000, // 30 seconds
  maxReconnectAttempts: 3,
  reconnectDelay: 2000, // 2 seconds
};

export class AppLifecycleService extends EventEmitter {
  private config: AppLifecycleConfig;
  private bleService: IBLEService | null = null;
  private currentAppState: AppStateStatus = AppState.currentState;
  private backgroundTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private wasConnectedBeforeBackground: boolean = false;
  private backgroundDeviceId: string | null = null;
  private isInitialized: boolean = false;

  constructor(config?: Partial<AppLifecycleConfig>) {
    super();
    this.config = { ...DEFAULT_LIFECYCLE_CONFIG, ...config };
  }

  /**
   * Initialize the lifecycle service with BLE service
   */
  initialize(bleService: IBLEService): void {
    if (this.isInitialized) {
      return;
    }

    this.bleService = bleService;
    this.setupAppStateListener();
    this.isInitialized = true;

    this.emitEvent({
      type: 'app_state_changed',
      appState: this.currentAppState,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup and remove listeners
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    AppState.removeEventListener('change', this.handleAppStateChange);
    this.clearBackgroundTimer();
    this.removeAllListeners();
    this.isInitialized = false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AppLifecycleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AppLifecycleConfig {
    return { ...this.config };
  }

  /**
   * Get current app state
   */
  getCurrentAppState(): AppStateStatus {
    return this.currentAppState;
  }

  /**
   * Check if app is in background
   */
  isInBackground(): boolean {
    return this.currentAppState === 'background' || this.currentAppState === 'inactive';
  }

  /**
   * Check if app is in foreground
   */
  isInForeground(): boolean {
    return this.currentAppState === 'active';
  }

  /**
   * Force reconnection attempt
   */
  async forceReconnect(): Promise<boolean> {
    if (!this.bleService || !this.backgroundDeviceId) {
      return false;
    }

    try {
      const success = await this.bleService.connectToDevice(this.backgroundDeviceId);
      if (success) {
        this.reconnectAttempts = 0;
        this.emitEvent({
          type: 'connection_restored',
          appState: this.currentAppState,
          timestamp: Date.now(),
          connectionStatus: ConnectionStatus.CONNECTED,
          deviceId: this.backgroundDeviceId,
        });
      }
      return success;
    } catch (error) {
      console.error('Force reconnect failed:', error);
      return false;
    }
  }

  /**
   * Set up app state change listener
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const previousAppState = this.currentAppState;
    this.currentAppState = nextAppState;

    this.emitEvent({
      type: 'app_state_changed',
      appState: nextAppState,
      timestamp: Date.now(),
      connectionStatus: this.bleService?.getConnectionStatus(),
    });

    // Handle transition to background
    if (previousAppState === 'active' && this.isInBackground()) {
      this.handleAppGoingToBackground();
    }

    // Handle transition to foreground
    if (this.isInBackground() && nextAppState === 'active') {
      this.handleAppComingToForeground();
    }
  };

  /**
   * Handle app going to background
   */
  private handleAppGoingToBackground(): void {
    if (!this.bleService) {
      return;
    }

    const isConnected = this.bleService.isConnected();
    const currentDevice = this.bleService.getCurrentDevice();

    if (isConnected && currentDevice) {
      this.wasConnectedBeforeBackground = true;
      this.backgroundDeviceId = currentDevice.id;

      if (this.config.maintainConnectionInBackground) {
        // Set up timer to suspend connection after timeout
        this.backgroundTimer = setTimeout(() => {
          this.suspendConnection();
        }, this.config.backgroundTimeout);

        this.emitEvent({
          type: 'connection_maintained',
          appState: this.currentAppState,
          timestamp: Date.now(),
          connectionStatus: ConnectionStatus.CONNECTED,
          deviceId: currentDevice.id,
        });
      } else {
        // Immediately suspend connection
        this.suspendConnection();
      }
    }
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppComingToForeground(): void {
    this.clearBackgroundTimer();

    if (!this.bleService) {
      return;
    }

    const isConnected = this.bleService.isConnected();

    // If we were connected before background and now we're not, try to reconnect
    if (this.wasConnectedBeforeBackground && !isConnected && this.config.reconnectOnForeground) {
      this.attemptReconnection();
    }

    // Reset background state
    this.wasConnectedBeforeBackground = false;
  }

  /**
   * Suspend BLE connection
   */
  private async suspendConnection(): Promise<void> {
    if (!this.bleService) {
      return;
    }

    try {
      await this.bleService.disconnect();
      
      this.emitEvent({
        type: 'connection_suspended',
        appState: this.currentAppState,
        timestamp: Date.now(),
        connectionStatus: ConnectionStatus.DISCONNECTED,
        deviceId: this.backgroundDeviceId,
      });
    } catch (error) {
      console.error('Failed to suspend connection:', error);
    }
  }

  /**
   * Attempt to reconnect to the device
   */
  private async attemptReconnection(): Promise<void> {
    if (!this.bleService || !this.backgroundDeviceId || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    try {
      const success = await this.bleService.connectToDevice(this.backgroundDeviceId);
      
      if (success) {
        this.reconnectAttempts = 0;
        this.emitEvent({
          type: 'connection_restored',
          appState: this.currentAppState,
          timestamp: Date.now(),
          connectionStatus: ConnectionStatus.CONNECTED,
          deviceId: this.backgroundDeviceId,
        });
      } else {
        // Schedule retry if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          setTimeout(() => {
            this.attemptReconnection();
          }, this.config.reconnectDelay);
        }
      }
    } catch (error) {
      console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      
      // Schedule retry if we haven't exceeded max attempts
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        setTimeout(() => {
          this.attemptReconnection();
        }, this.config.reconnectDelay);
      }
    }
  }

  /**
   * Clear background timer
   */
  private clearBackgroundTimer(): void {
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
  }

  /**
   * Emit lifecycle event
   */
  private emitEvent(event: AppLifecycleEvent): void {
    this.emit('lifecycle_event', event);
  }
}