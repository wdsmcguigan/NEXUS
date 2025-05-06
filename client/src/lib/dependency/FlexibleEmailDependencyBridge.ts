import { EventEmitter } from '../utils/EventEmitter';
import { DependencyRegistry } from './DependencyRegistry';
import { DependencyManager } from './DependencyManager';
import { DependencyDataTypes } from './DependencyInterfaces';
import { toast } from '@/hooks/use-toast';

/**
 * A specialized bridge component for the Flexible Email view.
 * This component directly manages dependencies between email list and detail panes,
 * without relying on the more abstract dependency system.
 */
export class FlexibleEmailDependencyBridge extends EventEmitter {
  private registry: DependencyRegistry;
  private manager: DependencyManager;
  private listPaneIds: Set<string> = new Set();
  private detailPaneIds: Set<string> = new Set();
  private activeConnections: Map<string, string[]> = new Map(); // Map of listId -> detailIds[]
  private autoConnectEnabled: boolean = false; // Default to false - only connect when explicitly requested

  constructor(registry: DependencyRegistry, manager: DependencyManager) {
    super();
    this.registry = registry;
    this.manager = manager;
    
    console.log('[FlexibleEmailDependencyBridge] Initialized');
  }
  
  /**
   * Register an email list pane with the bridge
   */
  registerEmailListPane(componentId: string): void {
    this.listPaneIds.add(componentId);
    console.log(`[FlexibleEmailDependencyBridge] Registered email list pane: ${componentId}`);
    
    // Attempt to connect this list pane to any detail panes
    this.connectAllPanes();
  }
  
  /**
   * Register an email detail pane with the bridge
   */
  registerEmailDetailPane(componentId: string): void {
    this.detailPaneIds.add(componentId);
    console.log(`[FlexibleEmailDependencyBridge] Registered email detail pane: ${componentId}`);
    
    // Attempt to connect this detail pane to any list panes
    this.connectAllPanes();
  }
  
  /**
   * Unregister a component from the bridge
   */
  unregisterComponent(componentId: string): void {
    if (this.listPaneIds.has(componentId)) {
      this.listPaneIds.delete(componentId);
      console.log(`[FlexibleEmailDependencyBridge] Unregistered email list pane: ${componentId}`);
    }
    
    if (this.detailPaneIds.has(componentId)) {
      this.detailPaneIds.delete(componentId);
      console.log(`[FlexibleEmailDependencyBridge] Unregistered email detail pane: ${componentId}`);
    }
    
    // Remove any connections involving this component
    this.cleanupConnections(componentId);
  }
  
  /**
   * Connect all email list panes to all email detail panes
   */
  connectAllPanes(): void {
    try {
      // Get current counts
      const listPaneCount = this.listPaneIds.size;
      const detailPaneCount = this.detailPaneIds.size;
      
      console.log(`[FlexibleEmailDependencyBridge] Connecting all panes: ${listPaneCount} list panes, ${detailPaneCount} detail panes`);
      
      // Only create connections automatically if auto-connect is enabled
      if (!this.autoConnectEnabled) {
        console.log(`[FlexibleEmailDependencyBridge] Auto-connect disabled. Skipping automatic connections.`);
        return;
      }
      
      // Skip if there are no panes to connect
      if (listPaneCount === 0 || detailPaneCount === 0) {
        console.log(`[FlexibleEmailDependencyBridge] No panes to connect. Skipping.`);
        return;
      }
      
      // Create an array from the Sets to avoid iteration issues
      const listPaneIds = Array.from(this.listPaneIds);
      const detailPaneIds = Array.from(this.detailPaneIds);
      
      console.log(`[FlexibleEmailDependencyBridge] Will connect ${listPaneIds.length} list panes to ${detailPaneIds.length} detail panes`);
      
      // For each list pane, connect to all detail panes
      let connectionCount = 0;
      
      for (let i = 0; i < listPaneIds.length; i++) {
        const listId = listPaneIds[i];
        
        for (let j = 0; j < detailPaneIds.length; j++) {
          const detailId = detailPaneIds[j];
          
          // Skip if trying to connect a pane to itself (defensive coding)
          if (listId === detailId) {
            console.log(`[FlexibleEmailDependencyBridge] Skipping self-connection for ${listId}`);
            continue;
          }
          
          try {
            this.createConnection(listId, detailId);
            connectionCount++;
          } catch (error) {
            console.error(`[FlexibleEmailDependencyBridge] Error connecting ${listId} to ${detailId}:`, error);
          }
        }
      }
      
      console.log(`[FlexibleEmailDependencyBridge] Auto-connect created ${connectionCount} connections`);
      
      // Emit an event after all connections are made
      this.emit('allConnectionsCreated', {
        timestamp: Date.now(),
        listPaneCount: listPaneIds.length,
        detailPaneCount: detailPaneIds.length,
        connectionCount
      });
      
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Error in connectAllPanes:`, error);
    }
  }
  
  /**
   * Create a direct connection between an email list pane and an email detail pane
   */
  createConnection(listPaneId: string, detailPaneId: string): void {
    console.log(`[FlexibleEmailDependencyBridge] Creating connection from ${listPaneId} to ${detailPaneId}`);
    
    // 1. First, check if both components exist
    if (!this.listPaneIds.has(listPaneId)) {
      console.warn(`[FlexibleEmailDependencyBridge] List pane ${listPaneId} not found`);
      return;
    }
    
    if (!this.detailPaneIds.has(detailPaneId)) {
      console.warn(`[FlexibleEmailDependencyBridge] Detail pane ${detailPaneId} not found`);
      return;
    }
    
    // 2. Check if this connection already exists
    if (this.activeConnections.has(listPaneId)) {
      const connections = this.activeConnections.get(listPaneId);
      if (connections?.includes(detailPaneId)) {
        console.log(`[FlexibleEmailDependencyBridge] Connection from ${listPaneId} to ${detailPaneId} already exists`);
        return;
      }
    }
    
    // 3. Define direct provider/consumer relationships for these components
    const providerId = `${listPaneId}-provider`;
    const consumerId = `${detailPaneId}-consumer`;
    
    try {
      console.log('[FlexibleEmailDependencyBridge] Registry type:', this.registry && typeof this.registry);
      console.log('[FlexibleEmailDependencyBridge] Registry methods:', 
        this.registry && Object.getOwnPropertyNames(Object.getPrototypeOf(this.registry)));

      // Defensive check for registry and method existence
      if (!this.registry || typeof this.registry.registerDefinition !== 'function') {
        throw new Error('Registry or registerDefinition method not available');
      }
      
      // Create provider definition for the list pane
      const providerDef = this.registry.registerDefinition({
        id: providerId,
        componentId: listPaneId,
        dataType: DependencyDataTypes.EMAIL,
        role: 'provider'
      });
      
      // Create consumer definition for the detail pane
      const consumerDef = this.registry.registerDefinition({
        id: consumerId,
        componentId: detailPaneId,
        dataType: DependencyDataTypes.EMAIL,
        role: 'consumer'
      });
      
      // Create the dependency between them - use the component IDs directly
      // This is a fix for a critical issue - we need to use component IDs, not definition IDs
      console.log(`[FlexibleEmailDependencyBridge] Creating dependency between ${listPaneId} and ${detailPaneId}`);
      const dependency = this.registry.createDependency(
        listPaneId, 
        detailPaneId, 
        DependencyDataTypes.EMAIL
      );
      
      // Store the connection
      if (!this.activeConnections.has(listPaneId)) {
        this.activeConnections.set(listPaneId, []);
      }
      
      const connections = this.activeConnections.get(listPaneId);
      if (connections) {
        connections.push(detailPaneId);
      }
      
      if (dependency) {
        console.log(`[FlexibleEmailDependencyBridge] Successfully created dependency: ${dependency.id}`);
        
        // Emit an event for the new connection
        this.emit('connectionCreated', {
          dependencyId: dependency.id,
          sourceId: listPaneId,
          targetId: detailPaneId
        });
      } else {
        console.warn(`[FlexibleEmailDependencyBridge] Dependency creation returned undefined`);
      }
      
      toast({
        title: 'Components Connected',
        description: `Connected ${listPaneId} to ${detailPaneId}`,
        variant: 'default'
      });
      
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Error creating connection:`, error);
      
      toast({
        title: 'Connection Failed',
        description: error.message || 'Error creating connection',
        variant: 'destructive'
      });
    }
  }
  
  /**
   * Send data directly from an email list pane to all connected email detail panes
   */
  sendEmailData(listPaneId: string, emailData: any): void {
    if (!listPaneId) {
      console.warn(`[FlexibleEmailDependencyBridge] Invalid list pane ID: ${listPaneId}`);
      return;
    }
    
    if (!emailData) {
      console.warn(`[FlexibleEmailDependencyBridge] Null or undefined email data from ${listPaneId}`);
      return;
    }
    
    // Add a simplified log without the full data to prevent console clutter
    console.log(`[FlexibleEmailDependencyBridge] Sending email data from ${listPaneId}:`, {
      id: emailData?.id,
      subject: emailData?.subject,
      metadata: emailData?.metadata,
      hasContent: !!emailData
    });
    
    if (!this.listPaneIds.has(listPaneId)) {
      console.warn(`[FlexibleEmailDependencyBridge] List pane ${listPaneId} not found`);
      return;
    }
    
    try {
      // Create sanitized version of the email data with proper null checks
      const sanitizedData = emailData ? {
        ...emailData,
        tags: Array.isArray(emailData.tags) ? emailData.tags : [],
        attachments: Array.isArray(emailData.attachments) ? emailData.attachments : [],
        recipients: Array.isArray(emailData.recipients) ? emailData.recipients : [],
        // Add metadata to track the source of this update
        metadata: {
          ...(emailData.metadata || {}),
          selectionTimestamp: Date.now(),
          source: listPaneId,
          updateType: 'email-selected'
        }
      } : null;
      
      // Directly update data through the manager
      this.manager.updateData(listPaneId, DependencyDataTypes.EMAIL, sanitizedData);
      
      // Update via connected components as well
      if (this.activeConnections.has(listPaneId)) {
        const detailIds = this.activeConnections.get(listPaneId) || [];
        
        console.log(`[FlexibleEmailDependencyBridge] Broadcasting to ${detailIds.length} detail panes`);
        
        // Emit an event for the data update
        this.emit('dataUpdated', {
          sourceId: listPaneId,
          targets: detailIds,
          data: sanitizedData
        });
      }
    } catch (error) {
      console.error('[FlexibleEmailDependencyBridge] Error sending email data:', error);
    }
  }
  
  /**
   * Clean up connections for a removed component
   */
  private cleanupConnections(componentId: string | null): void {
    if (!componentId) {
      console.warn(`[FlexibleEmailDependencyBridge] Attempted to clean up connections for null component ID`);
      return;
    }
    
    try {
      // Handle list pane removal - we need to actually remove the dependencies from the registry
      if (this.activeConnections.has(componentId)) {
        const connections = this.activeConnections.get(componentId) || [];
        
        console.log(`[FlexibleEmailDependencyBridge] Cleaning up ${connections.length} connections for list pane ${componentId}`);
        
        // For each detail pane connected to this list, remove the dependency
        for (const detailId of connections) {
          // Get the provider and consumer IDs
          const providerId = `${componentId}-provider`;
          const consumerId = `${detailId}-consumer`;
          
          // Find and remove the dependency
          try {
            const depIds = this.getRegistryDependencyIds(componentId, detailId);
            
            if (depIds.length > 0) {
              console.log(`[FlexibleEmailDependencyBridge] Removing ${depIds.length} registry dependencies between ${componentId} and ${detailId}`);
              
              // Remove each dependency from registry
              for (const depId of depIds) {
                this.registry.removeDependency(depId);
                console.log(`[FlexibleEmailDependencyBridge] Removed registry dependency: ${depId}`);
              }
            } else {
              console.log(`[FlexibleEmailDependencyBridge] No registry dependencies found between ${componentId} and ${detailId}`);
            }
          } catch (removalError) {
            console.error(`[FlexibleEmailDependencyBridge] Error removing registry dependency:`, removalError);
          }
        }
        
        // Finally remove from our active connections map
        this.activeConnections.delete(componentId);
      }
      
      // Handle detail pane removal (need to check all list panes)
      for (const [listId, detailIds] of this.activeConnections.entries()) {
        if (detailIds && Array.isArray(detailIds) && detailIds.includes(componentId)) {
          // Get the provider and consumer IDs
          const providerId = `${listId}-provider`;
          const consumerId = `${componentId}-consumer`;
          
          // Find and remove the dependency
          try {
            const depIds = this.getRegistryDependencyIds(listId, componentId);
            
            if (depIds.length > 0) {
              console.log(`[FlexibleEmailDependencyBridge] Removing ${depIds.length} registry dependencies between ${listId} and ${componentId}`);
              
              // Remove each dependency from registry
              for (const depId of depIds) {
                this.registry.removeDependency(depId);
                console.log(`[FlexibleEmailDependencyBridge] Removed registry dependency: ${depId}`);
              }
            } else {
              console.log(`[FlexibleEmailDependencyBridge] No registry dependencies found between ${listId} and ${componentId}`);
            }
          } catch (removalError) {
            console.error(`[FlexibleEmailDependencyBridge] Error removing registry dependency:`, removalError);
          }
          
          // Update our active connections map
          const updatedDetails = detailIds.filter(id => id !== componentId);
          this.activeConnections.set(listId, updatedDetails);
          
          console.log(`[FlexibleEmailDependencyBridge] Removed connection from ${listId} to ${componentId}`);
        }
      }
      
      // Emit an event about the connection removal
      this.emit('connectionRemoved', {
        componentId: componentId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Error cleaning up connections:`, error);
    }
  }
  
  /**
   * Helper method to find dependency IDs in the registry between two components
   */
  private getRegistryDependencyIds(providerId: string, consumerId: string): string[] {
    try {
      // Get the actual dependency IDs from the registry
      const providerDepIds = this.registry.getDependenciesByProvider(providerId);
      const consumerDepIds = this.registry.getDependenciesByConsumer(consumerId);
      
      // Find dependencies that connect these two components
      const matchingDepIds: string[] = [];
      
      // Provider dependencies - we need to cast the array items to string
      // (these are already dependency IDs even though TypeScript doesn't recognize it)
      if (providerDepIds && providerDepIds.length > 0) {
        for (const depId of providerDepIds) {
          const dep = this.registry.getDependency(depId as string);
          if (dep && dep.consumerId === consumerId) {
            matchingDepIds.push(depId as string);
          }
        }
      }
      
      // Consumer dependencies - same casting needed
      if (consumerDepIds && consumerDepIds.length > 0) {
        for (const depId of consumerDepIds) {
          const dep = this.registry.getDependency(depId as string);
          if (dep && dep.providerId === providerId) {
            matchingDepIds.push(depId as string);
          }
        }
      }
      
      console.log(`[FlexibleEmailDependencyBridge] Found ${matchingDepIds.length} dependencies between ${providerId} and ${consumerId}`);
      return matchingDepIds;
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Error finding dependency IDs:`, error);
      return [];
    }
  }
  
  /**
   * Get all active list pane IDs
   */
  getListPaneIds(): string[] {
    return Array.from(this.listPaneIds);
  }
  
  /**
   * Get all active detail pane IDs
   */
  getDetailPaneIds(): string[] {
    return Array.from(this.detailPaneIds);
  }
  
  /**
   * Get all connections for a specific list pane
   */
  getConnectionsForListPane(listPaneId: string): string[] {
    return this.activeConnections.get(listPaneId) || [];
  }
  
  /**
   * Remove a specific connection
   */
  /**
   * Remove a specific connection between a list pane and a detail pane
   * @param listPaneId The ID of the email list pane (provider)
   * @param detailPaneId The ID of the email detail pane (consumer)
   */
  removeConnection(listPaneId: string, detailPaneId: string): void {
    try {
      console.log(`[FlexibleEmailDependencyBridge] Attempting to remove connection from ${listPaneId} to ${detailPaneId}`);
      
      // Input validation - null checks
      if (!listPaneId || !detailPaneId) {
        console.warn(`[FlexibleEmailDependencyBridge] Cannot remove connection: Invalid IDs provided`, { listPaneId, detailPaneId });
        return;
      }
      
      // First, make sure these components exist in our registry
      if (!this.listPaneIds.has(listPaneId)) {
        console.warn(`[FlexibleEmailDependencyBridge] Cannot remove connection: List pane ${listPaneId} not found`);
        return;
      }
      
      if (!this.detailPaneIds.has(detailPaneId)) {
        console.warn(`[FlexibleEmailDependencyBridge] Cannot remove connection: Detail pane ${detailPaneId} not found`);
        return;
      }
      
      // Update our internal connection tracking
      if (this.activeConnections.has(listPaneId)) {
        const connections = this.activeConnections.get(listPaneId) || [];
        
        // Check if this connection actually exists
        if (!connections.includes(detailPaneId)) {
          console.warn(`[FlexibleEmailDependencyBridge] No active connection found from ${listPaneId} to ${detailPaneId}`);
          
          // Even though our tracking doesn't show a connection, we'll still check the registry
          // to ensure we're not leaving orphaned dependencies
          console.log(`[FlexibleEmailDependencyBridge] Checking for orphaned dependencies anyway...`);
        }
        
        // Find and remove the dependency in the registry
        try {
          // Check both ways - from list to detail and detail to list
          // since connections can sometimes be asymmetrically tracked
          const depIds = this.getRegistryDependencyIds(listPaneId, detailPaneId);
          
          if (depIds.length > 0) {
            console.log(`[FlexibleEmailDependencyBridge] Removing ${depIds.length} registry dependencies between ${listPaneId} and ${detailPaneId}`);
            
            let successCount = 0;
            
            // Remove each dependency from registry
            for (const depId of depIds) {
              try {
                const result = this.registry.removeDependency(depId);
                if (result) {
                  console.log(`[FlexibleEmailDependencyBridge] Successfully removed registry dependency: ${depId}`);
                  successCount++;
                } else {
                  console.warn(`[FlexibleEmailDependencyBridge] Failed to remove registry dependency: ${depId}`);
                }
              } catch (depError) {
                console.error(`[FlexibleEmailDependencyBridge] Error removing dependency ${depId}:`, depError);
              }
            }
            
            console.log(`[FlexibleEmailDependencyBridge] Removed ${successCount}/${depIds.length} dependencies`);
          } else {
            console.log(`[FlexibleEmailDependencyBridge] No registry dependencies found between ${listPaneId} and ${detailPaneId}`);
          }
          
          // Update our active connections map regardless of registry results
          // This ensures our internal tracking is clean even if registry removal fails
          const updatedConnections = connections.filter(id => id !== detailPaneId);
          this.activeConnections.set(listPaneId, updatedConnections);
          
          console.log(`[FlexibleEmailDependencyBridge] Removed connection from ${listPaneId} to ${detailPaneId}`);
          
          // Also check if the connection exists in the reverse direction
          // (this shouldn't happen, but we're being defensive)
          if (this.activeConnections.has(detailPaneId)) {
            const reverseConnections = this.activeConnections.get(detailPaneId) || [];
            if (reverseConnections.includes(listPaneId)) {
              console.warn(`[FlexibleEmailDependencyBridge] Found reverse connection from ${detailPaneId} to ${listPaneId}, removing it`);
              const updatedReverseConnections = reverseConnections.filter(id => id !== listPaneId);
              this.activeConnections.set(detailPaneId, updatedReverseConnections);
            }
          }
          
          // Emit an event about this connection removal
          this.emit('connectionRemoved', {
            sourceId: listPaneId,
            targetId: detailPaneId,
            timestamp: Date.now()
          });
          
          // Display toast notification
          toast({
            title: 'Connection Removed',
            description: `Disconnected ${listPaneId} from ${detailPaneId}`,
            variant: 'default'
          });
          
        } catch (error) {
          console.error(`[FlexibleEmailDependencyBridge] Error removing connection:`, error);
          
          toast({
            title: 'Error Removing Connection',
            description: `Failed to disconnect ${listPaneId} from ${detailPaneId}`,
            variant: 'destructive'
          });
        }
      } else {
        console.warn(`[FlexibleEmailDependencyBridge] List pane ${listPaneId} has no tracked connections to remove`);
        
        // Even when no connections are tracked, we'll still try to clean up any orphaned dependencies
        // This handles the case where our tracking gets out of sync with the registry
        const depIds = this.getRegistryDependencyIds(listPaneId, detailPaneId);
        if (depIds.length > 0) {
          console.warn(`[FlexibleEmailDependencyBridge] Found ${depIds.length} orphaned dependencies to clean up`);
          for (const depId of depIds) {
            try {
              this.registry.removeDependency(depId);
              console.log(`[FlexibleEmailDependencyBridge] Removed orphaned dependency: ${depId}`);
            } catch (depError) {
              console.error(`[FlexibleEmailDependencyBridge] Error removing orphaned dependency:`, depError);
            }
          }
        }
      }
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Critical error in removeConnection:`, error);
      
      toast({
        title: 'System Error',
        description: 'An unexpected error occurred while managing connections',
        variant: 'destructive'
      });
    }
  }
  
  /**
   * Set whether automatic connections should be created
   */
  setAutoConnect(enabled: boolean): void {
    this.autoConnectEnabled = enabled;
    console.log(`[FlexibleEmailDependencyBridge] Auto-connect ${enabled ? 'enabled' : 'disabled'}`);
    
    // If enabling, try to connect all panes
    if (enabled) {
      this.connectAllPanes();
    }
  }
  
  /**
   * Get the current auto-connect setting
   */
  getAutoConnect(): boolean {
    return this.autoConnectEnabled;
  }
  
  /**
   * Force trigger an update for a specific connection
   * @param listPaneId The ID of the email list pane (source)
   * @param detailPaneId The ID of the email detail pane (target)
   */
  forceUpdateConnection(listPaneId: string, detailPaneId: string): void {
    console.log(`[FlexibleEmailDependencyBridge] Force updating connection from ${listPaneId} to ${detailPaneId}`);
    
    try {
      // First, verify the components exist
      if (!this.listPaneIds.has(listPaneId) || !this.detailPaneIds.has(detailPaneId)) {
        console.warn(`[FlexibleEmailDependencyBridge] Cannot force update: invalid components`, { listPaneId, detailPaneId });
        return;
      }
      
      // Get registry dependency IDs
      const depIds = this.getRegistryDependencyIds(listPaneId, detailPaneId);
      
      if (depIds.length === 0) {
        console.warn(`[FlexibleEmailDependencyBridge] No dependencies found between components, attempting to create connection first`);
        this.createConnection(listPaneId, detailPaneId);
        
        // Get the new dependencies after creation
        const newDepIds = this.getRegistryDependencyIds(listPaneId, detailPaneId);
        
        if (newDepIds.length === 0) {
          console.error(`[FlexibleEmailDependencyBridge] Failed to create dependencies for force update`);
          return;
        }
        
        // Use the newly created dependencies
        for (const depId of newDepIds) {
          console.log(`[FlexibleEmailDependencyBridge] Force triggering update for new dependency: ${depId}`);
          this.manager.forceTriggerUpdate(depId);
        }
      } else {
        // Force update each dependency
        for (const depId of depIds) {
          console.log(`[FlexibleEmailDependencyBridge] Force triggering update for existing dependency: ${depId}`);
          this.manager.forceTriggerUpdate(depId);
        }
      }
      
      // Emit a force update event
      this.emit('connectionForceUpdated', {
        sourceId: listPaneId,
        targetId: detailPaneId,
        timestamp: Date.now()
      });
      
      // Display toast notification
      toast({
        title: 'Connection Refreshed',
        description: `Refreshed data flow from ${listPaneId} to ${detailPaneId}`,
        variant: 'default'
      });
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Error during force update:`, error);
      
      toast({
        title: 'Error Refreshing Connection',
        description: `Failed to refresh connection data flow`,
        variant: 'destructive'
      });
    }
  }
  
  /**
   * Force updates all active connections
   */
  forceUpdateAllConnections(): void {
    console.log(`[FlexibleEmailDependencyBridge] Force updating all connections`);
    
    try {
      // Iterate through all active connections
      for (const [listPaneId, detailPaneIds] of this.activeConnections.entries()) {
        for (const detailPaneId of detailPaneIds) {
          this.forceUpdateConnection(listPaneId, detailPaneId);
        }
      }
      
      toast({
        title: 'All Connections Refreshed',
        description: `Refreshed data flow for all active connections`,
        variant: 'default'
      });
    } catch (error) {
      console.error(`[FlexibleEmailDependencyBridge] Error updating all connections:`, error);
      
      toast({
        title: 'Error Refreshing Connections',
        description: `Failed to refresh all connections`,
        variant: 'destructive'
      });
    }
  }
}