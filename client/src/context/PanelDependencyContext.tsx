/**
 * PanelDependencyContext.tsx
 * 
 * This provides a context that connects panel components to the dependency system.
 * It takes care of registering components with the PanelDependencyBridge.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useDependencyContext } from './DependencyContext';
import { 
  PanelDependencyBridge, 
  PanelComponentType
} from '../lib/dependency/PanelDependencyBridge';
import { nanoid } from 'nanoid';
import { DependencyDataTypes } from '../lib/dependency/DependencyInterfaces';

// Create context type
interface PanelDependencyContextType {
  bridge: PanelDependencyBridge;
  registerPanelComponent: (tabId: string, panelId: string, componentType: PanelComponentType, instanceId?: string) => string;
  unregisterPanelComponent: (tabId: string) => void;
  focusPanelComponent: (tabId: string) => void;
  blurPanelComponent: (tabId: string) => void;
  getComponentId: (tabId: string) => string | undefined;
  isTabConnected: (tabId: string) => boolean;
  connectTabs: (sourceTabId: string, targetTabId: string) => void;
  disconnectTabs: (sourceTabId: string, targetTabId: string) => void;
  createAllCompatibleDependencies: () => void;
  forceCreateDependency: (providerId: string, consumerId: string) => void;
  getComponentIdForTab: (tabId: string) => string | undefined;
  showDebugInfo: boolean;
}

// Create context
const PanelDependencyContext = createContext<PanelDependencyContextType | null>(null);

// Provider component
export function PanelDependencyProvider({ children }: { children: React.ReactNode }) {
  const { registry, manager } = useDependencyContext();
  const bridgeRef = useRef<PanelDependencyBridge | null>(null);
  
  // Initialize the bridge if not already created
  if (!bridgeRef.current) {
    // Cast to extended types
    const registryExt = registry as any;
    const managerExt = manager as any;
    
    // Create the bridge
    bridgeRef.current = new PanelDependencyBridge(registryExt, managerExt);
    console.log('[PanelDependencyProvider] Created new bridge');
  }
  
  const bridge = bridgeRef.current!;
  
  /**
   * Register a component in a panel
   */
  const registerPanelComponent = (
    tabId: string, 
    panelId: string, 
    componentType: PanelComponentType,
    instanceId?: string
  ): string => {
    // Generate a unique component ID if not provided
    const componentId = instanceId || `${componentType.toLowerCase()}-${nanoid(6)}`;
    
    // Register with the bridge
    bridge.registerComponent(tabId, panelId, componentType, componentId);
    
    // Fire event directly on the bridge's event emitter
    bridge.emit('componentRegister', { tabId, panelId, componentType, componentId });
    
    console.log(`[PanelDependencyProvider] Registered component ${componentId} in tab ${tabId}, panel ${panelId}`);
    
    return componentId;
  };
  
  /**
   * Unregister a component from a panel
   */
  const unregisterPanelComponent = (tabId: string): void => {
    // Fire event directly on the bridge's event emitter
    bridge.emit('componentUnregister', { tabId });
    
    // Unregister with the bridge
    bridge.unregisterComponent(tabId);
    
    console.log(`[PanelDependencyProvider] Unregistered component from tab ${tabId}`);
  };
  
  /**
   * Focus a component in a panel
   */
  const focusPanelComponent = (tabId: string): void => {
    // Fire event directly on the bridge's event emitter
    bridge.emit('componentFocus', { tabId });
    
    console.log(`[PanelDependencyProvider] Focused component in tab ${tabId}`);
  };
  
  /**
   * Blur a component in a panel
   */
  const blurPanelComponent = (tabId: string): void => {
    // Fire event directly on the bridge's event emitter
    bridge.emit('componentBlur', { tabId });
    
    console.log(`[PanelDependencyProvider] Blurred component in tab ${tabId}`);
  };
  
  /**
   * Get the component ID for a tab
   */
  const getComponentId = (tabId: string): string | undefined => {
    const registration = bridge.getRegistrationForTab(tabId);
    return registration?.componentId;
  };
  
  /**
   * Check if a tab is connected to another tab
   */
  const isTabConnected = (tabId: string): boolean => {
    const componentId = getComponentId(tabId);
    
    if (!componentId) {
      return false;
    }
    
    // Check if the component is a provider
    const asProvider = registry.getDependenciesByProvider(componentId).length > 0;
    
    // Check if the component is a consumer
    const asConsumer = registry.getDependenciesByConsumer(componentId).length > 0;
    
    return asProvider || asConsumer;
  };
  
  /**
   * Connect two tabs
   */
  const connectTabs = (sourceTabId: string, targetTabId: string): void => {
    const sourceComponentId = getComponentId(sourceTabId);
    const targetComponentId = getComponentId(targetTabId);
    
    if (!sourceComponentId || !targetComponentId) {
      console.warn('[PanelDependencyProvider] Cannot connect tabs: Component ID not found');
      return;
    }
    
    // Connect the tabs
    bridge.createConnection(sourceComponentId, targetComponentId, DependencyDataTypes.EMAIL);
    
    console.log(`[PanelDependencyProvider] Connected tab ${sourceTabId} to ${targetTabId}`);
  };
  
  /**
   * Disconnect two tabs
   */
  const disconnectTabs = (sourceTabId: string, targetTabId: string): void => {
    const sourceComponentId = getComponentId(sourceTabId);
    const targetComponentId = getComponentId(targetTabId);
    
    if (!sourceComponentId || !targetComponentId) {
      console.warn('[PanelDependencyProvider] Cannot disconnect tabs: Component ID not found');
      return;
    }
    
    // Find dependencies between these components
    const dependencies = registry.getDependenciesByProvider(sourceComponentId)
      .filter(dep => dep.consumerId === targetComponentId);
    
    // Remove each dependency
    for (const dep of dependencies) {
      registry.removeDependency(dep.id);
      console.log(`[PanelDependencyProvider] Removed dependency ${dep.id}`);
    }
    
    console.log(`[PanelDependencyProvider] Disconnected tab ${sourceTabId} from ${targetTabId}`);
  };
  
  /**
   * Create compatible dependencies between components
   */
  const createAllCompatibleDependencies = (): void => {
    bridge.findCompatibleComponents();
    console.log('[PanelDependencyProvider] Checking for compatible components');
  };
  
  /**
   * Force dependency creation between two components
   */
  const forceCreateDependency = (providerId: string, consumerId: string): void => {
    console.log(`[PanelDependencyProvider] Force creating dependency from ${providerId} to ${consumerId}`);
    bridge.createConnection(providerId, consumerId);
  };

  /**
   * Get component ID for tab (same as getComponentId but with a better name for UI code)
   */
  const getComponentIdForTab = (tabId: string): string | undefined => {
    return getComponentId(tabId);
  };
  
  // Debug flag for UI
  const showDebugInfo = true;
  
  // Context value
  const contextValue: PanelDependencyContextType = {
    bridge,
    registerPanelComponent,
    unregisterPanelComponent,
    focusPanelComponent,
    blurPanelComponent,
    getComponentId,
    isTabConnected,
    connectTabs,
    disconnectTabs,
    createAllCompatibleDependencies,
    forceCreateDependency,
    getComponentIdForTab,
    showDebugInfo
  };
  
  return (
    <PanelDependencyContext.Provider value={contextValue}>
      {children}
    </PanelDependencyContext.Provider>
  );
}

// Hook to access the panel dependency context
export function usePanelDependencyContext() {
  const context = useContext(PanelDependencyContext);
  
  if (!context) {
    throw new Error('usePanelDependencyContext must be used within a PanelDependencyProvider');
  }
  
  return context;
}

// React hook for EmailListPane components to use in panels
export function useEmailListPanel(tabId: string, panelId: string) {
  const { registerPanelComponent, unregisterPanelComponent, focusPanelComponent, blurPanelComponent, getComponentId } = usePanelDependencyContext();
  const { updateComponentData } = useDependencyContext();
  const componentIdRef = useRef<string | null>(null);
  
  // Register the component on mount
  useEffect(() => {
    componentIdRef.current = registerPanelComponent(tabId, panelId, 'EmailListPane');
    
    // Log registration
    console.log(`[useEmailListPanel] Registered EmailListPane with ID ${componentIdRef.current} in tab ${tabId}`);
    
    // Clean up on unmount
    return () => {
      unregisterPanelComponent(tabId);
      console.log(`[useEmailListPanel] Unregistered EmailListPane from tab ${tabId}`);
    };
  }, []);
  
  // Handle when the component is activated or deactivated
  useEffect(() => {
    const handleActivate = () => {
      focusPanelComponent(tabId);
    };
    
    const handleDeactivate = () => {
      blurPanelComponent(tabId);
    };
    
    // Add event listeners to the tab container
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      tabElement.addEventListener('focus', handleActivate);
      tabElement.addEventListener('blur', handleDeactivate);
    }
    
    // Clean up event listeners
    return () => {
      if (tabElement) {
        tabElement.removeEventListener('focus', handleActivate);
        tabElement.removeEventListener('blur', handleDeactivate);
      }
    };
  }, []);
  
  // Function to update email data
  const updateSelectedEmail = (email: any) => {
    if (componentIdRef.current) {
      updateComponentData(componentIdRef.current, DependencyDataTypes.EMAIL, email);
      console.log(`[useEmailListPanel] Updated email data for ${componentIdRef.current}`, email);
    }
  };
  
  return {
    componentId: componentIdRef.current,
    updateSelectedEmail
  };
}

// React hook for EmailDetailPane components to use in panels
export function useEmailDetailPanel(tabId: string, panelId: string) {
  const { registerPanelComponent, unregisterPanelComponent, focusPanelComponent, blurPanelComponent } = usePanelDependencyContext();
  const { getComponentData } = useDependencyContext();
  const [email, setEmail] = useState<any>(null);
  const componentIdRef = useRef<string | null>(null);
  
  // Register the component on mount
  useEffect(() => {
    componentIdRef.current = registerPanelComponent(tabId, panelId, 'EmailDetailPane');
    
    // Log registration
    console.log(`[useEmailDetailPanel] Registered EmailDetailPane with ID ${componentIdRef.current} in tab ${tabId}`);
    
    // Clean up on unmount
    return () => {
      unregisterPanelComponent(tabId);
      console.log(`[useEmailDetailPanel] Unregistered EmailDetailPane from tab ${tabId}`);
    };
  }, []);
  
  // Handle when the component is activated or deactivated
  useEffect(() => {
    const handleActivate = () => {
      focusPanelComponent(tabId);
    };
    
    const handleDeactivate = () => {
      blurPanelComponent(tabId);
    };
    
    // Add event listeners to the tab container
    const tabElement = document.getElementById(`tab-${tabId}`);
    if (tabElement) {
      tabElement.addEventListener('focus', handleActivate);
      tabElement.addEventListener('blur', handleDeactivate);
    }
    
    // Clean up event listeners
    return () => {
      if (tabElement) {
        tabElement.removeEventListener('focus', handleActivate);
        tabElement.removeEventListener('blur', handleDeactivate);
      }
    };
  }, []);
  
  // Poll for email data changes
  useEffect(() => {
    if (!componentIdRef.current) return;
    
    const checkForUpdates = () => {
      try {
        const data = getComponentData(componentIdRef.current!, DependencyDataTypes.EMAIL);
        
        // Only update state if the data has changed
        if (data && JSON.stringify(data) !== JSON.stringify(email)) {
          setEmail(data);
          console.log(`[useEmailDetailPanel] Received data update for ${componentIdRef.current}`, data);
        }
      } catch (error) {
        console.error('[useEmailDetailPanel] Error checking for updates:', error);
      }
    };
    
    // Check immediately
    checkForUpdates();
    
    // Then set up an interval
    const intervalId = setInterval(checkForUpdates, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [email]);
  
  return {
    componentId: componentIdRef.current,
    email
  };
}