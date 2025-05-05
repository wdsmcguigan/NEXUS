/**
 * React hooks for the Component Dependency System
 * 
 * These hooks enable React components to easily use the dependency system.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { dependencyRegistry } from '../lib/dependency/DependencyRegistry';
import { dependencyManager, DependencyManagerEvent } from '../lib/dependency/DependencyManager';
import { 
  DependencyConfig, 
  DependencyStatus,
  DependencyInstance,
  DependencyDataUpdateEvent
} from '../lib/dependency/DependencyInterfaces';
import { eventBus } from '../lib/communication/EventBus';
import { ComponentType } from '../lib/communication/ComponentCommunication';

/**
 * Hook to use a dependency as a provider
 * 
 * @param providerId ID of the provider component
 * @param definitionId ID of the dependency definition
 * @param initialData Optional initial data
 * @returns Functions to manage the dependency
 */
export function useDependencyProvider<T = any>(
  providerId: string,
  definitionId: string,
  initialData?: T
) {
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    // Get all existing dependencies for this provider
    const existingDependencies = dependencyManager
      .getDependenciesForProvider(providerId)
      .filter(dep => dep.definitionId === definitionId);
    
    setDependencyIds(existingDependencies.map(dep => dep.id));
    
    // Set initial data if provided
    if (initialData !== undefined) {
      existingDependencies.forEach(dep => {
        try {
          dependencyManager.updateDependencyData(dep.id, initialData);
        } catch (err) {
          console.error(`Failed to set initial data for dependency ${dep.id}:`, err);
          setError(err.message);
        }
      });
    }
    
    // Subscribe to dependency creation events
    const subscription = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_CREATED,
      (event) => {
        const { instance } = event;
        
        if (instance.providerId === providerId && instance.definitionId === definitionId) {
          setDependencyIds(prev => [...prev, instance.id]);
          
          // Set initial data for the new dependency if provided
          if (initialData !== undefined) {
            try {
              dependencyManager.updateDependencyData(instance.id, initialData);
            } catch (err) {
              console.error(`Failed to set initial data for new dependency ${instance.id}:`, err);
              setError(err.message);
            }
          }
        }
      }
    );
    
    // Subscribe to dependency removal events
    const removalSubscription = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      (event) => {
        const { instance } = event;
        
        if (instance.providerId === providerId && instance.definitionId === definitionId) {
          setDependencyIds(prev => prev.filter(id => id !== instance.id));
        }
      }
    );
    
    // Clean up subscriptions
    return () => {
      eventBus.unsubscribe(subscription);
      eventBus.unsubscribe(removalSubscription);
    };
  }, [providerId, definitionId, initialData]);
  
  /**
   * Get all dependencies for this provider
   */
  const dependencies = useMemo(() => {
    return dependencyIds.map(id => dependencyManager.getDependency(id)).filter(Boolean) as DependencyInstance[];
  }, [dependencyIds]);
  
  /**
   * Get all consumer IDs for this provider
   */
  const consumerIds = useMemo(() => {
    return dependencies.map(dep => dep.consumerId);
  }, [dependencies]);
  
  /**
   * Update the data for all dependencies
   */
  const updateData = useCallback((data: T) => {
    setError(null);
    
    const results = dependencyIds.map(id => {
      try {
        return dependencyManager.updateDependencyData(id, data);
      } catch (err) {
        console.error(`Failed to update data for dependency ${id}:`, err);
        setError(err.message);
        return false;
      }
    });
    
    return !results.includes(false);
  }, [dependencyIds]);
  
  /**
   * Check if a specific component is a consumer
   */
  const hasConsumer = useCallback((consumerId: string) => {
    return consumerIds.includes(consumerId);
  }, [consumerIds]);
  
  /**
   * Get a specific dependency by consumer ID
   */
  const getDependencyByConsumer = useCallback((consumerId: string) => {
    return dependencies.find(dep => dep.consumerId === consumerId);
  }, [dependencies]);
  
  return {
    dependencies,
    consumerIds,
    updateData,
    hasConsumer,
    getDependencyByConsumer,
    error
  };
}

/**
 * Hook to use a dependency as a consumer
 * 
 * @param consumerId ID of the consumer component
 * @param definitionId ID of the dependency definition
 * @param config Optional dependency configuration
 * @returns The dependency data and functions to manage the dependency
 */
export function useDependencyConsumer<T = any>(
  consumerId: string,
  definitionId: string,
  config?: Partial<DependencyConfig>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [dependencyId, setDependencyId] = useState<string | null>(null);
  
  // Get dependency definition details
  const definition = useMemo(() => {
    return dependencyRegistry.getDependency(definitionId);
  }, [definitionId]);
  
  // Configure existing or create new dependency
  useEffect(() => {
    // Check if definition exists
    if (!definition) {
      setError(`Dependency definition not found: ${definitionId}`);
      return;
    }
    
    // Find existing dependency
    const existingDependencies = dependencyManager
      .getDependenciesForConsumer(consumerId)
      .filter(dep => dep.definitionId === definitionId);
    
    if (existingDependencies.length > 0) {
      // Use the first existing dependency
      const existingDep = existingDependencies[0];
      setDependencyId(existingDep.id);
      setProviderId(existingDep.providerId);
      
      // Update configuration if provided
      if (config) {
        try {
          dependencyManager.updateDependencyConfig(existingDep.id, config);
        } catch (err) {
          console.error(`Failed to update dependency configuration:`, err);
          setError(err.message);
        }
      }
      
      // Set initial data if available
      if (existingDep.currentData !== undefined) {
        setData(existingDep.currentData);
      } else {
        // Request data from provider
        requestData(existingDep.id);
      }
    } else {
      setDependencyId(null);
      setProviderId(null);
      setData(null);
    }
  }, [consumerId, definitionId, config]);
  
  // Subscribe to data updates
  useEffect(() => {
    if (!dependencyId) return;
    
    // Subscribe to data update events
    const subscription = eventBus.subscribe<DependencyDataUpdateEvent>(
      DependencyManagerEvent.DEPENDENCY_DATA_UPDATED,
      (event) => {
        if (event.dependencyId === dependencyId) {
          setData(event.data);
          setError(null);
        }
      }
    );
    
    // Subscribe to dependency removal events
    const removalSubscription = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      (event) => {
        if (event.instance.id === dependencyId) {
          setDependencyId(null);
          setProviderId(null);
          setData(null);
        }
      }
    );
    
    // Subscribe to dependency error events
    const errorSubscription = eventBus.subscribe(
      DependencyManagerEvent.DEPENDENCY_ERROR,
      (event) => {
        if (event.instance.id === dependencyId) {
          setError(event.error.message || 'Unknown error');
        }
      }
    );
    
    // Clean up subscriptions
    return () => {
      eventBus.unsubscribe(subscription);
      eventBus.unsubscribe(removalSubscription);
      eventBus.unsubscribe(errorSubscription);
    };
  }, [dependencyId]);
  
  /**
   * Connect to a specific provider
   */
  const connectToProvider = useCallback(async (newProviderId: string) => {
    if (!definition) {
      setError(`Dependency definition not found: ${definitionId}`);
      return false;
    }
    
    try {
      // Check if already connected to this provider
      if (providerId === newProviderId && dependencyId) {
        return true;
      }
      
      // Create a new dependency
      setIsLoading(true);
      const id = dependencyManager.createDependency(definitionId, newProviderId, consumerId, config);
      setDependencyId(id);
      setProviderId(newProviderId);
      
      // Request initial data
      await requestData(id);
      
      return true;
    } catch (err) {
      console.error('Failed to connect to provider:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [definition, definitionId, providerId, dependencyId, consumerId, config]);
  
  /**
   * Disconnect from the current provider
   */
  const disconnect = useCallback(() => {
    if (dependencyId) {
      try {
        dependencyManager.removeDependency(dependencyId);
        setDependencyId(null);
        setProviderId(null);
        setData(null);
        setError(null);
        return true;
      } catch (err) {
        console.error('Failed to disconnect:', err);
        setError(err.message);
        return false;
      }
    }
    return true;
  }, [dependencyId]);
  
  /**
   * Request data from the provider
   */
  const requestData = useCallback(async (depId: string, params?: any) => {
    if (!depId) {
      if (!dependencyId) {
        setError('No active dependency');
        return null;
      }
      depId = dependencyId;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dependencyManager.requestData(depId, params);
      setData(result);
      return result;
    } catch (err) {
      console.error('Failed to request data:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dependencyId]);
  
  /**
   * Refresh the data from the provider
   */
  const refresh = useCallback(async (params?: any) => {
    if (!dependencyId) {
      setError('No active dependency');
      return null;
    }
    
    return requestData(dependencyId, params);
  }, [dependencyId, requestData]);
  
  /**
   * Update dependency status
   */
  const setStatus = useCallback((status: DependencyStatus, errorMessage?: string) => {
    if (!dependencyId) {
      return false;
    }
    
    try {
      return dependencyManager.setDependencyStatus(dependencyId, status, errorMessage);
    } catch (err) {
      console.error('Failed to set dependency status:', err);
      setError(err.message);
      return false;
    }
  }, [dependencyId]);
  
  /**
   * Find available providers
   */
  const findAvailableProviders = useCallback(() => {
    if (!definition) return [];
    
    // TODO: Implement provider discovery based on component registry
    // For now, just return an empty array
    return [];
  }, [definition]);
  
  return {
    data,
    error,
    isLoading,
    providerId,
    dependencyId,
    definition,
    connectToProvider,
    disconnect,
    refresh,
    setStatus,
    findAvailableProviders
  };
}

/**
 * Hook to find available component dependencies
 * 
 * @param componentId ID of the component
 * @param componentType Type of the component
 * @returns Available dependencies
 */
export function useAvailableDependencies(
  componentId: string,
  componentType: ComponentType
) {
  /**
   * Get dependencies where this component can be a provider
   */
  const providerDependencies = useMemo(() => {
    return dependencyRegistry.getDependenciesForProvider(componentType);
  }, [componentType]);
  
  /**
   * Get dependencies where this component can be a consumer
   */
  const consumerDependencies = useMemo(() => {
    return dependencyRegistry.getDependenciesForConsumer(componentType);
  }, [componentType]);
  
  /**
   * Get active dependencies where this component is a provider
   */
  const activeProviderDependencies = useMemo(() => {
    return dependencyManager.getDependenciesForProvider(componentId);
  }, [componentId]);
  
  /**
   * Get active dependencies where this component is a consumer
   */
  const activeConsumerDependencies = useMemo(() => {
    return dependencyManager.getDependenciesForConsumer(componentId);
  }, [componentId]);
  
  return {
    providerDependencies,
    consumerDependencies,
    activeProviderDependencies,
    activeConsumerDependencies
  };
}

/**
 * Hook to manage automatic dependency creation
 * 
 * @param componentId ID of the component
 * @param componentType Type of the component
 * @param options Options for auto-dependency
 */
export function useAutoDependency(
  componentId: string,
  componentType: ComponentType,
  options: {
    autoConnect?: boolean;
    preferredProviders?: Record<string, string[]>;
  } = {}
) {
  const { autoConnect = true, preferredProviders = {} } = options;
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    consumerDependencies,
    activeConsumerDependencies
  } = useAvailableDependencies(componentId, componentType);
  
  // Auto-connect on mount if enabled
  useEffect(() => {
    if (!autoConnect || isInitialized) return;
    
    async function connectRequiredDependencies() {
      // Find required dependencies that are not already connected
      const requiredDependencies = consumerDependencies.filter(def => 
        def.isRequired && 
        !activeConsumerDependencies.some(active => active.definitionId === def.id)
      );
      
      if (requiredDependencies.length === 0) {
        setIsInitialized(true);
        return;
      }
      
      // TODO: Find available providers for each required dependency
      // For now, just mark as initialized
      
      setIsInitialized(true);
    }
    
    connectRequiredDependencies().catch(err => {
      console.error('Error connecting dependencies:', err);
      setError(err.message);
    });
  }, [
    componentId, 
    componentType, 
    autoConnect, 
    isInitialized, 
    consumerDependencies, 
    activeConsumerDependencies, 
    preferredProviders
  ]);
  
  return {
    isInitialized,
    error,
    requiredDependencyCount: consumerDependencies.filter(def => def.isRequired).length,
    connectedRequiredCount: consumerDependencies
      .filter(def => def.isRequired)
      .filter(def => activeConsumerDependencies.some(active => active.definitionId === def.id))
      .length
  };
}