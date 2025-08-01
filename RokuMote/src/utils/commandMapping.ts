/**
 * Command Mapping Utilities
 * Maps UI button presses to BLE remote commands
 */

import {
  RemoteCommand,
  RemoteCommandType,
  NavigationAction,
  MediaAction,
  VolumeAction,
  UtilityAction
} from '../types/ble';

// Button identifier type
export type ButtonId = 
  // Navigation buttons
  | 'up' | 'down' | 'left' | 'right' | 'ok' | 'back' | 'home'
  // Media buttons
  | 'playPause' | 'rewind' | 'fastForward' | 'replay'
  // Volume buttons
  | 'mute' | 'volumeUp' | 'volumeDown'
  // Utility buttons
  | 'search' | 'voice' | 'keyboard' | 'settings' | 'guide' | 'star' | 'headphones' | 'power';

// Command mapping interface
export interface CommandMapping {
  [key: string]: {
    command: RemoteCommand;
    description: string;
    icon: string;
    hapticFeedback: boolean;
  };
}

// Generate a unique command ID
const generateCommandId = (): string => {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create a remote command
export const createRemoteCommand = (
  type: RemoteCommandType,
  action: NavigationAction | MediaAction | VolumeAction | UtilityAction,
  payload?: Record<string, any>
): RemoteCommand => {
  return {
    type,
    action,
    payload,
    timestamp: Date.now(),
    id: generateCommandId()
  };
};

// Command mapping configuration
export const COMMAND_MAPPING: CommandMapping = {
  // Navigation commands
  up: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.UP),
    description: 'Navigate up',
    icon: 'arrow-up',
    hapticFeedback: true
  },
  down: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.DOWN),
    description: 'Navigate down',
    icon: 'arrow-down',
    hapticFeedback: true
  },
  left: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.LEFT),
    description: 'Navigate left',
    icon: 'arrow-left',
    hapticFeedback: true
  },
  right: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.RIGHT),
    description: 'Navigate right',
    icon: 'arrow-right',
    hapticFeedback: true
  },
  ok: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.OK),
    description: 'Select/OK',
    icon: 'check-circle',
    hapticFeedback: true
  },
  back: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.BACK),
    description: 'Go back',
    icon: 'arrow-back',
    hapticFeedback: true
  },
  home: {
    command: createRemoteCommand(RemoteCommandType.NAVIGATION, NavigationAction.HOME),
    description: 'Go to home',
    icon: 'home',
    hapticFeedback: true
  },

  // Media commands
  playPause: {
    command: createRemoteCommand(RemoteCommandType.MEDIA, MediaAction.PLAY_PAUSE),
    description: 'Play/Pause',
    icon: 'play-pause',
    hapticFeedback: true
  },
  rewind: {
    command: createRemoteCommand(RemoteCommandType.MEDIA, MediaAction.REWIND),
    description: 'Rewind',
    icon: 'play-back',
    hapticFeedback: true
  },
  fastForward: {
    command: createRemoteCommand(RemoteCommandType.MEDIA, MediaAction.FAST_FORWARD),
    description: 'Fast forward',
    icon: 'play-forward',
    hapticFeedback: true
  },
  replay: {
    command: createRemoteCommand(RemoteCommandType.MEDIA, MediaAction.REPLAY),
    description: 'Replay',
    icon: 'refresh',
    hapticFeedback: true
  },

  // Volume commands
  mute: {
    command: createRemoteCommand(RemoteCommandType.VOLUME, VolumeAction.MUTE),
    description: 'Mute/Unmute',
    icon: 'volume-mute',
    hapticFeedback: true
  },
  volumeUp: {
    command: createRemoteCommand(RemoteCommandType.VOLUME, VolumeAction.VOLUME_UP),
    description: 'Volume up',
    icon: 'volume-high',
    hapticFeedback: true
  },
  volumeDown: {
    command: createRemoteCommand(RemoteCommandType.VOLUME, VolumeAction.VOLUME_DOWN),
    description: 'Volume down',
    icon: 'volume-low',
    hapticFeedback: true
  },

  // Utility commands
  search: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.SEARCH),
    description: 'Search',
    icon: 'search',
    hapticFeedback: true
  },
  voice: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.VOICE),
    description: 'Voice search',
    icon: 'mic',
    hapticFeedback: true
  },
  keyboard: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.KEYBOARD),
    description: 'Keyboard',
    icon: 'keypad',
    hapticFeedback: true
  },
  settings: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.SETTINGS),
    description: 'Settings',
    icon: 'settings',
    hapticFeedback: true
  },
  guide: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.GUIDE),
    description: 'Program guide',
    icon: 'list',
    hapticFeedback: true
  },
  star: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.STAR),
    description: 'Options',
    icon: 'star',
    hapticFeedback: true
  },
  headphones: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.HEADPHONES),
    description: 'Private listening',
    icon: 'headset',
    hapticFeedback: true
  },
  power: {
    command: createRemoteCommand(RemoteCommandType.UTILITY, UtilityAction.POWER),
    description: 'Power',
    icon: 'power',
    hapticFeedback: true
  }
};

// Utility functions for command mapping
export class CommandMapper {
  /**
   * Get command for button ID
   */
  static getCommand(buttonId: ButtonId): RemoteCommand {
    const mapping = COMMAND_MAPPING[buttonId];
    if (!mapping) {
      throw new Error(`Unknown button ID: ${buttonId}`);
    }
    
    // Create a fresh command with new timestamp and ID
    return createRemoteCommand(
      mapping.command.type,
      mapping.command.action,
      mapping.command.payload
    );
  }

  /**
   * Get command description
   */
  static getDescription(buttonId: ButtonId): string {
    const mapping = COMMAND_MAPPING[buttonId];
    return mapping?.description || 'Unknown command';
  }

  /**
   * Get command icon
   */
  static getIcon(buttonId: ButtonId): string {
    const mapping = COMMAND_MAPPING[buttonId];
    return mapping?.icon || 'help-circle';
  }

  /**
   * Check if command should trigger haptic feedback
   */
  static shouldTriggerHaptic(buttonId: ButtonId): boolean {
    const mapping = COMMAND_MAPPING[buttonId];
    return mapping?.hapticFeedback || false;
  }

  /**
   * Get all available button IDs
   */
  static getAllButtonIds(): ButtonId[] {
    return Object.keys(COMMAND_MAPPING) as ButtonId[];
  }

  /**
   * Get commands by type
   */
  static getCommandsByType(type: RemoteCommandType): ButtonId[] {
    return Object.entries(COMMAND_MAPPING)
      .filter(([_, mapping]) => mapping.command.type === type)
      .map(([buttonId]) => buttonId as ButtonId);
  }

  /**
   * Validate button ID
   */
  static isValidButtonId(buttonId: string): buttonId is ButtonId {
    return buttonId in COMMAND_MAPPING;
  }
}