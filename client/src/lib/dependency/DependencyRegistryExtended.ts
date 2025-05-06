/**
 * DependencyRegistryExtended.ts
 * 
 * This file extends the DependencyRegistry to implement the additional methods
 * required by the PanelDependencyBridge and adds event emission
 */

import { 
  DependencyDefinition, 
  DependencyRegistry as IDependencyRegistry,
  Dependency,
  DependencyDataTypes,
  DependencyStatus,
  DependencyChain,
  DependencyLogEntry,
  DependencyLogLevel,
  DependencySuggestion,
  PerformanceImpact
} from './DependencyInterfaces';
import { DependencyRegistry } from './DependencyRegistry';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * Extended DependencyRegistry with event emission and additional methods
 */
export class DependencyRegistryExtended extends DependencyRegistry {
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
   * Override updateDependencyStatus to emit events
   */
  updateDependencyStatus(id: string, status: DependencyStatus): Dependency | null {
    const result = super.updateDependencyStatus(id, status);
    
    if (result) {
      this.emit('dependencyStatusChanged', { dependencyId: id, status });
    }
    
    return result;
  }
  
  /**
   * Get all component IDs
   */
  getAllComponents(): string[] {
    const componentIds = new Set<string>();
    
    for (const definition of this.getAllDefinitions()) {
      componentIds.add(definition.componentId);
    }
    
    return Array.from(componentIds);
  }
  
  /**
   * Get all definitions
   */
  getAllDefinitions(): DependencyDefinition[] {
    return Array.from(this.getDefinitionsMap().values());
  }
  
  /**
   * Get a component by ID
   */
  getComponent(componentId: string): string | null {
    const definitions = this.getDefinitionsByComponent(componentId);
    
    if (definitions.length > 0) {
      return componentId;
    }
    
    return null;
  }
  
  /**
   * Get definitions by component and role
   */
  getDefinitionsByComponentAndRole(
    componentId: string, 
    role: string, 
    dataType?: DependencyDataTypes
  ): DependencyDefinition[] {
    const definitions = this.getDefinitionsByComponent(componentId);
    
    if (!dataType) {
      return definitions.filter(def => def.role === role);
    }
    
    return definitions.filter(def => def.role === role && def.dataType === dataType);
  }
  
  /**
   * Get dependencies by provider and data type
   */
  getDependenciesByProviderAndDataType(
    providerId: string, 
    dataType: DependencyDataTypes
  ): Dependency[] {
    return this.getDependenciesByProvider(providerId)
      .filter(dep => dep.dataType === dataType);
  }
  
  /**
   * Expose the private definitions map for testing
   */
  private getDefinitionsMap(): Map<string, DependencyDefinition> {
    // @ts-ignore - Access private field for testing
    return this.definitions;
  }
}