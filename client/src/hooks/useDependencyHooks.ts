import { useState, useEffect, useCallback, useRef } from 'react';
import { useDependencyContext } from '../context/DependencyContext';
import { 
  DependencyDataTypes, 
  DependencyStatus,
  DependencySyncStrategy,
  DependencyDefinition
} from '../lib/dependency/DependencyInterfaces';
import { nanoid } from 'nanoid';

/**
 * Consumer hook result data
 */
export interface ConsumerHookResult<T> {
  consumerData: T | null;
  isReady: boolean;
  isLoading: boolean;
  isError: boolean;
  providerId: string | null;
  lastUpdated: number | null;
  status: DependencyStatus;
  requestData: () => void;
  disconnect: () => void;
}

/**
 * Provider hook result data
 */
export interface ProviderHookResult<T> {
  isRegistered: boolean;
  updateProviderData: (data: T) => void;
  getDependentConsumers: () => string[];
  disconnectConsumer: (consumerId: string) => void;
  disconnectAllConsumers: () => void;
}

/**
 * Hook for components that consume data from a provider
 */
export function useDependencyConsumer<T>(
  componentId: string,
  dataType: DependencyDataTypes,
  options?: {
    required?: boolean;
    syncStrategy?: DependencySyncStrategy;
  }
): ConsumerHookResult<T> {
  const context = useDependencyContext();
  const { registry, manager } = context;
  
  const [consumerData, setConsumerData] = useState<T | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [status, setStatus] = useState<DependencyStatus>(DependencyStatus.DISCONNECTED);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Register component as a consumer
  useEffect(() => {
    const definition: DependencyDefinition = {
      id: `def-consumer-${componentId}-${dataType}`,
      componentId,
      dataType,
      role: 'consumer',
      required: options?.required || false,
      syncStrategy: options?.syncStrategy || DependencySyncStrategy.BOTH,
      description: `Consumer of ${dataType} data`
    };
    
    context.registerComponent(componentId, [definition]);
    
    return () => {
      context.unregisterComponent(componentId);
    };
  }, [componentId, dataType, context, options]);
  
  // Listen for data updates
  useEffect(() => {
    const handleDataUpdate = (dependencyId: string, data: any) => {
      // Check if this update is for this component
      const dependency = registry.getDependency(dependencyId);
      
      if (dependency && dependency.consumerId === componentId && dependency.dataType === dataType) {
        setConsumerData(data);
        setProviderId(dependency.providerId);
        setLastUpdated(dependency.lastUpdated || Date.now());
        setStatus(dependency.status);
      }
    };
    
    const handleStatusChange = (dependencyId: string, newStatus: DependencyStatus) => {
      // Check if this update is for this component
      const dependency = registry.getDependency(dependencyId);
      
      if (dependency && dependency.consumerId === componentId && dependency.dataType === dataType) {
        setStatus(newStatus);
        setProviderId(dependency.providerId);
        
        if (newStatus === DependencyStatus.DISCONNECTED) {
          setConsumerData(null);
          setProviderId(null);
          setLastUpdated(null);
        } else if (newStatus === DependencyStatus.READY && dependency.lastUpdated) {
          setLastUpdated(dependency.lastUpdated);
        }
      }
    };
    
    // Register data update callback
    const removeDataListener = manager.onDataUpdated(handleDataUpdate);
    const removeStatusListener = manager.onStatusChanged(handleStatusChange);
    
    // Check if we already have providers
    const providers = manager.getProviders(componentId, dataType);
    
    if (providers.length > 0) {
      // Request data from the first provider
      manager.requestData(componentId, providers[0], dataType);
      setProviderId(providers[0]);
    }
    
    return () => {
      removeDataListener();
      removeStatusListener();
    };
  }, [componentId, dataType, manager, registry]);
  
  // Request data manually
  const requestData = useCallback(() => {
    if (!providerId) {
      return;
    }
    
    manager.requestData(componentId, providerId, dataType);
  }, [componentId, providerId, dataType, manager]);
  
  // Disconnect from provider
  const disconnect = useCallback(() => {
    if (!providerId) {
      return;
    }
    
    // Find the dependency
    const dependencies = registry.getDependenciesByConsumer(componentId)
      .filter(dep => dep.providerId === providerId && dep.dataType === dataType);
    
    if (dependencies.length > 0) {
      registry.removeDependency(dependencies[0].id);
      
      if (isMounted.current) {
        setConsumerData(null);
        setProviderId(null);
        setLastUpdated(null);
        setStatus(DependencyStatus.DISCONNECTED);
      }
    }
  }, [componentId, providerId, dataType, registry]);
  
  // Calculate derived states
  const isReady = status === DependencyStatus.READY && consumerData !== null;
  const isLoading = status === DependencyStatus.CONNECTING;
  const isError = status === DependencyStatus.ERROR;
  
  return {
    consumerData,
    isReady,
    isLoading,
    isError,
    providerId,
    lastUpdated,
    status,
    requestData,
    disconnect
  };
}

/**
 * Hook for components that provide data to consumers
 */
export function useDependencyProvider<T>(
  componentId: string,
  dataType: DependencyDataTypes,
  options?: {
    acceptsMultiple?: boolean;
    syncStrategy?: DependencySyncStrategy;
    initialData?: T;
  }
): ProviderHookResult<T> {
  const context = useDependencyContext();
  const { registry, manager } = context;
  
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Register component as a provider
  useEffect(() => {
    const definition: DependencyDefinition = {
      id: `def-provider-${componentId}-${dataType}`,
      componentId,
      dataType,
      role: 'provider',
      acceptsMultiple: options?.acceptsMultiple || true,
      syncStrategy: options?.syncStrategy || DependencySyncStrategy.BOTH,
      description: `Provider of ${dataType} data`
    };
    
    context.registerComponent(componentId, [definition]);
    setIsRegistered(true);
    
    // If initial data is provided, update it
    if (options?.initialData !== undefined) {
      context.updateComponentData(componentId, dataType, options.initialData);
    }
    
    return () => {
      context.unregisterComponent(componentId);
      setIsRegistered(false);
    };
  }, [componentId, dataType, context, options]);
  
  // Update provider data
  const updateProviderData = useCallback((data: T) => {
    context.updateComponentData(componentId, dataType, data);
  }, [componentId, dataType, context]);
  
  // Get dependent consumers
  const getDependentConsumers = useCallback(() => {
    return manager.getDependents(componentId, dataType);
  }, [componentId, dataType, manager]);
  
  // Disconnect a specific consumer
  const disconnectConsumer = useCallback((consumerId: string) => {
    // Find the dependency
    const dependencies = registry.getDependenciesByProvider(componentId)
      .filter(dep => dep.consumerId === consumerId && dep.dataType === dataType);
    
    if (dependencies.length > 0) {
      registry.removeDependency(dependencies[0].id);
    }
  }, [componentId, dataType, registry]);
  
  // Disconnect all consumers
  const disconnectAllConsumers = useCallback(() => {
    // Get all dependencies
    const dependencies = registry.getDependenciesByProvider(componentId)
      .filter(dep => dep.dataType === dataType);
    
    // Remove each dependency
    dependencies.forEach(dep => {
      registry.removeDependency(dep.id);
    });
  }, [componentId, dataType, registry]);
  
  return {
    isRegistered,
    updateProviderData,
    getDependentConsumers,
    disconnectConsumer,
    disconnectAllConsumers
  };
}

/**
 * Hook for components that both provide and consume data
 */
export function useDependencyBidirectional<TConsume, TProvide>(
  componentId: string,
  consumeDataType: DependencyDataTypes,
  provideDataType: DependencyDataTypes,
  options?: {
    required?: boolean;
    acceptsMultiple?: boolean;
    syncStrategy?: DependencySyncStrategy;
    initialProvideData?: TProvide;
  }
): {
  consumer: ConsumerHookResult<TConsume>;
  provider: ProviderHookResult<TProvide>;
} {
  const consumer = useDependencyConsumer<TConsume>(componentId, consumeDataType, {
    required: options?.required,
    syncStrategy: options?.syncStrategy
  });
  
  const provider = useDependencyProvider<TProvide>(componentId, provideDataType, {
    acceptsMultiple: options?.acceptsMultiple,
    syncStrategy: options?.syncStrategy,
    initialData: options?.initialProvideData
  });
  
  return { consumer, provider };
}