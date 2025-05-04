import React, { useEffect, useRef } from 'react';
import { useTabContext } from '../context/TabContext';
import { nanoid } from 'nanoid';

// Utility to create a simple visual element for debugging
const createAlert = (message: string) => {
  const alertDiv = document.createElement('div');
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '50%';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translate(-50%, -50%)';
  alertDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
  alertDiv.style.color = 'white';
  alertDiv.style.padding = '20px';
  alertDiv.style.borderRadius = '10px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.maxWidth = '80%';
  alertDiv.style.textAlign = 'center';
  alertDiv.innerText = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    document.body.removeChild(alertDiv);
  }, 3000);
};

/**
 * A completely different approach to panel edge detection and splitting.
 * This component uses direct DOM manipulation and bypasses React's synthetic
 * event system for handling drops on panel edges.
 */
export function SimplePanelEdgeDrop() {
  // Reference to keep track of dragged tab
  const draggedTab = useRef<{
    id: string;
    panelId: string;
  } | null>(null);
  
  // Flag to prevent multiple handling of the same drop
  const isHandlingDrop = useRef(false);
  
  // Access tab context
  const { state, splitPanel, moveTab } = useTabContext();
  
  useEffect(() => {
    console.log('🔥 NEW APPROACH: SimplePanelEdgeDrop mounted');
    
    // 1. Set up a global dragstart listener to capture when a tab starts dragging
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the dragged element is a tab
      if (target.hasAttribute('data-tab-id') && target.hasAttribute('data-panel-id')) {
        const tabId = target.getAttribute('data-tab-id')!;
        const panelId = target.getAttribute('data-panel-id')!;
        
        console.log(`🔥 NEW APPROACH: Tab drag started: ${tabId} from panel ${panelId}`);
        
        // Store the dragged tab information
        draggedTab.current = {
          id: tabId,
          panelId: panelId
        };
        
        // Add visual drag data
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', `tab:${tabId}`);
          e.dataTransfer.effectAllowed = 'move';
          
          // Try to set a drag image if possible
          if (target.parentElement) {
            const dragImage = target.cloneNode(true) as HTMLElement;
            dragImage.style.transform = 'translate(-50%, -50%)';
            dragImage.style.opacity = '0.8';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            
            // Clean up the temporary element
            setTimeout(() => {
              document.body.removeChild(dragImage);
            }, 0);
          }
        }
      }
    };
    
    // 2. Calculate edge zones for all panels
    const calculatePanelEdgeZones = () => {
      const panels = document.querySelectorAll('[data-panel-id]');
      const panelZones: Array<{
        panelId: string,
        rect: DOMRect,
        edges: {
          top: DOMRect,
          right: DOMRect,
          bottom: DOMRect,
          left: DOMRect
        }
      }> = [];
      
      panels.forEach(panel => {
        const panelId = panel.getAttribute('data-panel-id');
        if (!panelId) return;
        
        const rect = panel.getBoundingClientRect();
        
        // Define edge zone thickness (pixels)
        const edgeSize = 30;
        
        // Calculate edge rectangles
        const edges = {
          top: new DOMRect(
            rect.left,
            rect.top,
            rect.width,
            edgeSize
          ),
          right: new DOMRect(
            rect.right - edgeSize,
            rect.top,
            edgeSize,
            rect.height
          ),
          bottom: new DOMRect(
            rect.left,
            rect.bottom - edgeSize,
            rect.width,
            edgeSize
          ),
          left: new DOMRect(
            rect.left,
            rect.top,
            edgeSize,
            rect.height
          )
        };
        
        panelZones.push({
          panelId,
          rect,
          edges
        });
      });
      
      return panelZones;
    };
    
    // 3. Handle dragover to detect if we're in an edge zone
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault(); // Allow drop
      
      // Skip if no tab is being dragged
      if (!draggedTab.current) return;
      
      // Get mouse position
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Calculate edge zones for all panels
      const panelZones = calculatePanelEdgeZones();
      
      // Check if mouse is in any edge zone
      let inEdgeZone = false;
      let edgeInfo: { panelId: string, edge: 'top' | 'right' | 'bottom' | 'left' } | null = null;
      
      for (const pz of panelZones) {
        // Skip the source panel (don't drop on the panel we're dragging from)
        if (pz.panelId === draggedTab.current.panelId) continue;
        
        // Check each edge
        if (mouseX >= pz.edges.top.left && mouseX <= pz.edges.top.right &&
            mouseY >= pz.edges.top.top && mouseY <= pz.edges.top.bottom) {
          inEdgeZone = true;
          edgeInfo = { panelId: pz.panelId, edge: 'top' };
          break;
        }
        
        if (mouseX >= pz.edges.right.left && mouseX <= pz.edges.right.right &&
            mouseY >= pz.edges.right.top && mouseY <= pz.edges.right.bottom) {
          inEdgeZone = true;
          edgeInfo = { panelId: pz.panelId, edge: 'right' };
          break;
        }
        
        if (mouseX >= pz.edges.bottom.left && mouseX <= pz.edges.bottom.right &&
            mouseY >= pz.edges.bottom.top && mouseY <= pz.edges.bottom.bottom) {
          inEdgeZone = true;
          edgeInfo = { panelId: pz.panelId, edge: 'bottom' };
          break;
        }
        
        if (mouseX >= pz.edges.left.left && mouseX <= pz.edges.left.right &&
            mouseY >= pz.edges.left.top && mouseY <= pz.edges.left.bottom) {
          inEdgeZone = true;
          edgeInfo = { panelId: pz.panelId, edge: 'left' };
          break;
        }
      }
      
      // Show visual feedback for edge zones
      document.querySelectorAll('.panel-edge-highlight').forEach(el => el.remove());
      
      if (inEdgeZone && edgeInfo) {
        console.log(`🔥 NEW APPROACH: Dragging over ${edgeInfo.edge} edge of panel ${edgeInfo.panelId}`);
        
        // Create visual indicator
        const highlight = document.createElement('div');
        highlight.className = 'panel-edge-highlight';
        highlight.style.position = 'fixed';
        highlight.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
        highlight.style.border = '2px dashed rgba(59, 130, 246, 0.7)';
        highlight.style.zIndex = '9000';
        highlight.style.pointerEvents = 'none';
        
        // Find panel element
        const panelElement = document.querySelector(`[data-panel-id="${edgeInfo.panelId}"]`);
        if (panelElement) {
          const rect = panelElement.getBoundingClientRect();
          
          // Position based on edge
          switch (edgeInfo.edge) {
            case 'top':
              highlight.style.top = `${rect.top}px`;
              highlight.style.left = `${rect.left}px`;
              highlight.style.width = `${rect.width}px`;
              highlight.style.height = `${rect.height * 0.5}px`;
              break;
            case 'right':
              highlight.style.top = `${rect.top}px`;
              highlight.style.left = `${rect.left + rect.width * 0.5}px`;
              highlight.style.width = `${rect.width * 0.5}px`;
              highlight.style.height = `${rect.height}px`;
              break;
            case 'bottom':
              highlight.style.top = `${rect.top + rect.height * 0.5}px`;
              highlight.style.left = `${rect.left}px`;
              highlight.style.width = `${rect.width}px`;
              highlight.style.height = `${rect.height * 0.5}px`;
              break;
            case 'left':
              highlight.style.top = `${rect.top}px`;
              highlight.style.left = `${rect.left}px`;
              highlight.style.width = `${rect.width * 0.5}px`;
              highlight.style.height = `${rect.height}px`;
              break;
          }
          
          // Add to document
          document.body.appendChild(highlight);
        }
      }
    };
    
    // 4. Handle actual drops
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      
      // Clean up visual indicators immediately
      document.querySelectorAll('.panel-edge-highlight').forEach(el => el.remove());
      
      // Skip if no tab is being dragged or if we're already handling a drop
      if (!draggedTab.current || isHandlingDrop.current) return;
      
      // Set handling flag to prevent multiple processing
      isHandlingDrop.current = true;
      
      try {
        // Get mouse position
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Calculate edge zones for all panels
        const panelZones = calculatePanelEdgeZones();
        
        // Check if drop is in any edge zone
        for (const pz of panelZones) {
          // Skip the source panel (don't drop on the panel we're dragging from)
          if (pz.panelId === draggedTab.current.panelId) continue;
          
          // Store tab data for use in callbacks
          const tabId = draggedTab.current.id;
          const sourcePanelId = draggedTab.current.panelId;
          
          // Check each edge
          // TOP EDGE
          if (mouseX >= pz.edges.top.left && mouseX <= pz.edges.top.right &&
              mouseY >= pz.edges.top.top && mouseY <= pz.edges.top.bottom) {
            console.log(`🔥 NEW APPROACH: Dropped on TOP edge of panel ${pz.panelId}`);
            createAlert(`Dropped tab ${tabId} on TOP edge of panel ${pz.panelId}`);
            
            // Create new panel ID
            const newPanelId = `panel-${nanoid(8)}`;
            
            // Execute split with panel above
            splitPanelAndMoveTab(pz.panelId, 'vertical', false, tabId, sourcePanelId, newPanelId);
            return;
          }
          
          // RIGHT EDGE
          if (mouseX >= pz.edges.right.left && mouseX <= pz.edges.right.right &&
              mouseY >= pz.edges.right.top && mouseY <= pz.edges.right.bottom) {
            console.log(`🔥 NEW APPROACH: Dropped on RIGHT edge of panel ${pz.panelId}`);
            createAlert(`Dropped tab ${tabId} on RIGHT edge of panel ${pz.panelId}`);
            
            // Create new panel ID
            const newPanelId = `panel-${nanoid(8)}`;
            
            // Execute split with panel to the right
            splitPanelAndMoveTab(pz.panelId, 'horizontal', true, tabId, sourcePanelId, newPanelId);
            return;
          }
          
          // BOTTOM EDGE
          if (mouseX >= pz.edges.bottom.left && mouseX <= pz.edges.bottom.right &&
              mouseY >= pz.edges.bottom.top && mouseY <= pz.edges.bottom.bottom) {
            console.log(`🔥 NEW APPROACH: Dropped on BOTTOM edge of panel ${pz.panelId}`);
            createAlert(`Dropped tab ${tabId} on BOTTOM edge of panel ${pz.panelId}`);
            
            // Create new panel ID
            const newPanelId = `panel-${nanoid(8)}`;
            
            // Execute split with panel below
            splitPanelAndMoveTab(pz.panelId, 'vertical', true, tabId, sourcePanelId, newPanelId);
            return;
          }
          
          // LEFT EDGE
          if (mouseX >= pz.edges.left.left && mouseX <= pz.edges.left.right &&
              mouseY >= pz.edges.left.top && mouseY <= pz.edges.left.bottom) {
            console.log(`🔥 NEW APPROACH: Dropped on LEFT edge of panel ${pz.panelId}`);
            createAlert(`Dropped tab ${tabId} on LEFT edge of panel ${pz.panelId}`);
            
            // Create new panel ID
            const newPanelId = `panel-${nanoid(8)}`;
            
            // Execute split with panel to the left
            splitPanelAndMoveTab(pz.panelId, 'horizontal', false, tabId, sourcePanelId, newPanelId);
            return;
          }
        }
      } finally {
        // Clear dragged tab and handling flag
        draggedTab.current = null;
        isHandlingDrop.current = false;
      }
    };
    
    // 5. Handle drag end to clean up
    const handleDragEnd = () => {
      // Clean up visual indicators
      document.querySelectorAll('.panel-edge-highlight').forEach(el => el.remove());
      
      // Clear dragged tab
      draggedTab.current = null;
      isHandlingDrop.current = false;
    };
    
    // Helper function to split panel and move tab in one operation
    const splitPanelAndMoveTab = (
      targetPanelId: string,
      direction: 'horizontal' | 'vertical',
      positionAfter: boolean, 
      tabId: string,
      sourcePanelId: string,
      newPanelId: string
    ) => {
      console.log(`🔥 NEW APPROACH: Executing panel split operation:`, {
        targetPanelId,
        direction,
        positionAfter,
        tabId,
        sourcePanelId,
        newPanelId
      });
      
      try {
        // 1. Split the panel
        console.log(`🔥 NEW APPROACH: Calling splitPanel with options:`, {
          targetPanelId,
          direction,
          options: {
            newPanelId,
            positionAfter
          }
        });
        
        splitPanel(targetPanelId, direction, { 
          newPanelId,
          positionAfter
        });
        
        // 2. Wait for the panel split to complete, then move the tab
        setTimeout(() => {
          console.log(`🔥 NEW APPROACH: Attempting to move tab ${tabId} to new panel ${newPanelId}`);
          
          try {
            // Check if panel exists after split
            if (state.panels[newPanelId]) {
              console.log(`🔥 NEW APPROACH: New panel ${newPanelId} exists, moving tab`);
              moveTab(tabId, sourcePanelId, newPanelId);
              
              // Success message
              console.log(`🔥 NEW APPROACH: Tab ${tabId} successfully moved to panel ${newPanelId}`);
              createAlert(`Successfully split panel and moved tab!`);
            } else {
              // Try to find child panels of the target panel
              const targetPanel = state.panels[targetPanelId];
              
              if (targetPanel?.childPanels?.length) {
                console.log(`🔥 NEW APPROACH: Target has child panels:`, targetPanel.childPanels);
                
                // Find the empty child panel to move the tab to
                const emptyChild = targetPanel.childPanels.find(id => 
                  state.panels[id] && (!state.panels[id].tabs || state.panels[id].tabs.length === 0)
                );
                
                if (emptyChild) {
                  console.log(`🔥 NEW APPROACH: Moving tab to empty child panel ${emptyChild}`);
                  moveTab(tabId, sourcePanelId, emptyChild);
                  createAlert(`Tab moved to new panel!`);
                } else {
                  console.error(`🔥 NEW APPROACH: No empty child panel found`);
                  createAlert(`Error: No empty panel found after split`);
                }
              } else {
                console.error(`🔥 NEW APPROACH: Panel split failed, no new panel created`);
                createAlert(`Error: Panel split failed!`);
              }
            }
          } catch (error) {
            console.error(`🔥 NEW APPROACH: Error moving tab:`, error);
            createAlert(`Error moving tab: ${error}`);
          }
        }, 300); // Wait for panel state to update
      } catch (error) {
        console.error(`🔥 NEW APPROACH: Error splitting panel:`, error);
        createAlert(`Error splitting panel: ${error}`);
      }
    };
    
    // Add event listeners
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);
    
    // Clean up
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragend', handleDragEnd);
      
      // Remove any visual elements
      document.querySelectorAll('.panel-edge-highlight').forEach(el => el.remove());
    };
  }, [moveTab, splitPanel, state.panels]);
  
  // This component doesn't render anything visual
  return null;
}