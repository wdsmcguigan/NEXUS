import { useState, useCallback, useEffect } from 'react';
import { useDependencyContext } from '../context/DependencyContext';
import { DependencyDataType, DependencyStatus } from '../lib/dependency/DependencyInterfaces';

/**
 * Hook for component instances to register and act as dependency providers
 * 
 * @param instanceId Unique identifier for the component instance
 * @param dataType The type of data this provider provides
 * @returns Object with methods to update provider data and manage dependencies
 */
export function useDependencyProvider<T>(instanceId: string, dataType: DependencyDataType) {
  const { dependencyManager } = useDependencyContext();
  const [providerRegistered, setProviderRegistered] = useState(false);
  
  // Register this component as a provider when mounted
  useEffect(() => {
    if (!providerRegistered) {
      dependencyManager.registerProvider(instanceId, dataType);
      setProviderRegistered(true);
    }
    
    // Cleanup when unmounted
    return () => {
      if (providerRegistered) {
        dependencyManager.unregisterProvider(instanceId, dataType);
      }
    };
  }, [dependencyManager, instanceId, dataType, providerRegistered]);
  
  // Method to update the data this provider shares with consumers
  const updateProviderData = useCallback((data: T) => {
    dependencyManager.updateProviderData(instanceId, dataType, data);
  }, [dependencyManager, instanceId, dataType]);
  
  // Method to get all consumers dependent on this provider
  const getDependentConsumers = useCallback(() => {
    return dependencyManager.getConsumersForProvider(instanceId, dataType);
  }, [dependencyManager, instanceId, dataType]);
  
  return {
    updateProviderData,
    getDependentConsumers,
    isRegistered: providerRegistered
  };
}

/**
 * Hook for component instances to register and act as dependency consumers
 * 
 * @param instanceId Unique identifier for the component instance
 * @param dataType The type of data this consumer requires
 * @returns Object with the consumed data and dependency status
 */
export function useDependencyConsumer<T>(instanceId: string, dataType: DependencyDataType) {
  const { dependencyManager } = useDependencyContext();
  const [consumerData, setConsumerData] = useState<T | null>(null);
  const [status, setStatus] = useState<DependencyStatus>(DependencyStatus.INACTIVE);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Register this component as a consumer when mounted
  useEffect(() => {
    dependencyManager.registerConsumer(instanceId, dataType);
    
    // Set up data listener
    const unsubscribe = dependencyManager.subscribeToData<T>(
      instanceId,
      dataType,
      (data, source, timestamp) => {
        setConsumerData(data);
        setProviderId(source);
        setLastUpdated(timestamp);
        setStatus(DependencyStatus.ACTIVE);
      }
    );
    
    // Get initial state
    const initialState = dependencyManager.getDependencyState(instanceId, dataType);
    if (initialState && initialState.isReady && initialState.currentData) {
      setConsumerData(initialState.currentData as T);
      setProviderId(initialState.providerId);
      setLastUpdated(initialState.lastUpdated || null);
      setStatus(DependencyStatus.ACTIVE);
    }
    
    // Cleanup when unmounted
    return () => {
      unsubscribe();
      dependencyManager.unregisterConsumer(instanceId, dataType);
    };
  }, [dependencyManager, instanceId, dataType]);
  
  // Method to request data from the provider (pull)
  const requestData = useCallback(() => {
    setStatus(DependencyStatus.LOADING);
    dependencyManager.requestDataFromProvider<T>(instanceId, dataType)
      .then(result => {
        if (result.success && result.data) {
          setConsumerData(result.data as T);
          setProviderId(result.providerId);
          setLastUpdated(result.timestamp);
          setStatus(DependencyStatus.ACTIVE);
        } else {
          setStatus(DependencyStatus.ERROR);
        }
      })
      .catch(() => {
        setStatus(DependencyStatus.ERROR);
      });
  }, [dependencyManager, instanceId, dataType]);
  
  return {
    consumerData,
    providerId,
    lastUpdated,
    status,
    isLoading: status === DependencyStatus.LOADING,
    isError: status === DependencyStatus.ERROR,
    isReady: status === DependencyStatus.ACTIVE,
    requestData
  };
}

/**
 * Hook to get data consumers for a specific data type
 */
export function useDataTypeConsumers(dataType: DependencyDataType) {
  const { dependencyManager } = useDependencyContext();
  const [consumers, setConsumers] = useState<string[]>([]);
  
  useEffect(() => {
    // Get initial consumers
    setConsumers(dependencyManager.getConsumersForDataType(dataType));
    
    // Subscribe to consumer registration changes
    const unsubscribe = dependencyManager.subscribeToConsumerChanges(dataType, (updatedConsumers) => {
      setConsumers(updatedConsumers);
    });
    
    return unsubscribe;
  }, [dependencyManager, dataType]);
  
  return consumers;
}

/**
 * Hook to get data providers for a specific data type
 */
export function useDataTypeProviders(dataType: DependencyDataType) {
  const { dependencyManager } = useDependencyContext();
  const [providers, setProviders] = useState<string[]>([]);
  
  useEffect(() => {
    // Get initial providers
    setProviders(dependencyManager.getProvidersForDataType(dataType));
    
    // Subscribe to provider registration changes
    const unsubscribe = dependencyManager.subscribeToProviderChanges(dataType, (updatedProviders) => {
      setProviders(updatedProviders);
    });
    
    return unsubscribe;
  }, [dependencyManager, dataType]);
  
  return providers;
}

/**
 * Hook to find and connect to a provider automatically
 */
export function useAutoDependency<T>(
  instanceId: string, 
  dataType: DependencyDataType,
  options?: { autoRequest?: boolean }
) {
  const { dependencyManager } = useDependencyContext();
  const [connected, setConnected] = useState(false);
  
  // Register as consumer and find provider automatically
  useEffect(() => {
    dependencyManager.registerConsumer(instanceId, dataType);
    
    const result = dependencyManager.findAndConnectProvider(instanceId, dataType);
    setConnected(result.success);
    
    // Auto-request data if configured
    if (result.success && options?.autoRequest) {
      dependencyManager.requestDataFromProvider(instanceId, dataType);
    }
    
    return () => {
      dependencyManager.unregisterConsumer(instanceId, dataType);
    };
  }, [dependencyManager, instanceId, dataType, options?.autoRequest]);
  
  // Re-use the consumer hook for convenience
  const consumerHook = useDependencyConsumer<T>(instanceId, dataType);
  
  return {
    ...consumerHook,
    connected
  };
}

/**
 * Hook to create a bidirectional dependency between two components
 */
export function useBidirectionalDependency<T, U>(
  instanceId: string,
  dataType: DependencyDataType,
  options?: { 
    sendDataType?: DependencyDataType,
    receiveDataType?: DependencyDataType
  }
) {
  const sendType = options?.sendDataType || dataType;
  const receiveType = options?.receiveDataType || dataType;
  
  // Use both provider and consumer hooks
  const provider = useDependencyProvider<T>(instanceId, sendType);
  const consumer = useDependencyConsumer<U>(instanceId, receiveType);
  
  return {
    provider,
    consumer,
    updateData: provider.updateProviderData,
    data: consumer.consumerData,
    isReady: consumer.isReady
  };
}