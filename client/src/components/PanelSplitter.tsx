import React, { useCallback } from 'react';
import { useDragContext, DropDirection } from '../context/DragContext';
import { useTabContext } from '../context/TabContext';
import { nanoid } from 'nanoid';

/**
 * PanelSplitter handles the logic for creating new panels when a tab is dragged to the edge of an existing panel
 */
export function PanelSplitter() {
  const { dragItem, dropTarget, endDrag } = useDragContext();
  const { state, moveTab, splitPanel } = useTabContext();
  
  // Handle the drop operation when a tab is dropped onto a panel edge
  const handleEdgeDrop = useCallback(() => {
    if (!dragItem || !dropTarget || dropTarget.type !== 'edge' || !dropTarget.direction) {
      return;
    }
    
    // Only handle tab drops
    if (dragItem.type !== 'tab' || !dragItem.sourcePanelId) {
      return;
    }
    
    const { id: tabId, sourcePanelId } = dragItem;
    const { id: targetPanelId, direction } = dropTarget;
    
    // Determine the split direction based on the edge direction
    let splitDirection: 'horizontal' | 'vertical';
    if (direction === 'left' || direction === 'right') {
      splitDirection = 'horizontal';
    } else {
      splitDirection = 'vertical';
    }
    
    // Create new panel ID
    const newPanelId = nanoid();
    
    // Create the panel split
    splitPanel(targetPanelId, splitDirection, {
      newPanelId,
      positionAfter: direction === 'right' || direction === 'bottom'
    });
    
    // Move the tab to the new panel
    setTimeout(() => {
      moveTab(tabId, sourcePanelId, newPanelId);
    }, 0);
    
    // End the drag operation
    endDrag(true);
  }, [dragItem, dropTarget, endDrag, moveTab, splitPanel]);
  
  // Monitor for edge drops
  React.useEffect(() => {
    if (dropTarget?.type === 'edge' && dragItem?.type === 'tab') {
      // Auto-handle edge drops immediately
      handleEdgeDrop();
    }
  }, [dropTarget, dragItem, handleEdgeDrop]);
  
  // This is a logic-only component, it doesn't render anything
  return null;
}