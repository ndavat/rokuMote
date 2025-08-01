import { PixelRatio, Dimensions } from 'react-native';

/**
 * Accessibility utilities for RokuMote app
 */

/**
 * Gets the system font scale factor
 * @returns The current font scale factor from system accessibility settings
 */
export const getFontScale = (): number => {
  return PixelRatio.getFontScale();
};

/**
 * Scales a font size based on the system font scale setting
 * @param baseFontSize - The base font size to scale
 * @param maxScale - Maximum scale factor to prevent text from becoming too large
 * @returns Scaled font size
 */
export const scaleFontSize = (baseFontSize: number, maxScale: number = 1.5): number => {
  const fontScale = getFontScale();
  const clampedScale = Math.min(fontScale, maxScale);
  return Math.round(baseFontSize * clampedScale);
};

/**
 * Scales spacing values based on font scale for better accessibility
 * @param baseSpacing - The base spacing value
 * @param factor - How much the spacing should scale relative to font scale (0-1)
 * @returns Scaled spacing value
 */
export const scaleSpacing = (baseSpacing: number, factor: number = 0.3): number => {
  const fontScale = getFontScale();
  const scaleFactor = 1 + ((fontScale - 1) * factor);
  return Math.round(baseSpacing * scaleFactor);
};

/**
 * Ensures minimum touch target size for accessibility (44x44 points)
 * @param size - The desired size
 * @returns Size that meets minimum accessibility requirements
 */
export const ensureMinimumTouchTarget = (size: number): number => {
  const MINIMUM_TOUCH_TARGET = 44;
  return Math.max(size, MINIMUM_TOUCH_TARGET);
};

/**
 * Gets screen dimensions and calculates if device is in landscape mode
 * @returns Object with screen dimensions and orientation info
 */
export const getScreenInfo = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    isLandscape: width > height,
    isTablet: Math.min(width, height) >= 768, // iPad mini and larger
  };
};

/**
 * Calculates responsive button size based on screen size
 * @param baseSize - Base button size
 * @param screenWidth - Current screen width
 * @returns Responsive button size
 */
export const getResponsiveButtonSize = (baseSize: number, screenWidth: number): number => {
  // Scale buttons slightly on larger screens
  const scaleFactor = screenWidth > 400 ? 1.1 : screenWidth < 350 ? 0.9 : 1;
  const scaledSize = baseSize * scaleFactor;
  return ensureMinimumTouchTarget(scaledSize);
};

/**
 * Generates accessibility label for connection status
 * @param isConnected - Whether device is connected
 * @param deviceName - Name of the connected device
 * @param mockMode - Whether app is in mock mode
 * @returns Descriptive accessibility label
 */
export const getConnectionStatusLabel = (
  isConnected: boolean,
  deviceName: string,
  mockMode: boolean = false
): string => {
  if (mockMode) {
    return `Mock mode active. Simulating connection to ${deviceName}`;
  }
  
  return isConnected 
    ? `Connected to ${deviceName}` 
    : `Not connected to ${deviceName}`;
};

/**
 * Generates accessibility hint for button actions
 * @param action - The action the button performs
 * @param context - Additional context about the action
 * @returns Descriptive accessibility hint
 */
export const getButtonAccessibilityHint = (action: string, context?: string): string => {
  const baseHint = `Activates ${action}`;
  return context ? `${baseHint}. ${context}` : baseHint;
};

/**
 * Creates accessibility props for interactive elements
 * @param label - Accessibility label
 * @param hint - Accessibility hint
 * @param role - Accessibility role
 * @param state - Accessibility state
 * @returns Object with accessibility props
 */
export const createAccessibilityProps = (
  label: string,
  hint?: string,
  role: 'button' | 'text' | 'image' | 'switch' = 'button',
  state?: { disabled?: boolean; selected?: boolean; checked?: boolean }
) => ({
  accessibilityRole: role,
  accessibilityLabel: label,
  ...(hint && { accessibilityHint: hint }),
  ...(state && { accessibilityState: state }),
});

/**
 * Calculates hit slop for better touch accessibility
 * @param baseHitSlop - Base hit slop value
 * @returns Hit slop object with scaled values
 */
export const getAccessibleHitSlop = (baseHitSlop: number = 8) => {
  const fontScale = getFontScale();
  const scaledHitSlop = Math.round(baseHitSlop * Math.min(fontScale, 1.3));
  
  return {
    top: scaledHitSlop,
    bottom: scaledHitSlop,
    left: scaledHitSlop,
    right: scaledHitSlop,
  };
};

/**
 * Determines if reduced motion should be used based on accessibility settings
 * Note: This would typically use a native module to check system settings
 * For now, we'll provide a placeholder that can be enhanced later
 * @returns Whether reduced motion should be used
 */
export const shouldUseReducedMotion = (): boolean => {
  // This would ideally check system accessibility settings
  // For now, return false but this can be enhanced with a native module
  return false;
};

/**
 * Formats time duration for accessibility announcements
 * @param seconds - Duration in seconds
 * @returns Human-readable time format
 */
export const formatDurationForAccessibility = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
  }
  
  return parts.join(', ');
};