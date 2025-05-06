/**
 * PanelDependencyContext.tsx
 * 
 * This context provides the bridge between the Panel system and Dependency system
 * to all components in the application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDependencyContext } from './DependencyContext';
import { useTabContext } from './TabContext';
import { 
  PanelDependencyBridge, 
  createPanelDependencyBridge, 
  PanelDependencyEvents,
  PanelComponentType
} from '../lib/dependency/PanelDependencyBridge';
import { DependencyStatus, DependencyDataTypes } from '../lib/dependency/DependencyInterfaces';

// Define the context type
export interface PanelDependencyContextType {
  bridge: PanelDependencyBridge;
  registerPanelComponent: (
    tabId: string, 
    panelId: string, 
    componentType: PanelComponentType,
    metadata?: Record<string, any>
  ) => void;
  unregisterPanelComponent: (tabId: string) => void;
  focusPanelComponent: (tabId: string) => void;
  updatePanelComponentData: (tabId: string, dataType: DependencyDataTypes, data: any) => void;
  createAllCompatibleDependencies: () => void;
  isDependencyReady: (providerId: string, consumerId: string) => boolean;
  getComponentIdForTab: (tabId: string) => string | undefined;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
}

// Create the context
const PanelDependencyContext = createContext<PanelDependencyContextType | undefined>(undefined);

// Provider component
export function PanelDependencyProvider({ children }: { children: React.ReactNode }) {
  const dependencyContext = useDependencyContext();
  const { registry, manager } = dependencyContext;
  const [bridge, setBridge] = useState<PanelDependencyBridge | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Initialize the bridge
  useEffect(() => {
    const bridgeInstance = createPanelDependencyBridge(registry, manager);
    setBridge(bridgeInstance);
    
    console.log('[PanelDependencyContext] Bridge initialized');
    
    return () => {
      // Clean up event listeners when the context is unmounted
      console.log('[PanelDependencyContext] Cleaning up bridge');
    };
  }, [registry, manager]);
  
  // Register a panel component with the bridge
  const registerPanelComponent = (
    tabId: string, 
    panelId: string, 
    componentType: PanelComponentType,
    metadata?: Record<string, any>
  ) => {
    if (!bridge) return;
    
    bridge.registerComponent({
      tabId,
      panelId,
      instanceId: `${componentType}-${tabId}`,
      componentType,
      metadata
    });
    
    console.log(`[PanelDependencyContext] Registered panel component: ${tabId} (${componentType})`);
  };
  
  // Unregister a panel component from the bridge
  const unregisterPanelComponent = (tabId: string) => {
    if (!bridge) return;
    
    bridge.unregisterComponent(tabId);
  };
  
  // Focus a panel component
  const focusPanelComponent = (tabId: string) => {
    if (!bridge) return;
    
    bridge.focusComponent(tabId);
  };
  
  // Update a panel component's data
  const updatePanelComponentData = (tabId: string, dataType: DependencyDataTypes, data: any) => {
    if (!bridge) return;
    
    bridge.updateComponentData(tabId, dataType, data);
  };
  
  // Create dependencies between all compatible components
  const createAllCompatibleDependencies = () => {
    if (!bridge) return;
    
    bridge.createDependenciesBetweenCompatibleComponents();
  };
  
  // Check if a dependency is ready
  const isDependencyReady = (providerId: string, consumerId: string): boolean => {
    const dependencies = registry.getDependenciesByProvider(providerId)
      .filter(dep => dep.consumerId === consumerId);
    
    if (dependencies.length === 0) return false;
    
    return dependencies[0].status === DependencyStatus.READY || 
           dependencies[0].status === DependencyStatus.CONNECTED;
  };
  
  // Get the normalized component ID for a tab ID
  const getComponentIdForTab = (tabId: string): string | undefined => {
    if (!bridge) return undefined;
    
    return bridge.getComponentIdForTab(tabId);
  };
  
  // Context value
  const contextValue: PanelDependencyContextType = {
    bridge: bridge!,
    registerPanelComponent,
    unregisterPanelComponent,
    focusPanelComponent,
    updatePanelComponentData,
    createAllCompatibleDependencies,
    isDependencyReady,
    getComponentIdForTab,
    showDebugInfo,
    setShowDebugInfo
  };
  
  // Only render the provider when the bridge is initialized
  if (!bridge) {
    return <div>Initializing dependency bridge...</div>;
  }
  
  return (
    <PanelDependencyContext.Provider value={contextValue}>
      {children}
    </PanelDependencyContext.Provider>
  );
}

// Hook to access the panel dependency context
export function usePanelDependencyContext(): PanelDependencyContextType {
  const context = useContext(PanelDependencyContext);
  
  if (context === undefined) {
    throw new Error('usePanelDependencyContext must be used within a PanelDependencyProvider');
  }
  
  return context;
}

// Custom hook for email list panels to register themselves
export function useEmailListPanel(tabId: string, panelId: string) {
  const { 
    registerPanelComponent, 
    unregisterPanelComponent, 
    updatePanelComponentData, 
    getComponentIdForTab 
  } = usePanelDependencyContext();
  
  // Register the component when mounted
  useEffect(() => {
    registerPanelComponent(tabId, panelId, PanelComponentType.EMAIL_LIST);
    
    // Unregister on unmount
    return () => {
      unregisterPanelComponent(tabId);
    };
  }, [tabId, panelId, registerPanelComponent, unregisterPanelComponent]);
  
  // Return the functions needed by the panel
  return {
    updateEmailData: (data: any) => updatePanelComponentData(tabId, DependencyDataTypes.EMAIL_DATA, data),
    componentId: getComponentIdForTab(tabId)
  };
}

// Custom hook for email detail panels to register themselves
export function useEmailDetailPanel(tabId: string, panelId: string) {
  const { 
    registerPanelComponent, 
    unregisterPanelComponent,
    getComponentIdForTab 
  } = usePanelDependencyContext();
  const dependencyContext = useDependencyContext();
  const [emailData, setEmailData] = useState<any>(null);
  
  // Register the component when mounted
  useEffect(() => {
    registerPanelComponent(tabId, panelId, PanelComponentType.EMAIL_DETAIL);
    
    // Unregister on unmount
    return () => {
      unregisterPanelComponent(tabId);
    };
  }, [tabId, panelId, registerPanelComponent, unregisterPanelComponent]);
  
  // Get the normalized component ID
  const componentId = getComponentIdForTab(tabId);
  
  // Listen for data updates
  useEffect(() => {
    if (!componentId) return;
    
    // Get initial data
    const initialData = dependencyContext.getComponentData(componentId, DependencyDataTypes.EMAIL_DATA);
    if (initialData) {
      setEmailData(initialData);
    }
    
    // Subscribe to data updates
    const dependencies = dependencyContext.registry.getDependenciesByConsumer(componentId)
      .filter(dep => dep.dataType === DependencyDataTypes.EMAIL_DATA);
    
    if (dependencies.length === 0) return;
    
    const dependencyId = dependencies[0].id;
    
    const handleDataUpdate = (data: any) => {
      console.log(`[EmailDetailPanel ${tabId}] Received data update:`, data);
      setEmailData(data);
    };
    
    const unsubscribe = dependencyContext.manager.onDataUpdate(dependencyId, handleDataUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [componentId, dependencyContext, tabId]);
  
  // Return the data and component ID
  return {
    emailData,
    componentId
  };
}

// Visual debug component to show the panel dependency bridge state
export function PanelDependencyDebugger() {
  const { bridge, showDebugInfo, setShowDebugInfo } = usePanelDependencyContext();
  const [debugState, setDebugState] = useState<Record<string, any>>({});
  const [dependencies, setDependencies] = useState<any[]>([]);
  const dependencyContext = useDependencyContext();
  
  // Update debug state every second
  useEffect(() => {
    if (!showDebugInfo) return;
    
    // Print debug state to console
    bridge.debugState();
    
    // Get all dependencies from the registry
    const allDependencies = dependencyContext.registry.getAllDefinitions()
      .map(def => ({
        id: def.id,
        componentId: def.componentId,
        dataType: def.dataType,
        role: def.role
      }));
    
    setDependencies(allDependencies);
    
    // Update debug state
    setDebugState({
      componentTypes: {
        EMAIL_LIST: Array.from(bridge['componentTypeMap'].get(PanelComponentType.EMAIL_LIST) || []),
        EMAIL_DETAIL: Array.from(bridge['componentTypeMap'].get(PanelComponentType.EMAIL_DETAIL) || [])
      },
      registeredComponents: Array.from(bridge['registeredComponents'].entries()),
      activeComponents: Array.from(bridge['activeComponents']),
      tabToComponentMap: Array.from(bridge['tabToComponentMap'].entries()),
    });
    
    const interval = setInterval(() => {
      // Update debug state every second only if debugger is shown
      if (showDebugInfo) {
        bridge.debugState();
        
        // Get all dependencies from the registry
        const allDeps = dependencyContext.registry.getAllDefinitions()
          .map(def => ({
            id: def.id,
            componentId: def.componentId,
            dataType: def.dataType,
            role: def.role
          }));
        
        setDependencies(allDeps);
        
        // Update debug state
        setDebugState({
          componentTypes: {
            EMAIL_LIST: Array.from(bridge['componentTypeMap'].get(PanelComponentType.EMAIL_LIST) || []),
            EMAIL_DETAIL: Array.from(bridge['componentTypeMap'].get(PanelComponentType.EMAIL_DETAIL) || [])
          },
          registeredComponents: Array.from(bridge['registeredComponents'].entries()),
          activeComponents: Array.from(bridge['activeComponents']),
          tabToComponentMap: Array.from(bridge['tabToComponentMap'].entries()),
        });
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [bridge, showDebugInfo, dependencyContext.registry]);
  
  if (!showDebugInfo) {
    return (
      <button 
        onClick={() => setShowDebugInfo(true)}
        className="fixed bottom-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
      >
        Show Dependency Debug
      </button>
    );
  }
  
  return (
    <div className="fixed top-16 left-4 z-50 bg-neutral-900 border border-neutral-700 rounded-md p-4 text-white text-xs w-96 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Panel Dependency Bridge Debug</h3>
        <button 
          onClick={() => setShowDebugInfo(false)}
          className="text-neutral-400 hover:text-white"
        >
          Close
        </button>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-1">Registered Components</h4>
        <div className="bg-neutral-800 p-2 rounded">
          <h5 className="text-blue-400">EMAIL_LIST</h5>
          <ul className="ml-2">
            {debugState.componentTypes?.EMAIL_LIST.map((tabId: string) => (
              <li key={tabId}>
                Tab: {tabId} → Component: {bridge.getComponentIdForTab(tabId)}
              </li>
            ))}
          </ul>
          
          <h5 className="text-green-400 mt-2">EMAIL_DETAIL</h5>
          <ul className="ml-2">
            {debugState.componentTypes?.EMAIL_DETAIL.map((tabId: string) => (
              <li key={tabId}>
                Tab: {tabId} → Component: {bridge.getComponentIdForTab(tabId)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-1">Dependencies</h4>
        <button 
          onClick={() => bridge.createDependenciesBetweenCompatibleComponents()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mb-2"
        >
          Create Compatible Dependencies
        </button>
        <div className="bg-neutral-800 p-2 rounded">
          {dependencies.length === 0 ? (
            <p>No dependencies registered</p>
          ) : (
            <ul>
              {dependencies.map(dep => (
                <li key={dep.id} className={dep.role === 'provider' ? 'text-yellow-400' : 'text-purple-400'}>
                  {dep.role}: {dep.componentId} ({dep.dataType})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-1">Active Components</h4>
        <div className="bg-neutral-800 p-2 rounded">
          {debugState.activeComponents?.length === 0 ? (
            <p>No active components</p>
          ) : (
            <ul>
              {debugState.activeComponents?.map((componentId: string) => (
                <li key={componentId}>{componentId}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div>
        <button 
          onClick={() => {
            console.log('Full Debug State:', debugState);
            console.log('Bridge:', bridge);
          }}
          className="bg-neutral-700 hover:bg-neutral-600 text-white px-2 py-1 rounded text-xs"
        >
          Log Full State to Console
        </button>
      </div>
    </div>
  );
}