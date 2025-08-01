import { useState, useEffect } from 'react';
import { Dimensions, PixelRatio, AccessibilityInfo } from 'react-native';
import { 
  getFontScale, 
  scaleFontSize, 
  scaleSpacing, 
  getScreenInfo,
  shouldUseReducedMotion 
} from '../utils/accessibility';

export interface AccessibilityState {
  fontScale: number;
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  screenInfo: {
    width: number;
    height: number;
    isLandscape: boolean;
    isTablet: boolean;
  };
}

/**
 * Hook for managing accessibility features and responsive design
 */
export const useAccessibility = () => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    fontScale: getFontScale(),
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: shouldUseReducedMotion(),
    screenInfo: getScreenInfo(),
  });

  useEffect(() => {
    // Check if screen reader is enabled
    const checkScreenReader = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        setAccessibilityState(prev => ({
          ...prev,
          isScreenReaderEnabled: isEnabled,
        }));
      } catch (error) {
        console.warn('Could not check screen reader status:', error);
      }
    };

    checkScreenReader();

    // Listen for screen reader changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled: boolean) => {
        setAccessibilityState(prev => ({
          ...prev,
          isScreenReaderEnabled: isEnabled,
        }));
      }
    );

    // Listen for dimension changes (orientation, window resize)
    const dimensionListener = Dimensions.addEventListener('change', () => {
      setAccessibilityState(prev => ({
        ...prev,
        fontScale: getFontScale(),
        screenInfo: getScreenInfo(),
      }));
    });

    return () => {
      screenReaderListener?.remove();
      dimensionListener?.remove();
    };
  }, []);

  /**
   * Scales font size based on system accessibility settings
   */
  const getScaledFontSize = (baseFontSize: number, maxScale: number = 1.5) => {
    return scaleFontSize(baseFontSize, maxScale);
  };

  /**
   * Scales spacing based on font scale for better accessibility
   */
  const getScaledSpacing = (baseSpacing: number, factor: number = 0.3) => {
    return scaleSpacing(baseSpacing, factor);
  };

  /**
   * Gets responsive button size based on screen size and accessibility settings
   */
  const getResponsiveButtonSize = (baseSize: number) => {
    const { width } = accessibilityState.screenInfo;
    const scaleFactor = width > 400 ? 1.1 : width < 350 ? 0.9 : 1;
    const scaledSize = baseSize * scaleFactor;
    
    // Apply font scale for accessibility
    const accessibleSize = scaledSize * Math.min(accessibilityState.fontScale, 1.3);
    
    // Ensure minimum touch target
    return Math.max(accessibleSize, 44);
  };

  /**
   * Gets animation duration based on reduced motion preference
   */
  const getAnimationDuration = (baseDuration: number) => {
    return accessibilityState.isReduceMotionEnabled ? 0 : baseDuration;
  };

  /**
   * Determines if haptic feedback should be used
   */
  const shouldUseHapticFeedback = () => {
    // Disable haptic feedback for screen reader users as it can interfere
    return !accessibilityState.isScreenReaderEnabled;
  };

  /**
   * Gets layout props for responsive design
   */
  const getResponsiveLayout = () => {
    const { width, height, isLandscape, isTablet } = accessibilityState.screenInfo;
    
    return {
      containerPadding: isTablet ? 32 : 20,
      buttonSpacing: isTablet ? 16 : 12,
      sectionSpacing: getScaledSpacing(isTablet ? 24 : 16),
      maxContentWidth: isTablet ? 600 : width,
      isCompactLayout: width < 350,
      isLandscape,
      isTablet,
    };
  };

  return {
    ...accessibilityState,
    getScaledFontSize,
    getScaledSpacing,
    getResponsiveButtonSize,
    getAnimationDuration,
    shouldUseHapticFeedback,
    getResponsiveLayout,
  };
};