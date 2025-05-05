import { v4 as uuidv4 } from 'uuid';
import { dependencyRegistry } from './DependencyRegistry';
import {
  DependencyDataType,
  DependencyStatus,
  DependencySyncStrategy,
  DataRequestResponse,
  DependencyState,
  DependencyInstance,
  DependencyOptions,
  ProviderInfo
} from './DependencyInterfaces';

/**
 * Manages runtime dependencies between component instances
 * Provides a high-level API for components to register as providers or consumers
 */
export class DependencyManager {
  // Track registered providers
  private providers: Map<string, Set<string>> = new Map(); // dataType -> instanceIds
  
  // Track registered consumers
  private consumers: Map<string, Set<string>> = new Map(); // dataType -> instanceIds
  
  // Store provider data
  private providerData: Map<string, any> = new Map(); // providerId:dataType -> data
  
  // Store data subscribers
  private dataSubscribers: Map<string, Set<(data: any, source: string, timestamp: number) => void>> = new Map(); // consumerId:dataType -> callbacks
  
  // Store provider change subscribers
  private providerChangeSubscribers: Map<string, Set<(providers: string[]) => void>> = new Map(); // dataType -> callbacks
  
  // Store consumer change subscribers
  private consumerChangeSubscribers: Map<string, Set<(consumers: string[]) => void>> = new Map(); // dataType -> callbacks
  
  constructor() {
    console.log('DependencyManager initialized');
  }
  
  /**
   * Register a component instance as a provider for a data type
   */
  registerProvider(instanceId: string, dataType: DependencyDataType): void {
    // Get or create the set of providers for this data type
    const providers = this.providers.get(dataType) || new Set<string>();
    
    // Add this instance to the providers
    providers.add(instanceId);
    this.providers.set(dataType, providers);
    
    // Notify subscribers of provider changes
    this.notifyProviderChangeSubscribers(dataType);
  }
  
  /**
   * Register a component instance as a consumer for a data type
   */
  registerConsumer(instanceId: string, dataType: DependencyDataType): void {
    // Get or create the set of consumers for this data type
    const consumers = this.consumers.get(dataType) || new Set<string>();
    
    // Add this instance to the consumers
    consumers.add(instanceId);
    this.consumers.set(dataType, consumers);
    
    // Notify subscribers of consumer changes
    this.notifyConsumerChangeSubscribers(dataType);
  }
  
  /**
   * Unregister a component instance as a provider for a data type
   */
  unregisterProvider(instanceId: string, dataType: DependencyDataType): void {
    // Get the set of providers for this data type
    const providers = this.providers.get(dataType);
    
    if (providers) {
      // Remove this instance from the providers
      providers.delete(instanceId);
      
      // If there are no more providers, remove the data type
      if (providers.size === 0) {
        this.providers.delete(dataType);
      } else {
        this.providers.set(dataType, providers);
      }
      
      // Remove provider data
      const key = `${instanceId}:${dataType}`;
      this.providerData.delete(key);
      
      // Notify subscribers of provider changes
      this.notifyProviderChangeSubscribers(dataType);
    }
  }
  
  /**
   * Unregister a component instance as a consumer for a data type
   */
  unregisterConsumer(instanceId: string, dataType: DependencyDataType): void {
    // Get the set of consumers for this data type
    const consumers = this.consumers.get(dataType);
    
    if (consumers) {
      // Remove this instance from the consumers
      consumers.delete(instanceId);
      
      // If there are no more consumers, remove the data type
      if (consumers.size === 0) {
        this.consumers.delete(dataType);
      } else {
        this.consumers.set(dataType, consumers);
      }
      
      // Remove data subscribers
      const subscriberKey = `${instanceId}:${dataType}`;
      this.dataSubscribers.delete(subscriberKey);
      
      // Notify subscribers of consumer changes
      this.notifyConsumerChangeSubscribers(dataType);
    }
  }
  
  /**
   * Update the data provided by a provider
   */
  updateProviderData<T>(providerId: string, dataType: DependencyDataType, data: T): void {
    // Update the provider data
    const key = `${providerId}:${dataType}`;
    this.providerData.set(key, data);
    
    // Update dependency registry data
    dependencyRegistry.updateDependencyData(providerId, dataType, data);
    
    // Notify all consumers that depend on this provider
    const timestamp = Date.now();
    const consumers = dependencyRegistry.getConsumersForProvider(providerId);
    
    consumers.forEach(consumerId => {
      const subscriberKey = `${consumerId}:${dataType}`;
      const subscribers = this.dataSubscribers.get(subscriberKey);
      
      if (subscribers) {
        subscribers.forEach(callback => {
          try {
            callback(data, providerId, timestamp);
          } catch (error) {
            console.error('Error in data subscriber callback:', error);
          }
        });
      }
    });
  }
  
  /**
   * Request data from a provider (pull model)
   */
  async requestDataFromProvider<T>(
    consumerId: string,
    dataType: DependencyDataType
  ): Promise<DataRequestResponse<T>> {
    // Find providers for this consumer
    const providers = dependencyRegistry.getProvidersForConsumer(consumerId);
    
    if (providers.length === 0) {
      return {
        success: false,
        providerId: null,
        data: null,
        timestamp: Date.now(),
        errorMessage: 'No provider found for this consumer'
      };
    }
    
    // Find a provider that provides this data type
    // (In a more sophisticated implementation, we might have preferences
    // or priority for selecting a provider)
    let providerId = null;
    
    for (const p of providers) {
      const providerDataTypes = this.getProviderDataTypes(p);
      if (providerDataTypes.includes(dataType as string)) {
        providerId = p;
        break;
      }
    }
    
    if (!providerId) {
      return {
        success: false,
        providerId: null,
        data: null,
        timestamp: Date.now(),
        errorMessage: 'No provider found for the requested data type'
      };
    }
    
    // Get the data from the provider
    const key = `${providerId}:${dataType}`;
    const data = this.providerData.get(key) || null;
    const timestamp = Date.now();
    
    // If no data is available, return an error
    if (data === null) {
      return {
        success: false,
        providerId,
        data: null,
        timestamp,
        errorMessage: 'Provider has no data available'
      };
    }
    
    // Return the data
    return {
      success: true,
      providerId,
      data: data as T,
      timestamp
    };
  }
  
  /**
   * Subscribe to data updates for a consumer
   */
  subscribeToData<T>(
    consumerId: string,
    dataType: DependencyDataType,
    callback: (data: T, source: string, timestamp: number) => void
  ): () => void {
    const key = `${consumerId}:${dataType}`;
    
    // Get or create the set of subscribers for this consumer and data type
    const subscribers = this.dataSubscribers.get(key) || new Set();
    
    // Add the callback to the subscribers
    subscribers.add(callback as any);
    this.dataSubscribers.set(key, subscribers);
    
    // Return an unsubscribe function
    return () => {
      const subscribers = this.dataSubscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback as any);
        if (subscribers.size === 0) {
          this.dataSubscribers.delete(key);
        } else {
          this.dataSubscribers.set(key, subscribers);
        }
      }
    };
  }
  
  /**
   * Subscribe to provider changes for a data type
   */
  subscribeToProviderChanges(
    dataType: DependencyDataType,
    callback: (providers: string[]) => void
  ): () => void {
    // Get or create the set of subscribers for this data type
    const subscribers = this.providerChangeSubscribers.get(dataType as string) || new Set();
    
    // Add the callback to the subscribers
    subscribers.add(callback);
    this.providerChangeSubscribers.set(dataType as string, subscribers);
    
    // Call the callback with the current providers
    callback(this.getProvidersForDataType(dataType));
    
    // Return an unsubscribe function
    return () => {
      const subscribers = this.providerChangeSubscribers.get(dataType as string);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.providerChangeSubscribers.delete(dataType as string);
        } else {
          this.providerChangeSubscribers.set(dataType as string, subscribers);
        }
      }
    };
  }
  
  /**
   * Subscribe to consumer changes for a data type
   */
  subscribeToConsumerChanges(
    dataType: DependencyDataType,
    callback: (consumers: string[]) => void
  ): () => void {
    // Get or create the set of subscribers for this data type
    const subscribers = this.consumerChangeSubscribers.get(dataType as string) || new Set();
    
    // Add the callback to the subscribers
    subscribers.add(callback);
    this.consumerChangeSubscribers.set(dataType as string, subscribers);
    
    // Call the callback with the current consumers
    callback(this.getConsumersForDataType(dataType));
    
    // Return an unsubscribe function
    return () => {
      const subscribers = this.consumerChangeSubscribers.get(dataType as string);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.consumerChangeSubscribers.delete(dataType as string);
        } else {
          this.consumerChangeSubscribers.set(dataType as string, subscribers);
        }
      }
    };
  }
  
  /**
   * Notify subscribers of provider changes
   */
  private notifyProviderChangeSubscribers(dataType: DependencyDataType): void {
    const subscribers = this.providerChangeSubscribers.get(dataType as string);
    
    if (subscribers) {
      const providers = this.getProvidersForDataType(dataType);
      
      subscribers.forEach(callback => {
        try {
          callback(providers);
        } catch (error) {
          console.error('Error in provider change subscriber callback:', error);
        }
      });
    }
  }
  
  /**
   * Notify subscribers of consumer changes
   */
  private notifyConsumerChangeSubscribers(dataType: DependencyDataType): void {
    const subscribers = this.consumerChangeSubscribers.get(dataType as string);
    
    if (subscribers) {
      const consumers = this.getConsumersForDataType(dataType);
      
      subscribers.forEach(callback => {
        try {
          callback(consumers);
        } catch (error) {
          console.error('Error in consumer change subscriber callback:', error);
        }
      });
    }
  }
  
  /**
   * Get all providers for a data type
   */
  getProvidersForDataType(dataType: DependencyDataType): string[] {
    const providers = this.providers.get(dataType as string);
    return providers ? Array.from(providers) : [];
  }
  
  /**
   * Get all consumers for a data type
   */
  getConsumersForDataType(dataType: DependencyDataType): string[] {
    const consumers = this.consumers.get(dataType as string);
    return consumers ? Array.from(consumers) : [];
  }
  
  /**
   * Get all data types provided by a provider
   */
  getProviderDataTypes(providerId: string): string[] {
    const dataTypes: string[] = [];
    
    this.providers.forEach((providers, dataType) => {
      if (providers.has(providerId)) {
        dataTypes.push(dataType);
      }
    });
    
    return dataTypes;
  }
  
  /**
   * Get all data types consumed by a consumer
   */
  getConsumerDataTypes(consumerId: string): string[] {
    const dataTypes: string[] = [];
    
    this.consumers.forEach((consumers, dataType) => {
      if (consumers.has(consumerId)) {
        dataTypes.push(dataType);
      }
    });
    
    return dataTypes;
  }
  
  /**
   * Get all consumers for a provider
   */
  getConsumersForProvider(providerId: string, dataType?: DependencyDataType): string[] {
    const dependencies = dependencyRegistry.getDependenciesByProvider(providerId);
    
    if (dataType) {
      return dependencies
        .filter(dep => dep.dataType === dataType)
        .map(dep => dep.consumerId);
    }
    
    return dependencies.map(dep => dep.consumerId);
  }
  
  /**
   * Get all providers for a consumer
   */
  getProvidersForConsumer(consumerId: string, dataType?: DependencyDataType): string[] {
    const dependencies = dependencyRegistry.getDependenciesByConsumer(consumerId);
    
    if (dataType) {
      return dependencies
        .filter(dep => dep.dataType === dataType)
        .map(dep => dep.providerId);
    }
    
    return dependencies.map(dep => dep.providerId);
  }
  
  /**
   * Get the state of a dependency relationship
   */
  getDependencyState(consumerId: string, dataType: DependencyDataType): DependencyState | null {
    // Find providers for this consumer
    const providers = this.getProvidersForConsumer(consumerId, dataType);
    
    if (providers.length === 0) {
      return {
        isReady: false,
        providerId: null,
        currentData: null,
        lastUpdated: null,
        status: DependencyStatus.INACTIVE
      };
    }
    
    // Get the provider with the most recent data
    // (In a more sophisticated implementation, we might have priorities or preferences)
    const providerId = providers[0];
    
    // Get the dependency
    const dependency = dependencyRegistry.findDependency(providerId, consumerId, dataType);
    
    if (!dependency) {
      return {
        isReady: false,
        providerId,
        currentData: null,
        lastUpdated: null,
        status: DependencyStatus.INACTIVE
      };
    }
    
    // Return the dependency state
    return {
      isReady: dependency.status === DependencyStatus.ACTIVE,
      providerId,
      currentData: dependency.currentData,
      lastUpdated: dependency.lastUpdated || null,
      status: dependency.status
    };
  }
  
  /**
   * Find a provider for a consumer and establish a dependency
   */
  findAndConnectProvider(
    consumerId: string,
    dataType: DependencyDataType,
    syncStrategy?: DependencySyncStrategy
  ): { success: boolean; providerId: string | null } {
    // Get all providers for this data type
    const providers = this.getProvidersForDataType(dataType);
    
    if (providers.length === 0) {
      return { success: false, providerId: null };
    }
    
    // For now, just use the first provider
    // (In a more sophisticated implementation, we might use priorities or preferences)
    const providerId = providers[0];
    
    // Create a dependency between the provider and consumer
    const options: Partial<DependencyOptions> = {
      isActive: true,
      autoUpdate: true,
      notifyOnChange: true
    };
    
    if (syncStrategy) {
      options.options = { syncStrategy };
    }
    
    const dependency = dependencyRegistry.createDependency(
      providerId,
      consumerId,
      dataType,
      options
    );
    
    return {
      success: !!dependency,
      providerId: dependency ? providerId : null
    };
  }
  
  /**
   * Get information about available providers
   */
  getAvailableProviders(dataType: DependencyDataType): ProviderInfo[] {
    const providers = this.getProvidersForDataType(dataType);
    
    return providers.map(providerId => {
      const key = `${providerId}:${dataType}`;
      const hasData = this.providerData.has(key);
      
      return {
        instanceId: providerId,
        componentId: providerId.split('-')[0], // Extract component ID from instance ID
        dataType,
        hasData,
        lastUpdated: hasData ? Date.now() : undefined // For now, we don't track last updated time
      };
    });
  }
}