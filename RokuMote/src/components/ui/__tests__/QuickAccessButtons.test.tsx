import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { QuickAccessButtons, QuickAccessButtonType } from '../QuickAccessButtons';
import { ThemeProvider } from '../../../theme/ThemeProvider';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('QuickAccessButtons', () => {
  const mockOnButtonPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all buttons correctly', () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        testID="quick-access"
      />
    );

    // Check top row buttons
    expect(getByTestId('quick-access-search')).toBeTruthy();
    expect(getByTestId('quick-access-voice')).toBeTruthy();
    expect(getByTestId('quick-access-keyboard')).toBeTruthy();
    expect(getByTestId('quick-access-settings')).toBeTruthy();

    // Check bottom row buttons
    expect(getByTestId('quick-access-back')).toBeTruthy();
    expect(getByTestId('quick-access-guide')).toBeTruthy();
    expect(getByTestId('quick-access-home')).toBeTruthy();
  });

  it('has correct accessibility labels', () => {
    const { getByLabelText } = renderWithTheme(
      <QuickAccessButtons onButtonPress={mockOnButtonPress} />
    );

    expect(getByLabelText('Search')).toBeTruthy();
    expect(getByLabelText('Voice')).toBeTruthy();
    expect(getByLabelText('Keyboard')).toBeTruthy();
    expect(getByLabelText('Settings')).toBeTruthy();
    expect(getByLabelText('Back')).toBeTruthy();
    expect(getByLabelText('Guide')).toBeTruthy();
    expect(getByLabelText('Home')).toBeTruthy();
  });

  it('calls onButtonPress with correct button type when pressed', async () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        testID="quick-access"
      />
    );

    const searchButton = getByTestId('quick-access-search');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockOnButtonPress).toHaveBeenCalledWith('search');
    });
  });

  it('provides haptic feedback when button is pressed', async () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        testID="quick-access"
      />
    );

    const voiceButton = getByTestId('quick-access-voice');
    fireEvent.press(voiceButton);

    await waitFor(() => {
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light');
    });
  });

  it('handles haptic feedback errors gracefully', async () => {
    mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic not available'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        testID="quick-access"
      />
    );

    const keyboardButton = getByTestId('quick-access-keyboard');
    fireEvent.press(keyboardButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error));
      expect(mockOnButtonPress).toHaveBeenCalledWith('keyboard');
    });

    consoleSpy.mockRestore();
  });

  it('does not call onButtonPress when disabled', async () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        disabled={true}
        testID="quick-access"
      />
    );

    const settingsButton = getByTestId('quick-access-settings');
    fireEvent.press(settingsButton);

    await waitFor(() => {
      expect(mockOnButtonPress).not.toHaveBeenCalled();
      expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  it('applies disabled styling when disabled prop is true', () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        disabled={true}
        testID="quick-access"
      />
    );

    const backButton = getByTestId('quick-access-back');
    expect(backButton.props.accessibilityState).toEqual({ disabled: true });
  });

  describe('individual button functionality', () => {
    const buttonTests: Array<{
      testId: string;
      expectedType: QuickAccessButtonType;
      label: string;
    }> = [
      { testId: 'quick-access-search', expectedType: 'search', label: 'Search' },
      { testId: 'quick-access-voice', expectedType: 'voice', label: 'Voice' },
      { testId: 'quick-access-keyboard', expectedType: 'keyboard', label: 'Keyboard' },
      { testId: 'quick-access-settings', expectedType: 'settings', label: 'Settings' },
      { testId: 'quick-access-back', expectedType: 'back', label: 'Back' },
      { testId: 'quick-access-guide', expectedType: 'guide', label: 'Guide' },
      { testId: 'quick-access-home', expectedType: 'home', label: 'Home' },
    ];

    buttonTests.forEach(({ testId, expectedType, label }) => {
      it(`${label} button calls onButtonPress with '${expectedType}'`, async () => {
        const { getByTestId } = renderWithTheme(
          <QuickAccessButtons 
            onButtonPress={mockOnButtonPress} 
            testID="quick-access"
          />
        );

        const button = getByTestId(testId);
        fireEvent.press(button);

        await waitFor(() => {
          expect(mockOnButtonPress).toHaveBeenCalledWith(expectedType);
        });
      });
    });
  });

  it('has proper accessibility properties', () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        testID="quick-access"
      />
    );

    const homeButton = getByTestId('quick-access-home');
    expect(homeButton.props.accessibilityRole).toBe('button');
    expect(homeButton.props.accessibilityLabel).toBe('Home');
    expect(homeButton.props.accessibilityHint).toBe('Returns to home screen');
  });

  it('maintains minimum touch target size', () => {
    const { getByTestId } = renderWithTheme(
      <QuickAccessButtons 
        onButtonPress={mockOnButtonPress} 
        testID="quick-access"
      />
    );

    const guideButton = getByTestId('quick-access-guide');
    expect(guideButton.props.hitSlop).toEqual({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    });
  });
});