import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector, selectors } from '../../state';
import { getAccessibleHitSlop, createAccessibilityProps } from '../../utils/accessibility';

export type DirectionType = 'up' | 'down' | 'left' | 'right';

export interface DirectionalPadProps {
  onDirectionPress: (direction: DirectionType) => void;
  onOkPress: () => void;
  disabled?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const DirectionalPad: React.FC<DirectionalPadProps> = ({
  onDirectionPress,
  onOkPress,
  disabled = false,
  hapticFeedback = true,
  style,
  testID,
}) => {
  const { theme, accessibility } = useTheme();
  
  // Get settings from global state
  const vibrationEnabled = useAppSelector(selectors.vibrationEnabled);
  const isLoading = useAppSelector(selectors.isLoading);

  const handlePress = async (callback: () => void) => {
    if (disabled || isLoading) return;

    // Provide haptic feedback if enabled in settings and appropriate for accessibility
    if (hapticFeedback && vibrationEnabled && accessibility.shouldUseHapticFeedback()) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }

    callback();
  };

  // Get responsive sizing for the directional pad
  const layout = accessibility.getResponsiveLayout();
  const baseButtonSize = accessibility.getResponsiveButtonSize(60);
  const centerButtonSize = accessibility.getResponsiveButtonSize(80);
  
  // Scale the container based on button sizes
  const containerSize = Math.max(200, centerButtonSize + baseButtonSize);

  const containerStyles = [
    styles.container,
    {
      width: containerSize,
      height: containerSize,
      position: theme.components.dpad.container.position as any,
    },
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const getButtonStyles = (position: 'up' | 'down' | 'left' | 'right' | 'center') => {
    const baseButtonStyle = {
      backgroundColor: theme.components.dpad.button.backgroundColor,
      borderRadius: theme.components.dpad.button.borderRadius,
      alignItems: theme.components.dpad.button.alignItems as any,
      justifyContent: theme.components.dpad.button.justifyContent as any,
      position: theme.components.dpad.button.position as any,
    };

    // Calculate responsive positions and sizes
    const isCenter = position === 'center';
    const buttonSize = isCenter ? centerButtonSize : baseButtonSize;
    const centerOffset = (containerSize - buttonSize) / 2;
    const edgeOffset = (containerSize - buttonSize) / 2 - buttonSize / 2;

    let positionStyle: any = {
      width: buttonSize,
      height: buttonSize,
    };

    switch (position) {
      case 'center':
        positionStyle = {
          ...positionStyle,
          borderRadius: buttonSize / 2,
          top: centerOffset,
          left: centerOffset,
        };
        break;
      case 'up':
        positionStyle = {
          ...positionStyle,
          top: 0,
          left: centerOffset,
        };
        break;
      case 'down':
        positionStyle = {
          ...positionStyle,
          bottom: 0,
          left: centerOffset,
        };
        break;
      case 'left':
        positionStyle = {
          ...positionStyle,
          top: centerOffset,
          left: 0,
        };
        break;
      case 'right':
        positionStyle = {
          ...positionStyle,
          top: centerOffset,
          right: 0,
        };
        break;
    }

    return [
      styles.button,
      baseButtonStyle,
      positionStyle,
      (disabled || isLoading) && styles.disabledButton,
    ];
  };

  return (
    <View style={containerStyles} testID={testID}>
      {/* Up Button */}
      <TouchableOpacity
        style={getButtonStyles('up')}
        onPress={() => handlePress(() => onDirectionPress('up'))}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        hitSlop={getAccessibleHitSlop()}
        testID={`${testID}-up`}
        {...createAccessibilityProps(
          'Navigate up',
          'Moves selection up in the menu',
          'button',
          { disabled: disabled || isLoading }
        )}
      >
        <Ionicons 
          name="chevron-up" 
          size={theme.icons.size.lg} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>

      {/* Down Button */}
      <TouchableOpacity
        style={getButtonStyles('down')}
        onPress={() => handlePress(() => onDirectionPress('down'))}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        hitSlop={getAccessibleHitSlop()}
        testID={`${testID}-down`}
        {...createAccessibilityProps(
          'Navigate down',
          'Moves selection down in the menu',
          'button',
          { disabled: disabled || isLoading }
        )}
      >
        <Ionicons 
          name="chevron-down" 
          size={theme.icons.size.lg} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>

      {/* Left Button */}
      <TouchableOpacity
        style={getButtonStyles('left')}
        onPress={() => handlePress(() => onDirectionPress('left'))}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        hitSlop={getAccessibleHitSlop()}
        testID={`${testID}-left`}
        {...createAccessibilityProps(
          'Navigate left',
          'Moves selection left in the menu',
          'button',
          { disabled: disabled || isLoading }
        )}
      >
        <Ionicons 
          name="chevron-back" 
          size={theme.icons.size.lg} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>

      {/* Right Button */}
      <TouchableOpacity
        style={getButtonStyles('right')}
        onPress={() => handlePress(() => onDirectionPress('right'))}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        hitSlop={getAccessibleHitSlop()}
        testID={`${testID}-right`}
        {...createAccessibilityProps(
          'Navigate right',
          'Moves selection right in the menu',
          'button',
          { disabled: disabled || isLoading }
        )}
      >
        <Ionicons 
          name="chevron-forward" 
          size={theme.icons.size.lg} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>

      {/* Center OK Button */}
      <TouchableOpacity
        style={getButtonStyles('center')}
        onPress={() => handlePress(onOkPress)}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        hitSlop={getAccessibleHitSlop()}
        testID={`${testID}-ok`}
        {...createAccessibilityProps(
          'OK',
          'Selects the current item or confirms the action',
          'button',
          { disabled: disabled || isLoading }
        )}
      >
        <Ionicons 
          name="checkmark" 
          size={theme.icons.size.xl} 
          color={theme.icons.color.primary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles - theme styles will override these
  },
  button: {
    // Base styles - theme styles will override these
  },
  disabled: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.7,
  },
});