/**
 * Enhanced hooks for the Component Dependency System
 * 
 * These hooks provide a simplified API for React components to interact with
 * the dependency system, making it easy to create components that can
 * provide data to or consume data from other components.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDependencyContext } from '../context/DependencyContext';
import { 
  DependencyDataType, 
  DependencyStatus, 
  DependencyInstance 
} from '../lib/dependency/DependencyInterfaces';
import { ComponentType } from '../lib/communication/ComponentCommunication';
import { eventBus } from '../lib/communication/EventBus';
import { DependencyManagerEvent } from '../lib/dependency/DependencyManager';

/**
 * Basic hook for accessing the dependency system
 * @returns The dependency context
 */
export function useDependency() {
  const context = useDependencyContext();
  
  if (!context.isInitialized) {
    console.warn('Dependency system is not initialized yet');
  }
  
  return context;
}

/**
 * Options for the useDependentComponent hook
 */
export interface DependentComponentOptions<T = any> {
  /**
   * Whether to automatically connect to available providers
   */
  autoConnect?: boolean;
  
  /**
   * Preferred provider IDs in order of preference
   */
  preferredProviders?: string[];
  
  /**
   * Whether to automatically update when data changes
   */
  autoUpdate?: boolean;
  
  /**
   * Filter function to determine if data should be processed
   */
  filter?: (data: T) => boolean;
  
  /**
   * Transform function to convert data before use
   */
  transform?: (data: T) => any;
  
  /**
   * Callback when a provider connects
   */
  onProviderConnected?: (providerId: string) => void;
  
  /**
   * Callback when a provider disconnects
   */
  onProviderDisconnected?: (providerId: string) => void;
  
  /**
   * Callback when data is updated
   */
  onDataUpdated?: (data: T) => void;
  
  /**
   * Whether to log debug information
   */
  debug?: boolean;
}

/**
 * Hook for components that depend on data from other components
 * 
 * @param componentId The ID of the component
 * @param componentType The type of the component
 * @param dataType The type of data needed
 * @param options Configuration options
 * @returns Hook state and methods
 */
export function useDependentComponent<T = any>(
  componentId: string,
  componentType: ComponentType,
  dataType: DependencyDataType,
  options: DependentComponentOptions<T> = {}
) {
  const {
    autoConnect = true,
    preferredProviders = [],
    autoUpdate = true,
    filter,
    transform,
    onProviderConnected,
    onProviderDisconnected,
    onDataUpdated,
    debug = false
  } = options;
  
  const dependency = useDependency();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [dependencyId, setDependencyId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Track if the component is mounted
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Log debug information
  const logDebug = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[Dependency Debug - ${componentId}] ${message}`, ...args);
    }
  }, [debug, componentId]);
  
  // Get potential dependency definitions
  const dependencyDefinitions = useMemo(() => {
    return dependency.getDependencyDefinitionsByConsumer(componentType)
      .filter(def => def.dataType === dataType);
  }, [dependency, componentType, dataType]);
  
  // Auto-connect to providers if enabled
  useEffect(() => {
    if (!dependency.isInitialized || !autoConnect || dependencyDefinitions.length === 0) {
      return;
    }
    
    // Don't try to connect if already connected
    if (isConnected || dependencyId) {
      return;
    }
    
    const connectToProvider = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the first dependency definition
        const definition = dependencyDefinitions[0];
        logDebug(`Trying to auto-connect using definition: ${definition.name}`);
        
        // Find potential providers
        const potentialProviders: string[] = [];
        
        // First check preferred providers
        for (const preferred of preferredProviders) {
          const component = await getComponentInfo(preferred);
          
          if (component && component.componentType === definition.providerType) {
            potentialProviders.push(preferred);
          }
        }
        
        // If no preferred providers are available, find any matching providers
        if (potentialProviders.length === 0) {
          // This would need integration with the component registry
          // For now, just log that we couldn't find any providers
          logDebug('No matching providers found for auto-connect');
          return;
        }
        
        // Connect to the first available provider
        if (potentialProviders.length > 0) {
          const provider = potentialProviders[0];
          logDebug(`Auto-connecting to provider: ${provider}`);
          
          // Create the dependency
          const id = dependency.createDependency(definition.id, provider, componentId, {
            autoUpdate
          });
          
          if (id) {
            setDependencyId(id);
            setProviderId(provider);
            setIsConnected(true);
            
            // Call the callback
            if (onProviderConnected) {
              onProviderConnected(provider);
            }
            
            // Request initial data
            requestData(id);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
          logDebug('Error during auto-connect:', err);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    connectToProvider();
  }, [
    dependency, 
    autoConnect, 
    componentId, 
    componentType, 
    dataType, 
    dependencyDefinitions, 
    isConnected, 
    dependencyId,
    preferredProviders,
    autoUpdate,
    onProviderConnected,
    logDebug
  ]);
  
  // Subscribe to dependency events
  useEffect(() => {
    if (!dependencyId) return;
    
    // Function to handle data updates
    const handleDataUpdate = (event: any) => {
      if (event.dependencyId === dependencyId) {
        logDebug('Received data update event', event);
        
        let newData = event.data;
        
        // Apply filter if provided
        if (filter && !filter(newData)) {
          logDebug('Data filtered out', newData);
          return;
        }
        
        // Apply transformation if provided
        if (transform) {
          newData = transform(newData);
          logDebug('Data transformed', newData);
        }
        
        if (isMounted.current) {
          setData(newData);
          setError(null);
          
          // Call the callback
          if (onDataUpdated) {
            onDataUpdated(newData);
          }
        }
      }
    };
    
    // Subscribe to data update events
    const dataUpdateSubscriptionId = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_DATA_UPDATED,
      handleDataUpdate
    );
    
    // Subscribe to dependency removal events
    const removalSubscriptionId = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      (event) => {
        if (event.instance.id === dependencyId) {
          logDebug('Dependency removed', event);
          
          if (isMounted.current) {
            setDependencyId(null);
            setProviderId(null);
            setIsConnected(false);
            
            // Call the callback
            if (onProviderDisconnected && event.instance.providerId) {
              onProviderDisconnected(event.instance.providerId);
            }
          }
        }
      }
    );
    
    // Clean up subscriptions
    return () => {
      eventBus.unsubscribe(dataUpdateSubscriptionId);
      eventBus.unsubscribe(removalSubscriptionId);
    };
  }, [dependencyId, filter, transform, onProviderDisconnected, onDataUpdated, logDebug]);
  
  // Fetch component information from the component registry
  // Note: In a real implementation, this would integrate with the component registry
  const getComponentInfo = async (id: string) => {
    // Placeholder for component registry integration
    return { componentId: id, componentType: '' };
  };
  
  /**
   * Request data from the provider
   */
  const requestData = useCallback(async (depId: string = dependencyId!, params?: any) => {
    if (!depId) {
      setError('No active dependency');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      logDebug(`Requesting data from dependency ${depId}`, params);
      const result = await dependency.requestDependencyData<T>(depId, params);
      
      // Apply filter if provided
      if (filter && !filter(result)) {
        logDebug('Data filtered out', result);
        return null;
      }
      
      // Apply transformation if provided
      let transformedResult = result;
      if (transform) {
        transformedResult = transform(result);
        logDebug('Data transformed', transformedResult);
      }
      
      if (isMounted.current) {
        setData(transformedResult);
        
        // Call the callback
        if (onDataUpdated) {
          onDataUpdated(transformedResult);
        }
      }
      
      return transformedResult;
    } catch (err) {
      logDebug('Error requesting data:', err);
      
      if (isMounted.current) {
        setError(err.message);
      }
      
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [dependency, dependencyId, filter, transform, onDataUpdated, logDebug]);
  
  /**
   * Connect to a specific provider
   */
  const connectToProvider = useCallback(async (newProviderId: string) => {
    if (!dependency.isInitialized || dependencyDefinitions.length === 0) {
      setError('Dependency system not initialized or no compatible definitions found');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      logDebug(`Connecting to provider: ${newProviderId}`);
      
      // Check if already connected to this provider
      if (providerId === newProviderId && dependencyId) {
        logDebug(`Already connected to provider ${newProviderId}`);
        return true;
      }
      
      // Use the first dependency definition
      const definition = dependencyDefinitions[0];
      
      // Create the dependency
      const id = dependency.createDependency(definition.id, newProviderId, componentId, {
        autoUpdate
      });
      
      if (id) {
        setDependencyId(id);
        setProviderId(newProviderId);
        setIsConnected(true);
        
        // Call the callback
        if (onProviderConnected) {
          onProviderConnected(newProviderId);
        }
        
        // Request initial data
        await requestData(id);
        
        return true;
      }
      
      return false;
    } catch (err) {
      logDebug('Error connecting to provider:', err);
      
      if (isMounted.current) {
        setError(err.message);
      }
      
      return false;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [
    dependency, 
    dependencyDefinitions, 
    providerId, 
    dependencyId, 
    componentId, 
    autoUpdate, 
    onProviderConnected, 
    requestData,
    logDebug
  ]);
  
  /**
   * Disconnect from the current provider
   */
  const disconnect = useCallback(() => {
    if (dependencyId) {
      logDebug(`Disconnecting from provider: ${providerId}`);
      
      try {
        const result = dependency.removeDependency(dependencyId);
        
        if (result) {
          // Call the callback before resetting state
          if (onProviderDisconnected && providerId) {
            onProviderDisconnected(providerId);
          }
          
          setDependencyId(null);
          setProviderId(null);
          setData(null);
          setIsConnected(false);
          setError(null);
        }
        
        return result;
      } catch (err) {
        logDebug('Error disconnecting:', err);
        
        if (isMounted.current) {
          setError(err.message);
        }
        
        return false;
      }
    }
    
    return true;
  }, [dependency, dependencyId, providerId, onProviderDisconnected, logDebug]);
  
  /**
   * Refresh data from the provider
   */
  const refreshData = useCallback(async (params?: any) => {
    if (!dependencyId) {
      setError('No active dependency');
      return null;
    }
    
    return requestData(dependencyId, params);
  }, [dependencyId, requestData]);
  
  return {
    // State
    data,
    isLoading,
    error,
    providerId,
    dependencyId,
    isConnected,
    
    // Methods
    connectToProvider,
    disconnect,
    refreshData,
    
    // Debug
    logDebug
  };
}

/**
 * Options for the useSourceComponent hook
 */
export interface SourceComponentOptions<T = any> {
  /**
   * Initial data to provide to consumers
   */
  initialData?: T;
  
  /**
   * Transform function to convert data before sending
   */
  transform?: (data: T) => any;
  
  /**
   * Callback when a consumer connects
   */
  onConsumerConnected?: (consumerId: string) => void;
  
  /**
   * Callback when a consumer disconnects
   */
  onConsumerDisconnected?: (consumerId: string) => void;
  
  /**
   * Whether to log debug information
   */
  debug?: boolean;
}

/**
 * Hook for components that provide data to other components
 * 
 * @param componentId The ID of the component
 * @param componentType The type of the component
 * @param dataType The type of data provided
 * @param options Configuration options
 * @returns Hook state and methods
 */
export function useSourceComponent<T = any>(
  componentId: string,
  componentType: ComponentType,
  dataType: DependencyDataType,
  options: SourceComponentOptions<T> = {}
) {
  const {
    initialData,
    transform,
    onConsumerConnected,
    onConsumerDisconnected,
    debug = false
  } = options;
  
  const dependency = useDependency();
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [consumerIds, setConsumerIds] = useState<string[]>([]);
  const [currentData, setCurrentData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<string | null>(null);
  
  // Track if the component is mounted
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Log debug information
  const logDebug = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[Source Debug - ${componentId}] ${message}`, ...args);
    }
  }, [debug, componentId]);
  
  // Get potential dependency definitions
  const dependencyDefinitions = useMemo(() => {
    return dependency.getDependencyDefinitionsByProvider(componentType)
      .filter(def => def.dataType === dataType);
  }, [dependency, componentType, dataType]);
  
  // Initialize - find existing dependencies for this provider
  useEffect(() => {
    if (!dependency.isInitialized || dependencyDefinitions.length === 0) {
      return;
    }
    
    // Get all existing dependencies for this provider
    const existingDependencies = dependency.getDependenciesForProvider(componentId);
    
    // Filter by data type
    const matchingDependencies = existingDependencies.filter(dep => {
      const definition = dependency.getDependencyDefinition(dep.definitionId);
      return definition && definition.dataType === dataType;
    });
    
    if (matchingDependencies.length > 0) {
      logDebug(`Found ${matchingDependencies.length} existing dependencies`, matchingDependencies);
      
      setDependencyIds(matchingDependencies.map(dep => dep.id));
      setConsumerIds(matchingDependencies.map(dep => dep.consumerId));
      
      // Set initial data if provided
      if (initialData !== undefined) {
        matchingDependencies.forEach(dep => {
          updateDependencyData(dep.id, initialData);
        });
      }
    }
  }, [dependency, dependencyDefinitions, componentId, dataType, initialData, logDebug]);
  
  // Subscribe to dependency creation and removal events
  useEffect(() => {
    // Handle dependency creation
    const creationSubscriptionId = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_CREATED,
      (event) => {
        const { instance } = event;
        
        if (instance.providerId === componentId) {
          const definition = dependency.getDependencyDefinition(instance.definitionId);
          
          if (definition && definition.dataType === dataType) {
            logDebug(`New dependency created: ${instance.id}`, instance);
            
            if (isMounted.current) {
              setDependencyIds(prev => [...prev, instance.id]);
              setConsumerIds(prev => [...prev, instance.consumerId]);
              
              // Call the callback
              if (onConsumerConnected) {
                onConsumerConnected(instance.consumerId);
              }
              
              // Set initial data if available
              if (currentData !== undefined) {
                updateDependencyData(instance.id, currentData);
              }
            }
          }
        }
      }
    );
    
    // Handle dependency removal
    const removalSubscriptionId = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      (event) => {
        const { instance } = event;
        
        if (instance.providerId === componentId) {
          const definition = dependency.getDependencyDefinition(instance.definitionId);
          
          if (definition && definition.dataType === dataType) {
            logDebug(`Dependency removed: ${instance.id}`, instance);
            
            if (isMounted.current) {
              setDependencyIds(prev => prev.filter(id => id !== instance.id));
              setConsumerIds(prev => prev.filter(id => id !== instance.consumerId));
              
              // Call the callback
              if (onConsumerDisconnected) {
                onConsumerDisconnected(instance.consumerId);
              }
            }
          }
        }
      }
    );
    
    // Clean up subscriptions
    return () => {
      eventBus.unsubscribe(creationSubscriptionId);
      eventBus.unsubscribe(removalSubscriptionId);
    };
  }, [dependency, componentId, dataType, currentData, onConsumerConnected, onConsumerDisconnected, logDebug]);
  
  /**
   * Update data for all dependencies
   */
  const updateData = useCallback((data: T) => {
    setCurrentData(data);
    setError(null);
    
    const results = dependencyIds.map(id => {
      try {
        // Apply transformation if provided
        let transformedData = data;
        if (transform) {
          transformedData = transform(data);
          logDebug('Data transformed', { original: data, transformed: transformedData });
        }
        
        return updateDependencyData(id, transformedData);
      } catch (err) {
        logDebug(`Failed to update data for dependency ${id}:`, err);
        
        if (isMounted.current) {
          setError(err.message);
        }
        
        return false;
      }
    });
    
    return !results.includes(false);
  }, [dependencyIds, transform, logDebug]);
  
  /**
   * Update data for a specific dependency
   */
  const updateDependencyData = useCallback((id: string, data: any) => {
    try {
      logDebug(`Updating data for dependency ${id}`, data);
      return dependency.updateDependencyData(id, data);
    } catch (err) {
      logDebug(`Error updating dependency data for ${id}:`, err);
      
      if (isMounted.current) {
        setError(err.message);
      }
      
      return false;
    }
  }, [dependency, logDebug]);
  
  /**
   * Check if a specific component is a consumer
   */
  const hasConsumer = useCallback((consumerId: string) => {
    return consumerIds.includes(consumerId);
  }, [consumerIds]);
  
  /**
   * Get a specific dependency by consumer ID
   */
  const getDependencyForConsumer = useCallback((consumerId: string): DependencyInstance | undefined => {
    const dep = dependencyIds
      .map(id => dependency.getDependency(id))
      .find(dep => dep?.consumerId === consumerId);
    
    return dep;
  }, [dependency, dependencyIds]);
  
  /**
   * Get all dependencies
   */
  const getAllDependencies = useCallback((): DependencyInstance[] => {
    return dependencyIds
      .map(id => dependency.getDependency(id))
      .filter(Boolean) as DependencyInstance[];
  }, [dependency, dependencyIds]);
  
  return {
    // State
    dependencyIds,
    consumerIds,
    currentData,
    error,
    
    // Methods
    updateData,
    updateDependencyData,
    hasConsumer,
    getDependencyForConsumer,
    getAllDependencies,
    
    // Debug
    logDebug
  };
}