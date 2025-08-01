import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Button, ButtonProps } from '../Button';
import { ThemeProvider } from '../../../theme/ThemeProvider';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

// Helper function to render Button with ThemeProvider
const renderButton = (props: Partial<ButtonProps> = {}) => {
  const defaultProps: ButtonProps = {
    title: 'Test Button',
    onPress: jest.fn(),
    ...props,
  };

  return render(
    <ThemeProvider>
      <Button {...defaultProps} />
    </ThemeProvider>
  );
};

describe('Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with title text', () => {
      const { getByText } = renderButton({ title: 'Click Me' });
      expect(getByText('Click Me')).toBeTruthy();
    });

    it('renders with default secondary variant', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('renders with primary variant', () => {
      const { getByRole } = renderButton({ variant: 'primary' });
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('renders with directional variant', () => {
      const { getByRole } = renderButton({ variant: 'directional' });
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('renders with custom testID', () => {
      const { getByTestId } = renderButton({ testID: 'custom-button' });
      expect(getByTestId('custom-button')).toBeTruthy();
    });
  });

  describe('Press Handling', () => {
    it('calls onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByRole } = renderButton({ onPress: onPressMock });
      
      fireEvent.press(getByRole('button'));
      
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByRole } = renderButton({ 
        onPress: onPressMock, 
        disabled: true 
      });
      
      fireEvent.press(getByRole('button'));
      
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('provides haptic feedback by default', async () => {
      const onPressMock = jest.fn();
      const { getByRole } = renderButton({ onPress: onPressMock });
      
      fireEvent.press(getByRole('button'));
      
      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light');
      });
    });

    it('does not provide haptic feedback when disabled via prop', async () => {
      const onPressMock = jest.fn();
      const { getByRole } = renderButton({ 
        onPress: onPressMock,
        hapticFeedback: false 
      });
      
      fireEvent.press(getByRole('button'));
      
      await waitFor(() => {
        expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
      });
    });

    it('handles haptic feedback errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic not available'));
      
      const onPressMock = jest.fn();
      const { getByRole } = renderButton({ onPress: onPressMock });
      
      fireEvent.press(getByRole('button'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Haptic feedback not available:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = renderButton();
      expect(getByRole('button')).toBeTruthy();
    });

    it('uses title as default accessibility label', () => {
      const { getByLabelText } = renderButton({ title: 'Submit Form' });
      expect(getByLabelText('Submit Form')).toBeTruthy();
    });

    it('uses custom accessibility label when provided', () => {
      const { getByLabelText } = renderButton({ 
        title: 'OK',
        accessibilityLabel: 'Confirm selection' 
      });
      expect(getByLabelText('Confirm selection')).toBeTruthy();
    });

    it('sets accessibility state for disabled button', () => {
      const { getByRole } = renderButton({ disabled: true });
      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });

    it('includes accessibility hint when provided', () => {
      const { getByRole } = renderButton({ 
        accessibilityHint: 'Double tap to activate' 
      });
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Double tap to activate');
    });
  });

  describe('Touch Target', () => {
    it('has minimum touch target size through hitSlop', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button.props.hitSlop).toEqual({
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
      });
    });
  });

  describe('Styling', () => {
    it('applies custom style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByRole } = renderButton({ style: customStyle });
      const button = getByRole('button');
      
      // Check that custom style is applied (exact style checking depends on implementation)
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('applies custom text style prop', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = renderButton({ 
        title: 'Styled Text',
        textStyle: customTextStyle 
      });
      const text = getByText('Styled Text');
      
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      );
    });
  });

  describe('Variants', () => {
    it('applies different styles for each variant', () => {
      const variants: Array<'primary' | 'secondary' | 'directional'> = [
        'primary',
        'secondary', 
        'directional'
      ];

      variants.forEach(variant => {
        const { getByRole } = renderButton({ variant });
        const button = getByRole('button');
        expect(button).toBeTruthy();
      });
    });
  });
});