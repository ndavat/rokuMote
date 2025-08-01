import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector, selectors } from '../../state';
import { getAccessibleHitSlop, createAccessibilityProps } from '../../utils/accessibility';

export interface AccessibleTouchableProps extends Omit<TouchableOpacityProps, 'onPress'> {
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'text' | 'image' | 'switch';
  hapticFeedback?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Accessible touchable component that provides consistent accessibility features
 * and haptic feedback across the app
 */
export const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  hapticFeedback = true,
  disabled = false,
  children,
  hitSlop,
  style,
  ...props
}) => {
  const { accessibility } = useTheme();
  
  // Get settings from global state
  const vibrationEnabled = useAppSelector(selectors.vibrationEnabled);
  const isLoading = useAppSelector(selectors.isLoading);

  const handlePress = async (event: GestureResponderEvent) => {
    if (disabled || isLoading) return;

    // Provide haptic feedback if enabled and appropriate
    if (hapticFeedback && vibrationEnabled && accessibility.shouldUseHapticFeedback()) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }

    onPress(event);
  };

  const accessibilityProps = createAccessibilityProps(
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    { disabled: disabled || isLoading }
  );

  const accessibleHitSlop = hitSlop || getAccessibleHitSlop();

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      hitSlop={accessibleHitSlop}
      style={style}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};