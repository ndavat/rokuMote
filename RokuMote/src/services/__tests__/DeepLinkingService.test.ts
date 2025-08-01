/**
 * Deep Linking Service Tests
 * Tests for deep link parsing, creation, and handling
 */

import * as Linking from 'expo-linking';
import { DeepLinkingService, DeepLinkEvent, DEFAULT_DEEP_LINK_CONFIG } from '../DeepLinkingService';

// Mock expo-linking
jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
  parse: jest.fn(),
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

const mockLinking = Linking as jest.Mocked<typeof Linking>;

describe('DeepLinkingService', () => {
  let deepLinkingService: DeepLinkingService;
  let mockLinkingListener: (event: { url: string }) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock addEventListener to capture the listener
    mockLinking.addEventListener.mockImplementation((event, listener) => {
      if (event === 'url') {
        mockLinkingListener = listener;
        return { remove: jest.fn() };
      }
      return { remove: jest.fn() };
    });

    deepLinkingService = new DeepLinkingService();
  });

  afterEach(() => {
    deepLinkingService.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(deepLinkingService.getConfig()).toEqual(DEFAULT_DEEP_LINK_CONFIG);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        scheme: 'customscheme',
        enableCommandLinks: false,
      };

      const service = new DeepLinkingService(customConfig);
      const config = service.getConfig();

      expect(config.scheme).toBe('customscheme');
      expect(config.enableCommandLinks).toBe(false);
      expect(config.enableNavigationLinks).toBe(DEFAULT_DEEP_LINK_CONFIG.enableNavigationLinks);

      service.destroy();
    });

    it('should handle initial URL on initialize', async () => {
      const initialUrl = 'rokumote://remote?deviceId=test123';
      mockLinking.getInitialURL.mockResolvedValue(initialUrl);

      const eventSpy = jest.fn();
      deepLinkingService.on('deep_link', eventSpy);

      await deepLinkingService.initialize();

      expect(mockLinking.getInitialURL).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'link_received',
          url: initialUrl,
        })
      );
    });

    it('should set up URL event listener', async () => {
      await deepLinkingService.initialize();

      expect(mockLinking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
    });
  });

  describe('Deep Link Parsing', () => {
    beforeEach(() => {
      mockLinking.parse.mockImplementation((url) => {
        const urlObj = new URL(url);
        return {
          scheme: urlObj.protocol.replace(':', ''),
          path: urlObj.pathname,
          queryParams: Object.fromEntries(urlObj.searchParams.entries()),
        };
      });
    });

    it('should parse remote access link', () => {
      const url = 'rokumote://remote?deviceId=test123';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed).toEqual({
        action: 'remote',
        params: { deviceId: 'test123' },
        isValid: true,
      });
    });

    it('should parse settings link', () => {
      const url = 'rokumote://settings?section=bluetooth';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed).toEqual({
        action: 'settings',
        params: { section: 'bluetooth' },
        isValid: true,
      });
    });

    it('should parse connect link', () => {
      const url = 'rokumote://connect?deviceId=test123&deviceName=TestDevice';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed).toEqual({
        action: 'connect',
        params: {
          deviceId: 'test123',
          deviceName: 'TestDevice',
        },
        isValid: true,
      });
    });

    it('should parse command link', () => {
      const url = 'rokumote://command?type=navigation&action=up&payload={"test":"value"}';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed).toEqual({
        action: 'command',
        params: {
          type: 'navigation',
          action: 'up',
          payload: { test: 'value' },
        },
        isValid: true,
      });
    });

    it('should parse navigation link', () => {
      const url = 'rokumote://navigate?screen=settings&tab=bluetooth';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed).toEqual({
        action: 'navigate',
        params: {
          screen: 'settings',
          tab: 'bluetooth',
        },
        isValid: true,
      });
    });

    it('should handle invalid scheme', () => {
      const url = 'invalidscheme://remote';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Invalid scheme');
    });

    it('should handle invalid connect link without deviceId', () => {
      const url = 'rokumote://connect?deviceName=TestDevice';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Device ID is required');
    });

    it('should handle invalid command link without required params', () => {
      const url = 'rokumote://command?type=navigation';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Command type and action are required');
    });

    it('should handle disabled command links', () => {
      const service = new DeepLinkingService({ enableCommandLinks: false });
      const url = 'rokumote://command?type=navigation&action=up';
      const parsed = service.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Command links are disabled');

      service.destroy();
    });

    it('should handle disabled navigation links', () => {
      const service = new DeepLinkingService({ enableNavigationLinks: false });
      const url = 'rokumote://navigate?screen=settings';
      const parsed = service.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Navigation links are disabled');

      service.destroy();
    });

    it('should handle unknown path', () => {
      const url = 'rokumote://unknown';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Unknown path');
    });

    it('should handle parsing errors', () => {
      mockLinking.parse.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const url = 'invalid-url';
      const parsed = deepLinkingService.parseDeepLink(url);

      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toContain('Failed to parse URL');
    });
  });

  describe('Deep Link Creation', () => {
    it('should create basic deep link', () => {
      const link = deepLinkingService.createDeepLink('remote');
      expect(link).toBe('rokumote://remote');
    });

    it('should create deep link with parameters', () => {
      const link = deepLinkingService.createDeepLink('remote', { deviceId: 'test123' });
      expect(link).toBe('rokumote://remote?deviceId=test123');
    });

    it('should create deep link with multiple parameters', () => {
      const link = deepLinkingService.createDeepLink('connect', {
        deviceId: 'test123',
        deviceName: 'Test Device',
      });
      expect(link).toContain('rokumote://connect?');
      expect(link).toContain('deviceId=test123');
      expect(link).toContain('deviceName=Test%20Device');
    });

    it('should create deep link with object parameter', () => {
      const link = deepLinkingService.createDeepLink('command', {
        type: 'navigation',
        payload: { direction: 'up' },
      });
      expect(link).toContain('rokumote://command?');
      expect(link).toContain('type=navigation');
      expect(link).toContain('payload=');
    });

    it('should filter out undefined and null parameters', () => {
      const link = deepLinkingService.createDeepLink('remote', {
        deviceId: 'test123',
        deviceName: undefined,
        extra: null,
      });
      expect(link).toBe('rokumote://remote?deviceId=test123');
    });
  });

  describe('Convenience Link Creation Methods', () => {
    it('should create remote link', () => {
      const link = deepLinkingService.createRemoteLink();
      expect(link).toBe('rokumote://remote');
    });

    it('should create remote link with device ID', () => {
      const link = deepLinkingService.createRemoteLink('test123');
      expect(link).toBe('rokumote://remote?deviceId=test123');
    });

    it('should create settings link', () => {
      const link = deepLinkingService.createSettingsLink();
      expect(link).toBe('rokumote://settings');
    });

    it('should create settings link with section', () => {
      const link = deepLinkingService.createSettingsLink('bluetooth');
      expect(link).toBe('rokumote://settings?section=bluetooth');
    });

    it('should create connect link', () => {
      const link = deepLinkingService.createConnectLink('test123', 'Test Device');
      expect(link).toContain('rokumote://connect?');
      expect(link).toContain('deviceId=test123');
      expect(link).toContain('deviceName=Test%20Device');
    });

    it('should create command link', () => {
      const link = deepLinkingService.createCommandLink('navigation', 'up', { test: 'value' });
      expect(link).toContain('rokumote://command?');
      expect(link).toContain('type=navigation');
      expect(link).toContain('action=up');
    });

    it('should throw error for command link when disabled', () => {
      const service = new DeepLinkingService({ enableCommandLinks: false });
      expect(() => {
        service.createCommandLink('navigation', 'up');
      }).toThrow('Command links are disabled');
      service.destroy();
    });

    it('should create navigation link', () => {
      const link = deepLinkingService.createNavigationLink('settings', { tab: 'bluetooth' });
      expect(link).toContain('rokumote://navigate?');
      expect(link).toContain('screen=settings');
      expect(link).toContain('tab=bluetooth');
    });

    it('should throw error for navigation link when disabled', () => {
      const service = new DeepLinkingService({ enableNavigationLinks: false });
      expect(() => {
        service.createNavigationLink('settings');
      }).toThrow('Navigation links are disabled');
      service.destroy();
    });
  });

  describe('URL Handling', () => {
    it('should check if URL can be handled', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      
      const canHandle = await deepLinkingService.canHandleURL('rokumote://remote');
      
      expect(canHandle).toBe(true);
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith('rokumote://remote');
    });

    it('should handle canOpenURL error', async () => {
      mockLinking.canOpenURL.mockRejectedValue(new Error('Error'));
      
      const canHandle = await deepLinkingService.canHandleURL('rokumote://remote');
      
      expect(canHandle).toBe(false);
    });

    it('should open URL externally', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue(undefined);
      
      const result = await deepLinkingService.openURL('https://example.com');
      
      expect(result).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalledWith('https://example.com');
    });

    it('should not open URL if cannot handle', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      
      const result = await deepLinkingService.openURL('https://example.com');
      
      expect(result).toBe(false);
      expect(mockLinking.openURL).not.toHaveBeenCalled();
    });

    it('should handle openURL error', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockRejectedValue(new Error('Error'));
      
      const result = await deepLinkingService.openURL('https://example.com');
      
      expect(result).toBe(false);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await deepLinkingService.initialize();
    });

    it('should emit deep_link event for incoming URL', () => {
      const eventSpy = jest.fn();
      deepLinkingService.on('deep_link', eventSpy);

      const url = 'rokumote://remote?deviceId=test123';
      mockLinkingListener({ url });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'link_received',
          url,
          params: { deviceId: 'test123' },
        })
      );
    });

    it('should emit specific events for valid links', () => {
      const remoteEventSpy = jest.fn();
      const commandEventSpy = jest.fn();
      
      deepLinkingService.on('remote_requested', remoteEventSpy);
      deepLinkingService.on('command_requested', commandEventSpy);

      // Test remote link
      mockLinkingListener({ url: 'rokumote://remote' });
      expect(remoteEventSpy).toHaveBeenCalled();

      // Test command link
      mockLinkingListener({ url: 'rokumote://command?type=navigation&action=up' });
      expect(commandEventSpy).toHaveBeenCalled();
    });

    it('should emit invalid_link event for invalid links', () => {
      const invalidEventSpy = jest.fn();
      deepLinkingService.on('invalid_link', invalidEventSpy);

      mockLinkingListener({ url: 'invalidscheme://remote' });

      expect(invalidEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invalid_link',
          url: 'invalidscheme://remote',
          error: expect.stringContaining('Invalid scheme'),
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        scheme: 'newscheme',
        enableCommandLinks: false,
      };

      deepLinkingService.updateConfig(newConfig);
      const config = deepLinkingService.getConfig();

      expect(config.scheme).toBe('newscheme');
      expect(config.enableCommandLinks).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', async () => {
      const mockRemove = jest.fn();
      mockLinking.addEventListener.mockReturnValue({ remove: mockRemove });

      await deepLinkingService.initialize();
      deepLinkingService.destroy();

      expect(mockRemove).toHaveBeenCalled();
    });

    it('should handle destroy when not initialized', () => {
      expect(() => deepLinkingService.destroy()).not.toThrow();
    });

    it('should not initialize twice', async () => {
      await deepLinkingService.initialize();
      await deepLinkingService.initialize();

      expect(mockLinking.addEventListener).toHaveBeenCalledTimes(1);
    });
  });
});