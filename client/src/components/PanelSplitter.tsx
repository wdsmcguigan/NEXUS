import React, { useCallback, useState, useEffect } from 'react';
import { useDragContext, DropDirection } from '../context/DragContext';
import { useTabContext } from '../context/TabContext';
import { nanoid } from 'nanoid';

/**
 * PanelSplitter handles the logic for creating new panels when a tab is dragged to the edge of an existing panel
 * It provides enhanced visual feedback for panel splitting operations
 */
export function PanelSplitter() {
  const { 
    dragItem, 
    dropTarget, 
    endDrag, 
    mousePosition 
  } = useDragContext();
  const { state, moveTab, splitPanel } = useTabContext();
  
  // Track current preview state
  const [splitPreview, setSplitPreview] = useState<{
    panelId: string;
    direction: DropDirection;
    rect: DOMRect;
  } | null>(null);
  
  // Update split preview based on drop target
  useEffect(() => {
    if (dropTarget?.type === 'edge' && dropTarget.direction && dropTarget.rect) {
      setSplitPreview({
        panelId: dropTarget.id,
        direction: dropTarget.direction,
        rect: dropTarget.rect
      });
    } else {
      setSplitPreview(null);
    }
  }, [dropTarget]);
  
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
    
    // Determine if new panel should be positioned after the current panel
    const positionAfter = direction === 'right' || direction === 'bottom';
    
    // Create the panel split
    splitPanel(targetPanelId, splitDirection, {
      newPanelId,
      positionAfter
    });
    
    // Move the tab to the new panel with a small delay to ensure panel is created
    setTimeout(() => {
      moveTab(tabId, sourcePanelId, newPanelId);
    }, 50);
    
    // End the drag operation
    endDrag(true);
    
    // Clear the split preview
    setSplitPreview(null);
  }, [dragItem, dropTarget, endDrag, moveTab, splitPanel]);
  
  // Monitor for edge drops
  useEffect(() => {
    if (dropTarget?.type === 'edge' && dragItem?.type === 'tab') {
      // Only auto-handle on mouse up (this is now handled by the DragOverlay component)
      if (dropTarget.direction && mousePosition) {
        // Generate a visual split preview
        const panelRect = dropTarget.rect;
        if (panelRect) {
          setSplitPreview({
            panelId: dropTarget.id,
            direction: dropTarget.direction,
            rect: panelRect
          });
        }
      }
    }
  }, [dropTarget, dragItem, mousePosition]);
  
  // Enhanced split preview
  if (splitPreview) {
    const { direction, rect } = splitPreview;
    const isHorizontal = direction === 'left' || direction === 'right';
    const isStart = direction === 'left' || direction === 'top';
    
    // Calculate dimensions for split preview
    const previewStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 41,
      pointerEvents: 'none',
      backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with 20% opacity
      border: '2px dashed rgba(59, 130, 246, 0.7)', // blue-500 with 70% opacity
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' // blue-500 glow
    };
    
    // Determine position and size based on split direction
    if (isHorizontal) {
      // Left or right split
      const width = rect.width * 0.45; // 45% of panel width
      
      Object.assign(previewStyle, {
        left: isStart ? rect.left : rect.right - width,
        top: rect.top,
        width,
        height: rect.height,
      });
    } else {
      // Top or bottom split  
      const height = rect.height * 0.45; // 45% of panel height
      
      Object.assign(previewStyle, {
        left: rect.left,
        top: isStart ? rect.top : rect.bottom - height,
        width: rect.width,
        height,
      });
    }
    
    // Render split preview
    return (
      <div 
        className="animate-pulse" 
        style={previewStyle}
        onClick={handleEdgeDrop}
      >
        <div className="w-full h-full flex items-center justify-center text-blue-300 text-opacity-80 text-sm font-medium">
          {isHorizontal ? 'Horizontal Split' : 'Vertical Split'}
        </div>
      </div>
    );
  }
  
  // This component only renders when there's a split preview
  return null;
}