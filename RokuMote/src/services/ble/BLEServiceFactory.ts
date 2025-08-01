/**
 * BLE Service Factory
 * Factory for creating and managing BLE service instances with proper configuration
 */

import { IBLEService, IMockBLEService, IBLEServiceFactory } from './BLEServiceInterface';
import { BLEService } from './BLEService';
import { MockBLEService } from './MockBLEService';
import { BLEServiceConfig, DEFAULT_BLE_CONFIG } from '../../types/ble';
// import { BLEConfigManager } from './BLEConfigManager';

export class BLEServiceFactory implements IBLEServiceFactory {
  private static instance: BLEServiceFactory | null = null;
  // private configManager: BLEConfigManager;
  private activeServices: Map<string, IBLEService> = new Map();
  private serviceCounter: number = 0;

  private constructor() {
    // this.configManager = BLEConfigManager.getInstance();
  }

  /**
   * Get singleton instance of BLE service factory
   */
  public static getInstance(): BLEServiceFactory {
    if (!BLEServiceFactory.instance) {
      BLEServiceFactory.instance = new BLEServiceFactory();
    }
    return BLEServiceFactory.instance;
  }

  /**
   * Create a new BLE service instance
   */
  public createBLEService(config?: Partial<BLEServiceConfig>): IBLEService {
    const serviceId = `ble_service_${++this.serviceCounter}`;
    const mergedConfig = { ...DEFAULT_BLE_CONFIG, ...config };
    
    const service = new BLEService(mergedConfig);
    this.activeServices.set(serviceId, service);

    // Set up cleanup when service is destroyed
    const originalDestroy = service.destroy.bind(service);
    service.destroy = async () => {
      await originalDestroy();
      this.activeServices.delete(serviceId);
    };

    return service;
  }

  /**
   * Create a new mock BLE service instance
   */
  public createMockBLEService(config?: Partial<BLEServiceConfig>): IMockBLEService {
    const serviceId = `mock_ble_service_${++this.serviceCounter}`;
    const mergedConfig = { ...DEFAULT_BLE_CONFIG, ...config };
    
    const service = new MockBLEService(mergedConfig);
    this.activeServices.set(serviceId, service);

    // Set up cleanup when service is destroyed
    const originalDestroy = service.destroy.bind(service);
    service.destroy = async () => {
      await originalDestroy();
      this.activeServices.delete(serviceId);
    };

    return service;
  }

  /**
   * Create service based on environment or configuration
   */
  public createService(useMock?: boolean, config?: Partial<BLEServiceConfig>): IBLEService | IMockBLEService {
    const shouldUseMock = useMock ?? false;
    
    if (shouldUseMock) {
      return this.createMockBLEService(config);
    } else {
      return this.createBLEService(config);
    }
  }

  /**
   * Get all active service instances
   */
  public getActiveServices(): IBLEService[] {
    return Array.from(this.activeServices.values());
  }

  /**
   * Get count of active services
   */
  public getActiveServiceCount(): number {
    return this.activeServices.size;
  }

  /**
   * Destroy all active services
   */
  public async destroyAllServices(): Promise<void> {
    const destroyPromises = Array.from(this.activeServices.values()).map(service => 
      service.destroy().catch(error => {
        console.warn('Error destroying service:', error);
      })
    );

    await Promise.all(destroyPromises);
    this.activeServices.clear();
  }

  /**
   * Update global configuration for all new services
   */
  public updateGlobalConfig(config: Partial<BLEServiceConfig>): void {
    // this.configManager.updateGlobalConfig(config);
  }

  /**
   * Get current global configuration
   */
  public getGlobalConfig(): BLEServiceConfig {
    return DEFAULT_BLE_CONFIG;
  }

  /**
   * Reset global configuration to defaults
   */
  public resetGlobalConfig(): void {
    // this.configManager.resetToDefaults();
  }

  /**
   * Get factory statistics
   */
  public getFactoryStats(): {
    activeServices: number;
    totalServicesCreated: number;
    globalConfig: BLEServiceConfig;
  } {
    return {
      activeServices: this.activeServices.size,
      totalServicesCreated: this.serviceCounter,
      globalConfig: DEFAULT_BLE_CONFIG
    };
  }

  /**
   * Cleanup factory resources
   */
  public async cleanup(): Promise<void> {
    await this.destroyAllServices();
    this.serviceCounter = 0;
    BLEServiceFactory.instance = null;
  }
}

// Export singleton instance getter for convenience
export const getBLEServiceFactory = (): BLEServiceFactory => {
  return BLEServiceFactory.getInstance();
};