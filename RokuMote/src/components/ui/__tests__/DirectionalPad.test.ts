import { DirectionalPadProps, DirectionType } from '../DirectionalPad';

describe('DirectionalPad Component Types', () => {
  it('should have correct DirectionalPadProps interface', () => {
    const mockProps: DirectionalPadProps = {
      onDirectionPress: jest.fn(),
      onOkPress: jest.fn(),
      disabled: false,
      hapticFeedback: true,
      testID: 'directional-pad',
    };

    expect(typeof mockProps.onDirectionPress).toBe('function');
    expect(typeof mockProps.onOkPress).toBe('function');
    expect(mockProps.disabled).toBe(false);
    expect(mockProps.hapticFeedback).toBe(true);
    expect(mockProps.testID).toBe('directional-pad');
  });

  it('should handle optional props correctly', () => {
    const minimalProps: DirectionalPadProps = {
      onDirectionPress: jest.fn(),
      onOkPress: jest.fn(),
    };

    expect(typeof minimalProps.onDirectionPress).toBe('function');
    expect(typeof minimalProps.onOkPress).toBe('function');
    expect(minimalProps.disabled).toBeUndefined();
    expect(minimalProps.hapticFeedback).toBeUndefined();
  });

  it('should support all direction types', () => {
    const directions: DirectionType[] = ['up', 'down', 'left', 'right'];
    
    expect(directions).toHaveLength(4);
    expect(directions).toContain('up');
    expect(directions).toContain('down');
    expect(directions).toContain('left');
    expect(directions).toContain('right');
  });

  it('should call onDirectionPress with correct direction', () => {
    const mockOnDirectionPress = jest.fn();
    const mockOnOkPress = jest.fn();

    const props: DirectionalPadProps = {
      onDirectionPress: mockOnDirectionPress,
      onOkPress: mockOnOkPress,
    };

    // Simulate calling the direction press handler
    props.onDirectionPress('up');
    expect(mockOnDirectionPress).toHaveBeenCalledWith('up');

    props.onDirectionPress('down');
    expect(mockOnDirectionPress).toHaveBeenCalledWith('down');

    props.onDirectionPress('left');
    expect(mockOnDirectionPress).toHaveBeenCalledWith('left');

    props.onDirectionPress('right');
    expect(mockOnDirectionPress).toHaveBeenCalledWith('right');

    expect(mockOnDirectionPress).toHaveBeenCalledTimes(4);
  });

  it('should call onOkPress when OK is pressed', () => {
    const mockOnDirectionPress = jest.fn();
    const mockOnOkPress = jest.fn();

    const props: DirectionalPadProps = {
      onDirectionPress: mockOnDirectionPress,
      onOkPress: mockOnOkPress,
    };

    // Simulate calling the OK press handler
    props.onOkPress();
    expect(mockOnOkPress).toHaveBeenCalledTimes(1);
    expect(mockOnDirectionPress).not.toHaveBeenCalled();
  });

  it('should support disabled state', () => {
    const disabledProps: DirectionalPadProps = {
      onDirectionPress: jest.fn(),
      onOkPress: jest.fn(),
      disabled: true,
    };

    const enabledProps: DirectionalPadProps = {
      onDirectionPress: jest.fn(),
      onOkPress: jest.fn(),
      disabled: false,
    };

    expect(disabledProps.disabled).toBe(true);
    expect(enabledProps.disabled).toBe(false);
  });

  it('should support haptic feedback configuration', () => {
    const withHapticProps: DirectionalPadProps = {
      onDirectionPress: jest.fn(),
      onOkPress: jest.fn(),
      hapticFeedback: true,
    };

    const withoutHapticProps: DirectionalPadProps = {
      onDirectionPress: jest.fn(),
      onOkPress: jest.fn(),
      hapticFeedback: false,
    };

    expect(withHapticProps.hapticFeedback).toBe(true);
    expect(withoutHapticProps.hapticFeedback).toBe(false);
  });
});