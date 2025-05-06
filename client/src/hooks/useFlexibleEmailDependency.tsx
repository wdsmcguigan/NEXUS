import React, { useRef, useEffect, useState, useContext, createContext } from 'react';
import { useDependencyContext } from '../context/DependencyContext';
import { FlexibleEmailDependencyBridge } from '../lib/dependency/FlexibleEmailDependencyBridge';
import { DependencyDataTypes } from '../lib/dependency/DependencyInterfaces';

// Create a context to share the bridge instance across components
const FlexibleEmailDependencyContext = createContext<FlexibleEmailDependencyBridge | null>(null);

/**
 * Provider component for Flexible Email Dependency context
 */
export function FlexibleEmailDependencyProvider({ children }: { children: React.ReactNode }) {
  const { registry, manager } = useDependencyContext();
  const bridgeRef = useRef<FlexibleEmailDependencyBridge | null>(null);
  
  // Initialize the bridge if not already created
  if (!bridgeRef.current) {
    bridgeRef.current = new FlexibleEmailDependencyBridge(registry, manager);
    console.log('[FlexibleEmailDependencyProvider] Created new bridge instance');
  }
  
  return (
    <FlexibleEmailDependencyContext.Provider value={bridgeRef.current}>
      {children}
    </FlexibleEmailDependencyContext.Provider>
  );
}

/**
 * Hook to access the Flexible Email Dependency bridge
 */
export function useFlexibleEmailDependency() {
  const bridge = useContext(FlexibleEmailDependencyContext);
  
  if (!bridge) {
    throw new Error('useFlexibleEmailDependency must be used within a FlexibleEmailDependencyProvider');
  }
  
  return bridge;
}

/**
 * Hook for email list pane components to use with the Flexible Email bridge
 */
export function useFlexibleEmailListPane(componentId: string) {
  const bridge = useFlexibleEmailDependency();
  const { manager } = useDependencyContext();
  
  // Register the component on mount
  useEffect(() => {
    bridge.registerEmailListPane(componentId);
    console.log(`[useFlexibleEmailListPane] Registered email list pane: ${componentId}`);
    
    // Clean up on unmount
    return () => {
      bridge.unregisterComponent(componentId);
      console.log(`[useFlexibleEmailListPane] Unregistered email list pane: ${componentId}`);
    };
  }, [componentId, bridge]);
  
  // Function to update email data
  const updateSelectedEmail = (email: any) => {
    if (!email) {
      console.log(`[useFlexibleEmailListPane] Skipping update for null/undefined email`);
      return;
    }
    
    console.log(`[useFlexibleEmailListPane] Sending email data from ${componentId}:`, email);
    
    // Update via the bridge
    bridge.sendEmailData(componentId, email);
    
    // Also update via the manager for backward compatibility
    manager.updateData(componentId, DependencyDataTypes.EMAIL, email);
  };
  
  return {
    updateSelectedEmail
  };
}

/**
 * Hook for email detail pane components to use with the Flexible Email bridge
 */
export function useFlexibleEmailDetailPane(componentId: string) {
  const bridge = useFlexibleEmailDependency();
  const [email, setEmail] = useState<any>(null);
  
  // Register the component on mount
  useEffect(() => {
    bridge.registerEmailDetailPane(componentId);
    console.log(`[useFlexibleEmailDetailPane] Registered email detail pane: ${componentId}`);
    
    // Clean up on unmount
    return () => {
      bridge.unregisterComponent(componentId);
      console.log(`[useFlexibleEmailDetailPane] Unregistered email detail pane: ${componentId}`);
    };
  }, [componentId, bridge]);
  
  // Create a listener for data updates from the bridge
  useEffect(() => {
    const handleDataUpdated = (event: any) => {
      if (event.targets && event.targets.includes(componentId)) {
        console.log(`[useFlexibleEmailDetailPane] Received data update for ${componentId}:`, event.data);
        setEmail(event.data);
      }
    };
    
    bridge.on('dataUpdated', handleDataUpdated);
    
    return () => {
      bridge.off('dataUpdated', handleDataUpdated);
    };
  }, [componentId, bridge]);
  
  return {
    email
  };
}