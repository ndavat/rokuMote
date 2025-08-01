# Design Document

## Overview

RokuMote is a React Native Expo application that replicates the functionality and visual design of a physical Roku remote control. The app features a dark theme with purple accent colors, providing an intuitive interface for controlling Roku devices via Bluetooth Low Energy (BLE) communication.

The design follows the visual layout shown in the reference screenshot, with a status bar, navigation controls, directional pad, media controls, volume controls, and a bottom information panel.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│              React Native App           │
├─────────────────────────────────────────┤
│  Presentation Layer (Screens/Components)│
├─────────────────────────────────────────┤
│     Business Logic Layer (Services)     │
├─────────────────────────────────────────┤
│      Data Layer (State Management)      │
├─────────────────────────────────────────┤
│    Native Layer (BLE Communication)     │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: React Native with Expo SDK
- **Navigation**: Expo Router or React Navigation
- **State Management**: React Context API with useReducer
- **BLE Communication**: react-native-ble-plx
- **UI Components**: Custom components based on RokuMote design system
- **Icons**: Expo Vector Icons
- **Build**: EAS Build for native BLE support

### Cross-Platform Design Considerations

#### iOS and Android Support (Requirement 9.1, 9.2)
- **Unified Codebase**: Single React Native codebase supports both platforms
- **Platform-Specific Adaptations**: Automatic handling of platform differences through Expo SDK
- **Native Dependencies**: BLE functionality requires EAS Build for proper native module support
- **Permission Handling**: Platform-specific BLE and location permission requests

#### Responsive Design (Requirement 9.3)
- **Screen Size Adaptation**: Components scale appropriately across different device sizes
- **Safe Area Handling**: Proper handling of notches, status bars, and navigation bars
- **Touch Target Optimization**: Minimum 44px touch targets for accessibility
- **Orientation Support**: Primary portrait orientation with landscape considerations

#### Build and Distribution (Requirement 9.4)
- **No Additional Dependencies**: App works without requiring users to install additional native dependencies
- **EAS Build Configuration**: Proper build configuration for BLE permissions and capabilities
- **App Store Compliance**: Meets requirements for both iOS App Store and Google Play Store

## Components and Interfaces

### Core Components

#### 1. RemoteScreen Component
- Main screen containing the entire remote interface
- Manages BLE connection state
- Handles button press events and feedback
- Provides visual feedback for all button interactions (Requirement 1.2)

#### 2. DeviceSelectionScreen Component
```typescript
interface DeviceSelectionScreenProps {
  availableDevices: RokuDevice[];
  isScanning: boolean;
  onDeviceSelect: (device: RokuDevice) => void;
  onRescan: () => void;
  onEnableMockMode: () => void;
}
```
- Displays list of discovered Roku devices (Requirement 8.2)
- Shows scanning indicator during device discovery
- Provides option to enable mock mode for testing
- Includes retry/rescan functionality for failed connections

#### 3. StatusBar Component
```typescript
interface StatusBarProps {
  deviceName: string;
  isConnected: boolean;
  onClose: () => void;
  onPowerToggle: () => void;
}
```
- Displays current room/device name (Requirement 1.3)
- Shows connection status indicator with color coding
- Provides power toggle functionality

#### 4. DirectionalPad Component
```typescript
interface DirectionalPadProps {
  onDirectionPress: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onOkPress: () => void;
}
```

#### 5. QuickAccessButtons Component
```typescript
interface QuickAccessButtonsProps {
  onButtonPress: (button: 'search' | 'voice' | 'keyboard' | 'settings' | 'back' | 'guide' | 'home') => void;
}
```

#### 6. MediaControls Component
```typescript
interface MediaControlsProps {
  onMediaPress: (action: 'replay' | 'star' | 'headphones' | 'rewind' | 'playPause' | 'fastForward') => void;
}
```

#### 7. VolumeControls Component
```typescript
interface VolumeControlsProps {
  onVolumePress: (action: 'mute' | 'volumeDown' | 'volumeUp') => void;
}
```

#### 8. BottomPanel Component
```typescript
interface BottomPanelProps {
  title: string;
  subtitle: string;
}
```

### Service Interfaces

#### BLE Service
```typescript
interface BLEService {
  scanForDevices(): Promise<RokuDevice[]>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnect(): Promise<void>;
  sendCommand(command: RemoteCommand): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
  enableAutoReconnect(enabled: boolean): void;
}

interface MockBLEService extends BLEService {
  enableMockMode(enabled: boolean): void;
  simulateConnectionLoss(): void;
  setMockResponseDelay(delay: number): void;
}

interface RokuDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected?: boolean;
}

interface RemoteCommand {
  type: 'navigation' | 'media' | 'volume' | 'utility';
  action: string;
  payload?: any;
  timestamp?: number;
}

type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error' | 'reconnecting';
```

## Data Models

### Application State
```typescript
interface AppState {
  connection: {
    isConnected: boolean;
    currentDevice: RokuDevice | null;
    availableDevices: RokuDevice[];
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  };
  ui: {
    currentScreen: 'remote' | 'settings' | 'pairing';
    isLoading: boolean;
    mockMode: boolean;
  };
  settings: {
    vibrationEnabled: boolean;
    soundEnabled: boolean;
    autoReconnect: boolean;
  };
}
```

### Remote Button Mapping
```typescript
interface ButtonMapping {
  [key: string]: {
    command: RemoteCommand;
    icon: string;
    label: string;
    hapticFeedback?: boolean;
  };
}
```

## Error Handling

### BLE Connection Errors
- **Device Not Found**: Display retry option and device scanning
- **Connection Failed**: Show reconnection dialog with manual retry
- **Permission Denied**: Guide user to enable Bluetooth and location permissions
- **Service Unavailable**: Fall back to mock mode with user notification

### UI Error States
- **Loading States**: Show spinner during device scanning and connection
- **Error Messages**: Toast notifications for temporary errors
- **Fallback UI**: Mock mode when BLE is unavailable

### Visual Feedback System
- **Button Press Feedback**: All buttons provide immediate visual feedback through color changes and subtle animations (Requirement 1.2, 7.5)
- **Press State**: Buttons darken slightly when pressed using `buttonPressed` color from design system
- **Haptic Feedback**: Optional vibration feedback for button presses on supported devices
- **Loading Indicators**: Spinner animations during connection attempts and command processing

### Mock Mode Design
- **Mock Mode Indicator**: Clear visual banner at top of screen indicating "Mock Mode Active" (Requirement 10.3)
- **Mock Mode Banner**: Uses warning color (#ED8936) background with white text
- **Command Logging**: Visual console overlay (toggleable) showing sent commands for debugging (Requirement 10.4)
- **Simulated Responses**: Mock service provides realistic response delays and success/failure patterns (Requirement 10.1, 10.2)

### Error Recovery
```typescript
interface ErrorHandler {
  handleBLEError(error: BLEError): void;
  handlePermissionError(error: PermissionError): void;
  handleConnectionLoss(): void;
  enableMockMode(): void;
}
```

## Testing Strategy

### Unit Testing
- Component rendering and prop handling
- BLE service methods and error handling
- State management reducers and actions
- Button press event handling

### Integration Testing
- BLE connection flow end-to-end
- Remote command transmission
- UI state updates based on connection status
- Mock mode functionality

### Device Testing
- Test on various Android devices and versions
- Verify BLE compatibility with different Roku models
- Performance testing for button responsiveness
- Battery usage optimization

### Mock Testing
- Simulate BLE connection scenarios
- Test error conditions and recovery
- Verify UI behavior without physical Roku device

## Performance Considerations

### BLE Optimization
- Implement connection pooling and reuse
- Batch multiple commands when possible
- Handle background/foreground app transitions
- Optimize scanning intervals to preserve battery

### UI Performance
- Use React.memo for expensive components
- Implement proper key props for list items
- Optimize re-renders with useCallback and useMemo
- Lazy load non-critical components

### Memory Management
- Clean up BLE subscriptions on unmount
- Implement proper error boundary components
- Monitor and prevent memory leaks in long-running connections

## Security Considerations

### BLE Security
- Implement proper device authentication
- Use encrypted communication channels
- Validate all incoming BLE data
- Handle device pairing securely

### Data Privacy
- No personal data collection or transmission
- Local storage only for device preferences
- Secure handling of device identifiers

## Design System

The following design system defines the visual language and component specifications for RokuMote:

```json
{
  "colors": {
    "primary": {
      "purple": "#8B5CF6",
      "purpleDark": "#7C3AED",
      "purpleLight": "#A78BFA"
    },
    "background": {
      "primary": "#1A1B2E",
      "secondary": "#16213E",
      "gradient": "linear-gradient(180deg, #1A1B2E 0%, #16213E 100%)"
    },
    "surface": {
      "button": "#2D3748",
      "buttonPressed": "#4A5568",
      "card": "#2A2D3A"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#A0AEC0",
      "accent": "#8B5CF6"
    },
    "status": {
      "connected": "#48BB78",
      "disconnected": "#F56565",
      "warning": "#ED8936"
    }
  },
  "typography": {
    "fontFamily": {
      "primary": "System",
      "secondary": "Roboto"
    },
    "fontSize": {
      "xs": 12,
      "sm": 14,
      "base": 16,
      "lg": 18,
      "xl": 20,
      "2xl": 24,
      "3xl": 30
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32,
    "2xl": 48,
    "3xl": 64
  },
  "borderRadius": {
    "sm": 4,
    "md": 8,
    "lg": 12,
    "xl": 16,
    "2xl": 24,
    "full": 9999
  },
  "shadows": {
    "sm": {
      "shadowColor": "#000",
      "shadowOffset": { "width": 0, "height": 1 },
      "shadowOpacity": 0.2,
      "shadowRadius": 2,
      "elevation": 2
    },
    "md": {
      "shadowColor": "#000",
      "shadowOffset": { "width": 0, "height": 2 },
      "shadowOpacity": 0.25,
      "shadowRadius": 4,
      "elevation": 4
    },
    "lg": {
      "shadowColor": "#000",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.3,
      "shadowRadius": 8,
      "elevation": 8
    }
  },
  "components": {
    "button": {
      "base": {
        "borderRadius": 12,
        "paddingVertical": 16,
        "paddingHorizontal": 20,
        "alignItems": "center",
        "justifyContent": "center"
      },
      "variants": {
        "primary": {
          "backgroundColor": "#8B5CF6",
          "color": "#FFFFFF"
        },
        "secondary": {
          "backgroundColor": "#2D3748",
          "color": "#FFFFFF"
        },
        "directional": {
          "backgroundColor": "#8B5CF6",
          "color": "#FFFFFF",
          "minWidth": 60,
          "minHeight": 60
        }
      }
    },
    "dpad": {
      "container": {
        "width": 200,
        "height": 200,
        "position": "relative"
      },
      "button": {
        "backgroundColor": "#8B5CF6",
        "borderRadius": 12,
        "alignItems": "center",
        "justifyContent": "center",
        "position": "absolute"
      },
      "center": {
        "width": 80,
        "height": 80,
        "borderRadius": 40,
        "top": 60,
        "left": 60
      },
      "up": {
        "width": 60,
        "height": 60,
        "top": 0,
        "left": 70
      },
      "down": {
        "width": 60,
        "height": 60,
        "bottom": 0,
        "left": 70
      },
      "left": {
        "width": 60,
        "height": 60,
        "top": 70,
        "left": 0
      },
      "right": {
        "width": 60,
        "height": 60,
        "top": 70,
        "right": 0
      }
    },
    "statusBar": {
      "container": {
        "flexDirection": "row",
        "justifyContent": "space-between",
        "alignItems": "center",
        "paddingHorizontal": 20,
        "paddingVertical": 12,
        "backgroundColor": "transparent"
      },
      "deviceName": {
        "fontSize": 16,
        "fontWeight": "500",
        "color": "#FFFFFF"
      },
      "connectionStatus": {
        "width": 8,
        "height": 8,
        "borderRadius": 4,
        "backgroundColor": "#48BB78"
      }
    },
    "bottomBar": {
      "container": {
        "backgroundColor": "#1A1B2E",
        "paddingVertical": 20,
        "paddingHorizontal": 16,
        "borderTopWidth": 1,
        "borderTopColor": "#2D3748"
      },
      "title": {
        "fontSize": 20,
        "fontWeight": "bold",
        "color": "#FFFFFF",
        "marginBottom": 4
      },
      "subtitle": {
        "fontSize": 14,
        "color": "#A0AEC0"
      }
    }
  },
  "layout": {
    "container": {
      "flex": 1,
      "backgroundColor": "#1A1B2E",
      "paddingHorizontal": 20
    },
    "section": {
      "marginVertical": 16
    },
    "buttonGrid": {
      "flexDirection": "row",
      "flexWrap": "wrap",
      "justifyContent": "space-between",
      "gap": 12
    },
    "buttonRow": {
      "flexDirection": "row",
      "justifyContent": "space-between",
      "marginVertical": 8
    }
  },
  "icons": {
    "size": {
      "sm": 16,
      "md": 20,
      "lg": 24,
      "xl": 28
    },
    "color": {
      "primary": "#FFFFFF",
      "secondary": "#A0AEC0",
      "accent": "#8B5CF6"
    }
  }
}
```

## Accessibility

### Screen Reader Support
- Proper accessibility labels for all buttons
- Semantic markup for navigation elements
- Voice-over friendly component structure

### Motor Accessibility
- Large touch targets (minimum 44px)
- Adequate spacing between interactive elements
- Support for external switch controls

### Visual Accessibility
- High contrast color scheme
- Scalable text and UI elements
- Support for system font size preferences