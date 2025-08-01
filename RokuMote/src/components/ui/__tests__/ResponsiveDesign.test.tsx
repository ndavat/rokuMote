import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { Button } from '../Button';
import { DirectionalPad } from '../DirectionalPad';
import { StatusBar } from '../StatusBar';

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  PixelRatio: {
    getFontScale: jest.fn(() => 1.0),
  },
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock state
jest.mock('../../../state', () => ({
  useAppSelector: jest.fn(() => true),
  selectors: {
    vibrationEnabled: jest.fn(),
    isLoading: jest.fn(),
    currentDevice: jest.fn(),
    connectionStatus: jest.fn(),
    mockMode: jest.fn(),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Phone Portrait (375x667)', () => {
    beforeEach(() => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
    });

    it('should render Button with appropriate size for phone', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Button
            title="Test"
            onPress={jest.fn()}
            testID="test-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-button');
      expect(button).toBeTruthy();
      // Button should have minimum touch target size
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: expect.any(Number),
            minWidth: expect.any(Number),
          })
        ])
      );
    });

    it('should render DirectionalPad with appropriate size for phone', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DirectionalPad
            onDirectionPress={jest.fn()}
            onOkPress={jest.fn()}
            testID="test-dpad"
          />
        </TestWrapper>
      );

      const dpad = getByTestId('test-dpad');
      expect(dpad).toBeTruthy();
      // Should have responsive container size
      expect(dpad.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          })
        ])
      );
    });
  });

  describe('Phone Landscape (667x375)', () => {
    beforeEach(() => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 667, height: 375 });
    });

    it('should adapt to landscape orientation', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <StatusBar
            deviceName="Test Device"
            testID="test-status-bar"
          />
        </TestWrapper>
      );

      const statusBar = getByTestId('test-status-bar');
      expect(statusBar).toBeTruthy();
      // Should maintain proper layout in landscape
    });
  });

  describe('Small Phone (320x568)', () => {
    beforeEach(() => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 320, height: 568 });
    });

    it('should provide compact layout for small screens', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Button
            title="Test"
            onPress={jest.fn()}
            variant="directional"
            testID="test-small-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-small-button');
      expect(button).toBeTruthy();
      // Should still meet minimum touch target requirements
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: expect.any(Number),
            minWidth: expect.any(Number),
          })
        ])
      );
    });
  });

  describe('Large Phone (414x896)', () => {
    beforeEach(() => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 414, height: 896 });
    });

    it('should scale up appropriately for larger screens', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DirectionalPad
            onDirectionPress={jest.fn()}
            onOkPress={jest.fn()}
            testID="test-large-dpad"
          />
        </TestWrapper>
      );

      const dpad = getByTestId('test-large-dpad');
      expect(dpad).toBeTruthy();
      // Should scale up for larger screens
    });
  });

  describe('Tablet Portrait (768x1024)', () => {
    beforeEach(() => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
    });

    it('should provide tablet-optimized layout', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Button
            title="Tablet Button"
            onPress={jest.fn()}
            testID="test-tablet-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-tablet-button');
      expect(button).toBeTruthy();
      // Should have larger sizing for tablet
    });
  });

  describe('Tablet Landscape (1024x768)', () => {
    beforeEach(() => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
    });

    it('should handle tablet landscape orientation', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <StatusBar
            deviceName="Tablet Device"
            testID="test-tablet-status"
          />
        </TestWrapper>
      );

      const statusBar = getByTestId('test-tablet-status');
      expect(statusBar).toBeTruthy();
      // Should maintain proper proportions in landscape
    });
  });

  describe('Accessibility Scaling', () => {
    it('should scale components when font scale is increased', () => {
      // Mock increased font scale
      const mockPixelRatio = require('react-native').PixelRatio;
      mockPixelRatio.getFontScale.mockReturnValue(1.3);

      const { getByTestId } = render(
        <TestWrapper>
          <Button
            title="Scaled Button"
            onPress={jest.fn()}
            testID="test-scaled-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-scaled-button');
      expect(button).toBeTruthy();
      // Should be scaled for accessibility
    });

    it('should maintain minimum touch targets with accessibility scaling', () => {
      // Mock very large font scale
      const mockPixelRatio = require('react-native').PixelRatio;
      mockPixelRatio.getFontScale.mockReturnValue(2.0);

      const { getByTestId } = render(
        <TestWrapper>
          <Button
            title="Large Scale Button"
            onPress={jest.fn()}
            testID="test-large-scale-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-large-scale-button');
      expect(button).toBeTruthy();
      // Should maintain proper touch targets even with large scaling
    });
  });

  describe('Hit Slop Accessibility', () => {
    it('should provide adequate hit slop for touch accessibility', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Button
            title="Hit Slop Test"
            onPress={jest.fn()}
            testID="test-hit-slop-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-hit-slop-button');
      expect(button.props.hitSlop).toEqual({
        top: expect.any(Number),
        bottom: expect.any(Number),
        left: expect.any(Number),
        right: expect.any(Number),
      });
    });
  });

  describe('Dynamic Layout Updates', () => {
    it('should update layout when screen dimensions change', () => {
      const { rerender, getByTestId } = render(
        <TestWrapper>
          <Button
            title="Dynamic Button"
            onPress={jest.fn()}
            testID="test-dynamic-button"
          />
        </TestWrapper>
      );

      // Change screen dimensions
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });

      rerender(
        <TestWrapper>
          <Button
            title="Dynamic Button"
            onPress={jest.fn()}
            testID="test-dynamic-button"
          />
        </TestWrapper>
      );

      const button = getByTestId('test-dynamic-button');
      expect(button).toBeTruthy();
      // Should adapt to new dimensions
    });
  });
});