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
  const handleSplitPanel = useCallback((panelId: string, direction: 'horizontal' | 'vertical') => {
    if (!dragData) return;
    
    const { tabId, sourcePanelId } = dragData;
    const sourcePanel = findPanel(layout, sourcePanelId);
    if (!sourcePanel || !sourcePanel.tabs) return;
    
    const tab = sourcePanel.tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    // Create a new panel structure with the dragged tab
    const newPanelId = `panel-${nanoid()}`;
    
    // Update the layout by first removing the tab from the source panel
    let newLayout = updatePanelInLayout(
      layout,
      sourcePanelId,
      panel => {
        if (!panel.tabs) return panel;
        return {
          ...panel,
          tabs: panel.tabs.filter(t => t.id !== tabId),
          activeTabId: panel.activeTabId === tabId
            ? (panel.tabs.length > 1)
              ? (panel.tabs[0].id === tabId)
                ? panel.tabs[1].id
                : panel.tabs[0].id
              : undefined
            : panel.activeTabId
        };
      }
    );
    
    // Then update the target panel to become a group with two panels
    newLayout = updatePanelInLayout(
      newLayout,
      panelId,
      panel => {
        // Create a new panel with the dragged tab
        const newChildPanel: PanelConfig = {
          id: newPanelId,
          type: 'panel',
          size: 50,
          tabs: [tab],
          activeTabId: tab.id
        };
        
        // The current panel becomes a parent with children
        // We need to make a deep copy of the panel to avoid mutating the original
        const panelCopy = { 
          ...panel,
          id: `${panel.id}-child`,
          size: 50 // Set the size explicitly
        };
        
        // Don't copy over properties that shouldn't be inherited
        delete panelCopy.children;
        
        const updatedPanel: PanelConfig = {
          id: panel.id,
          type: 'split',
          direction,
          minSize: panel.minSize,
          size: panel.size,
          tabs: [], // Empty tabs array for parent panels
          children: direction === 'horizontal'
            ? [panelCopy, newChildPanel]
            : [newChildPanel, panelCopy]
        };
        
        return updatedPanel;
      }
    );
    
    updateLayout(newLayout);
    handleDragEnd();
  }, [layout, dragData, findPanel, handleDragEnd, updateLayout, updatePanelInLayout]);

  // Handle dropping a tab onto a panel
  const handlePanelDrop = useCallback((target: DropTarget) => {
    if (!dragData) return;
    
    const { type, id: panelId, direction, position } = target;
    
    if (type === 'panel' || type === 'tabbar') {
      // Move the tab to the target panel
      moveTab(dragData.tabId, dragData.sourcePanelId, panelId);
    } else if (type === 'edge' && direction) {
      // Make sure direction is a valid split direction
      if (direction === 'top' || direction === 'right' || direction === 'bottom' || direction === 'left') {
        // Create a new panel by splitting in the direction
        const splitDirection = (direction === 'left' || direction === 'right') ? 'horizontal' : 'vertical';
        handleSplitPanel(panelId, splitDirection);
      }
    } else if (type === 'position' && position) {
      // For position drop, just move to the target panel
      // Since our moveTab doesn't support index positioning yet
      moveTab(
        dragData.tabId,
        dragData.sourcePanelId,
        position.panelId
      );
    }
    
    handleDragEnd();
  }, [dragData, handleDragEnd, handleSplitPanel, moveTab]);

  // Process drop target when it changes - placed after handlePanelDrop is defined
  useEffect(() => {
    // Skip if no drop target, no drag data, or already processing
    if (!dropTarget || !dragData || processingDropRef.current) {
      return;
    }
    
    console.log('Processing drop target in AdvancedPanelManager:', dropTarget);
    processingDropRef.current = true;

    try {
      // Process the drop - this uses the same logic as handlePanelDrop
      handlePanelDrop(dropTarget);
    } catch (err) {
      console.error('Error processing drop target:', err);
    } finally {
      // Reset processing flag
      processingDropRef.current = false;
    }
  }, [dropTarget, dragData, handlePanelDrop]);

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