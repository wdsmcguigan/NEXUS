import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDragContext, DropTarget } from '../context/DragContext';

interface DragOverlayProps {
  active: boolean;
  onDrop: (target: DropTarget) => void;
}

/**
 * DragOverlay provides visual feedback and drop target detection for drag operations.
 * Currently only supports tab bar and panel body drops. Panel edge drop functionality
 * has been temporarily removed for stability.
 */
export function DragOverlay({ active, onDrop }: DragOverlayProps) {
  // Refs for DOM elements
  const overlayRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Get drag context
  const { 
    dragItem, 
    endDrag, 
    dropTarget,
    setDropTarget,
    updateMousePosition
  } = useDragContext();
  
  // Local state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Handle mouse movements during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    // Get mouse position
    const newPosition = {
      x: e.clientX,
      y: e.clientY
    };
    
    // Update mouse position in state and context
    setMousePosition(newPosition);
    updateMousePosition(newPosition.x, newPosition.y);
    
    // Track if we found a drop target
    let foundDropTarget = false;
    
    // Only process tab drops - most common drag operation
    if (dragItem.type === 'tab') {
      // Check for tab bars first (highest priority)
      const tabBars = document.querySelectorAll('[data-tabbar-id]');
      
      // Check if mouse is over any tab bar
      Array.from(tabBars).some(tabBar => {
        // Skip if we already found a target
        if (foundDropTarget) return true;
        
        const panelId = tabBar.getAttribute('data-tabbar-id');
        if (!panelId) return false;
        
        // Skip if we're dragging from the same panel
        if (dragItem.sourcePanelId === panelId) return false;
        
        const rect = tabBar.getBoundingClientRect();
        
        // Check if mouse is inside this tabbar (with padding for easier targeting)
        if (
          newPosition.x >= rect.left &&
          newPosition.x <= rect.right &&
          // Extend hit area slightly above and more below the tabbar
          newPosition.y >= rect.top - 8 && 
          newPosition.y <= rect.bottom + 15
        ) {
          foundDropTarget = true;
          
          // Create drop target for tabbar
          const target: DropTarget = {
            type: 'tabbar',
            id: panelId,
            rect
          };
          
          console.log(`🟢 Tab bar drop target: ${panelId}`);
          setDropTarget(target);
          return true; // Break the loop
        }
        
        return false;
      });
      
      // If not over a tab bar, check for panel bodies as secondary option
      if (!foundDropTarget) {
        const panels = document.querySelectorAll('[data-panel-body-id]');
        
        Array.from(panels).some(panel => {
          if (foundDropTarget) return true;
          
          const panelId = panel.getAttribute('data-panel-body-id');
          if (!panelId) return false;
          
          // Skip if we're dragging from the same panel
          if (dragItem.sourcePanelId === panelId) return false;
          
          const rect = panel.getBoundingClientRect();
          
          // Check if mouse is inside this panel
          if (
            newPosition.x >= rect.left &&
            newPosition.x <= rect.right &&
            newPosition.y >= rect.top &&
            newPosition.y <= rect.bottom
          ) {
            foundDropTarget = true;
            
            // Create drop target for panel body
            const target: DropTarget = {
              type: 'panel',
              id: panelId,
              rect
            };
            
            console.log(`🟣 Panel drop target: ${panelId}`);
            setDropTarget(target);
            return true;
          }
          
          return false;
        });
      }
      
      // Clear drop target if nothing was found
      if (!foundDropTarget && dropTarget) {
        setDropTarget(null);
      }
    }
  }, [active, dragItem, dropTarget, setDropTarget, updateMousePosition]);
  
  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    console.log('Mouse up detected with item:', dragItem);
    
    // Last chance detection if no drop target was found
    if (!dropTarget && dragItem.type === 'tab') {
      console.log('Last chance detection...');
      
      // Find elements under cursor
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      
      // Look for panel or tabbar elements
      for (const el of elements) {
        // Check for panels
        const panelId = el.getAttribute('data-panel-id') || 
                       el.getAttribute('data-panel-body-id');
        
        if (panelId) {
          console.log('Found panel under cursor:', panelId);
          const rect = el.getBoundingClientRect();
          
          const newTarget: DropTarget = {
            type: 'panel',
            id: panelId,
            rect
          };
          
          setDropTarget(newTarget);
          break;
        }
        
        // Check for tab bars
        const tabBarId = el.getAttribute('data-tabbar-id');
        if (tabBarId) {
          console.log('Found tab bar under cursor:', tabBarId);
          const rect = el.getBoundingClientRect();
          
          const newTarget: DropTarget = {
            type: 'tabbar',
            id: tabBarId,
            rect
          };
          
          setDropTarget(newTarget);
          break;
        }
      }
    }
    
    // Process the drop if we have a valid target
    if (dropTarget) {
      try {
        console.log('Processing drop:', dropTarget);
        
        // Call the onDrop handler with the current target
        onDrop(dropTarget);
        
        // End the drag operation (success)
        console.log('Drop successful');
        endDrag(true);
      } catch (err) {
        console.error('Error in drop handler:', err);
        endDrag(false);
      }
    } else {
      // No drop target found
      console.log('No drop target found');
      endDrag(false);
    }
  }, [active, dragItem, dropTarget, endDrag, onDrop, setDropTarget]);
  
  // Add/remove event listeners
  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [active, handleMouseMove, handleMouseUp]);
  
  // Don't render anything if not active or no drag item
  if (!active || !dragItem) {
    return null;
  }
  
  // Render tab drag preview
  if (dragItem.type === 'tab') {
    const { title, icon } = dragItem.data || { title: 'Tab', icon: null };
    
    return (
      <>
        {/* Fullscreen transparent overlay */}
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-neutral-950 bg-opacity-10 cursor-grabbing"
        />
        
        {/* Tab drag preview */}
        <div
          ref={previewRef}
          className="fixed z-50 px-4 flex items-center h-[40px] bg-neutral-800 border-t-2 border-t-blue-500 shadow-lg rounded opacity-90 pointer-events-none"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '150px',
            boxShadow: '0 0 12px 2px rgba(59, 130, 246, 0.5)'
          }}
        >
          <div className="flex items-center overflow-hidden w-full">
            {icon && <span className="mr-2 flex-shrink-0 text-blue-400">{icon}</span>}
            <span className="truncate text-white font-medium">{title}</span>
          </div>
          
          {/* Pulsing effect */}
          <div className="absolute inset-0 rounded">
            <div className="absolute inset-0 border border-blue-400 rounded animate-pulse" 
                 style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 border border-blue-300 rounded animate-pulse" 
                 style={{ animationDuration: '2s', animationDelay: '0.2s' }}></div>
          </div>
        </div>
        
        {/* Drop indicators (different visuals for different drop targets) */}
        {dropTarget && (
          <DropPreview target={dropTarget} />
        )}
      </>
    );
  }
  
  // Default case
  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black bg-opacity-10 cursor-grabbing"
    />
  );
}

// Component to render drop preview based on target type
function DropPreview({ target }: { target: DropTarget }) {
  if (!target) return null;
  
  // TABBAR DROP: Green color scheme with tab insertion indicators
  if (target.type === 'tabbar' && target.rect) {
    return (
      <div 
        className="fixed z-50 pointer-events-none" 
        style={{ 
          left: `${target.rect.left}px`,
          top: `${target.rect.top}px`,
          width: `${target.rect.width}px`,
          height: `${target.rect.height}px`
        }}
      >
        {/* Tab bar highlight with green color */}
        <div 
          className="absolute inset-0 bg-green-500 bg-opacity-15 border-t-2 border-l-2 border-r-2 border-green-500 rounded-t shadow-lg"
          style={{
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4) inset, 0 0 8px rgba(16, 185, 129, 0.4)'
          }}
        />
        
        {/* Tab insert indicator - prominent vertical line */}
        <div className="absolute right-1/3 top-0 h-full flex items-center">
          <div 
            className="h-[80%] w-1 bg-green-400 animate-pulse shadow-lg rounded-full"
            style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.9)' }} 
          />
        </div>
        
        {/* Label */}
        <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md">
            Add to Tab Bar
          </div>
        </div>
      </div>
    );
  }
  
  // PANEL CONTENT DROP: Purple color scheme for panel content
  if (target.type === 'panel' && target.rect) {
    return (
      <div
        className="fixed bg-purple-500 bg-opacity-15 border-2 border-purple-500 rounded z-40 pointer-events-none"
        style={{
          left: `${target.rect.left}px`,
          top: `${target.rect.top}px`,
          width: `${target.rect.width}px`,
          height: `${target.rect.height}px`,
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.4) inset, 0 0 8px rgba(139, 92, 246, 0.4)'
        }}
      >
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md">
            Add to Panel Content
          </div>
        </div>
        
        {/* Animated pulsing border */}
        <div className="absolute inset-0 border-2 border-purple-400 rounded animate-pulse" 
             style={{ animationDuration: '1.5s' }}></div>
      </div>
    );
  }
  
  // Default case (unknown target type)
  return null;
}