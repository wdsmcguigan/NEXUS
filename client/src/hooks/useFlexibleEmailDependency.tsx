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
  const [connectedDetailPanes, setConnectedDetailPanes] = useState<string[]>([]);
  
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
  
  // Update the connection status whenever it changes
  useEffect(() => {
    const updateConnectionStatus = () => {
      if (componentId) {
        try {
          const connected = bridge.getConnectedDetailPanes(componentId);
          setConnectedDetailPanes(connected || []);
          console.log(`[useFlexibleEmailListPane] Updated connections for ${componentId}:`, connected?.length || 0);
        } catch (error) {
          console.error(`[useFlexibleEmailListPane] Error getting connections:`, error);
          setConnectedDetailPanes([]);
        }
      }
    };
    
    // Initial update
    updateConnectionStatus();
    
    // Listen for connection changes
    const handleConnectionChange = () => {
      updateConnectionStatus();
    };
    
    bridge.on('connectionCreated', handleConnectionChange);
    bridge.on('connectionRemoved', handleConnectionChange);
    bridge.on('connectionForceUpdated', handleConnectionChange);
    
    return () => {
      bridge.off('connectionCreated', handleConnectionChange);
      bridge.off('connectionRemoved', handleConnectionChange);
      bridge.off('connectionForceUpdated', handleConnectionChange);
    };
  }, [componentId, bridge]);
  
  // Function to update email data
  const updateSelectedEmail = (email: any) => {
    if (!email) {
      console.log(`[useFlexibleEmailListPane] Skipping update for null/undefined email`);
      return;
    }
    
    console.log(`[useFlexibleEmailListPane] Sending email data from ${componentId}:`, email);
    
    try {
      // Update via the bridge
      if (componentId && bridge) {
        bridge.sendEmailData(componentId, email);
      }
      
      // Also update via the manager for backward compatibility
      if (manager && componentId) {
        manager.updateData(componentId, DependencyDataTypes.EMAIL, email);
      }
      
      // If we have connections, force update them for immediate data flow
      if (connectedDetailPanes.length > 0) {
        console.log(`[useFlexibleEmailListPane] Force updating ${connectedDetailPanes.length} connections`);
        forceUpdateConnections();
      }
    } catch (error) {
      console.error(`[useFlexibleEmailListPane] Error sending email data:`, error);
    }
  };
  
  // Function to force update all connections
  const forceUpdateConnections = () => {
    try {
      if (!componentId) {
        console.warn(`[useFlexibleEmailListPane] Cannot force update: No component ID`);
        return;
      }
      
      const detailPanes = bridge.getConnectedDetailPanes(componentId);
      console.log(`[useFlexibleEmailListPane] Forcing update of ${detailPanes.length} connections`);
      
      if (detailPanes && detailPanes.length > 0) {
        detailPanes.forEach(detailPaneId => {
          bridge.forceUpdateConnection(componentId, detailPaneId);
        });
      }
    } catch (error) {
      console.error(`[useFlexibleEmailListPane] Error forcing connection updates:`, error);
    }
  };
  
  return {
    updateSelectedEmail,
    forceUpdateConnections,
    connectedDetailPanes
  };
}

/**
 * Hook for email detail pane components to use with the Flexible Email bridge
 */
export function useFlexibleEmailDetailPane(componentId: string) {
  const bridge = useFlexibleEmailDependency();
  const [email, setEmail] = useState<any>(null);
  const [connectedListPanes, setConnectedListPanes] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
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
  
  // Update connected list panes whenever connections change
  useEffect(() => {
    const updateConnectionStatus = () => {
      if (!componentId) return;
      
      // Find any list panes that have this detail pane as a connection
      const connected: string[] = [];
      const listPaneIds = bridge.getListPaneIds();
      
      listPaneIds.forEach(listPaneId => {
        const connections = bridge.getConnectionsForListPane(listPaneId);
        if (connections && connections.includes(componentId)) {
          connected.push(listPaneId);
        }
      });
      
      setConnectedListPanes(connected);
      setConnectionStatus(connected.length > 0 ? 'connected' : 'disconnected');
      
      console.log(`[useFlexibleEmailDetailPane] Connection status for ${componentId}:`, 
        connected.length > 0 ? `Connected to ${connected.length} sources` : 'Disconnected');
    };
    
    // Initial update
    updateConnectionStatus();
    
    // Update when connections change
    const handleConnectionChange = () => {
      updateConnectionStatus();
    };
    
    bridge.on('connectionCreated', handleConnectionChange);
    bridge.on('connectionRemoved', handleConnectionChange);
    bridge.on('connectionForceUpdated', handleConnectionChange);
    
    return () => {
      bridge.off('connectionCreated', handleConnectionChange);
      bridge.off('connectionRemoved', handleConnectionChange);
      bridge.off('connectionForceUpdated', handleConnectionChange);
    };
  }, [componentId, bridge]);
  
  // Create a listener for data updates from the bridge
  useEffect(() => {
    const handleDataUpdated = (event: any) => {
      try {
        if (event && event.targets && Array.isArray(event.targets) && componentId && 
            event.targets.includes(componentId)) {
          console.log(`[useFlexibleEmailDetailPane] Received data update for ${componentId}:`, event.data);
          setEmail(event.data);
        }
      } catch (error) {
        console.error(`[useFlexibleEmailDetailPane] Error handling data update:`, error);
      }
    };
    
    if (bridge) {
      bridge.on('dataUpdated', handleDataUpdated);
    }
    
    return () => {
      if (bridge) {
        bridge.off('dataUpdated', handleDataUpdated);
      }
    };
  }, [componentId, bridge]);
  
  // Force-request updates from all connected list panes
  const forceRequestUpdates = () => {
    if (!componentId) return;
    
    try {
      console.log(`[useFlexibleEmailDetailPane] Requesting forced update from ${connectedListPanes.length} sources`);
      
      connectedListPanes.forEach(listPaneId => {
        bridge.forceUpdateConnection(listPaneId, componentId);
      });
    } catch (error) {
      console.error(`[useFlexibleEmailDetailPane] Error forcing updates:`, error);
    }
  };
  
  return {
    email,
    selectedEmail: email,  // Add the selectedEmail alias for compatibility with EmailDetailPane
    connectedListPanes,
    connectionStatus,
    forceRequestUpdates,
    isConnected: connectionStatus === 'connected'
  };
}