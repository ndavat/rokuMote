import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { VolumeControls, VolumeControlButtonType } from '../VolumeControls';
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

describe('VolumeControls', () => {
  const mockOnVolumePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all buttons correctly', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        testID="volume-controls"
      />
    );

    expect(getByTestId('volume-controls-mute')).toBeTruthy();
    expect(getByTestId('volume-controls-volumeDown')).toBeTruthy();
    expect(getByTestId('volume-controls-volumeUp')).toBeTruthy();
  });

  it('has correct accessibility labels', () => {
    const { getByLabelText } = renderWithTheme(
      <VolumeControls onVolumePress={mockOnVolumePress} />
    );

    expect(getByLabelText('Mute')).toBeTruthy(); // Default when not muted
    expect(getByLabelText('Volume Down')).toBeTruthy();
    expect(getByLabelText('Volume Up')).toBeTruthy();
  });

  it('shows correct mute button when muted', () => {
    const { getByLabelText } = renderWithTheme(
      <VolumeControls onVolumePress={mockOnVolumePress} isMuted={true} />
    );

    expect(getByLabelText('Unmute')).toBeTruthy();
  });

  it('shows correct mute button when not muted', () => {
    const { getByLabelText } = renderWithTheme(
      <VolumeControls onVolumePress={mockOnVolumePress} isMuted={false} />
    );

    expect(getByLabelText('Mute')).toBeTruthy();
  });

  it('calls onVolumePress with correct button type when pressed', async () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        testID="volume-controls"
      />
    );

    const muteButton = getByTestId('volume-controls-mute');
    fireEvent.press(muteButton);

    await waitFor(() => {
      expect(mockOnVolumePress).toHaveBeenCalledWith('mute');
    });
  });

  it('provides haptic feedback when button is pressed', async () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        testID="volume-controls"
      />
    );

    const volumeDownButton = getByTestId('volume-controls-volumeDown');
    fireEvent.press(volumeDownButton);

    await waitFor(() => {
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light');
    });
  });

  it('handles haptic feedback errors gracefully', async () => {
    mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic not available'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        testID="volume-controls"
      />
    );

    const volumeUpButton = getByTestId('volume-controls-volumeUp');
    fireEvent.press(volumeUpButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error));
      expect(mockOnVolumePress).toHaveBeenCalledWith('volumeUp');
    });

    consoleSpy.mockRestore();
  });

  it('does not call onVolumePress when disabled', async () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        disabled={true}
        testID="volume-controls"
      />
    );

    const muteButton = getByTestId('volume-controls-mute');
    fireEvent.press(muteButton);

    await waitFor(() => {
      expect(mockOnVolumePress).not.toHaveBeenCalled();
      expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  it('applies disabled styling when disabled prop is true', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        disabled={true}
        testID="volume-controls"
      />
    );

    const volumeDownButton = getByTestId('volume-controls-volumeDown');
    expect(volumeDownButton.props.accessibilityState).toEqual({ disabled: true });
  });

  describe('individual button functionality', () => {
    const buttonTests: Array<{
      testId: string;
      expectedType: VolumeControlButtonType;
      label: string;
    }> = [
      { testId: 'volume-controls-mute', expectedType: 'mute', label: 'Mute' },
      { testId: 'volume-controls-volumeDown', expectedType: 'volumeDown', label: 'Volume Down' },
      { testId: 'volume-controls-volumeUp', expectedType: 'volumeUp', label: 'Volume Up' },
    ];

    buttonTests.forEach(({ testId, expectedType, label }) => {
      it(`${label} button calls onVolumePress with '${expectedType}'`, async () => {
        const { getByTestId } = renderWithTheme(
          <VolumeControls 
            onVolumePress={mockOnVolumePress} 
            testID="volume-controls"
          />
        );

        const button = getByTestId(testId);
        fireEvent.press(button);

        await waitFor(() => {
          expect(mockOnVolumePress).toHaveBeenCalledWith(expectedType);
        });
      });
    });
  });

  it('has proper accessibility properties', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        testID="volume-controls"
      />
    );

    const volumeUpButton = getByTestId('volume-controls-volumeUp');
    expect(volumeUpButton.props.accessibilityRole).toBe('button');
    expect(volumeUpButton.props.accessibilityLabel).toBe('Volume Up');
    expect(volumeUpButton.props.accessibilityHint).toBe('Increases volume');
  });

  it('maintains minimum touch target size', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeControls 
        onVolumePress={mockOnVolumePress} 
        testID="volume-controls"
      />
    );

    const muteButton = getByTestId('volume-controls-mute');
    expect(muteButton.props.hitSlop).toEqual({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    });
  });

  describe('mute button state', () => {
    it('shows mute icon and label when not muted', () => {
      const { getByTestId, getByLabelText } = renderWithTheme(
        <VolumeControls 
          onVolumePress={mockOnVolumePress} 
          isMuted={false}
          testID="volume-controls"
        />
      );

      const muteButton = getByTestId('volume-controls-mute');
      expect(getByLabelText('Mute')).toBeTruthy();
      expect(muteButton.props.accessibilityHint).toBe('Mutes audio');
    });

    it('shows unmute icon and label when muted', () => {
      const { getByTestId, getByLabelText } = renderWithTheme(
        <VolumeControls 
          onVolumePress={mockOnVolumePress} 
          isMuted={true}
          testID="volume-controls"
        />
      );

      const muteButton = getByTestId('volume-controls-mute');
      expect(getByLabelText('Unmute')).toBeTruthy();
      expect(muteButton.props.accessibilityHint).toBe('Unmutes audio');
    });

    it('calls onVolumePress with mute regardless of muted state', async () => {
      const { getByTestId, rerender } = renderWithTheme(
        <VolumeControls 
          onVolumePress={mockOnVolumePress} 
          isMuted={false}
          testID="volume-controls"
        />
      );

      // Test when not muted
      const muteButton = getByTestId('volume-controls-mute');
      fireEvent.press(muteButton);

      await waitFor(() => {
        expect(mockOnVolumePress).toHaveBeenCalledWith('mute');
      });

      mockOnVolumePress.mockClear();

      // Test when muted
      rerender(
        <ThemeProvider>
          <VolumeControls 
            onVolumePress={mockOnVolumePress} 
            isMuted={true}
            testID="volume-controls"
          />
        </ThemeProvider>
      );

      const unmuteButton = getByTestId('volume-controls-mute');
      fireEvent.press(unmuteButton);

      await waitFor(() => {
        expect(mockOnVolumePress).toHaveBeenCalledWith('mute');
      });
    });
  });

  describe('accessibility hints', () => {
    it('has correct accessibility hints for all buttons', () => {
      const { getByTestId } = renderWithTheme(
        <VolumeControls 
          onVolumePress={mockOnVolumePress} 
          testID="volume-controls"
        />
      );

      expect(getByTestId('volume-controls-mute').props.accessibilityHint).toBe('Mutes audio');
      expect(getByTestId('volume-controls-volumeDown').props.accessibilityHint).toBe('Decreases volume');
      expect(getByTestId('volume-controls-volumeUp').props.accessibilityHint).toBe('Increases volume');
    });
  });

  describe('button layout', () => {
    it('renders buttons in a single row', () => {
      const { getByTestId } = renderWithTheme(
        <VolumeControls 
          onVolumePress={mockOnVolumePress} 
          testID="volume-controls"
        />
      );

      const container = getByTestId('volume-controls');
      expect(container).toBeTruthy();
      
      // All buttons should be present
      expect(getByTestId('volume-controls-mute')).toBeTruthy();
      expect(getByTestId('volume-controls-volumeDown')).toBeTruthy();
      expect(getByTestId('volume-controls-volumeUp')).toBeTruthy();
    });
  });
});