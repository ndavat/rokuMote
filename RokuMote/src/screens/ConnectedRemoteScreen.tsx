/**
 * Connected Remote Screen
 * Connects the RemoteScreen component to global state management and BLE service
 */

import React, { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { EnhancedRemoteScreen } from './EnhancedRemoteScreen';
import { useAppState, useAppSelector, selectors } from '../state';
import { useBLEService } from '../hooks/useBLEService';
import { ConnectionStatus } from '../types';
import type { DirectionType } from '../components/ui/DirectionalPad';
import type { QuickAccessButtonType } from '../components/ui/QuickAccessButtons';
import type { MediaControlButtonType } from '../components/ui/MediaControls';
import type { VolumeControlButtonType } from '../components/ui/VolumeControls';
import type { ButtonId } from '../utils/commandMapping';

export interface ConnectedRemoteScreenProps {
  testID?: string;
}

export const ConnectedRemoteScreen: React.FC<ConnectedRemoteScreenProps> = ({
  testID = 'connected-remote-screen',
}) => {
  const { dispatch, actions } = useAppState();
  
  // Use BLE service hook for service integration
  const {
    sendCommand,
    isConnected,
    connectionStatus,
    currentDevice,
    mockMode,
  } = useBLEService();
  
  // Use selectors for additional state slices
  const isLoading = useAppSelector(selectors.isLoading);
  const connectionError = useAppSelector(selectors.connectionError);
  const vibrationEnabled = useAppSelector(selectors.vibrationEnabled);

  // Determine device name
  const deviceName = currentDevice?.name || 'Roku Device';

  // Determine if controls should be disabled
  const controlsDisabled = !isConnected || isLoading || connectionStatus === ConnectionStatus.CONNECTING;

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      Alert.alert(
        'Connection Error',
        connectionError.message,
        [
          {
            text: 'Retry',
            onPress: () => {
              dispatch(actions.connection.clearConnectionError());
              // TODO: Trigger reconnection attempt
            },
          },
          {
            text: 'Enable Mock Mode',
            onPress: () => {
              dispatch(actions.connection.clearConnectionError());
              dispatch(actions.ui.setMockMode(true));
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              dispatch(actions.connection.clearConnectionError());
            },
          },
        ]
      );
    }
  }, [connectionError, dispatch, actions]);

  // Handle close action
  const handleClose = useCallback(() => {
    dispatch(actions.ui.setCurrentScreen('pairing'));
  }, [dispatch, actions]);

  // Handle power toggle
  const handlePowerToggle = useCallback(async () => {
    if (controlsDisabled) return;

    try {
      await sendCommand('power');
      
      // Provide haptic feedback if enabled
      if (vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to send power command:', error);
    }
  }, [controlsDisabled, sendCommand, vibrationEnabled]);

  // Handle directional pad presses
  const handleDirectionPress = useCallback(async (direction: DirectionType) => {
    if (controlsDisabled) return;

    let buttonId: ButtonId;
    switch (direction) {
      case 'up':
        buttonId = 'up';
        break;
      case 'down':
        buttonId = 'down';
        break;
      case 'left':
        buttonId = 'left';
        break;
      case 'right':
        buttonId = 'right';
        break;
      default:
        return;
    }

    try {
      await sendCommand(buttonId);
      
      // Provide haptic feedback if enabled
      if (vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error(`Failed to send ${direction} command:`, error);
    }
  }, [controlsDisabled, sendCommand, vibrationEnabled]);

  // Handle OK button press
  const handleOkPress = useCallback(async () => {
    if (controlsDisabled) return;

    try {
      await sendCommand('ok');
      
      // Provide haptic feedback if enabled
      if (vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to send OK command:', error);
    }
  }, [controlsDisabled, sendCommand, vibrationEnabled]);

  // Handle quick access button presses
  const handleQuickAccessPress = useCallback(async (button: QuickAccessButtonType) => {
    // Handle settings button as navigation instead of BLE command
    if (button === 'settings') {
      try {
        // Provide haptic feedback if enabled
        if (vibrationEnabled) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        // Navigate to settings screen
        router.push('/settings');
        return;
      } catch (error) {
        console.error('Failed to navigate to settings:', error);
        return;
      }
    }

    if (controlsDisabled) return;

    let buttonId: ButtonId;
    switch (button) {
      case 'search':
        buttonId = 'search';
        break;
      case 'voice':
        buttonId = 'voice';
        break;
      case 'keyboard':
        buttonId = 'keyboard';
        break;
      case 'back':
        buttonId = 'back';
        break;
      case 'guide':
        buttonId = 'guide';
        break;
      case 'home':
        buttonId = 'home';
        break;
      default:
        return;
    }

    try {
      await sendCommand(buttonId);
      
      // Provide haptic feedback if enabled
      if (vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error(`Failed to send ${button} command:`, error);
    }
  }, [controlsDisabled, sendCommand, vibrationEnabled]);

  // Handle media control presses
  const handleMediaPress = useCallback(async (action: MediaControlButtonType) => {
    if (controlsDisabled) return;

    let buttonId: ButtonId;
    switch (action) {
      case 'replay':
        buttonId = 'replay';
        break;
      case 'star':
        buttonId = 'star';
        break;
      case 'headphones':
        buttonId = 'headphones';
        break;
      case 'rewind':
        buttonId = 'rewind';
        break;
      case 'playPause':
        buttonId = 'playPause';
        break;
      case 'fastForward':
        buttonId = 'fastForward';
        break;
      default:
        return;
    }

    try {
      await sendCommand(buttonId);
      
      // Provide haptic feedback if enabled
      if (vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error(`Failed to send ${action} command:`, error);
    }
  }, [controlsDisabled, sendCommand, vibrationEnabled]);

  // Handle volume control presses
  const handleVolumePress = useCallback(async (action: VolumeControlButtonType) => {
    if (controlsDisabled) return;

    let buttonId: ButtonId;
    switch (action) {
      case 'mute':
        buttonId = 'mute';
        break;
      case 'volumeDown':
        buttonId = 'volumeDown';
        break;
      case 'volumeUp':
        buttonId = 'volumeUp';
        break;
      default:
        return;
    }

    try {
      await sendCommand(buttonId);
      
      // Provide haptic feedback if enabled
      if (vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error(`Failed to send ${action} command:`, error);
    }
  }, [controlsDisabled, sendCommand, vibrationEnabled]);

  return (
    <EnhancedRemoteScreen
      deviceName={deviceName}
      isConnected={isConnected}
      onClose={handleClose}
      onPowerToggle={handlePowerToggle}
      onDirectionPress={handleDirectionPress}
      onOkPress={handleOkPress}
      onQuickAccessPress={handleQuickAccessPress}
      onMediaPress={handleMediaPress}
      onVolumePress={handleVolumePress}
      disabled={controlsDisabled}
      isPlaying={false} // TODO: Get from BLE service state
      isMuted={false} // TODO: Get from BLE service state
      testID={testID}
    />
  );
};