import { 
  DependencyManager as IDependencyManager,
  DependencyRegistry,
  DependencyDataTypes,
  DependencyStatus,
  Dependency
} from './DependencyInterfaces';

/**
 * Implementation of the DependencyManager interface.
 * Handles runtime data exchange between components.
 */
export class DependencyManager implements IDependencyManager {
  private registry: DependencyRegistry;
  private dataStore: Map<string, any> = new Map();
  private dataUpdateCallbacks: Set<(dependencyId: string, data: any) => void> = new Set();
  private statusChangeCallbacks: Set<(dependencyId: string, status: DependencyStatus) => void> = new Set();
  
  constructor(registry: DependencyRegistry) {
    this.registry = registry;
    console.log('DependencyManager initialized');
  }
  
  /**
   * Update data for a dependency from a provider.
   */
  updateData(providerId: string, dataType: DependencyDataTypes, data: any): void {
    // Get all dependencies where this component is the provider
    const dependencies = this.registry.getDependenciesByProvider(providerId)
      .filter(dep => dep.dataType === dataType);
    
    // If no dependencies, just store the data
    if (dependencies.length === 0) {
      const key = `${providerId}:${dataType}`;
      this.dataStore.set(key, data);
      return;
    }
    
    // Update each dependency
    for (const dependency of dependencies) {
      // Skip suspended dependencies
      if (dependency.status === DependencyStatus.SUSPENDED) {
        console.log(`Skipping update for suspended dependency: ${dependency.id}`);
        continue;
      }
      
      // Store the data
      this.dataStore.set(dependency.id, data);
      
      // Update the status
      if (dependency.status !== DependencyStatus.READY) {
        this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
        this.notifyStatusChanged(dependency.id, DependencyStatus.READY);
      }
      
      // Notify listeners
      this.notifyDataUpdated(dependency.id, data);
    }
  }
  
  /**
   * Get data for a dependency.
   */
  getData(dependencyId: string): any {
    return this.dataStore.get(dependencyId);
  }
  
  /**
   * Request data from a provider.
   */
  requestData(consumerId: string, providerId: string, dataType: DependencyDataTypes): void {
    // Find the dependency
    const dependency = this.findDependency(providerId, consumerId, dataType);
    
    if (!dependency) {
      // Try to create the dependency if it doesn't exist
      const newDependency = this.registry.createDependency(providerId, consumerId, dataType);
      
      if (!newDependency) {
        console.warn(`Cannot request data: no dependency exists between ${providerId} and ${consumerId} for ${dataType}`);
        return;
      }
      
      // Update status
      this.registry.updateDependencyStatus(newDependency.id, DependencyStatus.CONNECTING);
      this.notifyStatusChanged(newDependency.id, DependencyStatus.CONNECTING);
      return;
    }
    
    // If data exists, update the status to READY
    const data = this.dataStore.get(dependency.id);
    
    if (data !== undefined) {
      this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
      this.notifyStatusChanged(dependency.id, DependencyStatus.READY);
    } else {
      // Otherwise, update to CONNECTING
      this.registry.updateDependencyStatus(dependency.id, DependencyStatus.CONNECTING);
      this.notifyStatusChanged(dependency.id, DependencyStatus.CONNECTING);
      
      // Check if provider has data
      const providerDataKey = `${providerId}:${dataType}`;
      const providerData = this.dataStore.get(providerDataKey);
      
      if (providerData !== undefined) {
        // Provider already has data, but no dependency data exists yet
        this.dataStore.set(dependency.id, providerData);
        this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
        this.notifyStatusChanged(dependency.id, DependencyStatus.READY);
        this.notifyDataUpdated(dependency.id, providerData);
      }
    }
  }
  
  /**
   * Register a callback for data updates.
   */
  onDataUpdated(callback: (dependencyId: string, data: any) => void): () => void {
    this.dataUpdateCallbacks.add(callback);
    
    return () => {
      this.dataUpdateCallbacks.delete(callback);
    };
  }
  
  /**
   * Register a callback for status changes.
   */
  onStatusChanged(callback: (dependencyId: string, status: DependencyStatus) => void): () => void {
    this.statusChangeCallbacks.add(callback);
    
    return () => {
      this.statusChangeCallbacks.delete(callback);
    };
  }
  
  /**
   * Check if a provider has dependents.
   */
  hasDependents(providerId: string, dataType: DependencyDataTypes): boolean {
    return this.getDependents(providerId, dataType).length > 0;
  }
  
  /**
   * Get all dependents for a provider.
   */
  getDependents(providerId: string, dataType: DependencyDataTypes): string[] {
    return this.registry.getDependenciesByProvider(providerId)
      .filter(dep => dep.dataType === dataType)
      .map(dep => dep.consumerId);
  }
  
  /**
   * Check if a consumer has providers.
   */
  hasProviders(consumerId: string, dataType: DependencyDataTypes): boolean {
    return this.getProviders(consumerId, dataType).length > 0;
  }
  
  /**
   * Get all providers for a consumer.
   */
  getProviders(consumerId: string, dataType: DependencyDataTypes): string[] {
    return this.registry.getDependenciesByConsumer(consumerId)
      .filter(dep => dep.dataType === dataType)
      .map(dep => dep.providerId);
  }
  
  /**
   * Find a dependency between a provider and consumer.
   */
  private findDependency(
    providerId: string, 
    consumerId: string, 
    dataType: DependencyDataTypes
  ): Dependency | undefined {
    const providerDependencies = this.registry.getDependenciesByProvider(providerId);
    
    for (const dependency of providerDependencies) {
      if (dependency.consumerId === consumerId && dependency.dataType === dataType) {
        return dependency;
      }
    }
    
    return undefined;
  }
  
  /**
   * Notify all listeners of a data update.
   */
  private notifyDataUpdated(dependencyId: string, data: any): void {
    for (const callback of this.dataUpdateCallbacks) {
      try {
        callback(dependencyId, data);
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    }
  }
  
  /**
   * Notify all listeners of a status change.
   */
  private notifyStatusChanged(dependencyId: string, status: DependencyStatus): void {
    for (const callback of this.statusChangeCallbacks) {
      try {
        callback(dependencyId, status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    }
  }
}