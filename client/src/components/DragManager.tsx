import React, { useEffect, useRef, useCallback } from 'react';
import { useDragContext, DropTarget } from '../context/DragContext';
import { useTabContext } from '../context/TabContext';
import { DragOverlay } from './DragOverlay';
import { PanelSplitter } from './PanelSplitter';
import { DirectPanelDropHandler } from './DirectPanelDropHandler';

/**
 * DragManager is a global component that handles drag-and-drop operations
 * across the entire application. It maintains drag state, renders visual
 * overlays, and coordinates different drag operations.
 */
export function DragManager() {
  const { 
    isDragging, 
    dragItem, 
    dragOperation, 
    dropTarget,
    setDropTarget, 
    endDrag,
    updateMousePosition,
    mousePosition
  } = useDragContext();
  
  const { moveTab } = useTabContext();
  
  // Ref to track the drag preview element
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  
  // Handle updating mouse position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    updateMousePosition(e.clientX, e.clientY);
  }, [isDragging, updateMousePosition]);
  
  // Set up mouse move tracking
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, handleMouseMove]);
  
  // Handle the drop operation
  const handleDrop = useCallback((target: DropTarget) => {
    if (!dragItem) {
      console.error('🎯 [DRAG_MGR] ERROR: No drag item available for drop operation');
      return;
    }
    
    console.log('🎯 [DRAG_MGR] Processing drop:', { target, dragItem });
    
    // Set the current drop target (used by other components)
    setDropTarget(target);
    
    // Process the drop based on target type
    if (dragItem.type === 'tab' && dragItem.sourcePanelId) {
      const { id: tabId, sourcePanelId } = dragItem;
      
      // Handle different types of drop targets
      switch (target.type) {
        case 'panel':
          console.log(`🎯 [DRAG_MGR] Moving tab ${tabId} from panel ${sourcePanelId} to panel ${target.id}`);
          moveTab(tabId, sourcePanelId, target.id);
          console.log(`🎯 [DRAG_MGR] moveTab executed successfully for panel drop`);
          endDrag(true); // Mark as successful drop
          break;
          
        case 'tabbar':
          console.log(`🎯 [DRAG_MGR] Moving tab ${tabId} from panel ${sourcePanelId} to tabbar ${target.id}`);
          moveTab(tabId, sourcePanelId, target.id);
          console.log(`🎯 [DRAG_MGR] moveTab executed successfully for tabbar drop`);
          endDrag(true); // Mark as successful drop
          break;
          
        case 'position':
          // Move tab to specific position
          if (target.position) {
            console.log(`🎯 [DRAG_MGR] Moving tab ${tabId} from panel ${sourcePanelId} to position ${target.position.index} in panel ${target.position.panelId}`);
            moveTab(
              tabId, 
              sourcePanelId, 
              target.position.panelId, 
              target.position.index
            );
            console.log(`🎯 [DRAG_MGR] moveTab executed successfully for position drop`);
            endDrag(true); // Mark as successful drop
          } else {
            console.error(`🎯 [DRAG_MGR] ERROR: Position drop target missing position details`);
            endDrag(false);
          }
          break;
          
        case 'edge':
          // Edge drop handling is more complex - PanelSplitter needs to create a new panel first
          if (target.direction) {
            console.log(`🎯 [DRAG_MGR] EDGE DROP DETECTED: Tab ${tabId} from panel ${sourcePanelId} to ${target.direction} edge of panel ${target.id}`);
            
            // Debug info
            console.log(`🎯 [DRAG_MGR] This will create a ${target.direction === 'left' || target.direction === 'right' ? 'horizontal' : 'vertical'} split`);
            
            // IMPORTANT: Add more details to help with debugging
            console.log(`🎯 [DRAG_MGR] Edge drop details:`, {
              tabId,
              sourcePanelId,
              targetPanelId: target.id,
              direction: target.direction,
              targetRect: target.rect ? 
                `${target.rect.left},${target.rect.top},${target.rect.right},${target.rect.bottom}` : 
                'missing'
            });
            
            // ENHANCEMENT: Add a failsafe timeout to end the drag if PanelSplitter fails to do so
            const failsafeTimer = setTimeout(() => {
              console.warn(`🎯 [DRAG_MGR] FAILSAFE: Ending drag after 2 second timeout - PanelSplitter may have failed`);
              endDrag(false);
            }, 2000);
            
            // Add a listener for custom panel-edge-drop-complete event
            const handleCompletionEvent = () => {
              console.log(`🎯 [DRAG_MGR] Received panel-edge-drop-complete event, clearing failsafe timer`);
              clearTimeout(failsafeTimer);
              document.removeEventListener('panel-edge-drop-complete', handleCompletionEvent);
            };
            
            document.addEventListener('panel-edge-drop-complete', handleCompletionEvent, { once: true });
            
            // Important: We need to keep the dropTarget set for PanelSplitter
            // But we don't call endDrag() here since PanelSplitter will do that
            console.log(`🎯 [DRAG_MGR] Letting PanelSplitter handle this - NOT ending drag yet`);
            
            // Wait for PanelSplitter to react to the dropTarget change
            console.log(`🎯 [DRAG_MGR] PanelSplitter should detect the edge drop and create a new panel`);
            return;
          } else {
            console.error('🎯 [DRAG_MGR] ERROR: Edge drop target missing direction');
            endDrag(false);
          }
          break;
          
        default:
          console.error(`🎯 [DRAG_MGR] ERROR: Unsupported drop target type: ${target.type}`);
          endDrag(false); // Mark as failed drop
      }
    } else {
      console.error(`🎯 [DRAG_MGR] ERROR: Unsupported drag item or missing source panel: ${JSON.stringify(dragItem)}`);
      endDrag(false); // Mark as failed drop
    }
  }, [dragItem, setDropTarget, moveTab, endDrag]);
  
  // Handle keyboard shortcuts during drag
  useEffect(() => {
    if (!isDragging) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to cancel drag
      if (e.key === 'Escape') {
        endDrag();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, endDrag]);
  
  return (
    <>
      {/* Visual drag overlay with drop zone highlighting */}
      <DragOverlay 
        active={isDragging} 
        onDrop={handleDrop} 
      />
      
      {/* Panel splitter for edge drops with enhanced visual feedback */}
      <PanelSplitter />
      
      {/* New direct approach for panel edge drops */}
      <DirectPanelDropHandler />
      
      {/* Add additional debug information if needed */}
      {process.env.NODE_ENV === 'development' && isDragging && mousePosition && (
        <div 
          className="fixed top-2 left-2 bg-neutral-900 bg-opacity-80 text-xs text-white p-2 rounded z-50 pointer-events-none"
        >
          <div>Dragging: {dragItem?.type} ({dragItem?.id})</div>
          <div>Operation: {dragOperation}</div>
          <div>Position: {mousePosition.x.toFixed(0)}x{mousePosition.y.toFixed(0)}</div>
          <div>Target: {dropTarget?.type} {dropTarget?.id?.substring(0, 6)}</div>
          {dropTarget?.direction && <div>Direction: {dropTarget.direction}</div>}
        </div>
      )}
    </>
  );
}