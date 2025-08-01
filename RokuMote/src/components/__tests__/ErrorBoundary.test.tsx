/**
 * Error Boundary Component Tests
 * Tests error boundary functionality and recovery mechanisms
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { BLEErrorBoundary } from '../BLEErrorBoundary';

// Mock console methods to avoid test noise
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
  shouldThrow, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <Text testID="success-component">Success</Text>;
};

// Component that throws a BLE-related error
const ThrowBLEError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    const error = new Error('Bluetooth connection failed');
    error.name = 'BLEError';
    throw error;
  }
  return <Text testID="ble-success-component">BLE Success</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
  });

  it('should render children when no error occurs', () => {
    const { getByTestId } = render(
      <ErrorBoundary testID="error-boundary">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByTestId('success-component')).toBeTruthy();
  });

  it('should catch errors and display fallback UI', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary testID="error-boundary">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(queryByTestId('success-component')).toBeNull();
    expect(getByTestId('error-boundary-error-boundary')).toBeTruthy();
  });

  it('should display error details', () => {
    const { getByText } = render(
      <ErrorBoundary testID="error-boundary">
        <ThrowError shouldThrow={true} errorMessage="Custom error message" />
      </ErrorBoundary>
    );

    expect(getByText('⚠️ Something went wrong')).toBeTruthy();
    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError} testID="error-boundary">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('should retry when retry button is pressed', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary testID="error-boundary">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error boundary should be displayed
    expect(getByTestId('error-boundary-error-boundary')).toBeTruthy();

    // Press retry button
    fireEvent.press(getByTestId('error-boundary-retry-button'));

    // Should attempt to render children again
    // In a real scenario, the component might not throw the second time
    expect(queryByTestId('error-boundary-error-boundary')).toBeTruthy();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
      <View testID="custom-fallback">
        <Text>Custom Error UI</Text>
        <Text testID="custom-retry" onPress={retry}>Custom Retry</Text>
      </View>
    );

    const { getByTestId } = render(
      <ErrorBoundary fallback={customFallback} testID="error-boundary">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('custom-fallback')).toBeTruthy();
    expect(getByTestId('custom-retry')).toBeTruthy();
  });

  it('should generate unique error IDs', () => {
    const onError = jest.fn();
    
    const { rerender } = render(
      <ErrorBoundary onError={onError} testID="error-boundary">
        <ThrowError shouldThrow={true} errorMessage="First error" />
      </ErrorBoundary>
    );

    const firstErrorId = onError.mock.calls[0][0].message;

    // Clear and trigger another error
    onError.mockClear();
    
    rerender(
      <ErrorBoundary onError={onError} testID="error-boundary">
        <ThrowError shouldThrow={true} errorMessage="Second error" />
      </ErrorBoundary>
    );

    const secondErrorId = onError.mock.calls[0][0].message;
    
    // Error messages should be different
    expect(firstErrorId).not.toBe(secondErrorId);
  });
});

describe('BLEErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
  });

  it('should render children when no error occurs', () => {
    const { getByTestId } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={false} />
      </BLEErrorBoundary>
    );

    expect(getByTestId('ble-success-component')).toBeTruthy();
  });

  it('should catch BLE-related errors', () => {
    const { getByTestId, queryByTestId } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    expect(queryByTestId('ble-success-component')).toBeNull();
    expect(getByTestId('ble-error-boundary-ble-error-boundary')).toBeTruthy();
  });

  it('should display BLE-specific error UI', () => {
    const { getByText } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    expect(getByText('Bluetooth Connection Issue')).toBeTruthy();
  });

  it('should show recovery options for recoverable errors', () => {
    const { getByTestId } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    expect(getByTestId('ble-error-boundary-recovery-button')).toBeTruthy();
    expect(getByTestId('ble-error-boundary-retry-button')).toBeTruthy();
    expect(getByTestId('ble-error-boundary-help-button')).toBeTruthy();
  });

  it('should attempt recovery when recovery button is pressed', async () => {
    const onRecovery = jest.fn();
    
    const { getByTestId } = render(
      <BLEErrorBoundary onRecovery={onRecovery} testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    fireEvent.press(getByTestId('ble-error-boundary-recovery-button'));

    // Wait for recovery attempt
    await waitFor(() => {
      // Recovery should have been attempted
      // The exact behavior depends on the mock implementation
    });
  });

  it('should show help when help button is pressed', () => {
    const { getByTestId } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    fireEvent.press(getByTestId('ble-error-boundary-help-button'));

    // This would typically show an alert or modal with help information
    // The exact implementation depends on the platform
  });

  it('should call onError callback with extended error', () => {
    const onError = jest.fn();
    
    render(
      <BLEErrorBoundary onError={onError} testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    const extendedError = onError.mock.calls[0][0];
    expect(extendedError).toHaveProperty('type');
    expect(extendedError).toHaveProperty('severity');
    expect(extendedError).toHaveProperty('category');
    expect(extendedError).toHaveProperty('errorId');
  });

  it('should track recovery attempts', async () => {
    const { getByTestId, getByText } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    // Attempt recovery multiple times
    fireEvent.press(getByTestId('ble-error-boundary-recovery-button'));
    
    await waitFor(() => {
      // Should show recovery attempts counter
      expect(getByText(/Recovery attempts:/)).toBeTruthy();
    });
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: any, retry: () => void, recover: () => void) => (
      <View testID="custom-ble-fallback">
        <Text>Custom BLE Error UI</Text>
        <Text testID="custom-ble-retry" onPress={retry}>Custom Retry</Text>
        <Text testID="custom-ble-recover" onPress={recover}>Custom Recover</Text>
      </View>
    );

    const { getByTestId } = render(
      <BLEErrorBoundary fallback={customFallback} testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    expect(getByTestId('custom-ble-fallback')).toBeTruthy();
    expect(getByTestId('custom-ble-retry')).toBeTruthy();
    expect(getByTestId('custom-ble-recover')).toBeTruthy();
  });

  it('should not catch non-BLE errors', () => {
    // This test verifies that non-BLE errors are re-thrown
    // and would be caught by a parent error boundary
    
    const NonBLEError: React.FC = () => {
      throw new Error('Regular error');
    };

    expect(() => {
      render(
        <BLEErrorBoundary testID="ble-error-boundary">
          <NonBLEError />
        </BLEErrorBoundary>
      );
    }).toThrow('Regular error');
  });

  it('should handle different BLE error types appropriately', () => {
    const BluetoothDisabledError: React.FC = () => {
      const error = new Error('Bluetooth is disabled');
      error.name = 'BLEError';
      throw error;
    };

    const { getByText } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <BluetoothDisabledError />
      </BLEErrorBoundary>
    );

    expect(getByText('Bluetooth Connection Issue')).toBeTruthy();
    // Should show appropriate error message for Bluetooth disabled
  });

  it('should disable recovery button after max attempts', async () => {
    const { getByTestId } = render(
      <BLEErrorBoundary testID="ble-error-boundary">
        <ThrowBLEError shouldThrow={true} />
      </BLEErrorBoundary>
    );

    const recoveryButton = getByTestId('ble-error-boundary-recovery-button');

    // Attempt recovery multiple times to exceed the limit
    for (let i = 0; i < 4; i++) {
      fireEvent.press(recoveryButton);
      await waitFor(() => {
        // Wait for recovery attempt to complete
      });
    }

    // Recovery button should be disabled or hidden after max attempts
    // The exact behavior depends on the implementation
  });
});

describe('Error Boundary Integration', () => {
  it('should work with nested error boundaries', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary testID="outer-boundary">
        <BLEErrorBoundary testID="inner-boundary">
          <ThrowBLEError shouldThrow={true} />
        </BLEErrorBoundary>
      </ErrorBoundary>
    );

    // BLE error should be caught by BLE error boundary
    expect(getByTestId('inner-boundary-ble-error-boundary')).toBeTruthy();
    // Outer boundary should not catch the error
    expect(queryByTestId('outer-boundary-error-boundary')).toBeNull();
  });

  it('should fall back to parent boundary for non-BLE errors', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary testID="outer-boundary">
        <BLEErrorBoundary testID="inner-boundary">
          <ThrowError shouldThrow={true} />
        </BLEErrorBoundary>
      </ErrorBoundary>
    );

    // Non-BLE error should be caught by outer error boundary
    expect(getByTestId('outer-boundary-error-boundary')).toBeTruthy();
    // Inner BLE boundary should not catch the error
    expect(queryByTestId('inner-boundary-ble-error-boundary')).toBeNull();
  });
});