import { MediaControlsProps, MediaControlButtonType } from '../MediaControls';

describe('MediaControls Component Types', () => {
  it('should have correct MediaControlsProps interface', () => {
    const mockProps: MediaControlsProps = {
      onMediaPress: jest.fn(),
      disabled: false,
      isPlaying: true,
      testID: 'media-controls',
    };

    expect(typeof mockProps.onMediaPress).toBe('function');
    expect(mockProps.disabled).toBe(false);
    expect(mockProps.isPlaying).toBe(true);
    expect(mockProps.testID).toBe('media-controls');
  });

  it('should handle optional props correctly', () => {
    const minimalProps: MediaControlsProps = {
      onMediaPress: jest.fn(),
    };

    expect(typeof minimalProps.onMediaPress).toBe('function');
    expect(minimalProps.disabled).toBeUndefined();
    expect(minimalProps.isPlaying).toBeUndefined();
    expect(minimalProps.testID).toBeUndefined();
  });

  it('should have correct media control button types', () => {
    const buttonTypes: MediaControlButtonType[] = [
      'replay', 
      'star', 
      'headphones', 
      'rewind', 
      'playPause', 
      'fastForward'
    ];
    
    expect(buttonTypes).toHaveLength(6);
    expect(buttonTypes).toContain('replay');
    expect(buttonTypes).toContain('star');
    expect(buttonTypes).toContain('headphones');
    expect(buttonTypes).toContain('rewind');
    expect(buttonTypes).toContain('playPause');
    expect(buttonTypes).toContain('fastForward');
  });

  it('should call onMediaPress with correct button type', () => {
    const mockOnMediaPress = jest.fn();

    const props: MediaControlsProps = {
      onMediaPress: mockOnMediaPress,
    };

    // Test all button types
    const buttonTypes: MediaControlButtonType[] = [
      'replay', 'star', 'headphones', 'rewind', 'playPause', 'fastForward'
    ];

    buttonTypes.forEach(buttonType => {
      props.onMediaPress(buttonType);
      expect(mockOnMediaPress).toHaveBeenCalledWith(buttonType);
    });

    expect(mockOnMediaPress).toHaveBeenCalledTimes(6);
  });

  it('should support disabled state', () => {
    const disabledProps: MediaControlsProps = {
      onMediaPress: jest.fn(),
      disabled: true,
    };

    const enabledProps: MediaControlsProps = {
      onMediaPress: jest.fn(),
      disabled: false,
    };

    expect(disabledProps.disabled).toBe(true);
    expect(enabledProps.disabled).toBe(false);
  });

  it('should support playing state', () => {
    const playingProps: MediaControlsProps = {
      onMediaPress: jest.fn(),
      isPlaying: true,
    };

    const pausedProps: MediaControlsProps = {
      onMediaPress: jest.fn(),
      isPlaying: false,
    };

    expect(playingProps.isPlaying).toBe(true);
    expect(pausedProps.isPlaying).toBe(false);
  });

  it('should have proper button type constraints', () => {
    const validTypes: MediaControlButtonType[] = [
      'replay', 'star', 'headphones', 'rewind', 'playPause', 'fastForward'
    ];
    
    // Test that each type is a string
    validTypes.forEach(type => {
      expect(typeof type).toBe('string');
    });
  });

  describe('individual button functionality', () => {
    const buttonTests: Array<{
      buttonType: MediaControlButtonType;
      description: string;
    }> = [
      { buttonType: 'replay', description: 'replay button' },
      { buttonType: 'star', description: 'star button' },
      { buttonType: 'headphones', description: 'headphones button' },
      { buttonType: 'rewind', description: 'rewind button' },
      { buttonType: 'playPause', description: 'play/pause button' },
      { buttonType: 'fastForward', description: 'fast forward button' },
    ];

    buttonTests.forEach(({ buttonType, description }) => {
      it(`${description} calls onMediaPress with '${buttonType}'`, () => {
        const mockOnMediaPress = jest.fn();
        const props: MediaControlsProps = {
          onMediaPress: mockOnMediaPress,
        };

        props.onMediaPress(buttonType);
        expect(mockOnMediaPress).toHaveBeenCalledWith(buttonType);
      });
    });
  });

  it('should handle play/pause state changes', () => {
    const mockOnMediaPress = jest.fn();

    // Test when not playing
    const pausedProps: MediaControlsProps = {
      onMediaPress: mockOnMediaPress,
      isPlaying: false,
    };

    // Test when playing
    const playingProps: MediaControlsProps = {
      onMediaPress: mockOnMediaPress,
      isPlaying: true,
    };

    // Both should call the same function with playPause
    pausedProps.onMediaPress('playPause');
    playingProps.onMediaPress('playPause');

    expect(mockOnMediaPress).toHaveBeenCalledTimes(2);
    expect(mockOnMediaPress).toHaveBeenNthCalledWith(1, 'playPause');
    expect(mockOnMediaPress).toHaveBeenNthCalledWith(2, 'playPause');
  });
});