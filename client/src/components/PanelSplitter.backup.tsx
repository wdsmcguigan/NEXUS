import React, { useCallback, useState, useEffect, useRef } from 'react';
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
    console.log('🔧 [EDGE DROP HANDLER] START - handleEdgeDrop called');
    console.log('🔧 [EDGE DROP HANDLER] Current state:', { dragItem, dropTarget });
    
    if (!dragItem || !dropTarget) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Missing dragItem or dropTarget', { dragItem, dropTarget });
      return;
    }
    
    if (dropTarget.type !== 'edge' || !dropTarget.direction) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Invalid dropTarget type or missing direction', dropTarget);
      return;
    }
    
    // Only handle tab drops
    if (dragItem.type !== 'tab') {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Not a tab drag operation', dragItem);
      return;
    }
    
    if (!dragItem.sourcePanelId) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Missing source panel ID', dragItem);
      return;
    }
    
    console.log('🔧 [EDGE DROP HANDLER] Validation passed, processing valid edge drop');
    
    const { id: tabId, sourcePanelId } = dragItem;
    const { id: targetPanelId, direction } = dropTarget;
    
    // Verify panels exist
    if (!state.panels[sourcePanelId]) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR: Source panel ${sourcePanelId} not found in state`);
      return;
    }
    
    if (!state.panels[targetPanelId]) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR: Target panel ${targetPanelId} not found in state`);
      return;
    }
    
    // Verify tab exists
    if (!state.tabs[tabId]) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR: Tab ${tabId} not found in state`);
      return;
    }
    
    // Log the panels involved
    console.log('🔧 [EDGE DROP HANDLER] Panels involved in splitting:', {
      sourcePanel: state.panels[sourcePanelId],
      targetPanel: state.panels[targetPanelId],
      tabBeingMoved: state.tabs[tabId]
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
    
    console.log(`🔧 [EDGE DROP HANDLER] Creating ${splitDirection} split with new panel ${positionAfter ? 'after' : 'before'} target`);
    
    try {
      // Create new panel ID with proper uniqueness
      const newPanelId = nanoid();
      console.log(`🔧 [EDGE DROP HANDLER] Generated new panel ID: ${newPanelId}`);
      
      // Create the panel split first
      console.log(`🔧 [EDGE DROP HANDLER] About to call splitPanel(${targetPanelId}, ${splitDirection}, { newPanelId: ${newPanelId}, positionAfter: ${positionAfter} })`);
      
      // Directly call splitPanel synchronously and verify the result
      splitPanel(targetPanelId, splitDirection, {
        newPanelId,
        positionAfter
      });
      
      // Check if the panel was actually created
      console.log(`🔧 [EDGE DROP HANDLER] After splitPanel call, checking if new panel ${newPanelId} exists:`, 
        !!state.panels[newPanelId]);
      
      if (state.panels[newPanelId]) {
        console.log(`🔧 [EDGE DROP HANDLER] Success! New panel created:`, state.panels[newPanelId]);
      } else {
        console.log(`🔧 [EDGE DROP HANDLER] Panel creation may be asynchronous. Will delay tab move.`);
      }
      
      // Add a slight delay to ensure the panel is created in state before moving the tab
      console.log(`🔧 [EDGE DROP HANDLER] Setting timeout to move tab from ${sourcePanelId} to ${newPanelId} in 50ms`);
      
      setTimeout(() => {
        console.log(`🔧 [EDGE DROP HANDLER] Timeout fired. About to move tab ${tabId} to panel ${newPanelId}`);
        console.log(`🔧 [EDGE DROP HANDLER] Checking again if panel exists:`, !!state.panels[newPanelId]);
        
        try {
          // Double check the panel exists before moving the tab
          if (state.panels[newPanelId]) {
            console.log(`🔧 [EDGE DROP HANDLER] Moving tab ${tabId} from panel ${sourcePanelId} to newly created panel ${newPanelId}`);
            moveTab(tabId, sourcePanelId, newPanelId);
            console.log(`🔧 [EDGE DROP HANDLER] moveTab executed successfully`);
          } else {
            console.error(`🔧 [EDGE DROP HANDLER] ERROR: New panel ${newPanelId} still doesn't exist after delay, cannot move tab`);
          }
          
          // End the drag operation
          console.log('🔧 [EDGE DROP HANDLER] Edge drop operation completed, ending drag');
          endDrag(true);
        } catch (innerError) {
          console.error('🔧 [EDGE DROP HANDLER] ERROR during tab move operation:', innerError);
          endDrag(false);
        }
      }, 100); // Increased timeout for more reliability
    } catch (error) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR during panel split operation:', error);
      endDrag(false);
    }
    
    // Clear the split preview immediately for better visual feedback
    setSplitPreview(null);
    console.log('🔧 [EDGE DROP HANDLER] END handleEdgeDrop function');
  }, [dragItem, dropTarget, endDrag, moveTab, splitPanel, state.panels, state.tabs]);
  
  // Debug counter for tracking mouse events
  const mouseEventCounter = useRef(0);
  
  // Monitor for edge drops
  useEffect(() => {
    if (dropTarget?.type === 'edge' && dragItem?.type === 'tab') {
      console.log('🔍 [EDGE DROP DEBUG] dropTarget set to EDGE type with panel:', dropTarget.id, 'direction:', dropTarget.direction);
      
      // Generate a visual split preview
      if (dropTarget.direction && dropTarget.rect) {
        setSplitPreview({
          panelId: dropTarget.id,
          direction: dropTarget.direction,
          rect: dropTarget.rect
        });
        console.log('🔍 [EDGE DROP DEBUG] Split preview updated for panel:', dropTarget.id);
      }
      
      // Add a mouse up listener to handle the actual drop
      const eventId = ++mouseEventCounter.current;
      console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Setting up mouseup listener for edge drop`);
      
      const handleMouseUp = (e: MouseEvent) => {
        console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] MOUSEUP TRIGGERED at ${e.clientX}x${e.clientY}`);
        console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Current dropTarget:`, dropTarget);
        
        if (dropTarget?.type === 'edge') {
          console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Calling handleEdgeDrop() for panel ${dropTarget.id} with direction ${dropTarget.direction}`);
          
          try {
            handleEdgeDrop();
            console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] handleEdgeDrop() executed successfully`);
          } catch (error) {
            console.error(`🔍 [EDGE DROP DEBUG] [${eventId}] ERROR in handleEdgeDrop():`, error);
          }
        } else {
          console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Not calling handleEdgeDrop - dropTarget no longer an edge`);
        }
      };
      
      // Use a direct DOM approach to ensure the event is captured
      document.body.addEventListener('mouseup', handleMouseUp, { once: true });
      console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Added one-time mouseup listener to document.body`);
      
      return () => {
        console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Cleaning up mouseup listener for edge drop`);
        document.body.removeEventListener('mouseup', handleMouseUp);
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