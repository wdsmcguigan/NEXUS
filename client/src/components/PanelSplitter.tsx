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
      console.error('PanelSplitter: Cannot process edge drop - invalid drop data', { dragItem, dropTarget });
      return;
    }
    
    // Only handle tab drops
    if (dragItem.type !== 'tab' || !dragItem.sourcePanelId) {
      console.error('PanelSplitter: Cannot process edge drop - not a tab or missing source panel', dragItem);
      return;
    }
    
    console.log('PanelSplitter: Processing edge drop with valid data', { dragItem, dropTarget });
    
    const { id: tabId, sourcePanelId } = dragItem;
    const { id: targetPanelId, direction } = dropTarget;
    
    // Log the panels involved
    console.log('Panels involved in splitting:', {
      sourcePanel: state.panels[sourcePanelId],
      targetPanel: state.panels[targetPanelId]
    });
    
    // Determine the split direction based on the edge direction
    let splitDirection: 'horizontal' | 'vertical';
    if (direction === 'left' || direction === 'right') {
      splitDirection = 'horizontal';
    } else {
      splitDirection = 'vertical';
    }
    
    // Determine if new panel should be positioned after the current panel
    const positionAfter = direction === 'right' || direction === 'bottom';
    
    console.log(`PanelSplitter: Creating ${splitDirection} split with new panel ${positionAfter ? 'after' : 'before'} target`);
    
    try {
      // Create new panel ID with proper uniqueness
      const newPanelId = nanoid();
      console.log(`PanelSplitter: Generated new panel ID: ${newPanelId}`);
      
      // Create the panel split first
      console.log(`PanelSplitter: Splitting panel ${targetPanelId} ${splitDirection}ly`);
      splitPanel(targetPanelId, splitDirection, {
        newPanelId,
        positionAfter
      });
      
      // Add a slight delay to ensure the panel is created in state before moving the tab
      setTimeout(() => {
        console.log(`PanelSplitter: Moving tab ${tabId} from panel ${sourcePanelId} to newly created panel ${newPanelId}`);
        moveTab(tabId, sourcePanelId, newPanelId);
        
        // End the drag operation after the tab is moved
        console.log('PanelSplitter: Edge drop completed successfully');
        endDrag(true);
      }, 50);
    } catch (error) {
      console.error('PanelSplitter: Error during panel split operation', error);
      endDrag(false);
    }
    
    // Clear the split preview immediately for better visual feedback
    setSplitPreview(null);
  }, [dragItem, dropTarget, endDrag, moveTab, splitPanel, state.panels]);
  
  // Monitor for edge drops
  useEffect(() => {
    if (dropTarget?.type === 'edge' && dragItem?.type === 'tab') {
      // Generate a visual split preview
      if (dropTarget.direction && dropTarget.rect) {
        setSplitPreview({
          panelId: dropTarget.id,
          direction: dropTarget.direction,
          rect: dropTarget.rect
        });
      }
      
      // Add a mouse up listener to handle the actual drop
      const handleMouseUp = () => {
        console.log('PanelSplitter: Mouse up detected with dropTarget:', dropTarget);
        if (dropTarget?.type === 'edge') {
          console.log('PanelSplitter: Executing panel split with direction:', dropTarget.direction);
          handleEdgeDrop();
        }
      };
      
      window.addEventListener('mouseup', handleMouseUp, { once: true });
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
      };
    } else {
      // Clear the preview if we're not over an edge
      setSplitPreview(null);
    }
  }, [dropTarget, dragItem, handleEdgeDrop]);
  
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
    
    // Render split preview with enhanced visual feedback
    return (
      <div 
        className="animate-pulse" 
        style={previewStyle}
        onClick={handleEdgeDrop}
      >
        {/* Split direction indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-blue-500 bg-opacity-80 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-lg">
            {isHorizontal ? 'Horizontal Split' : 'Vertical Split'}
          </div>
        </div>
        
        {/* Split direction arrows */}
        <div className="absolute inset-0 flex items-center justify-center text-blue-200 text-2xl font-bold">
          <span className="bg-blue-500 bg-opacity-20 p-2 rounded-full">
            {isHorizontal ? '⇔' : '⇕'}
          </span>
        </div>
        
        {/* Animated highlight borders */}
        <div className="absolute inset-1 border-2 border-blue-400 rounded-md opacity-60 animate-pulse" 
             style={{ animationDuration: '1.5s' }}></div>
        <div className="absolute inset-3 border border-blue-300 rounded-md opacity-40 animate-pulse" 
             style={{ animationDuration: '2s', animationDelay: '0.2s' }}></div>
      </div>
    );
  }
  
  // This component only renders when there's a split preview
  return null;
}