import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native', () => {
  const React = require('react');
  const mockStyleSheet = {
    create: (styles: any) => styles,
    flatten: (styles: any) => styles,
  };
  
  return {
    StyleSheet: mockStyleSheet,
    TouchableOpacity: ({ children, onPress, style, testID, accessibilityRole, accessibilityLabel, accessibilityHint, accessibilityState, hitSlop, activeOpacity, disabled, ...props }: any) => 
      React.createElement('button', { 
        onClick: onPress, 
        style, 
        'data-testid': testID,
        testID: testID,
        'aria-label': accessibilityLabel,
        'aria-describedby': accessibilityHint,
        disabled,
        accessibilityRole,
        accessibilityLabel,
        accessibilityHint,
        accessibilityState,
        hitSlop,
        ...props 
      }, children),
    Text: ({ children, style, ...props }: any) => 
      React.createElement('span', { style, ...props }, children),
    View: ({ children, style, testID, ...props }: any) => 
      React.createElement('div', { style, 'data-testid': testID, testID: testID, ...props }, children),
  };
});

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, colors, style, ...props }: any) => 
    require('react').createElement('div', { 
      style: { 
        ...style, 
        background: `linear-gradient(${colors.join(', ')})` 
      }, 
      ...props 
    }, children),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, ...props }: any) => 
    require('react').createElement('span', { 
      'data-testid': `icon-${name}`,
      style: { fontSize: size, color },
      ...props 
    }, name),
}));

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn(),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};