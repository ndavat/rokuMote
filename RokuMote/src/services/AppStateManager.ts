/**
 * App State Manager
 * Coordinates app lifecycle, deep linking, and BLE connection management
 */

import { EventEmitter } from 'events';
import { AppLifecycleService, AppLifecycleEvent, AppLifecycleConfig } from './AppLifecycleService';
import { DeepLinkingService, DeepLinkEvent, DeepLinkConfig, ParsedDeepLink } from './DeepLinkingService';
import { IBLEService } from './ble/BLEServiceInterface';
import { RemoteCommand } from '../types/ble';

export interface AppStateManagerEvent {
  type: 'lifecycle_event' | 'deep_link_event' | 'command_from_link' | 'navigation_from_link' | 'connection_from_link';
  data: any;
  timestamp: number;
}

export interface AppStateManagerConfig {
  lifecycle: Partial<AppLifecycleConfig>;
  deepLinking: Partial<DeepLinkConfig>;
}

export class AppStateManager extends EventEmitter {
  private lifecycleService: AppLifecycleService;
  private deepLinkingService: DeepLinkingService;
  private bleService: IBLEService | null = null;
  private isInitialized: boolean = false;

  constructor(config?: AppStateManagerConfig) {
    super();
    
    this.lifecycleService = new AppLifecycleService(config?.lifecycle);
    this.deepLinkingService = new DeepLinkingService(config?.deepLinking);
    
    this.setupEventListeners();
  }

  /**
   * Initialize the app state manager
   */
  async initialize(bleService: IBLEService): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.bleService = bleService;

    try {
      // Initialize lifecycle service
      this.lifecycleService.initialize(bleService);

      // Initialize deep linking service
      await this.deepLinkingService.initialize();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize app state manager:', error);
      throw error;
    }
  }

  /**
   * Cleanup and destroy services
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    this.lifecycleService.destroy();
    this.deepLinkingService.destroy();
    this.removeAllListeners();
    this.isInitialized = false;
  }

  /**
   * Get lifecycle service
   */
  getLifecycleService(): AppLifecycleService {
    return this.lifecycleService;
  }

  /**
   * Get deep linking service
   */
  getDeepLinkingService(): DeepLinkingService {
    return this.deepLinkingService;
  }

  /**
   * Update lifecycle configuration
   */
  updateLifecycleConfig(config: Partial<AppLifecycleConfig>): void {
    this.lifecycleService.updateConfig(config);
  }

  /**
   * Update deep linking configuration
   */
  updateDeepLinkingConfig(config: Partial<DeepLinkConfig>): void {
    this.deepLinkingService.updateConfig(config);
  }

  /**
   * Handle deep link navigation
   */
  async handleDeepLinkNavigation(parsedLink: ParsedDeepLink): Promise<boolean> {
    if (!parsedLink.isValid) {
      console.warn('Cannot handle invalid deep link:', parsedLink.error);
      return false;
    }

    try {
      switch (parsedLink.action) {
        case 'remote':
          return await this.handleRemoteAccess(parsedLink.params);

        case 'settings':
          return await this.handleSettingsNavigation(parsedLink.params);

        case 'connect':
          return await this.handleDeviceConnection(parsedLink.params);

        case 'command':
          return await this.handleCommandExecution(parsedLink.params);

        case 'navigate':
          return await this.handleScreenNavigation(parsedLink.params);

        default:
          console.warn('Unknown deep link action:', parsedLink.action);
          return false;
      }
    } catch (error) {
      console.error('Error handling deep link navigation:', error);
      return false;
    }
  }

  /**
   * Create deep link for current app state
   */
  createCurrentStateLink(): string {
    if (!this.bleService) {
      return this.deepLinkingService.createRemoteLink();
    }

    const currentDevice = this.bleService.getCurrentDevice();
    return this.deepLinkingService.createRemoteLink(currentDevice?.id);
  }

  /**
   * Force reconnection through lifecycle service
   */
  async forceReconnect(): Promise<boolean> {
    return await this.lifecycleService.forceReconnect();
  }

  /**
   * Check if app is in background
   */
  isInBackground(): boolean {
    return this.lifecycleService.isInBackground();
  }

  /**
   * Check if app is in foreground
   */
  isInForeground(): boolean {
    return this.lifecycleService.isInForeground();
  }

  /**
   * Set up event listeners for services
   */
  private setupEventListeners(): void {
    // Lifecycle events
    this.lifecycleService.on('lifecycle_event', (event: AppLifecycleEvent) => {
      this.emit('app_state_event', {
        type: 'lifecycle_event',
        data: event,
        timestamp: Date.now(),
      });
    });

    // Deep linking events
    this.deepLinkingService.on('deep_link', (event: DeepLinkEvent) => {
      this.emit('app_state_event', {
        type: 'deep_link_event',
        data: event,
        timestamp: Date.now(),
      });
    });

    this.deepLinkingService.on('command_requested', (event: DeepLinkEvent) => {
      this.handleCommandFromLink(event);
    });

    this.deepLinkingService.on('navigation_requested', (event: DeepLinkEvent) => {
      this.handleNavigationFromLink(event);
    });

    this.deepLinkingService.on('connect_requested', (event: DeepLinkEvent) => {
      this.handleConnectionFromLink(event);
    });

    this.deepLinkingService.on('remote_requested', (event: DeepLinkEvent) => {
      this.handleRemoteFromLink(event);
    });

    this.deepLinkingService.on('settings_requested', (event: DeepLinkEvent) => {
      this.handleSettingsFromLink(event);
    });
  }

  /**
   * Handle remote access from deep link
   */
  private async handleRemoteAccess(params: Record<string, any>): Promise<boolean> {
    // If a device ID is provided, try to connect to it
    if (params.deviceId && this.bleService) {
      const success = await this.bleService.connectToDevice(params.deviceId);
      if (success) {
        console.log('Connected to device from deep link:', params.deviceId);
      }
      return success;
    }

    // Otherwise, just navigate to remote screen
    return true;
  }

  /**
   * Handle settings navigation from deep link
   */
  private async handleSettingsNavigation(params: Record<string, any>): Promise<boolean> {
    // This would typically trigger navigation to settings screen
    // The actual navigation would be handled by the router
    console.log('Navigate to settings with params:', params);
    return true;
  }

  /**
   * Handle device connection from deep link
   */
  private async handleDeviceConnection(params: Record<string, any>): Promise<boolean> {
    if (!this.bleService || !params.deviceId) {
      return false;
    }

    try {
      const success = await this.bleService.connectToDevice(params.deviceId);
      if (success) {
        console.log('Connected to device from deep link:', params.deviceId);
      }
      return success;
    } catch (error) {
      console.error('Failed to connect to device from deep link:', error);
      return false;
    }
  }

  /**
   * Handle command execution from deep link
   */
  private async handleCommandExecution(params: Record<string, any>): Promise<boolean> {
    if (!this.bleService || !params.type || !params.action) {
      return false;
    }

    try {
      const command: RemoteCommand = {
        id: `deeplink_${Date.now()}`,
        type: params.type,
        action: params.action,
        payload: params.payload,
        timestamp: Date.now(),
      };

      const result = await this.bleService.sendCommand(command);
      return result.success;
    } catch (error) {
      console.error('Failed to execute command from deep link:', error);
      return false;
    }
  }

  /**
   * Handle screen navigation from deep link
   */
  private async handleScreenNavigation(params: Record<string, any>): Promise<boolean> {
    // This would typically trigger navigation to the specified screen
    // The actual navigation would be handled by the router
    console.log('Navigate to screen with params:', params);
    return true;
  }

  /**
   * Handle command request from deep link
   */
  private handleCommandFromLink(event: DeepLinkEvent): void {
    this.emit('app_state_event', {
      type: 'command_from_link',
      data: event,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle navigation request from deep link
   */
  private handleNavigationFromLink(event: DeepLinkEvent): void {
    this.emit('app_state_event', {
      type: 'navigation_from_link',
      data: event,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle connection request from deep link
   */
  private handleConnectionFromLink(event: DeepLinkEvent): void {
    this.emit('app_state_event', {
      type: 'connection_from_link',
      data: event,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle remote request from deep link
   */
  private handleRemoteFromLink(event: DeepLinkEvent): void {
    const parsedLink = this.deepLinkingService.parseDeepLink(event.url);
    this.handleDeepLinkNavigation(parsedLink);
  }

  /**
   * Handle settings request from deep link
   */
  private handleSettingsFromLink(event: DeepLinkEvent): void {
    const parsedLink = this.deepLinkingService.parseDeepLink(event.url);
    this.handleDeepLinkNavigation(parsedLink);
  }
}