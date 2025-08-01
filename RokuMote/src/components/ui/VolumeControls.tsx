import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

export type VolumeControlButtonType = 
  | 'mute' 
  | 'volumeDown' 
  | 'volumeUp';

export interface VolumeControlsProps {
  onVolumePress: (action: VolumeControlButtonType) => void;
  disabled?: boolean;
  isMuted?: boolean;
  testID?: string;
}

interface ButtonConfig {
  type: VolumeControlButtonType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accessibilityHint: string;
}

const volumeButtons: ButtonConfig[] = [
  {
    type: 'mute',
    icon: 'volume-mute', // Will be dynamically changed based on isMuted
    label: 'Mute',
    accessibilityHint: 'Toggles mute state'
  },
  {
    type: 'volumeDown',
    icon: 'volume-low',
    label: 'Volume Down',
    accessibilityHint: 'Decreases volume'
  },
  {
    type: 'volumeUp',
    icon: 'volume-high',
    label: 'Volume Up',
    accessibilityHint: 'Increases volume'
  }
];

export const VolumeControls: React.FC<VolumeControlsProps> = ({
  onVolumePress,
  disabled = false,
  isMuted = false,
  testID
}) => {
  const { theme } = useTheme();

  const handleButtonPress = async (type: VolumeControlButtonType) => {
    if (disabled) return;

    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }

    onVolumePress(type);
  };

  const getMuteIcon = (): keyof typeof Ionicons.glyphMap => {
    return isMuted ? 'volume-mute' : 'volume-medium';
  };

  const getMuteLabel = (): string => {
    return isMuted ? 'Unmute' : 'Mute';
  };

  const getMuteHint = (): string => {
    return isMuted ? 'Unmutes audio' : 'Mutes audio';
  };

  const renderButton = (buttonConfig: ButtonConfig) => {
    const { type, icon, label, accessibilityHint } = buttonConfig;
    
    // Handle mute button special case
    const buttonIcon = type === 'mute' ? getMuteIcon() : icon;
    const buttonLabel = type === 'mute' ? getMuteLabel() : label;
    const buttonHint = type === 'mute' ? getMuteHint() : accessibilityHint;
    
    return (
      <View key={type} style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => handleButtonPress(type)}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          accessibilityHint={buttonHint}
          accessibilityState={{ disabled }}
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.surface.button,
              borderRadius: theme.borderRadius.lg,
            },
            disabled && styles.disabled
          ]}
          testID={`${testID}-${type}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={buttonIcon}
            size={theme.icons.size.lg}
            color={disabled ? theme.colors.text.secondary : theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.row}>
        {volumeButtons.map(renderButton)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    aspectRatio: 1,
    minHeight: 50,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});