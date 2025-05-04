import React, { useEffect, useRef, useState } from 'react';
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
  }, 2000);
};

// Define edge zone type
type EdgeInfo = { 
  panelId: string, 
  edge: 'top' | 'right' | 'bottom' | 'left',
  rect: DOMRect
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
  
  // Track current edge zone
  const [activeEdge, setActiveEdge] = useState<EdgeInfo | null>(null);
  
  // Access tab context
  const { state, splitPanel, moveTab } = useTabContext();
  
  // Create visualization layer
  const [visualLayer, setVisualLayer] = useState<JSX.Element | null>(null);
  
  useEffect(() => {
    console.log('🔥 DIRECT-DOM APPROACH: SimplePanelEdgeDrop mounted');
    
    // 1. Set up a global dragstart listener to capture when a tab starts dragging
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the dragged element is a tab
      if (target.hasAttribute('data-tab-id') && target.hasAttribute('data-panel-id')) {
        const tabId = target.getAttribute('data-tab-id')!;
        const panelId = target.getAttribute('data-panel-id')!;
        
        console.log(`🔥 DIRECT-DOM APPROACH: Tab drag started: ${tabId} from panel ${panelId}`);
        
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
    
    // 2. Calculate edge zones for all panels - using math-based approach instead of DOM elements
    const calculatePanelEdgeZones = () => {
      const panels = document.querySelectorAll('[data-panel-id]');
      const panelZones: Array<{
        panelId: string,
        rect: DOMRect,
        edges: {
          top: { zone: DOMRect, region: 'top' },
          right: { zone: DOMRect, region: 'right' },
          bottom: { zone: DOMRect, region: 'bottom' },
          left: { zone: DOMRect, region: 'left' }
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
          top: { 
            zone: new DOMRect(
              rect.left,
              rect.top,
              rect.width,
              edgeSize
            ),
            region: 'top' as const
          },
          right: { 
            zone: new DOMRect(
              rect.right - edgeSize,
              rect.top,
              edgeSize,
              rect.height
            ),
            region: 'right' as const
          },
          bottom: { 
            zone: new DOMRect(
              rect.left,
              rect.bottom - edgeSize,
              rect.width,
              edgeSize
            ),
            region: 'bottom' as const
          },
          left: { 
            zone: new DOMRect(
              rect.left,
              rect.top,
              edgeSize,
              rect.height
            ),
            region: 'left' as const
          }
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
      let foundEdge: EdgeInfo | null = null;
      
      for (const pz of panelZones) {
        // Skip the source panel (don't drop on the panel we're dragging from)
        if (pz.panelId === draggedTab.current.panelId) continue;
        
        // Check each edge
        for (const [edgeKey, edgeInfo] of Object.entries(pz.edges)) {
          const zone = edgeInfo.zone;
          
          if (mouseX >= zone.left && mouseX <= zone.left + zone.width &&
              mouseY >= zone.top && mouseY <= zone.top + zone.height) {
            
            // Found an edge zone
            foundEdge = { 
              panelId: pz.panelId, 
              edge: edgeInfo.region,
              rect: pz.rect
            };
            break;
          }
        }
        
        if (foundEdge) break;
      }
      
      // Update active edge if it changed
      if (foundEdge) {
        if (!activeEdge || 
            activeEdge.panelId !== foundEdge.panelId || 
            activeEdge.edge !== foundEdge.edge) {
          setActiveEdge(foundEdge);
        }
      } else if (activeEdge) {
        setActiveEdge(null);
      }
    };
    
    // 4. Handle actual drops
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      
      // Skip if no tab is being dragged or if we're already handling a drop
      if (!draggedTab.current || isHandlingDrop.current || !activeEdge) return;
      
      // Clear visual state
      setActiveEdge(null);
      
      // Set handling flag to prevent multiple processing
      isHandlingDrop.current = true;
      
      try {
        // Store values from refs to local variables - important for async operations
        const tabId = draggedTab.current.id;
        const sourcePanelId = draggedTab.current.panelId;
        const targetPanelId = activeEdge.panelId;
        const edgeDirection = activeEdge.edge;
        
        console.log(`🔥 DIRECT-DOM APPROACH: Dropped on ${edgeDirection} edge of panel ${targetPanelId}`);
        
        // Create a unique new panel ID
        const newPanelId = `panel-${nanoid(8)}`;
        
        // Determine split direction and position
        let direction: 'horizontal' | 'vertical';
        let positionAfter: boolean;
        
        switch (edgeDirection) {
          case 'top':
            direction = 'vertical';
            positionAfter = false;
            break;
          case 'right':
            direction = 'horizontal';
            positionAfter = true;
            break;
          case 'bottom':
            direction = 'vertical';
            positionAfter = true;
            break;
          case 'left':
            direction = 'horizontal';
            positionAfter = false;
            break;
        }
        
        // Show confirmation alert
        createAlert(`Splitting panel at ${edgeDirection} edge`);
        
        // Execute panel split
        splitPanelAndMoveTab(targetPanelId, direction, positionAfter, tabId, sourcePanelId, newPanelId);
      } catch (error) {
        console.error('🔥 DIRECT-DOM APPROACH: Error in drop handler:', error);
        isHandlingDrop.current = false;
      }
    };
    
    // 5. Handle drag end to clean up
    const handleDragEnd = () => {
      // Clear visual state
      setActiveEdge(null);
      
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
      console.log(`🔥 DIRECT-DOM APPROACH: Executing panel split operation:`, {
        targetPanelId,
        direction,
        positionAfter,
        tabId,
        sourcePanelId,
        newPanelId
      });
      
      try {
        // 1. Split the panel
        splitPanel(targetPanelId, direction, { 
          newPanelId,
          positionAfter
        });
        
        // 2. Wait for the panel split to complete, then move the tab
        setTimeout(() => {
          try {
            // Check if panel exists after split
            if (state.panels[newPanelId]) {
              console.log(`🔥 DIRECT-DOM APPROACH: Moving tab ${tabId} to new panel ${newPanelId}`);
              moveTab(tabId, sourcePanelId, newPanelId);
              createAlert(`Tab moved to new panel!`);
            } else {
              // Try to find child panels of the target panel
              const targetPanel = state.panels[targetPanelId];
              
              if (targetPanel?.childPanels?.length) {
                // Find the empty child panel to move the tab to
                const emptyChild = targetPanel.childPanels.find(id => 
                  state.panels[id] && (!state.panels[id].tabs || state.panels[id].tabs.length === 0)
                );
                
                if (emptyChild) {
                  console.log(`🔥 DIRECT-DOM APPROACH: Moving tab to empty child panel ${emptyChild}`);
                  moveTab(tabId, sourcePanelId, emptyChild);
                  createAlert(`Tab moved to new panel!`);
                } else {
                  console.error(`🔥 DIRECT-DOM APPROACH: No empty child panel found`);
                }
              } else {
                console.error(`🔥 DIRECT-DOM APPROACH: Panel split failed, no new panel created`);
              }
            }
          } catch (error) {
            console.error(`🔥 DIRECT-DOM APPROACH: Error moving tab:`, error);
          } finally {
            // Clear flags
            isHandlingDrop.current = false;
          }
        }, 100); // Wait for panel state to update
      } catch (error) {
        console.error(`🔥 DIRECT-DOM APPROACH: Error splitting panel:`, error);
        isHandlingDrop.current = false;
      }
    };
    
    // Add global event listeners for drag operations
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragend', handleDragEnd);
    
    // Clean up on component unmount
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, [moveTab, splitPanel, state.panels, activeEdge]);
  
  // Update visual indicators whenever activeEdge changes
  useEffect(() => {
    if (!activeEdge) {
      setVisualLayer(null);
      return;
    }
    
    const { panelId, edge, rect } = activeEdge;
    
    // Create visualization element based on edge
    let visualStyle: React.CSSProperties = {
      position: 'fixed',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
      zIndex: 40,
      pointerEvents: 'none', // Critical - do not interfere with mouse events
    };
    
    // Position based on edge
    switch (edge) {
      case 'top':
        visualStyle = {
          ...visualStyle,
          top: rect.top + 'px',
          left: rect.left + 'px',
          width: rect.width + 'px',
          height: (rect.height * 0.5) + 'px',
        };
        break;
      case 'right':
        visualStyle = {
          ...visualStyle,
          top: rect.top + 'px',
          left: (rect.left + rect.width * 0.5) + 'px',
          width: (rect.width * 0.5) + 'px',
          height: rect.height + 'px',
        };
        break;
      case 'bottom':
        visualStyle = {
          ...visualStyle,
          top: (rect.top + rect.height * 0.5) + 'px',
          left: rect.left + 'px',
          width: rect.width + 'px',
          height: (rect.height * 0.5) + 'px',
        };
        break;
      case 'left':
        visualStyle = {
          ...visualStyle,
          top: rect.top + 'px',
          left: rect.left + 'px',
          width: (rect.width * 0.5) + 'px',
          height: rect.height + 'px',
        };
        break;
    }
    
    // Set visual layer
    setVisualLayer(
      <div style={visualStyle} className="animate-pulse">
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-blue-500 bg-opacity-40 text-white text-xs px-2 py-1 rounded-md shadow-lg">
            {edge === 'top' || edge === 'bottom' ? 'Split Vertically' : 'Split Horizontally'}
          </div>
        </div>
      </div>
    );
  }, [activeEdge]);
  
  // Render visualization layer
  return visualLayer;
}