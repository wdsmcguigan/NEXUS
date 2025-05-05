/**
 * Utility functions for the Component Dependency System
 * 
 * This file provides helper functions for working with dependencies,
 * including data formatting, transformation, and utility functions.
 */

import { 
  DependencyDefinition,
  DependencyInstance,
  DependencyDataType,
  DependencySyncStrategy,
  DependencyStatus
} from './DependencyInterfaces';
import { ComponentType } from '../communication/ComponentCommunication';
import { dependencyRegistry } from './DependencyRegistry';
import { dependencyManager } from './DependencyManager';

/**
 * Get a human-readable name for a dependency
 * 
 * @param dependency The dependency instance or definition
 * @returns A human-readable name
 */
export function getDependencyName(
  dependency: DependencyInstance | DependencyDefinition
): string {
  if ('name' in dependency) {
    // It's a definition
    return dependency.name;
  }
  
  // It's an instance, try to get the definition
  const definition = dependencyRegistry.getDependency(dependency.definitionId);
  
  if (definition) {
    return definition.name;
  }
  
  // Fallback
  return `${dependency.providerType} → ${dependency.consumerType}`;
}

/**
 * Format a dependency for display
 * 
 * @param dependency The dependency instance
 * @returns Formatted dependency information
 */
export function formatDependency(dependency: DependencyInstance): {
  id: string;
  name: string;
  provider: string;
  consumer: string;
  dataType: string;
  status: string;
  lastUpdated?: string;
} {
  const definition = dependencyRegistry.getDependency(dependency.definitionId);
  
  // Get status
  let status: string;
  if (dependency.error) {
    status = 'Error';
  } else if (!dependency.isActive) {
    status = 'Inactive';
  } else if (!dependency.isReady) {
    status = 'Pending';
  } else {
    status = 'Active';
  }
  
  return {
    id: dependency.id,
    name: definition?.name || 'Unknown',
    provider: dependency.providerId,
    consumer: dependency.consumerId,
    dataType: definition?.dataType || 'unknown',
    status,
    lastUpdated: dependency.lastUpdated 
      ? new Date(dependency.lastUpdated).toLocaleString() 
      : undefined
  };
}

/**
 * Get the status of a dependency
 * 
 * @param dependency The dependency instance
 * @returns The dependency status
 */
export function getDependencyStatus(dependency: DependencyInstance): DependencyStatus {
  if (dependency.error) {
    return DependencyStatus.ERROR;
  }
  
  if (!dependency.isActive) {
    return DependencyStatus.INACTIVE;
  }
  
  if (!dependency.isReady) {
    return DependencyStatus.PENDING;
  }
  
  return DependencyStatus.ACTIVE;
}

/**
 * Create a dependency between components
 * 
 * @param providerType Provider component type
 * @param providerId Provider component ID
 * @param consumerType Consumer component type
 * @param consumerId Consumer component ID
 * @param dataType Type of data to share
 * @param config Optional configuration
 * @returns ID of the created dependency or null if failed
 */
export function createDependencyBetweenComponents(
  providerType: ComponentType,
  providerId: string,
  consumerType: ComponentType,
  consumerId: string,
  dataType: DependencyDataType,
  config?: any
): string | null {
  try {
    // Find matching dependency definition
    const definitions = dependencyRegistry.findPossibleDependencies(
      providerType,
      consumerType
    ).filter(def => def.dataType === dataType);
    
    if (definitions.length === 0) {
      console.error(
        `No dependency definition found for ${providerType} → ${consumerType} with data type ${dataType}`
      );
      return null;
    }
    
    // Use the first matching definition
    const definition = definitions[0];
    
    // Create the dependency
    return dependencyManager.createDependency(
      definition.id,
      providerId,
      consumerId,
      config
    );
  } catch (error) {
    console.error('Failed to create dependency between components:', error);
    return null;
  }
}

/**
 * Check if a component can provide data to another component
 * 
 * @param providerType Provider component type
 * @param consumerType Consumer component type
 * @param dataType Optional data type to check
 * @returns Whether the component can provide data
 */
export function canComponentProvideFor(
  providerType: ComponentType,
  consumerType: ComponentType,
  dataType?: DependencyDataType
): boolean {
  // Get all possible dependencies between these component types
  const definitions = dependencyRegistry.findPossibleDependencies(
    providerType,
    consumerType
  );
  
  // If data type is specified, filter by it
  if (dataType) {
    return definitions.some(def => def.dataType === dataType);
  }
  
  return definitions.length > 0;
}

/**
 * Create a dependency definition
 * 
 * @param providerType Provider component type
 * @param consumerType Consumer component type
 * @param dataType Type of data to share
 * @param options Additional options
 * @returns ID of the created definition
 */
export function createDependencyDefinition(
  providerType: ComponentType,
  consumerType: ComponentType,
  dataType: DependencyDataType,
  options: {
    name?: string;
    description?: string;
    syncStrategy?: DependencySyncStrategy;
    isRequired?: boolean;
    isOneToMany?: boolean;
    isManyToOne?: boolean;
    configOptions?: any[];
    validateData?: (data: any) => boolean;
    transformData?: (data: any) => any;
  } = {}
): string {
  const {
    name = `${providerType} → ${consumerType}`,
    description,
    syncStrategy = DependencySyncStrategy.BOTH,
    isRequired = false,
    isOneToMany = true,
    isManyToOne = false,
    configOptions,
    validateData,
    transformData
  } = options;
  
  return dependencyRegistry.registerDependency({
    name,
    description,
    providerType,
    consumerType,
    dataType,
    syncStrategy,
    isRequired,
    isOneToMany,
    isManyToOne,
    configOptions,
    validateData,
    transformData
  });
}

/**
 * Find all dependencies between two components
 * 
 * @param providerId Provider component ID
 * @param consumerId Consumer component ID
 * @returns Array of dependency instances
 */
export function findDependenciesBetweenComponents(
  providerId: string,
  consumerId: string
): DependencyInstance[] {
  // Get all dependencies for the provider
  const providerDependencies = dependencyManager.getDependenciesForProvider(providerId);
  
  // Filter by consumer ID
  return providerDependencies.filter(dep => dep.consumerId === consumerId);
}

/**
 * Update data for all dependencies provided by a component
 * 
 * @param providerId Provider component ID
 * @param data Data to update
 * @param filter Optional filter function to select which dependencies to update
 * @returns Whether all updates were successful
 */
export function updateDataForAllDependencies<T>(
  providerId: string,
  data: T,
  filter?: (dependency: DependencyInstance) => boolean
): boolean {
  // Get all dependencies for the provider
  const providerDependencies = dependencyManager.getDependenciesForProvider(providerId);
  
  // Apply filter if provided
  const dependencies = filter 
    ? providerDependencies.filter(filter)
    : providerDependencies;
  
  // Update data for each dependency
  const results = dependencies.map(dep => 
    dependencyManager.updateDependencyData(dep.id, data)
  );
  
  return !results.includes(false);
}

/**
 * Get data transformers for specific data types
 * 
 * @param dataType The type of data to transform
 * @returns Transform functions for the data type
 */
export function getDataTransformers<T = any>(dataType: DependencyDataType): {
  toConsumer: (data: T) => any;
  fromProvider: (data: any) => T;
} {
  // Default transforms (identity)
  const defaultTransformers = {
    toConsumer: (data: T) => data,
    fromProvider: (data: any) => data as T
  };
  
  // Specific transforms for different data types
  switch (dataType) {
    case DependencyDataType.EMAIL:
      return {
        // Transform email data for consumer (e.g., remove sensitive info)
        toConsumer: (data: any) => ({
          id: data.id,
          subject: data.subject,
          sender: data.sender || data.from,
          received: data.received || data.date,
          preview: data.preview || data.snippet || (data.body?.substring(0, 100) + '...'),
          read: data.read || data.isRead || false,
          hasAttachments: data.hasAttachments || data.attachments?.length > 0 || false
        }),
        // Transform data back from consumer to provider format
        fromProvider: (data: any) => data as T
      };
      
    case DependencyDataType.FOLDER:
      return {
        // Transform folder data for consumer
        toConsumer: (data: any) => ({
          id: data.id,
          name: data.name,
          path: data.path,
          unreadCount: data.unreadCount || data.unread || 0,
          totalCount: data.totalCount || data.total || 0,
          color: data.color
        }),
        // Transform data back from consumer to provider format
        fromProvider: (data: any) => data as T
      };
      
    // Add other data type transformers as needed
    
    default:
      return defaultTransformers;
  }
}

/**
 * Get the last updated dependencies for a provider
 * 
 * @param providerId Provider component ID
 * @param limit Maximum number of dependencies to return
 * @returns Array of recently updated dependencies
 */
export function getRecentlyUpdatedDependencies(
  providerId: string,
  limit: number = 5
): DependencyInstance[] {
  // Get all dependencies for the provider
  const providerDependencies = dependencyManager.getDependenciesForProvider(providerId);
  
  // Sort by last updated time (descending)
  return providerDependencies
    .filter(dep => dep.lastUpdated !== undefined)
    .sort((a, b) => {
      const aTime = a.lastUpdated || 0;
      const bTime = b.lastUpdated || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

/**
 * Create or update a dependency between components
 * 
 * @param providerType Provider component type
 * @param providerId Provider component ID
 * @param consumerType Consumer component type
 * @param consumerId Consumer component ID
 * @param dataType Type of data to share
 * @param config Optional configuration
 * @returns ID of the created or updated dependency
 */
export function ensureDependency(
  providerType: ComponentType,
  providerId: string,
  consumerType: ComponentType,
  consumerId: string,
  dataType: DependencyDataType,
  config?: any
): string | null {
  // Find existing dependency
  const existingDependency = dependencyManager.findDependency(providerId, consumerId);
  
  if (existingDependency) {
    // Update configuration if provided
    if (config) {
      dependencyManager.updateDependencyConfig(existingDependency.id, config);
    }
    
    return existingDependency.id;
  }
  
  // Create new dependency
  return createDependencyBetweenComponents(
    providerType,
    providerId,
    consumerType,
    consumerId,
    dataType,
    config
  );
}

/**
 * Reset all dependencies for a component
 * 
 * @param componentId Component ID
 * @param options Reset options
 * @returns Number of dependencies reset
 */
export function resetDependencies(
  componentId: string,
  options: {
    asProvider?: boolean;
    asConsumer?: boolean;
    clearData?: boolean;
    resetStatus?: boolean;
  } = {
    asProvider: true,
    asConsumer: true,
    clearData: true,
    resetStatus: true
  }
): number {
  const { asProvider = true, asConsumer = true, clearData = true, resetStatus = true } = options;
  
  let resetCount = 0;
  
  // Reset dependencies where component is a provider
  if (asProvider) {
    const providerDependencies = dependencyManager.getDependenciesForProvider(componentId);
    
    for (const dependency of providerDependencies) {
      let updated = false;
      
      // Clear data if requested
      if (clearData && dependency.currentData !== undefined) {
        dependency.currentData = undefined;
        updated = true;
      }
      
      // Reset status if requested
      if (resetStatus && !dependency.isActive) {
        dependencyManager.setDependencyStatus(dependency.id, DependencyStatus.ACTIVE);
        updated = true;
      }
      
      if (updated) {
        resetCount++;
      }
    }
  }
  
  // Reset dependencies where component is a consumer
  if (asConsumer) {
    const consumerDependencies = dependencyManager.getDependenciesForConsumer(componentId);
    
    for (const dependency of consumerDependencies) {
      let updated = false;
      
      // Reset status if requested
      if (resetStatus && !dependency.isActive) {
        dependencyManager.setDependencyStatus(dependency.id, DependencyStatus.ACTIVE);
        updated = true;
      }
      
      if (updated) {
        resetCount++;
      }
    }
  }
  
  return resetCount;
}