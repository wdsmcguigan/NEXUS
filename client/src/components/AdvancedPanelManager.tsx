import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PanelContainer } from './PanelContainer';
import { DragOverlay } from './DragOverlay';
import { usePanelContext, PanelConfig } from '../context/PanelContext';
import { nanoid } from 'nanoid';
import { useDragContext, DropTarget, DropTargetType, DropDirection, DragItem } from '../context/DragContext';

export function AdvancedPanelManager() {
  const { layout, updateLayout, moveTab } = usePanelContext();
  const { isDragging, dragItem, dropTarget, setDropTarget, endDrag } = useDragContext();
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);
  
  // Extract drag data from dragItem if it exists and is a tab
  const dragData = dragItem && dragItem.type === 'tab' 
    ? { tabId: dragItem.id, sourcePanelId: dragItem.sourcePanelId || '' } 
    : null;
    
  // Flag to track if we processed a drop
  const processingDropRef = useRef(false);

  const handleMaximizePanel = (panelId: string) => {
    setMaximizedPanelId(panelId);
  };

  const handleRestorePanel = () => {
    setMaximizedPanelId(null);
  };

  // These local methods are now deprecated as we're using the dragContext
  // Keeping them for backward compatibility until all components are migrated
  const handleDragStart = useCallback((tabId: string, panelId: string) => {
    console.log('Using deprecated handleDragStart, use startDrag from DragContext instead');
  }, []);

  // Use the endDrag method from dragContext directly
  const handleDragEnd = useCallback(() => {
    // When calling endDrag, pass true to signify a successful drop
    // This cleans up the drag state but preserves the drop target info
    endDrag(true);
  }, [endDrag]);

  // Find a panel by ID in the layout tree
  const findPanel = useCallback((layout: PanelConfig, panelId: string): PanelConfig | null => {
    if (layout.id === panelId) {
      return layout;
    }
    
    if (layout.children) {
      for (const child of layout.children) {
        const found = findPanel(child, panelId);
        if (found) return found;
      }
    }
    
    return null;
  }, []);

  // Helper function to update a specific panel in the layout tree
  const updatePanelInLayout = useCallback((layout: PanelConfig, panelId: string, updater: (panel: PanelConfig) => PanelConfig): PanelConfig => {
    if (layout.id === panelId) {
      return updater(layout);
    }
    
    if (layout.children) {
      return {
        ...layout,
        children: layout.children.map(child => updatePanelInLayout(child, panelId, updater))
      };
    }
    
    return layout;
  }, []);

  // Create a new panel by splitting an existing one
  const handleSplitPanel = useCallback((panelId: string, direction: 'horizontal' | 'vertical', newPanel?: PanelConfig) => {
    console.log('💡 Creating split panel:', { panelId, direction, newPanel });
    
    try {
      // Find the panel to split
      const panel = findPanel(layout, panelId);
      if (!panel) {
        console.error(`Panel ${panelId} not found for splitting`);
        return;
      }
      
      // Create a new panel ID if not provided
      const newPanelId = newPanel?.id || `panel-${nanoid()}`;
      
      // Create the actual new panel config or use the provided one
      const actualNewPanel: PanelConfig = newPanel || {
        id: newPanelId,
        type: 'panel',
        size: 50,
        tabs: [],
        contents: [],
        activeTabId: undefined
      };
      
      console.log('🔄 Creating split with panels:', {
        existingPanel: panelId,
        newPanel: newPanelId,
        direction
      });
      
      // Update the layout - create a new split structure
      let newLayout = updatePanelInLayout(
        layout,
        panelId,
        panel => {
          // The current panel becomes a parent with children
          // We need to make a deep copy of the panel to avoid mutating the original
          const panelCopy = { 
            ...panel,
            id: `${panel.id}-child`,
            size: 50 // Set the size explicitly
          };
          
          // Don't copy over properties that shouldn't be inherited
          if (panelCopy.type === 'split') {
            delete panelCopy.children;
          }
          
          // Create the new split panel structure
          const updatedPanel: PanelConfig = {
            id: panel.id, // Keep the original ID for the parent
            type: 'split',
            direction,
            minSize: panel.minSize,
            size: panel.size,
            tabs: [], // Empty tabs array for parent panels
            children: direction === 'horizontal'
              ? [panelCopy, { ...actualNewPanel, size: 50 }]
              : [{ ...actualNewPanel, size: 50 }, panelCopy]
          };
          
          return updatedPanel;
        }
      );
      
      // Update the layout in state
      console.log('📋 Applying new layout with split panel');
      updateLayout(newLayout);
      
      return newPanelId; // Return the ID of the new panel
    } catch (err) {
      console.error('Error in handleSplitPanel:', err);
    }
  }, [layout, findPanel, updateLayout, updatePanelInLayout]);

  // Handle dropping a tab onto a panel - this is the critical part that connects the drag to the state change
  const handlePanelDrop = useCallback((target: DropTarget) => {
    console.log('📌 DROP EVENT triggered with target:', target);
    
    // First check if we have drag data
    if (!dragItem || dragItem.type !== 'tab') {
      console.error('handlePanelDrop called without valid drag data', { target, dragItem });
      return;
    }
    
    // Extract the necessary info from the drag item
    const sourceTabId = dragItem.id;
    const sourcePanelId = dragItem.sourcePanelId || '';
    
    // Make sure we have the required data
    if (!sourceTabId || !sourcePanelId) {
      console.error('Invalid drag data', { sourceTabId, sourcePanelId });
      return;
    }
    
    console.log('⚡ Processing tab drop:', { 
      sourceTabId, 
      sourcePanelId, 
      targetType: target.type,
      targetId: target.id
    });
    
    try {
      // Handle different target types
      if (target.type === 'panel' || target.type === 'tabbar') {
        // This is a drop directly onto a panel or tabbar
        const targetPanelId = target.id;
        
        console.log('🎯 Moving tab to panel', { 
          tab: sourceTabId, 
          from: sourcePanelId, 
          to: targetPanelId 
        });
        
        // DIRECT CALL to moveTab - this updates the panel state
        moveTab(sourcePanelId, sourceTabId, targetPanelId);
      } 
      else if (target.type === 'edge' && target.direction) {
        // This is a drop on a panel edge, which should create a split
        const panelId = target.id;
        const direction = target.direction;
        
        // Only process valid directions
        if (direction === 'top' || direction === 'right' || direction === 'bottom' || direction === 'left') {
          console.log('✂️ Creating split in direction', direction);
          
          // Convert edge direction to split direction
          const splitDirection = (direction === 'left' || direction === 'right') ? 'horizontal' : 'vertical';
          
          // Create a new panel configuration
          const newPanelId = `panel-${nanoid()}`;
          const newPanel = {
            id: newPanelId,
            type: 'panel' as const,
            size: 50,
            tabs: [],
            contents: [],
          };
          
          // First split the panel
          handleSplitPanel(panelId, splitDirection, newPanel);
          
          // Wait briefly for the split to be processed
          setTimeout(() => {
            // Then move the tab to the new panel
            console.log('↪️ Moving tab to newly created panel', newPanelId);
            moveTab(sourcePanelId, sourceTabId, newPanelId);
          }, 50);
        }
      } 
      else if (target.type === 'position' && target.position) {
        // This is a drop at a specific position in a tab bar
        const targetPanelId = target.position.panelId;
        
        console.log('🎯 Moving tab to specific position', { 
          tab: sourceTabId, 
          from: sourcePanelId, 
          to: targetPanelId,
          position: target.position.index
        });
        
        // For now, we'll just move to the panel without position-specific handling
        moveTab(sourcePanelId, sourceTabId, targetPanelId);
      }
      else {
        console.warn('⚠️ Unhandled drop target type', target.type);
      }
    } catch (err) {
      console.error('❌ Error processing drop:', err);
    }
    
    // Always call handleDragEnd to clean up the drag state
    handleDragEnd();
  }, [dragItem, handleDragEnd, handleSplitPanel, moveTab]);

  // Process drop target when it changes but only when no longer dragging
  // This handles the case where a valid drop has occurred but wasn't caught by the mouseup
  useEffect(() => {
    // Skip if still dragging, no drop target, no drag data, or already processing
    if (isDragging || !dropTarget || !dragData || processingDropRef.current) {
      return;
    }
    
    console.log('Processing drop target in AdvancedPanelManager useEffect:', dropTarget);
    processingDropRef.current = true;

    try {
      // If the drag is over but we still have a valid drop target, process it now
      handlePanelDrop(dropTarget);
    } catch (err) {
      console.error('Error processing drop target in useEffect:', err);
    } finally {
      // Reset processing flag
      processingDropRef.current = false;
    }
  }, [isDragging, dropTarget, dragData, handlePanelDrop]);

  return (
    <div className="h-full relative">
      <PanelContainer 
        layout={layout}
        onMaximizePanel={handleMaximizePanel}
        onRestorePanel={handleRestorePanel}
        maximizedPanelId={maximizedPanelId}
      />
      
      <DragOverlay
        active={isDragging}
        onDrop={handlePanelDrop}
      />
    </div>
  );
}