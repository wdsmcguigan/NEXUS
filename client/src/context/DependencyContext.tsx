/**
 * Dependency Context
 * 
 * This file provides a React context for the Component Dependency System.
 * It wraps the underlying dependency registry and manager to provide a
 * unified interface for React components.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { dependencyRegistry } from '../lib/dependency/DependencyRegistry';
import { dependencyManager } from '../lib/dependency/DependencyManager';
import {
  DependencyDefinition,
  DependencyInstance,
  DependencyStatus,
  DependencySyncStrategy
} from '../lib/dependency/DependencyInterfaces';
import { ComponentType } from '../lib/communication/ComponentCommunication';

// Interface for the dependency context
interface DependencyContextInterface {
  // Registry methods
  registerDependencyDefinition: (definition: Omit<DependencyDefinition, 'id' | 'createdAt'>) => string;
  getDependencyDefinition: (id: string) => DependencyDefinition | undefined;
  getDependencyDefinitionsByProvider: (providerType: ComponentType) => DependencyDefinition[];
  getDependencyDefinitionsByConsumer: (consumerType: ComponentType) => DependencyDefinition[];
  canProvideFor: (providerType: ComponentType, consumerType: ComponentType) => boolean;
  findPossibleDependencies: (providerType: ComponentType, consumerType: ComponentType) => DependencyDefinition[];

  // Manager methods
  createDependency: (definitionId: string, providerId: string, consumerId: string) => string;
  removeDependency: (id: string) => boolean;
  findDependency: (providerId: string, consumerId: string, definitionId?: string) => DependencyInstance | undefined;
  getDependency: (id: string) => DependencyInstance | undefined;
  getDependenciesForProvider: (providerId: string) => DependencyInstance[];
  getDependenciesForConsumer: (consumerId: string) => DependencyInstance[];
  updateDependencyData: <T>(id: string, data: T) => boolean;
  requestDependencyData: <T>(id: string, params?: any) => Promise<T>;
  setDependencyStatus: (id: string, status: DependencyStatus, error?: string) => boolean;
}

// Create the dependency context
const DependencyContext = createContext<DependencyContextInterface | null>(null);

// Props for the dependency provider
interface DependencyProviderProps {
  children: ReactNode;
}

// Dependency provider component
const DependencyProvider: React.FC<DependencyProviderProps> = ({ children }) => {
  // Initialize the dependency system
  useEffect(() => {
    dependencyManager.initialize();

    // Register standard dependencies
    registerStandardDependencies();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Register standard dependencies used throughout the application
  const registerStandardDependencies = () => {
    // Email selection dependency
    dependencyRegistry.registerDependency({
      name: 'Email Selection',
      description: 'Email list provides selected email to email viewer',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: 'email',
      syncStrategy: 'both' as DependencySyncStrategy,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false,
      createdAt: Date.now()
    });

    // Folder selection dependency
    dependencyRegistry.registerDependency({
      name: 'Folder Selection',
      description: 'Folder tree provides selected folder to email list',
      providerType: ComponentType.FOLDER_TREE,
      consumerType: ComponentType.EMAIL_LIST,
      dataType: 'folder',
      syncStrategy: 'push' as DependencySyncStrategy,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false,
      createdAt: Date.now()
    });

    // Add more standard dependencies as needed
  };

  // Create the context value
  const contextValue: DependencyContextInterface = {
    // Registry methods
    registerDependencyDefinition: (definition) => {
      return dependencyRegistry.registerDependency({
        ...definition,
        createdAt: Date.now()
      });
    },
    getDependencyDefinition: (id) => dependencyRegistry.getDependency(id),
    getDependencyDefinitionsByProvider: (providerType) => 
      dependencyRegistry.getDependenciesForProvider(providerType),
    getDependencyDefinitionsByConsumer: (consumerType) => 
      dependencyRegistry.getDependenciesForConsumer(consumerType),
    canProvideFor: (providerType, consumerType) => 
      dependencyRegistry.canProvideFor(providerType, consumerType),
    findPossibleDependencies: (providerType, consumerType) => 
      dependencyRegistry.findPossibleDependencies(providerType, consumerType),

    // Manager methods
    createDependency: (definitionId, providerId, consumerId) => 
      dependencyManager.createDependency(definitionId, providerId, consumerId),
    removeDependency: (id) => dependencyManager.removeDependency(id),
    findDependency: (providerId, consumerId, definitionId) => 
      dependencyManager.findDependency(providerId, consumerId, definitionId),
    getDependency: (id) => dependencyManager.getDependency(id),
    getDependenciesForProvider: (providerId) => 
      dependencyManager.getDependenciesForProvider(providerId),
    getDependenciesForConsumer: (consumerId) => 
      dependencyManager.getDependenciesForConsumer(consumerId),
    updateDependencyData: <T,>(id: string, data: T) => 
      dependencyManager.updateDependencyData<T>(id, data),
    requestDependencyData: <T,>(id: string, params?: any) => 
      dependencyManager.requestData<T>(id, params),
    setDependencyStatus: (id, status, error) => 
      dependencyManager.setDependencyStatus(id, status, error)
  };

  return (
    <DependencyContext.Provider value={contextValue}>
      {children}
    </DependencyContext.Provider>
  );
};

// Hook for using the dependency context
function useDependencyContext(): DependencyContextInterface {
  const context = useContext(DependencyContext);
  
  if (!context) {
    throw new Error('useDependencyContext must be used within a DependencyProvider');
  }
  
  return context;
}

export { DependencyContext, DependencyProvider, useDependencyContext };