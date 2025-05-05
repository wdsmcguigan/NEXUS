/**
 * Dependency Hooks for React Integration
 * 
 * This file contains React hooks for interacting with the Component Dependency System.
 * These hooks simplify the usage of the dependency system in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDependencyContext } from '../context/DependencyContext';
import {
  DependencyInstance,
  DependencyStatus,
  DependencyDataType
} from '../lib/dependency/DependencyInterfaces';
import { ComponentType } from '../lib/communication/ComponentCommunication';

/**
 * Hook for providing dependency data from a component
 * @param providerId ID of the provider component
 * @param consumerId ID of the consumer component
 * @param definitionId ID of the dependency definition
 * @returns Functions for managing dependency data
 */
export function useProvideDependency<T>(
  providerId: string,
  consumerId: string,
  definitionId: string
) {
  const dependency = useDependencyContext();
  const [dependencyId, setDependencyId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the dependency
  useEffect(() => {
    try {
      // Check if a dependency already exists
      const existingDep = dependency.findDependency(providerId, consumerId, definitionId);
      
      if (existingDep) {
        // Use the existing dependency
        setDependencyId(existingDep.id);
        setIsActive(existingDep.isActive);
        setError(existingDep.error || null);
      } else {
        // Create a new dependency
        const newDepId = dependency.createDependency(definitionId, providerId, consumerId);
        setDependencyId(newDepId);
        setIsActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error creating dependency:', err);
      setError(err.message || 'Failed to create dependency');
    }

    // Clean up when unmounted
    return () => {
      if (dependencyId) {
        dependency.removeDependency(dependencyId);
      }
    };
  }, [dependency, providerId, consumerId, definitionId]);

  // Function to update the dependency data
  const updateData = useCallback(
    (data: T) => {
      if (!dependencyId) return false;

      try {
        const result = dependency.updateDependencyData(dependencyId, data);
        
        if (!result) {
          setError('Failed to update dependency data');
        } else {
          setError(null);
        }
        
        return result;
      } catch (err) {
        console.error('Error updating dependency data:', err);
        setError(err.message || 'Failed to update dependency data');
        return false;
      }
    },
    [dependency, dependencyId]
  );

  // Function to set the dependency status
  const setStatus = useCallback(
    (status: DependencyStatus, errorMessage?: string) => {
      if (!dependencyId) return false;

      try {
        const result = dependency.setDependencyStatus(dependencyId, status, errorMessage);
        
        if (result) {
          setIsActive(status === DependencyStatus.ACTIVE);
          setError(errorMessage || null);
        }
        
        return result;
      } catch (err) {
        console.error('Error setting dependency status:', err);
        setError(err.message || 'Failed to set dependency status');
        return false;
      }
    },
    [dependency, dependencyId]
  );

  return {
    dependencyId,
    isActive,
    error,
    updateData,
    setStatus
  };
}

/**
 * Hook for consuming dependency data from a component
 * @param consumerId ID of the consumer component
 * @param providerId ID of the provider component
 * @param definitionId ID of the dependency definition
 * @returns The dependency data and state
 */
export function useConsumeDependency<T>(
  consumerId: string,
  providerId: string,
  definitionId: string
) {
  const dependency = useDependencyContext();
  const [dependencyId, setDependencyId] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create/find the dependency
  useEffect(() => {
    try {
      // Check if a dependency already exists
      const existingDep = dependency.findDependency(providerId, consumerId, definitionId);
      
      if (existingDep) {
        // Use the existing dependency
        setDependencyId(existingDep.id);
        setData(existingDep.currentData || null);
        setIsReady(existingDep.isReady);
        setIsActive(existingDep.isActive);
        setError(existingDep.error || null);
      } else {
        // Create a new dependency
        const newDepId = dependency.createDependency(definitionId, providerId, consumerId);
        setDependencyId(newDepId);
        setIsActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error establishing dependency:', err);
      setError(err.message || 'Failed to establish dependency');
    }
  }, [dependency, providerId, consumerId, definitionId]);

  // Function to request data from the dependency
  const requestData = useCallback(
    async (params?: any) => {
      if (!dependencyId) return null;

      try {
        const result = await dependency.requestDependencyData<T>(dependencyId, params);
        setData(result);
        setIsReady(true);
        setError(null);
        return result;
      } catch (err) {
        console.error('Error requesting dependency data:', err);
        setError(err.message || 'Failed to request dependency data');
        return null;
      }
    },
    [dependency, dependencyId]
  );

  return {
    dependencyId,
    data,
    isReady,
    isActive,
    error,
    requestData
  };
}

/**
 * Hook for finding provider components for a specific dependency type
 * @param consumerType The consumer component type
 * @param dataType The desired data type
 * @returns Compatible provider component types
 */
export function useFindProviders(
  consumerType: ComponentType,
  dataType: DependencyDataType
) {
  const dependency = useDependencyContext();
  const [providers, setProviders] = useState<ComponentType[]>([]);

  useEffect(() => {
    const deps = dependency.getDependencyDefinitionsByConsumer(consumerType)
      .filter(dep => dep.dataType === dataType);

    const providerTypes = [...new Set(deps.map(dep => dep.providerType))];
    setProviders(providerTypes);
  }, [dependency, consumerType, dataType]);

  return providers;
}

/**
 * Hook for finding consumer components for a specific dependency type
 * @param providerType The provider component type
 * @param dataType The data type to provide
 * @returns Compatible consumer component types
 */
export function useFindConsumers(
  providerType: ComponentType,
  dataType: DependencyDataType
) {
  const dependency = useDependencyContext();
  const [consumers, setConsumers] = useState<ComponentType[]>([]);

  useEffect(() => {
    const deps = dependency.getDependencyDefinitionsByProvider(providerType)
      .filter(dep => dep.dataType === dataType);

    const consumerTypes = [...new Set(deps.map(dep => dep.consumerType))];
    setConsumers(consumerTypes);
  }, [dependency, providerType, dataType]);

  return consumers;
}

/**
 * Hook for accessing all dependency instances for a component
 * @param componentId The component ID
 * @param asProvider Whether to get dependencies as provider (true) or consumer (false)
 * @returns Array of dependency instances
 */
export function useComponentDependencies(
  componentId: string,
  asProvider: boolean = true
) {
  const dependency = useDependencyContext();
  const [dependencies, setDependencies] = useState<DependencyInstance[]>([]);

  useEffect(() => {
    const deps = asProvider
      ? dependency.getDependenciesForProvider(componentId)
      : dependency.getDependenciesForConsumer(componentId);

    setDependencies(deps);
  }, [dependency, componentId, asProvider]);

  return dependencies;
}

/**
 * Hook to check if a component type can provide data to another component type
 * @param providerType The provider component type
 * @param consumerType The consumer component type
 * @returns Whether a dependency exists between the component types
 */
export function useCanProvideFor(
  providerType: ComponentType,
  consumerType: ComponentType
) {
  const dependency = useDependencyContext();
  const [canProvide, setCanProvide] = useState(false);

  useEffect(() => {
    const result = dependency.canProvideFor(providerType, consumerType);
    setCanProvide(result);
  }, [dependency, providerType, consumerType]);

  return canProvide;
}

/**
 * Hook to get all possible dependencies between two component types
 * @param providerType The provider component type
 * @param consumerType The consumer component type
 * @returns Array of dependency definitions
 */
export function usePossibleDependencies(
  providerType: ComponentType,
  consumerType: ComponentType
) {
  const dependency = useDependencyContext();
  const [dependencies, setDependencies] = useState([]);

  useEffect(() => {
    const deps = dependency.findPossibleDependencies(providerType, consumerType);
    setDependencies(deps);
  }, [dependency, providerType, consumerType]);

  return dependencies;
}

/**
 * Convenience hook for the common email selection pattern
 * @param emailListId ID of the email list component
 * @param emailViewerId ID of the email viewer component
 * @returns Functions for managing the email selection
 */
export function useEmailSelectionDependency(
  emailListId: string,
  emailViewerId: string
) {
  const dependency = useDependencyContext();
  const [dependencyId, setDependencyId] = useState<string | null>(null);
  
  // Find the email selection dependency definition
  useEffect(() => {
    const emailSelectionDef = dependency.getDependencyDefinitionsByProvider(ComponentType.EMAIL_LIST)
      .find(dep => 
        dep.consumerType === ComponentType.EMAIL_VIEWER &&
        dep.dataType === DependencyDataType.EMAIL
      );
    
    if (emailSelectionDef) {
      // Check if a dependency already exists
      const existingDep = dependency.findDependency(emailListId, emailViewerId, emailSelectionDef.id);
      
      if (existingDep) {
        setDependencyId(existingDep.id);
      } else {
        // Create a new dependency
        try {
          const newDepId = dependency.createDependency(
            emailSelectionDef.id,
            emailListId,
            emailViewerId
          );
          setDependencyId(newDepId);
        } catch (err) {
          console.error('Error creating email selection dependency:', err);
        }
      }
    }
  }, [dependency, emailListId, emailViewerId]);
  
  // Function to update the selected email
  const updateSelectedEmail = useCallback(
    (email: any) => {
      if (!dependencyId) return false;
      
      try {
        return dependency.updateDependencyData(dependencyId, email);
      } catch (err) {
        console.error('Error updating selected email:', err);
        return false;
      }
    },
    [dependency, dependencyId]
  );
  
  return {
    dependencyId,
    updateSelectedEmail
  };
}