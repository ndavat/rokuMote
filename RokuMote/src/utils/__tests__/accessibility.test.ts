import {
  getFontScale,
  scaleFontSize,
  scaleSpacing,
  ensureMinimumTouchTarget,
  getScreenInfo,
  getResponsiveButtonSize,
  getConnectionStatusLabel,
  getButtonAccessibilityHint,
  createAccessibilityProps,
  getAccessibleHitSlop,
  shouldUseReducedMotion,
  formatDurationForAccessibility,
} from '../accessibility';
import { PixelRatio, Dimensions } from 'react-native';

// Mock React Native modules
jest.mock('react-native', () => ({
  PixelRatio: {
    getFontScale: jest.fn(() => 1.0),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

describe('Accessibility Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFontScale', () => {
    it('should return the system font scale', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);
      expect(getFontScale()).toBe(1.2);
    });
  });

  describe('scaleFontSize', () => {
    it('should scale font size based on system font scale', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);
      const result = scaleFontSize(16);
      expect(result).toBe(19); // 16 * 1.2 = 19.2, rounded to 19
    });

    it('should respect maximum scale limit', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);
      const result = scaleFontSize(16, 1.5);
      expect(result).toBe(24); // 16 * 1.5 = 24 (clamped to maxScale)
    });

    it('should use default max scale of 1.5', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);
      const result = scaleFontSize(16);
      expect(result).toBe(24); // 16 * 1.5 = 24
    });
  });

  describe('scaleSpacing', () => {
    it('should scale spacing based on font scale with factor', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);
      const result = scaleSpacing(16, 0.3);
      // 1 + ((1.2 - 1) * 0.3) = 1.06, 16 * 1.06 = 16.96, rounded to 17
      expect(result).toBe(17);
    });

    it('should use default factor of 0.3', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);
      const result = scaleSpacing(20);
      // 1 + ((1.5 - 1) * 0.3) = 1.15, 20 * 1.15 = 23
      expect(result).toBe(23);
    });

    it('should not scale when font scale is 1.0', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);
      const result = scaleSpacing(16);
      expect(result).toBe(16);
    });
  });

  describe('ensureMinimumTouchTarget', () => {
    it('should return minimum touch target size when input is smaller', () => {
      expect(ensureMinimumTouchTarget(30)).toBe(44);
    });

    it('should return original size when it meets minimum requirement', () => {
      expect(ensureMinimumTouchTarget(50)).toBe(50);
    });

    it('should handle edge case of exactly minimum size', () => {
      expect(ensureMinimumTouchTarget(44)).toBe(44);
    });
  });

  describe('getScreenInfo', () => {
    it('should return screen dimensions and orientation info', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const result = getScreenInfo();
      
      expect(result).toEqual({
        width: 375,
        height: 667,
        isLandscape: false,
        isTablet: false,
      });
    });

    it('should detect landscape orientation', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 667, height: 375 });
      const result = getScreenInfo();
      
      expect(result.isLandscape).toBe(true);
    });

    it('should detect tablet size', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
      const result = getScreenInfo();
      
      expect(result.isTablet).toBe(true);
    });
  });

  describe('getResponsiveButtonSize', () => {
    it('should scale button size for larger screens', () => {
      const result = getResponsiveButtonSize(50, 450);
      expect(result).toBe(55); // 50 * 1.1 = 55, meets minimum
    });

    it('should scale button size for smaller screens', () => {
      const result = getResponsiveButtonSize(50, 320);
      expect(result).toBe(45); // 50 * 0.9 = 45, meets minimum
    });

    it('should ensure minimum touch target', () => {
      const result = getResponsiveButtonSize(30, 320);
      expect(result).toBe(44); // Scaled to 27, but minimum is 44
    });
  });

  describe('getConnectionStatusLabel', () => {
    it('should return connected status label', () => {
      const result = getConnectionStatusLabel(true, 'Living Room TV');
      expect(result).toBe('Connected to Living Room TV');
    });

    it('should return disconnected status label', () => {
      const result = getConnectionStatusLabel(false, 'Bedroom TV');
      expect(result).toBe('Not connected to Bedroom TV');
    });

    it('should return mock mode status label', () => {
      const result = getConnectionStatusLabel(true, 'Test Device', true);
      expect(result).toBe('Mock mode active. Simulating connection to Test Device');
    });
  });

  describe('getButtonAccessibilityHint', () => {
    it('should return basic hint without context', () => {
      const result = getButtonAccessibilityHint('play');
      expect(result).toBe('Activates play');
    });

    it('should return hint with context', () => {
      const result = getButtonAccessibilityHint('volume up', 'Increases audio volume');
      expect(result).toBe('Activates volume up. Increases audio volume');
    });
  });

  describe('createAccessibilityProps', () => {
    it('should create basic accessibility props', () => {
      const result = createAccessibilityProps('Play button');
      
      expect(result).toEqual({
        accessibilityRole: 'button',
        accessibilityLabel: 'Play button',
      });
    });

    it('should include hint when provided', () => {
      const result = createAccessibilityProps('Play button', 'Starts playback');
      
      expect(result).toEqual({
        accessibilityRole: 'button',
        accessibilityLabel: 'Play button',
        accessibilityHint: 'Starts playback',
      });
    });

    it('should include state when provided', () => {
      const result = createAccessibilityProps(
        'Mute button',
        'Toggles audio',
        'button',
        { selected: true }
      );
      
      expect(result).toEqual({
        accessibilityRole: 'button',
        accessibilityLabel: 'Mute button',
        accessibilityHint: 'Toggles audio',
        accessibilityState: { selected: true },
      });
    });

    it('should support different roles', () => {
      const result = createAccessibilityProps('Status text', undefined, 'text');
      
      expect(result).toEqual({
        accessibilityRole: 'text',
        accessibilityLabel: 'Status text',
      });
    });
  });

  describe('getAccessibleHitSlop', () => {
    it('should return default hit slop', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);
      const result = getAccessibleHitSlop();
      
      expect(result).toEqual({
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
      });
    });

    it('should scale hit slop based on font scale', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);
      const result = getAccessibleHitSlop(10);
      
      expect(result).toEqual({
        top: 12,
        bottom: 12,
        left: 12,
        right: 12,
      });
    });

    it('should limit hit slop scaling', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);
      const result = getAccessibleHitSlop(10);
      
      // Should be clamped to 1.3 max scale: 10 * 1.3 = 13
      expect(result).toEqual({
        top: 13,
        bottom: 13,
        left: 13,
        right: 13,
      });
    });
  });

  describe('shouldUseReducedMotion', () => {
    it('should return false as placeholder implementation', () => {
      expect(shouldUseReducedMotion()).toBe(false);
    });
  });

  describe('formatDurationForAccessibility', () => {
    it('should format seconds only', () => {
      expect(formatDurationForAccessibility(30)).toBe('30 seconds');
    });

    it('should format minutes and seconds', () => {
      expect(formatDurationForAccessibility(90)).toBe('1 minute, 30 seconds');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDurationForAccessibility(3661)).toBe('1 hour, 1 minute, 1 second');
    });

    it('should handle plural forms correctly', () => {
      expect(formatDurationForAccessibility(7322)).toBe('2 hours, 2 minutes, 2 seconds');
    });

    it('should handle zero duration', () => {
      expect(formatDurationForAccessibility(0)).toBe('0 seconds');
    });

    it('should handle hours without minutes', () => {
      expect(formatDurationForAccessibility(3600)).toBe('1 hour');
    });

    it('should handle minutes without seconds', () => {
      expect(formatDurationForAccessibility(120)).toBe('2 minutes');
    });
  });
});