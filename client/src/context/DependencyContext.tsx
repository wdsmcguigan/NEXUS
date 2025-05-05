/**
 * DependencyContext for the Component Dependency System
 * 
 * This context provides access to the dependency system for React components.
 * It initializes the registry and manager and provides methods for
 * interacting with the dependency system.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { dependencyRegistry, dependencyManager } from '../lib/dependency';
import { 
  DependencyDefinition, 
  DependencyInstance,
  DependencyConfig,
  DependencyDataType,
  DependencyStatus
} from '../lib/dependency/DependencyInterfaces';
import { ComponentType } from '../lib/communication/ComponentCommunication';

// Context interface
interface DependencyContextValue {
  // Initialization status
  isInitialized: boolean;
  
  // Registry methods
  registerDependencyDefinition: (definition: Omit<DependencyDefinition, 'id'>) => string;
  getDependencyDefinition: (id: string) => DependencyDefinition | undefined;
  getDependencyDefinitionsByProvider: (providerType: ComponentType) => DependencyDefinition[];
  getDependencyDefinitionsByConsumer: (consumerType: ComponentType) => DependencyDefinition[];
  getDependencyDefinitionsByDataType: (dataType: DependencyDataType) => DependencyDefinition[];
  
  // Manager methods
  createDependency: (
    definitionId: string,
    providerId: string,
    consumerId: string,
    config?: Partial<DependencyConfig>
  ) => string;
  removeDependency: (id: string) => boolean;
  getDependency: (id: string) => DependencyInstance | undefined;
  getDependenciesForProvider: (providerId: string) => DependencyInstance[];
  getDependenciesForConsumer: (consumerId: string) => DependencyInstance[];
  findDependency: (
    providerId: string, 
    consumerId: string,
    definitionId?: string
  ) => DependencyInstance | undefined;
  
  // Data flow methods
  updateDependencyData: <T>(id: string, data: T) => boolean;
  requestDependencyData: <T>(id: string, params?: any) => Promise<T>;
  
  // Status management
  setDependencyStatus: (
    id: string, 
    status: DependencyStatus,
    error?: string
  ) => boolean;
  
  // Validation methods
  canProvideFor: (providerType: ComponentType, consumerType: ComponentType) => boolean;
  canConsumeFrom: (consumerType: ComponentType, providerType: ComponentType) => boolean;
  findPossibleDependencies: (
    providerType: ComponentType, 
    consumerType: ComponentType
  ) => DependencyDefinition[];
}

// Create the context with default values
export const DependencyContext = createContext<DependencyContextValue>({
  isInitialized: false,
  
  // Default registry methods (no-ops)
  registerDependencyDefinition: () => '',
  getDependencyDefinition: () => undefined,
  getDependencyDefinitionsByProvider: () => [],
  getDependencyDefinitionsByConsumer: () => [],
  getDependencyDefinitionsByDataType: () => [],
  
  // Default manager methods (no-ops)
  createDependency: () => '',
  removeDependency: () => false,
  getDependency: () => undefined,
  getDependenciesForProvider: () => [],
  getDependenciesForConsumer: () => [],
  findDependency: () => undefined,
  
  // Default data flow methods (no-ops)
  updateDependencyData: () => false,
  requestDependencyData: async () => Promise.reject('Dependency context not initialized'),
  
  // Default status management
  setDependencyStatus: () => false,
  
  // Default validation methods
  canProvideFor: () => false,
  canConsumeFrom: () => false,
  findPossibleDependencies: () => []
});

// Provider props
interface DependencyProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the Dependency Context
 */
export const DependencyProvider: React.FC<DependencyProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the registry and manager
  useEffect(() => {
    const initDependencySystem = async () => {
      try {
        // Initialize dependency manager
        // @ts-ignore - Accessing private method for initialization
        dependencyManager.initialize();
        
        // Set up built-in dependencies if needed
        registerBuiltInDependencies();
        
        // Mark as initialized
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize dependency system:', error);
      }
    };
    
    initDependencySystem();
  }, []);
  
  /**
   * Register built-in dependencies
   */
  const registerBuiltInDependencies = () => {
    // Register common dependencies if they don't already exist
    
    // Email List to Email Viewer dependency
    const emailSelectionDep = dependencyRegistry.getAllDependencies().find(dep => 
      dep.providerType === ComponentType.EMAIL_LIST && 
      dep.consumerType === ComponentType.EMAIL_VIEWER &&
      dep.dataType === DependencyDataType.EMAIL
    );
    
    if (!emailSelectionDep) {
      dependencyRegistry.registerDependency({
        name: 'Email Selection',
        description: 'Email list provides selected email to email viewer',
        providerType: ComponentType.EMAIL_LIST,
        consumerType: ComponentType.EMAIL_VIEWER,
        dataType: DependencyDataType.EMAIL,
        syncStrategy: 'both',
        isRequired: false,
        isOneToMany: true,
        isManyToOne: false
      });
    }
    
    // Folder Tree to Email List dependency
    const folderSelectionDep = dependencyRegistry.getAllDependencies().find(dep => 
      dep.providerType === ComponentType.FOLDER_TREE && 
      dep.consumerType === ComponentType.EMAIL_LIST &&
      dep.dataType === DependencyDataType.FOLDER
    );
    
    if (!folderSelectionDep) {
      dependencyRegistry.registerDependency({
        name: 'Folder Selection',
        description: 'Folder tree provides selected folder to email list',
        providerType: ComponentType.FOLDER_TREE,
        consumerType: ComponentType.EMAIL_LIST,
        dataType: DependencyDataType.FOLDER,
        syncStrategy: 'push',
        isRequired: false,
        isOneToMany: true,
        isManyToOne: false
      });
    }
    
    // Other built-in dependencies can be added here
  };
  
  // Create the context value
  const contextValue: DependencyContextValue = {
    isInitialized,
    
    // Registry methods
    registerDependencyDefinition: (definition) => {
      return dependencyRegistry.registerDependency(definition);
    },
    
    getDependencyDefinition: (id) => {
      return dependencyRegistry.getDependency(id);
    },
    
    getDependencyDefinitionsByProvider: (providerType) => {
      return dependencyRegistry.getDependenciesForProvider(providerType);
    },
    
    getDependencyDefinitionsByConsumer: (consumerType) => {
      return dependencyRegistry.getDependenciesForConsumer(consumerType);
    },
    
    getDependencyDefinitionsByDataType: (dataType) => {
      return dependencyRegistry.getDependenciesByDataType(dataType);
    },
    
    // Manager methods
    createDependency: (definitionId, providerId, consumerId, config) => {
      return dependencyManager.createDependency(definitionId, providerId, consumerId, config);
    },
    
    removeDependency: (id) => {
      return dependencyManager.removeDependency(id);
    },
    
    getDependency: (id) => {
      return dependencyManager.getDependency(id);
    },
    
    getDependenciesForProvider: (providerId) => {
      return dependencyManager.getDependenciesForProvider(providerId);
    },
    
    getDependenciesForConsumer: (consumerId) => {
      return dependencyManager.getDependenciesForConsumer(consumerId);
    },
    
    findDependency: (providerId, consumerId, definitionId) => {
      return dependencyManager.findDependency(providerId, consumerId, definitionId);
    },
    
    // Data flow methods
    updateDependencyData: (id, data) => {
      return dependencyManager.updateDependencyData(id, data);
    },
    
    requestDependencyData: async (id, params) => {
      return dependencyManager.requestData(id, params);
    },
    
    // Status management
    setDependencyStatus: (id, status, error) => {
      return dependencyManager.setDependencyStatus(id, status, error);
    },
    
    // Validation methods
    canProvideFor: (providerType, consumerType) => {
      return dependencyRegistry.canProvideFor(providerType, consumerType);
    },
    
    canConsumeFrom: (consumerType, providerType) => {
      return dependencyRegistry.canConsumeFrom(consumerType, providerType);
    },
    
    findPossibleDependencies: (providerType, consumerType) => {
      return dependencyRegistry.findPossibleDependencies(providerType, consumerType);
    }
  };
  
  return (
    <DependencyContext.Provider value={contextValue}>
      {children}
    </DependencyContext.Provider>
  );
};

/**
 * Hook to access the dependency context
 * @returns The dependency context value
 */
export const useDependencyContext = () => {
  const context = useContext(DependencyContext);
  
  if (!context) {
    throw new Error('useDependencyContext must be used within a DependencyProvider');
  }
  
  return context;
};