/**
 * DependencyManagerExtended.ts
 * 
 * This file extends the DependencyManager to implement the additional methods
 * required by the PanelDependencyBridge and adds event emission
 */

import { 
  DependencyManager as IDependencyManager,
  DependencyStatus,
  DependencyDataTypes
} from './DependencyInterfaces';
import { DependencyManager } from './DependencyManager';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * Extended DependencyManager with event emission and additional methods
 */
export class DependencyManagerExtended extends DependencyManager {
  private eventEmitter: EventEmitter = new EventEmitter();
  
  /**
   * Subscribe to an event
   */
  on<T>(eventName: string, callback: (data: T) => void): () => void {
    return this.eventEmitter.on(eventName, callback);
  }
  
  /**
   * Unsubscribe from an event
   */
  off(eventName: string, callback: Function): void {
    this.eventEmitter.off(eventName, callback);
  }
  
  /**
   * Emit an event
   */
  private emit<T>(eventName: string, data: T): void {
    this.eventEmitter.emit(eventName, data);
  }
  
  /**
   * Override updateData to emit events
   */
  updateData(componentId: string, dataType: DependencyDataTypes, data: any): void {
    // Call the parent method
    super.updateData(componentId, dataType, data);
    
    // Now emit an event
    this.emit('dataUpdated', { componentId, dataType, data });
    
    // Also identify dependency IDs affected by this update
    try {
      // @ts-ignore - Access private registry
      const registry = this.registry;
      const dependencies = registry.getDependenciesByProvider(componentId)
        .filter(dep => dep.dataType === dataType);
      
      for (const dependency of dependencies) {
        this.emit('dataUpdated', { dependencyId: dependency.id, data });
      }
    } catch (err) {
      console.error('Error emitting events for dependencies:', err);
    }
  }
  
  /**
   * Subscribe to data updates for a specific dependency
   */
  onDataUpdated(dependencyId: string, callback: (data: any) => void): () => void {
    const wrappedCallback = (eventData: any) => {
      if (eventData.dependencyId === dependencyId) {
        callback(eventData.data);
      }
    };
    
    return this.on('dataUpdated', wrappedCallback);
  }
}