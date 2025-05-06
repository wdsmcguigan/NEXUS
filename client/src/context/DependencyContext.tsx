import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DependencyContextType, 
  DependencyDefinition, 
  DependencyDataTypes,
  DependencyStatus
} from '../lib/dependency/DependencyInterfaces';
import { DependencyRegistry } from '../lib/dependency/DependencyRegistry';
import { DependencyManager } from '../lib/dependency/DependencyManager';
import { registerSampleDependencies } from '../lib/dependency/sampleDependencies';
import { registerEmailDependencies } from '../lib/dependency/registerEmailDependencies';

// Create registry and manager instances
const registry = new DependencyRegistry();
const manager = new DependencyManager(registry);

// Initialize with sample dependencies
registerSampleDependencies(registry);

// Initialize with email component dependencies
registerEmailDependencies(registry);

// Create React context
const DependencyContext = createContext<DependencyContextType>({
  registry,
  manager,
  registerComponent: () => {},
  unregisterComponent: () => {},
  updateComponentData: () => {},
  getComponentData: () => undefined,
  getDependencyStatus: () => DependencyStatus.DISCONNECTED,
  suspendDependency: () => {},
  suspendAllDependencies: () => {},
  resumeDependency: () => {},
  resumeAllDependencies: () => {},
  removeDependency: () => {}
});

// Provider component
export function DependencyProvider({ children }: { children: React.ReactNode }) {
  // Register component with the dependency system
  const registerComponent = (componentId: string, definitions: DependencyDefinition[]) => {
    definitions.forEach(definition => {
      definition.componentId = componentId;
      registry.registerDefinition(definition);
    });
  };
  
  // Unregister component from the dependency system
  const unregisterComponent = (componentId: string) => {
    const definitions = registry.getDefinitionsByComponent(componentId);
    definitions.forEach(definition => {
      registry.removeDefinition(definition.id);
    });
  };
  
  // Update component data
  const updateComponentData = (
    componentId: string, 
    dataType: DependencyDataTypes, 
    data: any
  ) => {
    manager.updateData(componentId, dataType, data);
  };
  
  // Get component data
  const getComponentData = (
    componentId: string, 
    dataType: DependencyDataTypes
  ): any => {
    // Check if there's a dependency where this component is a consumer
    const dependencies = registry.getDependenciesByConsumer(componentId)
      .filter(dep => dep.dataType === dataType);
    
    if (dependencies.length > 0) {
      // Return data from the first dependency
      return manager.getData(dependencies[0].id);
    }
    
    // If no dependency exists, check if this component is a provider
    const providerKey = `${componentId}:${dataType}`;
    const directData = manager.getData(providerKey);
    
    return directData;
  };
  
  // Get dependency status
  const getDependencyStatus = (
    providerId: string, 
    consumerId: string, 
    dataType: DependencyDataTypes
  ): DependencyStatus => {
    // Find the dependency
    const dependencies = registry.getDependenciesByProvider(providerId)
      .filter(dep => dep.consumerId === consumerId && dep.dataType === dataType);
    
    if (dependencies.length > 0) {
      return dependencies[0].status;
    }
    
    return DependencyStatus.DISCONNECTED;
  };
  
  // Suspend a specific dependency (temporarily disable it)
  const suspendDependency = (dependencyId: string) => {
    const dependency = registry.getDependency(dependencyId);
    if (dependency) {
      // Set the status to suspended
      registry.updateDependencyStatus(dependencyId, DependencyStatus.SUSPENDED);
      console.log(`Suspended dependency: ${dependencyId}`);
    }
  };
  
  // Resume a specific dependency
  const resumeDependency = (dependencyId: string) => {
    const dependency = registry.getDependency(dependencyId);
    if (dependency) {
      // Set the status back to connected
      registry.updateDependencyStatus(dependencyId, DependencyStatus.CONNECTED);
      console.log(`Resumed dependency: ${dependencyId}`);
    }
  };
  
  // Suspend all dependencies for a component
  const suspendAllDependencies = (componentId: string) => {
    // Suspend dependencies where this component is a provider
    const providingDeps = registry.getDependenciesByProvider(componentId);
    providingDeps.forEach(dep => {
      registry.updateDependencyStatus(dep.id, DependencyStatus.SUSPENDED);
    });
    
    // Suspend dependencies where this component is a consumer
    const consumingDeps = registry.getDependenciesByConsumer(componentId);
    consumingDeps.forEach(dep => {
      registry.updateDependencyStatus(dep.id, DependencyStatus.SUSPENDED);
    });
    
    console.log(`Suspended all dependencies for component: ${componentId}`);
  };
  
  // Resume all dependencies for a component
  const resumeAllDependencies = (componentId: string) => {
    // Resume dependencies where this component is a provider
    const providingDeps = registry.getDependenciesByProvider(componentId);
    providingDeps.forEach(dep => {
      registry.updateDependencyStatus(dep.id, DependencyStatus.CONNECTED);
    });
    
    // Resume dependencies where this component is a consumer
    const consumingDeps = registry.getDependenciesByConsumer(componentId);
    consumingDeps.forEach(dep => {
      registry.updateDependencyStatus(dep.id, DependencyStatus.CONNECTED);
    });
    
    console.log(`Resumed all dependencies for component: ${componentId}`);
  };
  
  // Remove a dependency completely
  const removeDependency = (dependencyId: string) => {
    const dependency = registry.getDependency(dependencyId);
    if (dependency) {
      registry.removeDependency(dependencyId);
      console.log(`Removed dependency: ${dependencyId}`);
    }
  };
  
  const contextValue: DependencyContextType = {
    registry,
    manager,
    registerComponent,
    unregisterComponent,
    updateComponentData,
    getComponentData,
    getDependencyStatus,
    suspendDependency,
    suspendAllDependencies,
    resumeDependency,
    resumeAllDependencies,
    removeDependency
  };
  
  return (
    <DependencyContext.Provider value={contextValue}>
      {children}
    </DependencyContext.Provider>
  );
}

// Hook to access the dependency context
export function useDependencyContext() {
  const context = useContext(DependencyContext);
  
  if (context === undefined) {
    throw new Error('useDependencyContext must be used within a DependencyProvider');
  }
  
  return context;
}