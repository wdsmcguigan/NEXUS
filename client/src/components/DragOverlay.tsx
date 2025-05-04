import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDragContext, DropDirection, DropTarget } from '../context/DragContext';

interface DropZone {
  id: string;
  rect: DOMRect;
  type: 'panel' | 'edge' | 'tabbar' | 'position';
  direction?: DropDirection;
  index?: number;
}

interface DragOverlayProps {
  active: boolean;
  onDrop: (target: DropTarget) => void;
}

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
    updateMousePosition, 
    detectEdgeZone 
  } = useDragContext();
  
  // Local state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [edgeZones, setEdgeZones] = useState<Map<string, { rect: DOMRect, panelId: string }>>(new Map());
  const [activeEdgeZone, setActiveEdgeZone] = useState<{
    panelId: string, 
    direction: DropDirection
  } | null>(null);
  
  // Detect edge zones on page
  useEffect(() => {
    if (!active || !dragItem) return;
    
    // Get all panels on the page
    const panels = document.querySelectorAll('[data-panel-id]');
    const newEdgeZones = new Map();
    
    panels.forEach(panel => {
      const panelId = panel.getAttribute('data-panel-id');
      if (panelId) {
        const rect = panel.getBoundingClientRect();
        newEdgeZones.set(panelId, { rect, panelId });
      }
    });
    
    setEdgeZones(newEdgeZones);
  }, [active, dragItem]);
  
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
      // --- PRIORITY 1: Check for tab bars first (highest priority) ---
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
          
          // Clear any active edge zone
          setActiveEdgeZone(null);
          
          // Create drop target for tabbar with distinctive green color
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
      
      // --- PRIORITY 2: If not over a tab bar, check for panel edges ---
      if (!foundDropTarget) {
        // Note: We need to convert the Map to an array first to ensure consistent iteration
        Array.from(edgeZones.entries()).forEach(([key, { rect, panelId }]) => {
          if (foundDropTarget) return;
          
          // Skip if we're dragging from the same panel
          if (dragItem.sourcePanelId === panelId) {
            // console.log(`Skipping edge check for source panel: ${panelId}`);
            return;
          }
          
          // Check if we're in an edge zone of this panel
          const direction = detectEdgeZone(rect, newPosition.x, newPosition.y);
          
          if (direction) {
            foundDropTarget = true;
            setActiveEdgeZone({ panelId, direction });
            
            // Create drop target for edge with blue color scheme
            const target: DropTarget = {
              type: 'edge',
              id: panelId,
              direction,
              rect
            };
            
            console.log(`🔷 [DRAG] Edge drop target: ${panelId}-${direction} at x=${newPosition.x}, y=${newPosition.y}`);
            
            // Log some helpful diagnostics
            const edgeWidth = Math.min(rect.width, rect.height) * 0.15; // 15% of the smallest dimension
            console.log(`🔷 [DRAG] Edge zone: width=${edgeWidth}px, rect=${rect.left},${rect.top},${rect.right},${rect.bottom}`);
            
            // Update the drop target
            setDropTarget(target);
          }
        });
      }
      
      // --- PRIORITY 3: If not over a tab bar or edge, check for panel bodies ---
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
            
            // Clear any active edge zone
            setActiveEdgeZone(null);
            
            // Create drop target for panel body with purple color scheme
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
      
      // Reset edge zone highlight if not over any drop target
      if (!foundDropTarget && activeEdgeZone) {
        setActiveEdgeZone(null);
      }
      
      // Clear drop target if nothing was found
      if (!foundDropTarget && dropTarget) {
        setDropTarget(null);
      }
    }
  }, [active, dragItem, edgeZones, detectEdgeZone, activeEdgeZone, dropTarget, setDropTarget, updateMousePosition]);
  
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
    
    // Reset active edge zone
    setActiveEdgeZone(null);
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
        
        {/* Edge zone indicators */}
        {Array.from(edgeZones.values()).map(({ rect, panelId }) => (
          <EdgeZoneIndicators 
            key={panelId}
            rect={rect} 
            panelId={panelId}
            isActive={activeEdgeZone?.panelId === panelId}
            activeDirection={activeEdgeZone?.direction}
          />
        ))}
        
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

// Edge zone indicators component
function EdgeZoneIndicators({ 
  rect, 
  panelId, 
  isActive,
  activeDirection
}: { 
  rect: DOMRect, 
  panelId: string,
  isActive: boolean,
  activeDirection?: DropDirection
}) {
  // Calculate edge zone sizes (20% of panel dimension)
  const edgeSize = Math.min(rect.width, rect.height) * 0.2;
  
  // Common styling for all edge zones
  const getEdgeClasses = (direction: DropDirection) => {
    return `fixed z-40 pointer-events-none transition-all duration-200 ${
      isActive && activeDirection === direction
        ? 'bg-blue-500 bg-opacity-30 border-blue-500 shadow-lg' 
        : 'bg-blue-500 bg-opacity-0 border-blue-500 border-opacity-0'
    } border-2`;
  };
  
  // Generate arrow indicators for direction
  const getArrowIndicator = (direction: DropDirection) => {
    if (!isActive || activeDirection !== direction) return null;
    
    const arrowClasses = "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white animate-pulse";
    
    let position: React.CSSProperties = {};
    let arrowSymbol = "";
    
    switch (direction) {
      case 'top':
      case 'bottom':
        position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        arrowSymbol = "↕"; // Vertical split
        break;
      case 'left':
      case 'right':
        position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        arrowSymbol = "↔"; // Horizontal split 
        break;
      default:
        break;
    }
    
    return (
      <div className={arrowClasses} style={position}>
        {arrowSymbol}
      </div>
    );
  };
  
  return (
    <>
      {/* Top edge zone */}
      <div 
        className={getEdgeClasses('top')}
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: edgeSize,
          borderWidth: isActive && activeDirection === 'top' ? '2px' : '0px'
        }}
        data-edge-zone={`${panelId}-top`}
      >
        {getArrowIndicator('top')}
        {isActive && activeDirection === 'top' && (
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 to-transparent"></div>
        )}
      </div>
      
      {/* Right edge zone */}
      <div 
        className={getEdgeClasses('right')}
        style={{
          right: window.innerWidth - rect.right,
          top: rect.top,
          width: edgeSize,
          height: rect.height,
          borderWidth: isActive && activeDirection === 'right' ? '2px' : '0px'
        }}
        data-edge-zone={`${panelId}-right`}
      >
        {getArrowIndicator('right')}
        {isActive && activeDirection === 'right' && (
          <div className="absolute inset-0 bg-gradient-to-l from-blue-500/30 to-transparent"></div>
        )}
      </div>
      
      {/* Bottom edge zone */}
      <div 
        className={getEdgeClasses('bottom')}
        style={{
          left: rect.left,
          bottom: window.innerHeight - rect.bottom,
          width: rect.width,
          height: edgeSize,
          borderWidth: isActive && activeDirection === 'bottom' ? '2px' : '0px'
        }}
        data-edge-zone={`${panelId}-bottom`}
      >
        {getArrowIndicator('bottom')}
        {isActive && activeDirection === 'bottom' && (
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 to-transparent"></div>
        )}
      </div>
      
      {/* Left edge zone */}
      <div 
        className={getEdgeClasses('left')}
        style={{
          left: rect.left,
          top: rect.top,
          width: edgeSize,
          height: rect.height,
          borderWidth: isActive && activeDirection === 'left' ? '2px' : '0px'
        }}
        data-edge-zone={`${panelId}-left`}
      >
        {getArrowIndicator('left')}
        {isActive && activeDirection === 'left' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent"></div>
        )}
      </div>
    </>
  );
}

// Component to render drop preview based on target type
function DropPreview({ target }: { target: DropTarget }) {
  if (!target) return null;
  
  // PANEL EDGE DROP: Blue color scheme with split indicator
  if (target.type === 'edge' && target.direction && target.rect) {
    return <SplitPreview rect={target.rect} direction={target.direction} />;
  }
  
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

// Component to show panel split preview
function SplitPreview({ 
  rect, 
  direction,
}: { 
  rect: DOMRect, 
  direction: DropDirection
}) {
  const isHorizontal = direction === 'left' || direction === 'right';
  const isStart = direction === 'left' || direction === 'top';
  
  let previewStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 40,
    pointerEvents: 'none',
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // blue-500 with 15% opacity
    borderRadius: '4px',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)', // blue-500 shadow
    border: '2px dashed rgba(59, 130, 246, 0.7)' // blue-500 border
  };
  
  // Calculate preview size and position based on direction
  const horizontalWidth = rect.width * 0.45; // 45% of panel width
  const verticalHeight = rect.height * 0.45; // 45% of panel height
  
  if (isHorizontal) {
    previewStyle = {
      ...previewStyle,
      left: isStart ? rect.left : rect.right - horizontalWidth,
      top: rect.top,
      width: horizontalWidth,
      height: rect.height,
    };
  } else {
    previewStyle = {
      ...previewStyle,
      left: rect.left,
      top: isStart ? rect.top : rect.bottom - verticalHeight,
      width: rect.width,
      height: verticalHeight,
    };
  }
  
  // Direction-specific gradient styles
  let gradientStyle: React.CSSProperties = {};
  
  switch (direction) {
    case 'left':
      gradientStyle = { 
        background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2), transparent)',
        borderRight: '1px solid rgba(59, 130, 246, 0.5)'
      };
      break;
    case 'right':
      gradientStyle = { 
        background: 'linear-gradient(to left, rgba(59, 130, 246, 0.2), transparent)',
        borderLeft: '1px solid rgba(59, 130, 246, 0.5)'
      };
      break;
    case 'top':
      gradientStyle = { 
        background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.2), transparent)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.5)'
      };
      break;
    case 'bottom':
      gradientStyle = { 
        background: 'linear-gradient(to top, rgba(59, 130, 246, 0.2), transparent)',
        borderTop: '1px solid rgba(59, 130, 246, 0.5)'
      };
      break;
    default:
      break;
  }
  
  // Determine split direction label
  const splitLabel = isHorizontal ? 'Horizontal Split' : 'Vertical Split';
  
  return (
    <div
      className="animate-pulse shadow-xl"
      style={previewStyle}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={gradientStyle}></div>
      
      {/* Split indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-blue-500 bg-opacity-80 text-white px-3 py-1 rounded text-sm font-semibold shadow-md">
          {splitLabel}
        </div>
      </div>
      
      {/* Arrow indicator */}
      <div className="absolute inset-0 flex items-center justify-center text-blue-500 text-2xl font-bold">
        {isHorizontal ? '⇔' : '⇕'}
      </div>
    </div>
  );
}