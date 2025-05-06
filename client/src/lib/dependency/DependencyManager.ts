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
    console.log(`[DependencyManager] Updating data from provider ${providerId} for data type ${dataType}`, data);
    
    // Get all dependencies where this component is the provider
    const dependencies = this.registry.getDependenciesByProvider(providerId)
      .filter(dep => dep.dataType === dataType);
    
    console.log(`[DependencyManager] Found ${dependencies.length} dependencies for provider ${providerId}`);
    
    // If no dependencies, just store the data in the provider's storage
    if (dependencies.length === 0) {
      const key = `${providerId}:${dataType}`;
      this.dataStore.set(key, data);
      console.log(`[DependencyManager] No dependencies found, storing data with key ${key}`);
      return;
    }
    
    // Update each dependency
    for (const dependency of dependencies) {
      console.log(`[DependencyManager] Processing dependency ${dependency.id}, status: ${dependency.status}`);
      
      // Skip suspended dependencies
      if (dependency.status === DependencyStatus.SUSPENDED) {
        console.log(`[DependencyManager] Skipping update for suspended dependency: ${dependency.id}`);
        continue;
      }
      
      // Store the data
      this.dataStore.set(dependency.id, data);
      
      // Always update to READY status when data is provided
      this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
      this.notifyStatusChanged(dependency.id, DependencyStatus.READY);
      console.log(`[DependencyManager] Updated dependency ${dependency.id} status to READY`);
      
      // Notify listeners
      console.log(`[DependencyManager] Notifying listeners for dependency ${dependency.id}`);
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
    console.log(`[DependencyManager] Consumer ${consumerId} requesting data from provider ${providerId} for type ${dataType}`);
    
    // Find the dependency
    const dependency = this.findDependency(providerId, consumerId, dataType);
    
    if (!dependency) {
      console.log(`[DependencyManager] No existing dependency found, attempting to create one`);
      
      // Try to create the dependency if it doesn't exist
      const newDependency = this.registry.createDependency(providerId, consumerId, dataType);
      
      if (!newDependency) {
        console.warn(`[DependencyManager] Cannot request data: no dependency exists between ${providerId} and ${consumerId} for ${dataType}`);
        return;
      }
      
      console.log(`[DependencyManager] Created new dependency: ${newDependency.id}`);
      
      // Update status to CONNECTING
      this.registry.updateDependencyStatus(newDependency.id, DependencyStatus.CONNECTING);
      this.notifyStatusChanged(newDependency.id, DependencyStatus.CONNECTING);
      
      // Check if the provider already has data we can use immediately
      const providerDataKey = `${providerId}:${dataType}`;
      const providerData = this.dataStore.get(providerDataKey);
      
      if (providerData !== undefined) {
        console.log(`[DependencyManager] Provider already has data, making it immediately available`);
        
        // Store the data with the dependency ID
        this.dataStore.set(newDependency.id, providerData);
        
        // Update to READY status
        this.registry.updateDependencyStatus(newDependency.id, DependencyStatus.READY);
        this.notifyStatusChanged(newDependency.id, DependencyStatus.READY);
        
        // Notify about the data
        this.notifyDataUpdated(newDependency.id, providerData);
      }
      
      return;
    }
    
    console.log(`[DependencyManager] Found existing dependency: ${dependency.id}, status: ${dependency.status}`);
    
    // If dependency is suspended, activate it
    if (dependency.status === DependencyStatus.SUSPENDED) {
      console.log(`[DependencyManager] Reactivating suspended dependency: ${dependency.id}`);
      this.registry.updateDependencyStatus(dependency.id, DependencyStatus.CONNECTING);
      this.notifyStatusChanged(dependency.id, DependencyStatus.CONNECTING);
    }
    
    // If data exists, update the status to READY and notify
    const data = this.dataStore.get(dependency.id);
    
    if (data !== undefined) {
      console.log(`[DependencyManager] Dependency has existing data, setting to READY`);
      this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
      this.notifyStatusChanged(dependency.id, DependencyStatus.READY);
      
      // Notify data again to ensure consumer receives it
      this.notifyDataUpdated(dependency.id, data);
    } else {
      console.log(`[DependencyManager] No data for dependency, setting to CONNECTING`);
      
      // Otherwise, update to CONNECTING
      this.registry.updateDependencyStatus(dependency.id, DependencyStatus.CONNECTING);
      this.notifyStatusChanged(dependency.id, DependencyStatus.CONNECTING);
      
      // Check if provider has data
      const providerDataKey = `${providerId}:${dataType}`;
      const providerData = this.dataStore.get(providerDataKey);
      
      if (providerData !== undefined) {
        console.log(`[DependencyManager] Found provider data for key ${providerDataKey}, making it available`);
        
        // Provider already has data, but no dependency data exists yet
        this.dataStore.set(dependency.id, providerData);
        this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
        this.notifyStatusChanged(dependency.id, DependencyStatus.READY);
        this.notifyDataUpdated(dependency.id, providerData);
      } else {
        console.log(`[DependencyManager] No provider data found for key ${providerDataKey}`);
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
    // Convert Set to Array before iterating to avoid TypeScript errors
    const callbacks = [...this.dataUpdateCallbacks];
    callbacks.forEach(callback => {
      try {
        callback(dependencyId, data);
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }
  
  /**
   * Notify all listeners of a status change.
   */
  private notifyStatusChanged(dependencyId: string, status: DependencyStatus): void {
    // Convert Set to Array before iterating to avoid TypeScript errors
    const callbacks = [...this.statusChangeCallbacks];
    callbacks.forEach(callback => {
      try {
        callback(dependencyId, status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }
}