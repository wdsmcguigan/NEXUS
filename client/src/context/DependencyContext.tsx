import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DependencyContextType, 
  DependencyDefinition, 
  DependencyDataTypes,
  DependencyStatus
} from '../lib/dependency/DependencyInterfaces';
import { DependencyRegistry } from '../lib/dependency/DependencyRegistry';
import { DependencyManager } from '../lib/dependency/DependencyManager';

// Create registry and manager instances
const registry = new DependencyRegistry();
const manager = new DependencyManager(registry);

// Create React context
const DependencyContext = createContext<DependencyContextType>({
  registry,
  manager,
  registerComponent: () => {},
  unregisterComponent: () => {},
  updateComponentData: () => {},
  getComponentData: () => undefined,
  getDependencyStatus: () => DependencyStatus.DISCONNECTED
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
  
  const contextValue: DependencyContextType = {
    registry,
    manager,
    registerComponent,
    unregisterComponent,
    updateComponentData,
    getComponentData,
    getDependencyStatus
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