// Export all services from this file
export { BLEService } from './ble/BLEService';
export { MockBLEService } from './ble/MockBLEService';
export { BLEServiceFactory, getBLEServiceFactory } from './ble/BLEServiceFactory';
export { BLEServiceManager, getBLEServiceManager } from './BLEServiceManager';
export { ConnectionManager } from './ble/ConnectionManager';
export { ErrorHandler } from './ble/ErrorHandler';
export { ErrorRecoveryService, defaultRecoveryService } from './ErrorRecoveryService';

// Export app lifecycle and deep linking services
export { AppLifecycleService } from './AppLifecycleService';
export { DeepLinkingService } from './DeepLinkingService';
export { AppStateManager } from './AppStateManager';

// Export interfaces
export type { 
  IBLEService, 
  IMockBLEService, 
  IBLEServiceFactory, 
  BLEEventListener 
} from './ble/BLEServiceInterface';

// Export app state management types
export type {
  AppLifecycleEvent,
  AppLifecycleConfig,
} from './AppLifecycleService';

export type {
  DeepLinkEvent,
  DeepLinkConfig,
  ParsedDeepLink,
} from './DeepLinkingService';

export type {
  AppStateManagerEvent,
  AppStateManagerConfig,
} from './AppStateManager';