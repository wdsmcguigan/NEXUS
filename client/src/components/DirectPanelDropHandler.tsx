import React, { useEffect, useRef, useState } from 'react';
import { useDragContext, DropDirection, DropTarget } from '../context/DragContext';
import { useTabContext } from '../context/TabContext';
import { nanoid } from 'nanoid';

/**
 * DirectPanelDropHandler - A completely new implementation to handle panel edge drops
 * This component takes a direct approach with explicit DOM event handling and bypasses
 * the complex React event system for panel edge drops.
 */
export function DirectPanelDropHandler() {
  console.log('🚧 [DIRECT_HANDLER] DirectPanelDropHandler mounted');
  
  // Access context
  const { 
    dragItem, 
    endDrag,
    setDropTarget
  } = useDragContext();
  
  const { 
    state, 
    splitPanel,
    moveTab
  } = useTabContext();
  
  // Refs and state
  const processingDrop = useRef(false);
  const [panelEdges, setPanelEdges] = useState<Map<string, {
    element: HTMLElement,
    panelId: string,
    directions: {
      direction: DropDirection,
      element: HTMLElement
    }[]
  }>>(new Map());
  
  // State for active edge elements (for visual feedback)
  const [activeEdgeInfo, setActiveEdgeInfo] = useState<{
    panelId: string,
    direction: DropDirection
  } | null>(null);
  
  // Find all panel edges in the DOM and set up drop zones
  useEffect(() => {
    console.log('🚧 [DIRECT_HANDLER] Setting up panel edge detection');
    
    // Find panels in the DOM
    const panels = document.querySelectorAll('[data-panel-id]');
    console.log(`🚧 [DIRECT_HANDLER] Found ${panels.length} panels in the DOM`);
    
    const newPanelEdges = new Map();
    
    // For each panel, create edge drop zones
    panels.forEach(panel => {
      const panelId = panel.getAttribute('data-panel-id');
      
      if (!panelId) {
        console.warn('🚧 [DIRECT_HANDLER] Found panel element without ID');
        return;
      }
      
      console.log(`🚧 [DIRECT_HANDLER] Setting up edge zones for panel ${panelId}`);
      
      // Create edge elements for each direction if they don't exist
      const existingEdgeElements = panel.querySelectorAll('.panel-edge-drop-zone');
      
      if (existingEdgeElements.length === 0) {
        console.log(`🚧 [DIRECT_HANDLER] Creating new edge elements for panel ${panelId}`);
        
        // Create container for edge zones if it doesn't exist
        let edgeContainer = panel.querySelector('.panel-edge-zones-container');
        if (!edgeContainer) {
          edgeContainer = document.createElement('div');
          edgeContainer.className = 'panel-edge-zones-container';
          const containerEl = edgeContainer as HTMLElement;
          containerEl.style.position = 'absolute';
          containerEl.style.inset = '0';
          containerEl.style.pointerEvents = 'none';
          containerEl.style.zIndex = '100';
          panel.appendChild(edgeContainer);
        }
        
        // Define edge zones - top, right, bottom, left
        const directions: DropDirection[] = ['top', 'right', 'bottom', 'left'];
        const edgeElements: {direction: DropDirection, element: HTMLElement}[] = [];
        
        directions.forEach(direction => {
          const edge = document.createElement('div');
          edge.className = `panel-edge-drop-zone panel-edge-${direction}`;
          edge.setAttribute('data-panel-id', panelId);
          edge.setAttribute('data-edge-direction', direction);
          
          // Style the edge zone
          (edge as HTMLElement).style.position = 'absolute';
          (edge as HTMLElement).style.zIndex = '10';
          (edge as HTMLElement).style.pointerEvents = 'all';
          
          // Set size and position based on direction
          const edgeSize = '20px';
          const edgeEl = edge as HTMLElement;
          if (direction === 'top') {
            edgeEl.style.top = '0';
            edgeEl.style.left = '0';
            edgeEl.style.right = '0';
            edgeEl.style.height = edgeSize;
          } else if (direction === 'right') {
            edgeEl.style.top = '0';
            edgeEl.style.right = '0';
            edgeEl.style.bottom = '0';
            edgeEl.style.width = edgeSize;
          } else if (direction === 'bottom') {
            edgeEl.style.bottom = '0';
            edgeEl.style.left = '0';
            edgeEl.style.right = '0';
            edgeEl.style.height = edgeSize;
          } else if (direction === 'left') {
            edgeEl.style.top = '0';
            edgeEl.style.left = '0';
            edgeEl.style.bottom = '0';
            edgeEl.style.width = edgeSize;
          }
          
          // Add to container
          if (edgeContainer) {
            edgeContainer.appendChild(edge);
          }
          
          edgeElements.push({direction, element: edge});
        });
        
        // Add to panel edges map
        newPanelEdges.set(panelId, {
          element: panel as HTMLElement,
          panelId,
          directions: edgeElements
        });
      } else {
        console.log(`🚧 [DIRECT_HANDLER] Panel ${panelId} already has edge elements`);
        
        // Collect existing edge elements
        const edgeElements: {direction: DropDirection, element: HTMLElement}[] = [];
        existingEdgeElements.forEach(el => {
          const direction = el.getAttribute('data-edge-direction') as DropDirection;
          if (direction) {
            edgeElements.push({direction, element: el as HTMLElement});
          }
        });
        
        // Add to panel edges map
        newPanelEdges.set(panelId, {
          element: panel as HTMLElement,
          panelId,
          directions: edgeElements
        });
      }
    });
    
    setPanelEdges(newPanelEdges);
    
    // Set up a once-per-execution ID for panel IDs to avoid collisions
    window.__directPanelDropHandlerExecutionId = Date.now();
    
    console.log(`🚧 [DIRECT_HANDLER] Edge detection setup complete, found ${newPanelEdges.size} panels with edges`);
  }, []);
  
  // Set up event listeners for drag and drop
  useEffect(() => {
    console.log('🚧 [DIRECT_HANDLER] Setting up drag and drop event listeners');
    
    // Helper to check if a target is an edge element
    const isEdgeElement = (target: HTMLElement): {isEdge: boolean, panelId?: string, direction?: DropDirection} => {
      if (target.classList.contains('panel-edge-drop-zone')) {
        const panelId = target.getAttribute('data-panel-id');
        const direction = target.getAttribute('data-edge-direction') as DropDirection;
        
        if (panelId && direction) {
          return { isEdge: true, panelId, direction };
        }
      }
      return { isEdge: false };
    };
    
    // Event handlers
    const handleDragOver = (e: DragEvent) => {
      if (!dragItem || dragItem.type !== 'tab') return;
      
      // Check if we're over an edge element
      const target = e.target as HTMLElement;
      const edgeInfo = isEdgeElement(target);
      
      if (edgeInfo.isEdge && edgeInfo.panelId && edgeInfo.direction) {
        console.log(`🚧 [DIRECT_HANDLER] Drag over edge: panel=${edgeInfo.panelId}, direction=${edgeInfo.direction}`);
        
        // Allow the drop
        e.preventDefault();
        
        // Show visual indication
        setActiveEdgeInfo({
          panelId: edgeInfo.panelId,
          direction: edgeInfo.direction
        });
        
        // Update drop target in context for consistency
        const rect = target.getBoundingClientRect();
        setDropTarget({
          type: 'edge',
          id: edgeInfo.panelId,
          direction: edgeInfo.direction,
          rect
        });
      } else if (activeEdgeInfo) {
        // Clear visual indication if we're not over an edge
        setActiveEdgeInfo(null);
        setDropTarget(null);
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      // Clear visual indication
      setActiveEdgeInfo(null);
      setDropTarget(null);
    };
    
    const handleDrop = (e: DragEvent) => {
      if (!dragItem || dragItem.type !== 'tab' || !dragItem.sourcePanelId) {
        console.log('🚧 [DIRECT_HANDLER] Drop ignored - no valid drag item');
        return;
      }
      
      // Prevent browser default behavior
      e.preventDefault();
      e.stopPropagation();
      
      // Check if we're over an edge element
      const target = e.target as HTMLElement;
      const edgeInfo = isEdgeElement(target);
      
      if (edgeInfo.isEdge && edgeInfo.panelId && edgeInfo.direction) {
        console.log(`🚧 [DIRECT_HANDLER] Drop on edge: panel=${edgeInfo.panelId}, direction=${edgeInfo.direction}, tab=${dragItem.id}`);
        
        // Only process if not already processing another drop
        if (processingDrop.current) {
          console.log('🚧 [DIRECT_HANDLER] Already processing a drop, ignoring this one');
          return;
        }
        
        // Set processing flag
        processingDrop.current = true;
        
        // Clear visual indication
        setActiveEdgeInfo(null);
        
        // Execute panel split and tab move
        handlePanelEdgeDrop(dragItem.id, dragItem.sourcePanelId, edgeInfo.panelId, edgeInfo.direction);
      }
    };
    
    // Add event listeners to document to catch all events
    document.addEventListener('dragover', handleDragOver as EventListener);
    document.addEventListener('dragleave', handleDragLeave as EventListener);
    document.addEventListener('drop', handleDrop as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener('dragover', handleDragOver as EventListener);
      document.removeEventListener('dragleave', handleDragLeave as EventListener);
      document.removeEventListener('drop', handleDrop as EventListener);
    };
  }, [dragItem, activeEdgeInfo, setDropTarget]);
  
  // Highlight active edge for visual feedback
  useEffect(() => {
    // First remove highlighting from all edges
    document.querySelectorAll('.panel-edge-drop-zone').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '';
    });
    
    // Add highlighting to active edge
    if (activeEdgeInfo) {
      const edgeElement = document.querySelector(
        `.panel-edge-drop-zone[data-panel-id="${activeEdgeInfo.panelId}"][data-edge-direction="${activeEdgeInfo.direction}"]`
      );
      
      if (edgeElement) {
        (edgeElement as HTMLElement).style.backgroundColor = 'rgba(0, 120, 255, 0.3)';
      }
    }
  }, [activeEdgeInfo]);
  
  // The core function to handle panel edge drops
  const handlePanelEdgeDrop = (
    tabId: string,
    sourcePanelId: string,
    targetPanelId: string,
    direction: DropDirection
  ) => {
    console.log('🔧 [EDGE DROP HANDLER] START - handleEdgeDrop called', {
      tabId,
      sourcePanelId,
      targetPanelId,
      direction
    });
    
    // First validate all inputs to avoid mysterious errors
    if (!tabId || !sourcePanelId || !targetPanelId || !direction) {
      console.error('🔧 [EDGE DROP HANDLER] ERROR - Missing required parameters:', {
        tabId,
        sourcePanelId, 
        targetPanelId,
        direction
      });
      endDrag(false);
      processingDrop.current = false;
      return;
    }
    
    // Validate that the tab exists
    if (!state.tabs[tabId]) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR - Tab ${tabId} not found in state`);
      endDrag(false);
      processingDrop.current = false;
      return;
    }
    
    // Validate source panel exists
    if (!state.panels[sourcePanelId]) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR - Source panel ${sourcePanelId} not found`);
      endDrag(false);
      processingDrop.current = false;
      return;
    }
    
    // Validate target panel exists
    if (!state.panels[targetPanelId]) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR - Target panel ${targetPanelId} not found`);
      endDrag(false);
      processingDrop.current = false;
      return;
    }
    
    // Validate tab is in source panel
    const sourcePanel = state.panels[sourcePanelId];
    if (!sourcePanel.tabs.includes(tabId)) {
      console.error(`🔧 [EDGE DROP HANDLER] ERROR - Tab ${tabId} not found in source panel ${sourcePanelId}`);
      endDrag(false);
      processingDrop.current = false;
      return;
    }
    
    console.log('🔧 [EDGE DROP HANDLER] Validation passed, processing valid edge drop');
    
    // Step 1: Determine the split direction
    let splitDirection: 'horizontal' | 'vertical';
    if (direction === 'left' || direction === 'right') {
      splitDirection = 'horizontal';
    } else {
      splitDirection = 'vertical';
    }
    
    // Step 2: Determine panel order
    const positionAfter = direction === 'right' || direction === 'bottom';
    
    // Step 3: Generate a new panel ID
    const executionId = window.__directPanelDropHandlerExecutionId || Date.now();
    const timestamp = Date.now();
    const sanitizedTargetId = targetPanelId.replace(/[^a-zA-Z0-9]/g, '');
    const newPanelId = `panel-${sanitizedTargetId}-${executionId}-${timestamp}`;
    
    console.log(`🔧 [EDGE DROP HANDLER] Using direction=${splitDirection}, positionAfter=${positionAfter}, newPanelId=${newPanelId}`);
    
    try {
      // Step 4: Execute the panel split
      const splitOptions = {
        newPanelId: newPanelId,
        positionAfter: positionAfter
      };
      
      // Important: Handle any exception that might occur during the split operation
      try {
        console.log('🔧 [EDGE DROP HANDLER] About to call splitPanel with:', {
          targetPanelId,
          splitDirection,
          splitOptions
        });
        
        splitPanel(targetPanelId, splitDirection, splitOptions);
        
        console.log('🔧 [EDGE DROP HANDLER] splitPanel called successfully');
      } catch (error) {
        console.error('🔧 [EDGE DROP HANDLER] ERROR during panel split operation:', error);
        endDrag(false);
        processingDrop.current = false;
        return;
      }
      
      // Step 5: Wait for the panel to be created, then move the tab
      // Use a longer timeout to ensure state updates
      setTimeout(() => {
        try {
          // First check if the panel was created with the exact ID we specified
          let targetPanelForTab = state.panels[newPanelId];
          
          if (targetPanelForTab) {
            console.log(`🔧 [EDGE DROP HANDLER] Found new panel with ID ${newPanelId}`);
          } else {
            // Check for child panels of the target if our exact panel wasn't created
            const targetPanel = state.panels[targetPanelId];
            
            if (targetPanel && targetPanel.childPanels && targetPanel.childPanels.length > 0) {
              console.log(`🔧 [EDGE DROP HANDLER] Target panel has child panels:`, targetPanel.childPanels);
              
              // Find an empty child panel
              const emptyChildId = targetPanel.childPanels.find(
                childId => state.panels[childId] && state.panels[childId].tabs.length === 0
              );
              
              if (emptyChildId) {
                console.log(`🔧 [EDGE DROP HANDLER] Will move tab to empty child panel ${emptyChildId}`);
                targetPanelForTab = state.panels[emptyChildId];
              } else {
                console.warn('🔧 [EDGE DROP HANDLER] No empty child panel found');
              }
            }
          }
          
          // If we found a valid target panel, move the tab
          if (targetPanelForTab) {
            try {
              console.log(`🔧 [EDGE DROP HANDLER] Moving tab ${tabId} from ${sourcePanelId} to ${targetPanelForTab.id}`);
              moveTab(tabId, sourcePanelId, targetPanelForTab.id);
              console.log('🔧 [EDGE DROP HANDLER] Tab moved successfully');
              endDrag(true);
            } catch (moveError) {
              console.error('🔧 [EDGE DROP HANDLER] ERROR moving tab:', moveError);
              endDrag(false);
            }
          } else {
            console.error('🔧 [EDGE DROP HANDLER] No suitable target panel found for the tab');
            endDrag(false);
          }
        } catch (error) {
          console.error('🔧 [EDGE DROP HANDLER] ERROR in tab move phase:', error);
          endDrag(false);
        } finally {
          // Cleanup regardless of success/failure 
          processingDrop.current = false;
          
          // Dispatch a custom event to notify that edge drop handling is complete
          console.log('🔧 [EDGE DROP HANDLER] Dispatching panel-edge-drop-complete event');
          document.dispatchEvent(new CustomEvent('panel-edge-drop-complete'));
        }
      }, 300); // Longer timeout to ensure state updates
    } catch (outerError) {
      console.error('🔧 [EDGE DROP HANDLER] CRITICAL ERROR in edge drop handler:', outerError);
      
      // Safely end the drag operation even if things go very wrong
      console.log('🔧 [EDGE DROP HANDLER] Safely ending drag (success: false)');
      endDrag(false);
      processingDrop.current = false;
      
      // Still dispatch the event to ensure cleanup
      console.log('🔧 [EDGE DROP HANDLER] Dispatching panel-edge-drop-complete event');
      document.dispatchEvent(new CustomEvent('panel-edge-drop-complete'));
    }
  };
  
  // This component doesn't render anything visible
  return null;
}

// Add the execution ID to the window object
declare global {
  interface Window {
    __directPanelDropHandlerExecutionId?: number;
  }
}