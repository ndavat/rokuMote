/**
 * BLE Service Manager
 * Manages switching between real and mock BLE services
 */

import { IBLEService, IMockBLEService } from './ble/BLEServiceInterface';
import { BLEServiceFactory } from './ble/BLEServiceFactory';
import { BLEServiceConfig } from '../types/ble';

export class BLEServiceManager {
  private static instance: BLEServiceManager | null = null;
  private factory: BLEServiceFactory;
  private currentService: IBLEService | IMockBLEService | null = null;
  private useMockService: boolean = false;

  private constructor() {
    this.factory = BLEServiceFactory.getInstance();
  }

  public static getInstance(): BLEServiceManager {
    if (!BLEServiceManager.instance) {
      BLEServiceManager.instance = new BLEServiceManager();
    }
    return BLEServiceManager.instance;
  }

  public setUseMockService(useMock: boolean): void {
    this.useMockService = useMock;
    // Disconnect current service if switching types
    if (this.currentService) {
      this.currentService.disconnect().catch(console.error);
      this.currentService = null;
    }
  }

  public getBLEService(config?: Partial<BLEServiceConfig>): IBLEService | IMockBLEService {
    if (!this.currentService) {
      this.currentService = this.factory.createService(this.useMockService, config);
    }
    return this.currentService;
  }

  public async disconnect(): Promise<void> {
    if (this.currentService) {
      await this.currentService.disconnect();
      this.currentService = null;
    }
  }

  public isUsingMockService(): boolean {
    return this.useMockService;
  }

  public async cleanup(): Promise<void> {
    await this.disconnect();
    await this.factory.cleanup();
    BLEServiceManager.instance = null;
  }
}

export const getBLEServiceManager = (): BLEServiceManager => {
  return BLEServiceManager.getInstance();
};