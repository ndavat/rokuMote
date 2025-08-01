import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector, selectors } from '../../state';
import { getAccessibleHitSlop, createAccessibilityProps } from '../../utils/accessibility';

export type ButtonVariant = 'primary' | 'secondary' | 'directional';

export interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'secondary',
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  hapticFeedback = true,
  testID,
}) => {
  const { theme, accessibility } = useTheme();
  
  // Get settings from global state
  const vibrationEnabled = useAppSelector(selectors.vibrationEnabled);
  const isLoading = useAppSelector(selectors.isLoading);

  const handlePress = async (event: GestureResponderEvent) => {
    if (disabled || isLoading) return;

    // Provide haptic feedback if enabled in settings and appropriate for accessibility
    if (hapticFeedback && vibrationEnabled && accessibility.shouldUseHapticFeedback()) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptic feedback might not be available on all devices
        console.warn('Haptic feedback not available:', error);
      }
    }

    onPress(event);
  };

  // Get responsive button size
  const responsiveSize = accessibility.getResponsiveButtonSize(
    variant === 'directional' ? 60 : 50
  );

  const buttonStyles = [
    styles.base,
    {
      borderRadius: theme.components.button.base.borderRadius,
      paddingVertical: accessibility.getScaledSpacing(theme.components.button.base.paddingVertical),
      paddingHorizontal: accessibility.getScaledSpacing(theme.components.button.base.paddingHorizontal),
      minHeight: responsiveSize,
      minWidth: responsiveSize,
    },
    getVariantStyles(theme, variant, responsiveSize),
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    {
      fontSize: theme.typography.fontSize.base, // Already scaled by theme
      fontWeight: theme.typography.fontWeight.medium,
    },
    getVariantTextStyles(theme, variant),
    (disabled || isLoading) && styles.disabledText,
    textStyle,
  ];

  const accessibilityProps = createAccessibilityProps(
    accessibilityLabel || title,
    accessibilityHint,
    'button',
    { disabled: disabled || isLoading }
  );

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      testID={testID}
      hitSlop={getAccessibleHitSlop()}
      {...accessibilityProps}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const getVariantStyles = (theme: any, variant: ButtonVariant, responsiveSize: number): ViewStyle => {
  const variantConfig = theme.components.button.variants[variant];
  
  const baseStyle: ViewStyle = {
    backgroundColor: variantConfig.backgroundColor,
  };

  // Add specific styles for directional variant with responsive sizing
  if (variant === 'directional') {
    return {
      ...baseStyle,
      minWidth: responsiveSize,
      minHeight: responsiveSize,
    };
  }

  return baseStyle;
};

const getVariantTextStyles = (theme: any, variant: ButtonVariant): TextStyle => {
  const variantConfig = theme.components.button.variants[variant];
  
  return {
    color: variantConfig.color,
  };
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    // Minimum touch target size handled by responsive sizing
  },
  text: {
    textAlign: 'center',
    // Allow text to wrap for accessibility
    flexWrap: 'wrap',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});