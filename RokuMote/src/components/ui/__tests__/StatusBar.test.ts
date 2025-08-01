import { StatusBarProps } from '../StatusBar';

describe('StatusBar Component Types', () => {
  it('should have correct StatusBarProps interface', () => {
    const mockProps: StatusBarProps = {
      deviceName: 'Living Room Roku',
      isConnected: true,
      onClose: jest.fn(),
      onPowerToggle: jest.fn(),
      testID: 'status-bar',
    };

    expect(mockProps.deviceName).toBe('Living Room Roku');
    expect(mockProps.isConnected).toBe(true);
    expect(typeof mockProps.onClose).toBe('function');
    expect(typeof mockProps.onPowerToggle).toBe('function');
    expect(mockProps.testID).toBe('status-bar');
  });

  it('should handle optional props correctly', () => {
    const minimalProps: StatusBarProps = {
      deviceName: 'Bedroom Roku',
      isConnected: false,
    };

    expect(minimalProps.deviceName).toBe('Bedroom Roku');
    expect(minimalProps.isConnected).toBe(false);
    expect(minimalProps.onClose).toBeUndefined();
    expect(minimalProps.onPowerToggle).toBeUndefined();
  });

  it('should support different connection states', () => {
    const connectedProps: StatusBarProps = {
      deviceName: 'Test Device',
      isConnected: true,
    };

    const disconnectedProps: StatusBarProps = {
      deviceName: 'Test Device',
      isConnected: false,
    };

    expect(connectedProps.isConnected).toBe(true);
    expect(disconnectedProps.isConnected).toBe(false);
  });

  it('should support custom device names', () => {
    const deviceNames = [
      'Living Room Roku',
      'Bedroom',
      'Kitchen TV',
      'Master Bedroom Roku Ultra',
    ];

    deviceNames.forEach(deviceName => {
      const props: StatusBarProps = {
        deviceName,
        isConnected: true,
      };
      expect(props.deviceName).toBe(deviceName);
    });
  });
});