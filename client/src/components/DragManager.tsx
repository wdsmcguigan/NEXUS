import React, { useEffect, useRef, useCallback } from 'react';
import { useDragContext, DropTarget } from '../context/DragContext';
import { useTabContext } from '../context/TabContext';
import { DragOverlay } from './DragOverlay';
import { PanelSplitter } from './PanelSplitter';

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
    if (!dragItem) return;
    
    console.log('Processing drop in DragManager:', { target, dragItem });
    
    // Set the current drop target (used by other components)
    setDropTarget(target);
    
    // Process the drop based on target type
    if (dragItem.type === 'tab' && dragItem.sourcePanelId) {
      const { id: tabId, sourcePanelId } = dragItem;
      
      // Handle different types of drop targets
      switch (target.type) {
        case 'panel':
          console.log(`Moving tab ${tabId} from panel ${sourcePanelId} to panel ${target.id}`);
          moveTab(tabId, sourcePanelId, target.id);
          endDrag(true); // Mark as successful drop
          break;
        case 'tabbar':
          console.log(`Moving tab ${tabId} from panel ${sourcePanelId} to tabbar ${target.id}`);
          moveTab(tabId, sourcePanelId, target.id);
          endDrag(true); // Mark as successful drop
          break;
        case 'position':
          // Move tab to specific position
          if (target.position) {
            console.log(`Moving tab ${tabId} from panel ${sourcePanelId} to position ${target.position.index} in panel ${target.position.panelId}`);
            moveTab(
              tabId, 
              sourcePanelId, 
              target.position.panelId, 
              target.position.index
            );
            endDrag(true); // Mark as successful drop
          }
          break;
        case 'edge':
          // Let the PanelSplitter handle this but ensure the drop target is set
          if (target.direction) {
            console.log(`Edge drop detected on ${target.id} with direction ${target.direction} - letting PanelSplitter handle it`);
            // Important: We need to keep the dropTarget set for PanelSplitter
            // But we don't call endDrag() here since PanelSplitter will do that
            return;
          } else {
            console.error('Edge drop target missing direction');
            endDrag(false);
          }
      }
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