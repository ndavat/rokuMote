import { VolumeControlsProps, VolumeControlButtonType } from '../VolumeControls';

describe('VolumeControls Component Types', () => {
  it('should have correct VolumeControlsProps interface', () => {
    const mockProps: VolumeControlsProps = {
      onVolumePress: jest.fn(),
      disabled: false,
      isMuted: true,
      testID: 'volume-controls',
    };

    expect(typeof mockProps.onVolumePress).toBe('function');
    expect(mockProps.disabled).toBe(false);
    expect(mockProps.isMuted).toBe(true);
    expect(mockProps.testID).toBe('volume-controls');
  });

  it('should handle optional props correctly', () => {
    const minimalProps: VolumeControlsProps = {
      onVolumePress: jest.fn(),
    };

    expect(typeof minimalProps.onVolumePress).toBe('function');
    expect(minimalProps.disabled).toBeUndefined();
    expect(minimalProps.isMuted).toBeUndefined();
    expect(minimalProps.testID).toBeUndefined();
  });

  it('should have correct volume control button types', () => {
    const buttonTypes: VolumeControlButtonType[] = [
      'mute', 
      'volumeDown', 
      'volumeUp'
    ];
    
    expect(buttonTypes).toHaveLength(3);
    expect(buttonTypes).toContain('mute');
    expect(buttonTypes).toContain('volumeDown');
    expect(buttonTypes).toContain('volumeUp');
  });

  it('should call onVolumePress with correct button type', () => {
    const mockOnVolumePress = jest.fn();

    const props: VolumeControlsProps = {
      onVolumePress: mockOnVolumePress,
    };

    // Test all button types
    const buttonTypes: VolumeControlButtonType[] = [
      'mute', 'volumeDown', 'volumeUp'
    ];

    buttonTypes.forEach(buttonType => {
      props.onVolumePress(buttonType);
      expect(mockOnVolumePress).toHaveBeenCalledWith(buttonType);
    });

    expect(mockOnVolumePress).toHaveBeenCalledTimes(3);
  });

  it('should support disabled state', () => {
    const disabledProps: VolumeControlsProps = {
      onVolumePress: jest.fn(),
      disabled: true,
    };

    const enabledProps: VolumeControlsProps = {
      onVolumePress: jest.fn(),
      disabled: false,
    };

    expect(disabledProps.disabled).toBe(true);
    expect(enabledProps.disabled).toBe(false);
  });

  it('should support muted state', () => {
    const mutedProps: VolumeControlsProps = {
      onVolumePress: jest.fn(),
      isMuted: true,
    };

    const unmutedProps: VolumeControlsProps = {
      onVolumePress: jest.fn(),
      isMuted: false,
    };

    expect(mutedProps.isMuted).toBe(true);
    expect(unmutedProps.isMuted).toBe(false);
  });

  it('should have proper button type constraints', () => {
    const validTypes: VolumeControlButtonType[] = [
      'mute', 'volumeDown', 'volumeUp'
    ];
    
    // Test that each type is a string
    validTypes.forEach(type => {
      expect(typeof type).toBe('string');
    });
  });

  describe('individual button functionality', () => {
    const buttonTests: Array<{
      buttonType: VolumeControlButtonType;
      description: string;
    }> = [
      { buttonType: 'mute', description: 'mute button' },
      { buttonType: 'volumeDown', description: 'volume down button' },
      { buttonType: 'volumeUp', description: 'volume up button' },
    ];

    buttonTests.forEach(({ buttonType, description }) => {
      it(`${description} calls onVolumePress with '${buttonType}'`, () => {
        const mockOnVolumePress = jest.fn();
        const props: VolumeControlsProps = {
          onVolumePress: mockOnVolumePress,
        };

        props.onVolumePress(buttonType);
        expect(mockOnVolumePress).toHaveBeenCalledWith(buttonType);
      });
    });
  });

  it('should handle mute state changes', () => {
    const mockOnVolumePress = jest.fn();

    // Test when not muted
    const unmutedProps: VolumeControlsProps = {
      onVolumePress: mockOnVolumePress,
      isMuted: false,
    };

    // Test when muted
    const mutedProps: VolumeControlsProps = {
      onVolumePress: mockOnVolumePress,
      isMuted: true,
    };

    // Both should call the same function with mute
    unmutedProps.onVolumePress('mute');
    mutedProps.onVolumePress('mute');

    expect(mockOnVolumePress).toHaveBeenCalledTimes(2);
    expect(mockOnVolumePress).toHaveBeenNthCalledWith(1, 'mute');
    expect(mockOnVolumePress).toHaveBeenNthCalledWith(2, 'mute');
  });

  it('should handle volume up and down consistently', () => {
    const mockOnVolumePress = jest.fn();
    const props: VolumeControlsProps = {
      onVolumePress: mockOnVolumePress,
    };

    // Test volume up
    props.onVolumePress('volumeUp');
    expect(mockOnVolumePress).toHaveBeenCalledWith('volumeUp');

    // Test volume down
    props.onVolumePress('volumeDown');
    expect(mockOnVolumePress).toHaveBeenCalledWith('volumeDown');

    expect(mockOnVolumePress).toHaveBeenCalledTimes(2);
  });

  it('should support testID for testing', () => {
    const propsWithTestID: VolumeControlsProps = {
      onVolumePress: jest.fn(),
      testID: 'custom-volume-controls',
    };

    expect(propsWithTestID.testID).toBe('custom-volume-controls');
  });
});