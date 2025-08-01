import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

export type MediaControlButtonType = 
  | 'replay' 
  | 'star' 
  | 'headphones' 
  | 'rewind' 
  | 'playPause' 
  | 'fastForward';

export interface MediaControlsProps {
  onMediaPress: (action: MediaControlButtonType) => void;
  disabled?: boolean;
  isPlaying?: boolean;
  testID?: string;
}

interface ButtonConfig {
  type: MediaControlButtonType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accessibilityHint: string;
}

const topRowButtons: ButtonConfig[] = [
  {
    type: 'replay',
    icon: 'refresh',
    label: 'Replay',
    accessibilityHint: 'Replays the last few seconds'
  },
  {
    type: 'star',
    icon: 'star',
    label: 'Star',
    accessibilityHint: 'Opens options menu'
  },
  {
    type: 'headphones',
    icon: 'headset',
    label: 'Headphones',
    accessibilityHint: 'Toggles private listening mode'
  }
];

const bottomRowButtons: ButtonConfig[] = [
  {
    type: 'rewind',
    icon: 'play-back',
    label: 'Rewind',
    accessibilityHint: 'Rewinds playback'
  },
  {
    type: 'playPause',
    icon: 'play', // Will be dynamically changed based on isPlaying
    label: 'Play/Pause',
    accessibilityHint: 'Toggles playback state'
  },
  {
    type: 'fastForward',
    icon: 'play-forward',
    label: 'Fast Forward',
    accessibilityHint: 'Fast forwards playback'
  }
];

export const MediaControls: React.FC<MediaControlsProps> = ({
  onMediaPress,
  disabled = false,
  isPlaying = false,
  testID
}) => {
  const { theme } = useTheme();

  const handleButtonPress = async (type: MediaControlButtonType) => {
    if (disabled) return;

    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }

    onMediaPress(type);
  };

  const getPlayPauseIcon = (): keyof typeof Ionicons.glyphMap => {
    return isPlaying ? 'pause' : 'play';
  };

  const getPlayPauseLabel = (): string => {
    return isPlaying ? 'Pause' : 'Play';
  };

  const getPlayPauseHint = (): string => {
    return isPlaying ? 'Pauses playback' : 'Starts playback';
  };

  const renderButton = (buttonConfig: ButtonConfig) => {
    const { type, icon, label, accessibilityHint } = buttonConfig;
    
    // Handle play/pause button special case
    const buttonIcon = type === 'playPause' ? getPlayPauseIcon() : icon;
    const buttonLabel = type === 'playPause' ? getPlayPauseLabel() : label;
    const buttonHint = type === 'playPause' ? getPlayPauseHint() : accessibilityHint;
    
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
      {/* Top row: Replay, Star, Headphones */}
      <View style={[styles.row, { marginBottom: theme.spacing.sm }]}>
        {topRowButtons.map(renderButton)}
      </View>
      
      {/* Bottom row: Rewind, Play/Pause, Fast Forward */}
      <View style={styles.row}>
        {bottomRowButtons.map(renderButton)}
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