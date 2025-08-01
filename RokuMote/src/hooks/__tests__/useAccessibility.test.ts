import { renderHook, act } from '@testing-library/react-native';
import { useAccessibility } from '../useAccessibility';
import { Dimensions, PixelRatio, AccessibilityInfo } from 'react-native';

// Mock React Native modules
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  PixelRatio: {
    getFontScale: jest.fn(() => 1.0),
  },
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock accessibility utils
jest.mock('../../utils/accessibility', () => ({
  getFontScale: jest.fn(() => 1.0),
  scaleFontSize: jest.fn((size) => size),
  scaleSpacing: jest.fn((spacing) => spacing),
  getScreenInfo: jest.fn(() => ({
    width: 375,
    height: 667,
    isLandscape: false,
    isTablet: false,
  })),
  shouldUseReducedMotion: jest.fn(() => false),
}));

describe('useAccessibility Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default accessibility state', async () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.fontScale).toBe(1.0);
    expect(result.current.isScreenReaderEnabled).toBe(false);
    expect(result.current.isReduceMotionEnabled).toBe(false);
    expect(result.current.screenInfo).toEqual({
      width: 375,
      height: 667,
      isLandscape: false,
      isTablet: false,
    });
  });

  it('should provide scaled font size function', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const scaledSize = result.current.getScaledFontSize(16);
    expect(typeof scaledSize).toBe('number');
  });

  it('should provide scaled spacing function', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const scaledSpacing = result.current.getScaledSpacing(16);
    expect(typeof scaledSpacing).toBe('number');
  });

  it('should provide responsive button size function', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const buttonSize = result.current.getResponsiveButtonSize(50);
    expect(buttonSize).toBeGreaterThanOrEqual(44); // Minimum touch target
  });

  it('should provide animation duration function', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const duration = result.current.getAnimationDuration(300);
    expect(typeof duration).toBe('number');
  });

  it('should provide haptic feedback preference', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const shouldUseHaptic = result.current.shouldUseHapticFeedback();
    expect(typeof shouldUseHaptic).toBe('boolean');
  });

  it('should provide responsive layout configuration', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const layout = result.current.getResponsiveLayout();
    expect(layout).toHaveProperty('containerPadding');
    expect(layout).toHaveProperty('buttonSpacing');
    expect(layout).toHaveProperty('sectionSpacing');
    expect(layout).toHaveProperty('maxContentWidth');
    expect(layout).toHaveProperty('isCompactLayout');
    expect(layout).toHaveProperty('isLandscape');
    expect(layout).toHaveProperty('isTablet');
  });

  it('should handle screen reader state changes', async () => {
    const mockListener = jest.fn();
    (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

    const { result } = renderHook(() => useAccessibility());

    // Simulate screen reader being enabled
    act(() => {
      const listener = (AccessibilityInfo.addEventListener as jest.Mock).mock.calls[0][1];
      listener(true);
    });

    expect(result.current.isScreenReaderEnabled).toBe(true);
  });

  it('should handle dimension changes', () => {
    const mockListener = jest.fn();
    (Dimensions.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

    const { result } = renderHook(() => useAccessibility());

    // Simulate dimension change
    act(() => {
      const listener = (Dimensions.addEventListener as jest.Mock).mock.calls[0][1];
      listener();
    });

    // Should trigger re-evaluation of screen info and font scale
    expect(Dimensions.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should clean up listeners on unmount', () => {
    const mockRemove = jest.fn();
    (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });
    (Dimensions.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

    const { unmount } = renderHook(() => useAccessibility());

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(2);
  });

  describe('Responsive Layout', () => {
    it('should provide tablet-specific layout for large screens', () => {
      const mockGetScreenInfo = require('../../utils/accessibility').getScreenInfo;
      mockGetScreenInfo.mockReturnValue({
        width: 1024,
        height: 768,
        isLandscape: true,
        isTablet: true,
      });

      const { result } = renderHook(() => useAccessibility());
      const layout = result.current.getResponsiveLayout();

      expect(layout.isTablet).toBe(true);
      expect(layout.isLandscape).toBe(true);
      expect(layout.containerPadding).toBe(32);
      expect(layout.buttonSpacing).toBe(16);
    });

    it('should provide compact layout for small screens', () => {
      const mockGetScreenInfo = require('../../utils/accessibility').getScreenInfo;
      mockGetScreenInfo.mockReturnValue({
        width: 320,
        height: 568,
        isLandscape: false,
        isTablet: false,
      });

      const { result } = renderHook(() => useAccessibility());
      const layout = result.current.getResponsiveLayout();

      expect(layout.isCompactLayout).toBe(true);
      expect(layout.containerPadding).toBe(20);
      expect(layout.buttonSpacing).toBe(12);
    });
  });

  describe('Accessibility Features', () => {
    it('should disable haptic feedback for screen reader users', () => {
      const { result, rerender } = renderHook(() => useAccessibility());

      // Initially should allow haptic feedback
      expect(result.current.shouldUseHapticFeedback()).toBe(true);

      // Simulate screen reader being enabled
      act(() => {
        const listener = (AccessibilityInfo.addEventListener as jest.Mock).mock.calls[0][1];
        listener(true);
      });

      expect(result.current.shouldUseHapticFeedback()).toBe(false);
    });

    it('should return zero animation duration when reduced motion is enabled', () => {
      const mockShouldUseReducedMotion = require('../../utils/accessibility').shouldUseReducedMotion;
      mockShouldUseReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.getAnimationDuration(300)).toBe(0);
    });

    it('should return normal animation duration when reduced motion is disabled', () => {
      const mockShouldUseReducedMotion = require('../../utils/accessibility').shouldUseReducedMotion;
      mockShouldUseReducedMotion.mockReturnValue(false);

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.getAnimationDuration(300)).toBe(300);
    });
  });

  describe('Button Sizing', () => {
    it('should scale buttons based on screen size and accessibility settings', () => {
      const mockGetFontScale = require('../../utils/accessibility').getFontScale;
      mockGetFontScale.mockReturnValue(1.2);

      const { result } = renderHook(() => useAccessibility());
      
      const buttonSize = result.current.getResponsiveButtonSize(50);
      
      // Should be scaled for accessibility and ensure minimum touch target
      expect(buttonSize).toBeGreaterThanOrEqual(44);
    });

    it('should ensure minimum touch target size regardless of scaling', () => {
      const { result } = renderHook(() => useAccessibility());
      
      const smallButtonSize = result.current.getResponsiveButtonSize(20);
      
      expect(smallButtonSize).toBe(44); // Should be bumped up to minimum
    });
  });
});