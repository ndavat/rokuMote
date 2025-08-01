import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { MediaControls, MediaControlButtonType } from '../MediaControls';
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

describe('MediaControls', () => {
  const mockOnMediaPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all buttons correctly', () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        testID="media-controls"
      />
    );

    // Check top row buttons
    expect(getByTestId('media-controls-replay')).toBeTruthy();
    expect(getByTestId('media-controls-star')).toBeTruthy();
    expect(getByTestId('media-controls-headphones')).toBeTruthy();

    // Check bottom row buttons
    expect(getByTestId('media-controls-rewind')).toBeTruthy();
    expect(getByTestId('media-controls-playPause')).toBeTruthy();
    expect(getByTestId('media-controls-fastForward')).toBeTruthy();
  });

  it('has correct accessibility labels', () => {
    const { getByLabelText } = renderWithTheme(
      <MediaControls onMediaPress={mockOnMediaPress} />
    );

    expect(getByLabelText('Replay')).toBeTruthy();
    expect(getByLabelText('Star')).toBeTruthy();
    expect(getByLabelText('Headphones')).toBeTruthy();
    expect(getByLabelText('Rewind')).toBeTruthy();
    expect(getByLabelText('Play')).toBeTruthy(); // Default when not playing
    expect(getByLabelText('Fast Forward')).toBeTruthy();
  });

  it('shows correct play/pause button when playing', () => {
    const { getByLabelText } = renderWithTheme(
      <MediaControls onMediaPress={mockOnMediaPress} isPlaying={true} />
    );

    expect(getByLabelText('Pause')).toBeTruthy();
  });

  it('shows correct play/pause button when not playing', () => {
    const { getByLabelText } = renderWithTheme(
      <MediaControls onMediaPress={mockOnMediaPress} isPlaying={false} />
    );

    expect(getByLabelText('Play')).toBeTruthy();
  });

  it('calls onMediaPress with correct button type when pressed', async () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        testID="media-controls"
      />
    );

    const replayButton = getByTestId('media-controls-replay');
    fireEvent.press(replayButton);

    await waitFor(() => {
      expect(mockOnMediaPress).toHaveBeenCalledWith('replay');
    });
  });

  it('provides haptic feedback when button is pressed', async () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        testID="media-controls"
      />
    );

    const starButton = getByTestId('media-controls-star');
    fireEvent.press(starButton);

    await waitFor(() => {
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light');
    });
  });

  it('handles haptic feedback errors gracefully', async () => {
    mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic not available'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        testID="media-controls"
      />
    );

    const headphonesButton = getByTestId('media-controls-headphones');
    fireEvent.press(headphonesButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error));
      expect(mockOnMediaPress).toHaveBeenCalledWith('headphones');
    });

    consoleSpy.mockRestore();
  });

  it('does not call onMediaPress when disabled', async () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        disabled={true}
        testID="media-controls"
      />
    );

    const rewindButton = getByTestId('media-controls-rewind');
    fireEvent.press(rewindButton);

    await waitFor(() => {
      expect(mockOnMediaPress).not.toHaveBeenCalled();
      expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  it('applies disabled styling when disabled prop is true', () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        disabled={true}
        testID="media-controls"
      />
    );

    const playPauseButton = getByTestId('media-controls-playPause');
    expect(playPauseButton.props.accessibilityState).toEqual({ disabled: true });
  });

  describe('individual button functionality', () => {
    const buttonTests: Array<{
      testId: string;
      expectedType: MediaControlButtonType;
      label: string;
    }> = [
      { testId: 'media-controls-replay', expectedType: 'replay', label: 'Replay' },
      { testId: 'media-controls-star', expectedType: 'star', label: 'Star' },
      { testId: 'media-controls-headphones', expectedType: 'headphones', label: 'Headphones' },
      { testId: 'media-controls-rewind', expectedType: 'rewind', label: 'Rewind' },
      { testId: 'media-controls-playPause', expectedType: 'playPause', label: 'Play' },
      { testId: 'media-controls-fastForward', expectedType: 'fastForward', label: 'Fast Forward' },
    ];

    buttonTests.forEach(({ testId, expectedType, label }) => {
      it(`${label} button calls onMediaPress with '${expectedType}'`, async () => {
        const { getByTestId } = renderWithTheme(
          <MediaControls 
            onMediaPress={mockOnMediaPress} 
            testID="media-controls"
          />
        );

        const button = getByTestId(testId);
        fireEvent.press(button);

        await waitFor(() => {
          expect(mockOnMediaPress).toHaveBeenCalledWith(expectedType);
        });
      });
    });
  });

  it('has proper accessibility properties', () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        testID="media-controls"
      />
    );

    const fastForwardButton = getByTestId('media-controls-fastForward');
    expect(fastForwardButton.props.accessibilityRole).toBe('button');
    expect(fastForwardButton.props.accessibilityLabel).toBe('Fast Forward');
    expect(fastForwardButton.props.accessibilityHint).toBe('Fast forwards playback');
  });

  it('maintains minimum touch target size', () => {
    const { getByTestId } = renderWithTheme(
      <MediaControls 
        onMediaPress={mockOnMediaPress} 
        testID="media-controls"
      />
    );

    const starButton = getByTestId('media-controls-star');
    expect(starButton.props.hitSlop).toEqual({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
    });
  });

  describe('play/pause button state', () => {
    it('shows play icon and label when not playing', () => {
      const { getByTestId, getByLabelText } = renderWithTheme(
        <MediaControls 
          onMediaPress={mockOnMediaPress} 
          isPlaying={false}
          testID="media-controls"
        />
      );

      const playPauseButton = getByTestId('media-controls-playPause');
      expect(getByLabelText('Play')).toBeTruthy();
      expect(playPauseButton.props.accessibilityHint).toBe('Starts playback');
    });

    it('shows pause icon and label when playing', () => {
      const { getByTestId, getByLabelText } = renderWithTheme(
        <MediaControls 
          onMediaPress={mockOnMediaPress} 
          isPlaying={true}
          testID="media-controls"
        />
      );

      const playPauseButton = getByTestId('media-controls-playPause');
      expect(getByLabelText('Pause')).toBeTruthy();
      expect(playPauseButton.props.accessibilityHint).toBe('Pauses playback');
    });

    it('calls onMediaPress with playPause regardless of playing state', async () => {
      const { getByTestId, rerender } = renderWithTheme(
        <MediaControls 
          onMediaPress={mockOnMediaPress} 
          isPlaying={false}
          testID="media-controls"
        />
      );

      // Test when not playing
      const playPauseButton = getByTestId('media-controls-playPause');
      fireEvent.press(playPauseButton);

      await waitFor(() => {
        expect(mockOnMediaPress).toHaveBeenCalledWith('playPause');
      });

      mockOnMediaPress.mockClear();

      // Test when playing
      rerender(
        <ThemeProvider>
          <MediaControls 
            onMediaPress={mockOnMediaPress} 
            isPlaying={true}
            testID="media-controls"
          />
        </ThemeProvider>
      );

      const pauseButton = getByTestId('media-controls-playPause');
      fireEvent.press(pauseButton);

      await waitFor(() => {
        expect(mockOnMediaPress).toHaveBeenCalledWith('playPause');
      });
    });
  });

  describe('accessibility hints', () => {
    it('has correct accessibility hints for all buttons', () => {
      const { getByTestId } = renderWithTheme(
        <MediaControls 
          onMediaPress={mockOnMediaPress} 
          testID="media-controls"
        />
      );

      expect(getByTestId('media-controls-replay').props.accessibilityHint).toBe('Replays the last few seconds');
      expect(getByTestId('media-controls-star').props.accessibilityHint).toBe('Opens options menu');
      expect(getByTestId('media-controls-headphones').props.accessibilityHint).toBe('Toggles private listening mode');
      expect(getByTestId('media-controls-rewind').props.accessibilityHint).toBe('Rewinds playback');
      expect(getByTestId('media-controls-playPause').props.accessibilityHint).toBe('Starts playback');
      expect(getByTestId('media-controls-fastForward').props.accessibilityHint).toBe('Fast forwards playback');
    });
  });
});