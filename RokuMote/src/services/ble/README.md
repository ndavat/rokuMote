# BLE Error Handler

The ErrorHandler provides comprehensive error handling, recovery, and logging for BLE operations in the RokuMote app.

## Features

- **Error Classification**: Categorizes errors by type, severity, and category
- **Recovery Strategies**: Implements recovery mechanisms for different error types
- **Error Logging**: Configurable logging with different levels
- **Statistics Tracking**: Tracks error rates and recovery success rates
- **User-Friendly Messages**: Converts technical errors to user-friendly messages

## Usage

```typescript
import { ErrorHandler } from './ErrorHandler';
import { BLEErrorType } from '../../types/ble';

// Create error handler instance
const errorHandler = new ErrorHandler();

// Handle a BLE error
const bleError = {
  type: BLEErrorType.CONNECTION_FAILED,
  message: 'Failed to connect to device'
};

const extendedError = errorHandler.handleError(bleError);

// Get user-friendly message
const userMessage = errorHandler.formatUserMessage(extendedError);

// Attempt recovery
const recovered = await errorHandler.attemptRecovery(extendedError);

// Get error statistics
const stats = errorHandler.getStats();
```

## Error Types Supported

- `BLUETOOTH_DISABLED`: Bluetooth is not enabled
- `PERMISSION_DENIED`: Bluetooth permissions not granted
- `DEVICE_NOT_FOUND`: No Roku devices found
- `CONNECTION_FAILED`: Failed to connect to device
- `CONNECTION_LOST`: Connection was lost
- `COMMAND_FAILED`: Command transmission failed
- `SERVICE_NOT_FOUND`: Required BLE service not found
- `CHARACTERISTIC_NOT_FOUND`: Required BLE characteristic not found
- `TIMEOUT`: Operation timed out
- `UNKNOWN`: Unknown error occurred

## Configuration

```typescript
const errorHandler = new ErrorHandler({
  enableLogging: true,
  enableAutoRecovery: true,
  maxRetryAttempts: 3,
  retryDelay: 1000,
  logLevel: 'error'
});
```

## Recovery Strategies

The ErrorHandler implements recovery strategies for recoverable errors:

- **Connection Failed**: Retry with exponential backoff
- **Connection Lost**: Automatic reconnection if enabled
- **Command Failed**: Short delay and retry
- **Timeout**: Retry after delay
- **Bluetooth Disabled**: Guide user to enable Bluetooth
- **Permission Denied**: Guide user to grant permissions

## Error Statistics

Track error patterns and recovery success:

```typescript
const stats = errorHandler.getStats();
console.log('Total errors:', stats.totalErrors);
console.log('Recovery success rate:', stats.recoverySuccessRate);
console.log('Errors by type:', stats.errorsByType);
```