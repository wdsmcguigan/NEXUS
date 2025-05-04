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
  
  // Debug counter for tracking mouse events
  const mouseEventCounter = useRef(0);
  
  // Track if drag end is being processed
  const processingDragEnd = useRef(false);
  
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
    
    // Prevent duplicate processing - this is critical for edge drops
    if (processingDragEnd.current) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Already processing a drag end, skipping to prevent duplicates');
      return;
    }
    
    // Set processing flag immediately to prevent multiple calls
    processingDragEnd.current = true;
    
    // Make sure we reset the processing flag even if something fails
    const safeEndDrag = (success: boolean = false) => {
      console.log(`🔧 [EDGE DROP HANDLER] Safely ending drag (success: ${success})`);
      
      // Emit completion event BEFORE ending drag to ensure DragManager gets notified
      try {
        const completionEvent = new CustomEvent('panel-edge-drop-complete', {
          detail: { success }
        });
        console.log(`🔧 [EDGE DROP HANDLER] Dispatching panel-edge-drop-complete event`);
        document.dispatchEvent(completionEvent);
      } catch (error) {
        console.error('🔧 [EDGE DROP HANDLER] Error dispatching completion event:', error);
      }
      
      // End the drag operation now that we've notified listeners
      endDrag(success);
      processingDragEnd.current = false;
      setSplitPreview(null);
    };
    
    console.log('🔧 [EDGE DROP HANDLER] Current state:', { 
      dragItem, 
      dropTarget,
      isDragItem: !!dragItem,
      isDropTarget: !!dropTarget,
      dragType: dragItem?.type,
      dropType: dropTarget?.type
    });
    
    // Check if we have valid drag and drop state
    if (!dragItem || !dropTarget) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Missing dragItem or dropTarget');
      safeEndDrag(false);
      return;
    }
    
    // Validate drop target is an edge
    if (dropTarget.type !== 'edge' || !dropTarget.direction) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Invalid dropTarget type or missing direction', dropTarget);
      safeEndDrag(false);
      return;
    }
    
    // Only handle tab drops
    if (dragItem.type !== 'tab') {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Not a tab drag operation', dragItem);
      safeEndDrag(false);
      return;
    }
    
    // Source panel ID must be present
    if (!dragItem.sourcePanelId) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR: Missing source panel ID', dragItem);
      safeEndDrag(false);
      return;
    }
    
    console.log('🔧 [EDGE DROP HANDLER] Validation passed, processing valid edge drop');
    
    // Extract key information from drag item and drop target
    const { id: tabId, sourcePanelId } = dragItem;
    const { id: targetPanelId, direction } = dropTarget;
    
    try {
      // Verify panels exist
      if (!state.panels[sourcePanelId]) {
        throw new Error(`Source panel ${sourcePanelId} not found in state`);
      }
      
      if (!state.panels[targetPanelId]) {
        throw new Error(`Target panel ${targetPanelId} not found in state`);
      }
      
      // Verify tab exists
      if (!state.tabs[tabId]) {
        throw new Error(`Tab ${tabId} not found in state`);
      }
      
      // Log existing panels
      console.log('🔧 [EDGE DROP HANDLER] All panels in state:', Object.keys(state.panels));
      console.log('🔧 [EDGE DROP HANDLER] Panels involved in splitting:', {
        sourcePanel: state.panels[sourcePanelId],
        targetPanel: state.panels[targetPanelId],
        tabBeingMoved: state.tabs[tabId]
      });
      
      // Step 1: Determine the split direction based on the edge
      let splitDirection: 'horizontal' | 'vertical';
      if (direction === 'left' || direction === 'right') {
        splitDirection = 'horizontal';
      } else {
        splitDirection = 'vertical';
      }
      
      // Step 2: Determine panel order
      const positionAfter = direction === 'right' || direction === 'bottom';
      
      console.log(`🔧 [EDGE DROP HANDLER] Split direction:${splitDirection}, positionAfter:${positionAfter}`);
      
      // Step 3: Generate new panel ID with timestamp for uniqueness
      // Make sure the panel ID is simple and doesn't have special characters
      const timestamp = Date.now();
      // Clean panel ID to remove any special characters
      const sanitizedTargetId = targetPanelId.replace(/[^a-zA-Z0-9]/g, '');
      const newPanelId = `panel-${sanitizedTargetId}-${timestamp}`;
      
      console.log(`🔧 [EDGE DROP HANDLER] Original target ID: ${targetPanelId}, sanitized: ${sanitizedTargetId}`);
      console.log(`🔧 [EDGE DROP HANDLER] Created new panel ID: ${newPanelId}`);
      
      // Step 4: Execute the panel split with new panel ID
      console.log(`🔧 [EDGE DROP HANDLER] Calling splitPanel(${targetPanelId}, ${splitDirection}, { newPanelId:${newPanelId}, positionAfter:${positionAfter}})`);
      
      // Create options object exactly as expected by the splitPanel function
      const splitOptions = {
        newPanelId: newPanelId,
        positionAfter: positionAfter
      };
      console.log(`🔧 [EDGE DROP HANDLER] Split options (full object):`, splitOptions);
      
      // Execute split panel action
      splitPanel(targetPanelId, splitDirection, splitOptions);
      
      // Step 5: Verify the panel was created
      console.log('🔧 [EDGE DROP HANDLER] Checking if new panel exists in state:', 
                  Object.keys(state.panels).includes(newPanelId));
      
      if (!state.panels[newPanelId]) {
        console.log('🔧 [EDGE DROP HANDLER] New panel not immediately available, checking child panels of target');
        
        // Check if target panel now has child panels
        const updatedTargetPanel = state.panels[targetPanelId];
        console.log('🔧 [EDGE DROP HANDLER] Updated target panel:', updatedTargetPanel);
        
        if (updatedTargetPanel.childPanels && updatedTargetPanel.childPanels.length > 0) {
          console.log('🔧 [EDGE DROP HANDLER] Target panel now has child panels:', updatedTargetPanel.childPanels);
          
          // Find the empty child panel (the one without tabs)
          const emptyChildId = updatedTargetPanel.childPanels.find(
            childId => state.panels[childId] && state.panels[childId].tabs.length === 0
          );
          
          if (emptyChildId) {
            console.log(`🔧 [EDGE DROP HANDLER] Found empty child panel ${emptyChildId}, will use this as target for tab move`);
            
            // Wait a bit to ensure state is stable, then move the tab
            setTimeout(() => {
              try {
                console.log(`🔧 [EDGE DROP HANDLER] Moving tab ${tabId} from panel ${sourcePanelId} to panel ${emptyChildId}`);
                moveTab(tabId, sourcePanelId, emptyChildId);
                console.log(`🔧 [EDGE DROP HANDLER] Tab moved successfully, ending drag`);
                safeEndDrag(true);
              } catch (moveError) {
                console.error('🔧 [EDGE DROP HANDLER] ERROR moving tab to child panel:', moveError);
                safeEndDrag(false);
              }
            }, 100);
            return;
          }
        }
      }
      
      // Step 6: Move the tab to the new panel
      console.log(`🔧 [EDGE DROP HANDLER] Setting timeout to move tab ${tabId} from ${sourcePanelId} to ${newPanelId}`);
      
      // Use a delay to ensure the panel state update is processed
      // Increased timeout to give more time for state to update
      setTimeout(() => {
        try {
          console.log(`🔧 [EDGE DROP HANDLER] Executing moveTab(${tabId}, ${sourcePanelId}, ${newPanelId})`);
          console.log(`🔧 [EDGE DROP HANDLER] Current panels:`, Object.keys(state.panels));
          
          // Check all panels again for debugging
          const updatedPanelsList = Object.keys(state.panels);
          console.log(`🔧 [EDGE DROP HANDLER] Updated panels list:`, updatedPanelsList);
          
          // Try to find child panels of the target panel as an alternative
          const updatedTargetPanel = state.panels[targetPanelId];
          if (updatedTargetPanel && updatedTargetPanel.childPanels && updatedTargetPanel.childPanels.length > 0) {
            console.log(`🔧 [EDGE DROP HANDLER] Target panel now has child panels:`, updatedTargetPanel.childPanels);
          }
          
          // Double check the panel exists before moving the tab
          if (state.panels[newPanelId]) {
            // Panel exists, proceed with tab move
            moveTab(tabId, sourcePanelId, newPanelId);
            console.log(`🔧 [EDGE DROP HANDLER] Tab moved successfully to new panel`);
            safeEndDrag(true);
          } else {
            console.log(`🔧 [EDGE DROP HANDLER] Panel ${newPanelId} not found directly, searching for recently created panels`);
            
            // Look for any newly created panels
            const allPanelIds = Object.keys(state.panels);
            
            // Find any panel IDs containing our timestamp 
            const parts = newPanelId.split('-');
            const timestampPart = parts.length > 0 ? parts[parts.length - 1] : '';
            
            if (timestampPart) {
              const recentPanels = allPanelIds.filter(id => id.includes(timestampPart));
              
              if (recentPanels.length > 0) {
                const matchingPanelId = recentPanels[0];
                console.log(`🔧 [EDGE DROP HANDLER] Found panel with matching timestamp: ${matchingPanelId}`);
                moveTab(tabId, sourcePanelId, matchingPanelId);
                safeEndDrag(true);
                return;
              }
            }
            
            // Fallback to any empty child panel that may have been created
            if (updatedTargetPanel && updatedTargetPanel.childPanels && updatedTargetPanel.childPanels.length > 0) {
              const childPanels = updatedTargetPanel.childPanels;
              for (let i = 0; i < childPanels.length; i++) {
                const childId = childPanels[i];
                const childPanel = state.panels[childId];
                if (childPanel && childPanel.tabs && childPanel.tabs.length === 0) {
                  console.log(`🔧 [EDGE DROP HANDLER] Found empty child panel ${childId} to use`);
                  moveTab(tabId, sourcePanelId, childId);
                  safeEndDrag(true);
                  return;
                }
              }
            }
            
            // Last resort: Try to find a different panel to move to
            const newPanels = allPanelIds.filter(id => !id.includes(sourcePanelId) && id !== targetPanelId);
            
            if (newPanels.length > 0) {
              const fallbackPanelId = newPanels[0];
              console.log(`🔧 [EDGE DROP HANDLER] Using fallback panel ${fallbackPanelId}`);
              moveTab(tabId, sourcePanelId, fallbackPanelId);
              safeEndDrag(true);
            } else {
              console.error(`🔧 [EDGE DROP HANDLER] All fallbacks failed, no suitable panels found`);
              safeEndDrag(false);
            }
          }
        } catch (error) {
          console.error('🔧 [EDGE DROP HANDLER] ERROR during tab move operation:', error);
          safeEndDrag(false);
        }
      }, 250); // Increased delay for more reliable state updates
    } catch (error) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR during panel split operation:', error);
      safeEndDrag(false);
    }
    
    // Clear the split preview immediately for better visual feedback
    setSplitPreview(null);
  }, [dragItem, dropTarget, endDrag, moveTab, splitPanel, state.panels, state.tabs]);
  
  // Monitor for edge drops and create visual previews
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
    } else {
      // Clear the preview if we're not over an edge
      setSplitPreview(null);
    }
  }, [dropTarget, dragItem]);
  
  // Listen for the custom panel-edge-drop event from DragOverlay
  useEffect(() => {
    const handlePanelEdgeDropEvent = (event: CustomEvent) => {
      console.log('🔌 [PANEL EVENT] Received panel-edge-drop event:', event.detail);
      
      // Process the drop
      handleEdgeDrop();
    };
    
    // Add event listener with type assertion for CustomEvent
    document.addEventListener('panel-edge-drop', handlePanelEdgeDropEvent as EventListener);
    
    return () => {
      // Remove event listener
      document.removeEventListener('panel-edge-drop', handlePanelEdgeDropEvent as EventListener);
    };
  }, [handleEdgeDrop]);
  
  // Secondary monitoring with mouseUp listener as backup
  useEffect(() => {
    if (dropTarget?.type === 'edge' && dragItem?.type === 'tab') {
      // Add a mouse up listener to handle the actual drop
      const eventId = ++mouseEventCounter.current;
      console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Setting up mouseup listener for edge drop (backup)`);
      
      const handleMouseUp = (e: MouseEvent) => {
        console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] MOUSEUP TRIGGERED at ${e.clientX}x${e.clientY}`);
        
        if (dropTarget?.type === 'edge') {
          console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Calling handleEdgeDrop() from mouseup handler`);
          
          try {
            // Only fire this if we have a processing flag that's not set yet
            if (!processingDragEnd.current) {
              handleEdgeDrop();
            } else {
              console.log(`🔍 [EDGE DROP DEBUG] [${eventId}] Skip duplicate processing - already handling drop`);
            }
          } catch (error) {
            console.error(`🔍 [EDGE DROP DEBUG] [${eventId}] ERROR in handleEdgeDrop():`, error);
          }
        }
      };
      
      // Use a direct DOM approach to ensure the event is captured
      document.addEventListener('mouseup', handleMouseUp, { once: true });
      
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
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
