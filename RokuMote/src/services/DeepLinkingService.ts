/**
 * Deep Linking Service
 * Handles deep links for direct remote access and navigation
 */

import * as Linking from 'expo-linking';
import { EventEmitter } from 'events';

export interface DeepLinkEvent {
  type: 'link_received' | 'navigation_requested' | 'command_requested';
  url: string;
  params: Record<string, any>;
  timestamp: number;
}

export interface DeepLinkConfig {
  scheme: string;
  prefix: string;
  enableCommandLinks: boolean;
  enableNavigationLinks: boolean;
}

export const DEFAULT_DEEP_LINK_CONFIG: DeepLinkConfig = {
  scheme: 'rokumote',
  prefix: 'rokumote://',
  enableCommandLinks: true,
  enableNavigationLinks: true,
};

export interface ParsedDeepLink {
  action: 'remote' | 'settings' | 'connect' | 'command' | 'navigate';
  params: Record<string, any>;
  isValid: boolean;
  error?: string;
}

export class DeepLinkingService extends EventEmitter {
  private config: DeepLinkConfig;
  private isInitialized: boolean = false;
  private linkingSubscription: any = null;

  constructor(config?: Partial<DeepLinkConfig>) {
    super();
    this.config = { ...DEFAULT_DEEP_LINK_CONFIG, ...config };
  }

  /**
   * Initialize the deep linking service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if app was opened with a deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleDeepLink(initialUrl);
      }

      // Listen for incoming deep links
      this.linkingSubscription = Linking.addEventListener('url', (event) => {
        this.handleDeepLink(event.url);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize deep linking service:', error);
      throw error;
    }
  }

  /**
   * Cleanup and remove listeners
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    if (this.linkingSubscription) {
      this.linkingSubscription.remove();
      this.linkingSubscription = null;
    }

    this.removeAllListeners();
    this.isInitialized = false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DeepLinkConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): DeepLinkConfig {
    return { ...this.config };
  }

  /**
   * Parse a deep link URL
   */
  parseDeepLink(url: string): ParsedDeepLink {
    try {
      const parsed = Linking.parse(url);
      
      if (!parsed.scheme || parsed.scheme !== this.config.scheme) {
        return {
          action: 'remote',
          params: {},
          isValid: false,
          error: `Invalid scheme. Expected '${this.config.scheme}', got '${parsed.scheme}'`,
        };
      }

      const path = parsed.path || '';
      const queryParams = parsed.queryParams || {};

      // Parse different types of deep links
      switch (path) {
        case '/remote':
        case '/':
        case '':
          return {
            action: 'remote',
            params: queryParams,
            isValid: true,
          };

        case '/settings':
          return {
            action: 'settings',
            params: queryParams,
            isValid: true,
          };

        case '/connect':
          return {
            action: 'connect',
            params: {
              deviceId: queryParams.deviceId,
              deviceName: queryParams.deviceName,
              ...queryParams,
            },
            isValid: !!queryParams.deviceId,
            error: !queryParams.deviceId ? 'Device ID is required for connect action' : undefined,
          };

        case '/command':
          if (!this.config.enableCommandLinks) {
            return {
              action: 'command',
              params: {},
              isValid: false,
              error: 'Command links are disabled',
            };
          }

          return {
            action: 'command',
            params: {
              type: queryParams.type,
              action: queryParams.action,
              payload: queryParams.payload ? JSON.parse(queryParams.payload as string) : undefined,
              ...queryParams,
            },
            isValid: !!(queryParams.type && queryParams.action),
            error: !(queryParams.type && queryParams.action) ? 'Command type and action are required' : undefined,
          };

        case '/navigate':
          if (!this.config.enableNavigationLinks) {
            return {
              action: 'navigate',
              params: {},
              isValid: false,
              error: 'Navigation links are disabled',
            };
          }

          return {
            action: 'navigate',
            params: {
              screen: queryParams.screen,
              ...queryParams,
            },
            isValid: !!queryParams.screen,
            error: !queryParams.screen ? 'Screen parameter is required for navigation' : undefined,
          };

        default:
          return {
            action: 'remote',
            params: queryParams,
            isValid: false,
            error: `Unknown path: ${path}`,
          };
      }
    } catch (error) {
      return {
        action: 'remote',
        params: {},
        isValid: false,
        error: `Failed to parse URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create a deep link URL
   */
  createDeepLink(action: string, params?: Record<string, any>): string {
    const baseUrl = `${this.config.scheme}://${action}`;
    
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const encodedValue = typeof value === 'object' 
          ? encodeURIComponent(JSON.stringify(value))
          : encodeURIComponent(String(value));
        return `${encodeURIComponent(key)}=${encodedValue}`;
      })
      .join('&');

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Create a remote access deep link
   */
  createRemoteLink(deviceId?: string): string {
    return this.createDeepLink('remote', deviceId ? { deviceId } : undefined);
  }

  /**
   * Create a settings deep link
   */
  createSettingsLink(section?: string): string {
    return this.createDeepLink('settings', section ? { section } : undefined);
  }

  /**
   * Create a device connection deep link
   */
  createConnectLink(deviceId: string, deviceName?: string): string {
    return this.createDeepLink('connect', {
      deviceId,
      ...(deviceName && { deviceName }),
    });
  }

  /**
   * Create a command execution deep link
   */
  createCommandLink(type: string, action: string, payload?: any): string {
    if (!this.config.enableCommandLinks) {
      throw new Error('Command links are disabled');
    }

    return this.createDeepLink('command', {
      type,
      action,
      ...(payload && { payload }),
    });
  }

  /**
   * Create a navigation deep link
   */
  createNavigationLink(screen: string, params?: Record<string, any>): string {
    if (!this.config.enableNavigationLinks) {
      throw new Error('Navigation links are disabled');
    }

    return this.createDeepLink('navigate', {
      screen,
      ...params,
    });
  }

  /**
   * Check if the app can handle a URL
   */
  async canHandleURL(url: string): Promise<boolean> {
    try {
      return await Linking.canOpenURL(url);
    } catch (error) {
      console.error('Error checking if URL can be handled:', error);
      return false;
    }
  }

  /**
   * Open a URL externally
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const canOpen = await this.canHandleURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening URL:', error);
      return false;
    }
  }

  /**
   * Handle incoming deep link
   */
  private handleDeepLink(url: string): void {
    const parsed = this.parseDeepLink(url);
    
    const event: DeepLinkEvent = {
      type: 'link_received',
      url,
      params: parsed.params,
      timestamp: Date.now(),
    };

    this.emit('deep_link', event);

    if (parsed.isValid) {
      // Emit specific events based on action type
      switch (parsed.action) {
        case 'command':
          this.emit('command_requested', {
            type: 'command_requested',
            url,
            params: parsed.params,
            timestamp: Date.now(),
          });
          break;

        case 'navigate':
          this.emit('navigation_requested', {
            type: 'navigation_requested',
            url,
            params: parsed.params,
            timestamp: Date.now(),
          });
          break;

        case 'connect':
          this.emit('connect_requested', {
            type: 'connect_requested',
            url,
            params: parsed.params,
            timestamp: Date.now(),
          });
          break;

        case 'settings':
          this.emit('settings_requested', {
            type: 'settings_requested',
            url,
            params: parsed.params,
            timestamp: Date.now(),
          });
          break;

        case 'remote':
        default:
          this.emit('remote_requested', {
            type: 'remote_requested',
            url,
            params: parsed.params,
            timestamp: Date.now(),
          });
          break;
      }
    } else {
      console.warn('Invalid deep link:', parsed.error);
      this.emit('invalid_link', {
        type: 'invalid_link',
        url,
        params: parsed.params,
        timestamp: Date.now(),
        error: parsed.error,
      });
    }
  }
}