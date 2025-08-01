/**
 * Connection Manager
 * Manages BLE connection state, statistics, and preferences
 */

import { EventEmitter } from 'events';
import {
  IConnectionManager,
  ConnectionState,
  ConnectionStats,
  ConnectionPreferences,
  CommandQueueState,
  QueuedCommand,
  ConnectionManagerEvent,
  DEFAULT_CONNECTION_STATE,
  DEFAULT_CONNECTION_PREFERENCES,
  DEFAULT_COMMAND_QUEUE_STATE
} from '../../types/connection';
import {
  RemoteCommand,
  CommandResult,
  BLEError,
  BLEErrorType
} from '../../types/ble';

export class ConnectionManager extends EventEmitter implements IConnectionManager {
  private state: ConnectionState;
  private stats: ConnectionStats;
  private preferences: ConnectionPreferences;
  private queueState: CommandQueueState;

  constructor() {
    super();
    this.state = { ...DEFAULT_CONNECTION_STATE };
    this.preferences = { ...DEFAULT_CONNECTION_PREFERENCES };
    this.queueState = { ...DEFAULT_COMMAND_QUEUE_STATE };
    this.stats = this.initializeStats();
  }

  private initializeStats(): ConnectionStats {
    return {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageResponseTime: 0,
      uptime: 0,
      lastConnectionTime: null
    };
  }

  // State management
  getState(): ConnectionState {
    return { ...this.state };
  }

  updateState(updates: Partial<ConnectionState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    this.emit(ConnectionManagerEvent.STATE_CHANGED, {
      previousState,
      currentState: this.state,
      changes: updates
    });
  }

  resetState(): void {
    this.state = { ...DEFAULT_CONNECTION_STATE };
    this.emit(ConnectionManagerEvent.STATE_CHANGED, {
      previousState: null,
      currentState: this.state,
      changes: this.state
    });
  }

  // Statistics management
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  updateStats(updates: Partial<ConnectionStats>): void {
    this.stats = { ...this.stats, ...updates };
    this.emit(ConnectionManagerEvent.STATS_UPDATED, this.stats);
  }

  resetStats(): void {
    this.stats = this.initializeStats();
    this.emit(ConnectionManagerEvent.STATS_UPDATED, this.stats);
  }

  // Preferences management
  getPreferences(): ConnectionPreferences {
    return { ...this.preferences };
  }

  updatePreferences(updates: Partial<ConnectionPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
  }

  async savePreferences(): Promise<void> {
    // In a real implementation, this would save to AsyncStorage or similar
    // For now, we'll just store in memory
    try {
      // Simulate async storage operation
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Preferences saved:', this.preferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  async loadPreferences(): Promise<void> {
    // In a real implementation, this would load from AsyncStorage or similar
    try {
      // Simulate async storage operation
      await new Promise(resolve => setTimeout(resolve, 100));
      // For now, use defaults
      this.preferences = { ...DEFAULT_CONNECTION_PREFERENCES };
      console.log('Preferences loaded:', this.preferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      this.preferences = { ...DEFAULT_CONNECTION_PREFERENCES };
    }
  }

  // Command queue management
  getQueueState(): CommandQueueState {
    return {
      ...this.queueState,
      queue: [...this.queueState.queue] // Return a copy of the queue
    };
  }

  async enqueueCommand(command: RemoteCommand): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.queueState.queue.length >= this.queueState.maxQueueSize) {
        const error: BLEError = {
          type: BLEErrorType.COMMAND_FAILED,
          message: 'Command queue is full'
        };
        reject(error);
        return;
      }

      const queuedCommand: QueuedCommand = {
        command,
        timestamp: Date.now(),
        retryCount: 0,
        resolve,
        reject
      };

      this.queueState.queue.push(queuedCommand);
      
      this.emit(ConnectionManagerEvent.COMMAND_QUEUED, {
        command,
        queueSize: this.queueState.queue.length
      });

      // Start processing if not already processing
      if (!this.queueState.processing) {
        this.processQueue();
      }
    });
  }

  dequeueCommand(): QueuedCommand | null {
    return this.queueState.queue.shift() || null;
  }

  clearQueue(): void {
    // Reject all pending commands
    this.queueState.queue.forEach(queuedCommand => {
      const error: BLEError = {
        type: BLEErrorType.COMMAND_FAILED,
        message: 'Command queue cleared'
      };
      queuedCommand.reject(error);
      
      if (queuedCommand.timeoutId) {
        clearTimeout(queuedCommand.timeoutId);
      }
    });

    this.queueState.queue = [];
    this.queueState.currentCommand = null;
    this.queueState.processing = false;
  }

  getQueueSize(): number {
    return this.queueState.queue.length;
  }

  private async processQueue(): Promise<void> {
    if (this.queueState.processing) {
      return;
    }

    this.queueState.processing = true;

    while (this.queueState.queue.length > 0) {
      const queuedCommand = this.dequeueCommand();
      if (!queuedCommand) {
        break;
      }

      this.queueState.currentCommand = queuedCommand;

      try {
        // Simulate command processing
        const result = await this.processCommand(queuedCommand);
        queuedCommand.resolve(result);
        
        this.emit(ConnectionManagerEvent.COMMAND_PROCESSED, {
          command: queuedCommand.command,
          result,
          success: true
        });
      } catch (error) {
        queuedCommand.reject(error as BLEError);
        
        this.emit(ConnectionManagerEvent.COMMAND_PROCESSED, {
          command: queuedCommand.command,
          error,
          success: false
        });
      }

      this.queueState.currentCommand = null;
    }

    this.queueState.processing = false;
  }

  private async processCommand(queuedCommand: QueuedCommand): Promise<CommandResult> {
    // This is a placeholder implementation
    // In the real implementation, this would send the command via BLE
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      command: queuedCommand.command,
      responseTime
    };
  }

  // Event handling (inherited from EventEmitter)
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  off(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }
}