import React, { createContext, useContext, useRef, useMemo } from 'react';
import { DependencyManager } from '../lib/dependency/DependencyManager';
import { DependencySyncStrategy } from '../lib/dependency/DependencyInterfaces';

// Interface for the dependency context
interface DependencyContextType {
  dependencyManager: DependencyManager;
  // Additional configuration properties
  defaultSyncStrategy: DependencySyncStrategy;
  autoDiscoverDependencies: boolean;
}

// Create context with default values
const DependencyContext = createContext<DependencyContextType>({
  dependencyManager: new DependencyManager(),
  defaultSyncStrategy: DependencySyncStrategy.PUSH,
  autoDiscoverDependencies: true
});

// Interface for provider props
interface DependencyProviderProps {
  children: React.ReactNode;
  syncStrategy?: DependencySyncStrategy;
  autoDiscoverDependencies?: boolean;
}

/**
 * Provider component for the dependency system
 */
export const DependencyProvider: React.FC<DependencyProviderProps> = ({ 
  children,
  syncStrategy = DependencySyncStrategy.PUSH,
  autoDiscoverDependencies = true
}) => {
  // Create a persistent reference to the dependency manager
  const dependencyManagerRef = useRef<DependencyManager>(new DependencyManager());
  
  // Create the context value with memoization
  const contextValue = useMemo(() => ({
    dependencyManager: dependencyManagerRef.current,
    defaultSyncStrategy: syncStrategy,
    autoDiscoverDependencies
  }), [syncStrategy, autoDiscoverDependencies]);
  
  return (
    <DependencyContext.Provider value={contextValue}>
      {children}
    </DependencyContext.Provider>
  );
};

/**
 * Hook to access the dependency context
 */
export const useDependencyContext = () => {
  const context = useContext(DependencyContext);
  
  if (!context) {
    throw new Error('useDependencyContext must be used within a DependencyProvider');
  }
  
  return context;
};

export default DependencyContext;