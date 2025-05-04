import React, { useEffect, useRef } from 'react';
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
    endDrag 
  } = useDragContext();
  
  const { moveTab } = useTabContext();
  
  // Ref to track the drag preview element
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  
  // Handle the drop operation
  const handleDrop = (target: DropTarget) => {
    console.log('DragManager: handle drop called with target:', target);
    console.log('DragManager: current dragItem:', dragItem);
    
    if (!dragItem) {
      console.error('DragManager: No drag item found when handling drop');
      endDrag(false);
      return;
    }
    
    try {
      // Handle different types of drag items
      if (dragItem.type === 'tab' && dragItem.sourcePanelId) {
        const { id: tabId, sourcePanelId } = dragItem;
        
        if (!tabId || !sourcePanelId) {
          console.error('DragManager: Tab ID or source panel ID is missing:', dragItem);
          endDrag(false);
          return;
        }
        
        console.log(`DragManager: Moving tab ${tabId} from panel ${sourcePanelId}`);
        
        // Skip if target is the same as source with no position change
        if (
          (target.type === 'panel' || target.type === 'tabbar') && 
          target.id === sourcePanelId &&
          target.type !== 'position'
        ) {
          console.log('DragManager: Source and target panels are the same, skipping move');
          endDrag(false);
          return;
        }
        
        // Handle different types of drop targets
        switch (target.type) {
          case 'panel':
            console.log(`DragManager: Moving tab to panel ${target.id}`);
            moveTab(tabId, sourcePanelId, target.id);
            break;
          case 'tabbar':
            console.log(`DragManager: Moving tab to tabbar ${target.id}`);
            moveTab(tabId, sourcePanelId, target.id);
            break;
          case 'position':
            // Move tab to specific position
            if (target.position) {
              console.log(`DragManager: Moving tab to position index ${target.position.index} in panel ${target.position.panelId}`);
              moveTab(
                tabId, 
                sourcePanelId, 
                target.position.panelId, 
                target.position.index
              );
            } else {
              console.error('DragManager: Position target without position data');
              endDrag(false);
              return;
            }
            break;
          case 'edge':
            console.log(`DragManager: Edge target detected, should be handled by PanelSplitter`);
            // Edge case is handled by PanelSplitter component
            break;
          default:
            console.log(`DragManager: Unhandled target type: ${target.type}`);
            endDrag(false);
            return;
        }
      } else {
        console.log(`DragManager: Unsupported drag item type: ${dragItem.type}`);
        endDrag(false);
        return;
      }
      
      // End the drag operation
      console.log('DragManager: Ending drag operation with successful drop');
      endDrag(true);
    } catch (error) {
      console.error('DragManager: Error during drop handling:', error);
      endDrag(false);
    }
  };
  
  // Update drag preview position on mouse move
  useEffect(() => {
    if (!isDragging || !dragPreviewRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.left = `${e.clientX}px`;
        dragPreviewRef.current.style.top = `${e.clientY}px`;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);
  
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
  
  // Detect edge cases
  return (
    <>
      {/* Visual drag overlay with drop zone highlighting */}
      <DragOverlay 
        active={isDragging} 
        onDrop={handleDrop} 
      />
      
      {/* Panel splitter for edge drops */}
      <PanelSplitter />
      
      {/* Visual custom drag preview - rendered by DragOverlay component */}
    </>
  );
}