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
  const overlayRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { 
    dragItem, 
    endDrag, 
    dropTarget,
    setDropTarget,
    updateMousePosition, 
    detectEdgeZone 
  } = useDragContext();
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
    
    const newPosition = {
      x: e.clientX,
      y: e.clientY
    };
    
    setMousePosition(newPosition);
    updateMousePosition(newPosition.x, newPosition.y);
    
    // Track if we found a drop target
    let foundDropTarget = false;
    
    // PRIORITY 1: Check tab bars first - tab bars have highest priority for tab dragging
    if (dragItem.type === 'tab') {
      const tabBars = document.querySelectorAll('[data-tabbar-id]');
      
      // Convert NodeList to Array to avoid iteration issues
      let foundTabBar = false;
      Array.from(tabBars).forEach(tabBar => {
        if (foundDropTarget || foundTabBar) return;
        
        const panelId = tabBar.getAttribute('data-tabbar-id');
        if (!panelId) return;
        
        // Skip if we're dragging from same panel (not implementing reordering yet)
        if (dragItem.sourcePanelId === panelId) {
          return;
        }
        
        const rect = tabBar.getBoundingClientRect();
        
        // Check if mouse is inside this tabbar with some padding to make it easier to hit
        // Extend the hit area slightly below the tabbar to make it easier to drop
        if (
          newPosition.x >= rect.left &&
          newPosition.x <= rect.right &&
          newPosition.y >= rect.top - 5 && // Add a small buffer zone above
          newPosition.y <= rect.bottom + 10 // Add larger buffer zone below
        ) {
          foundDropTarget = true;
          foundTabBar = true;
          
          // Clear any active edge zone since tab bar has priority
          setActiveEdgeZone(null);
          
          // Create drop target for tabbar
          const target: DropTarget = {
            type: 'tabbar',
            id: panelId,
            rect
          };
          
          console.log(`✨ Found tabbar drop target: ${panelId}`);
          
          // Update the drop target
          setDropTarget(target);
        }
      });
    }
    
    // PRIORITY 2: Only check edge zones if we haven't found a tab bar
    if (!foundDropTarget) {
      // Edge zone detection (for panel splitting)
      edgeZones.forEach(({ rect, panelId }) => {
        if (foundDropTarget) return; // Skip if we already found a target
        
        // Skip if we're dragging from the same panel
        if (dragItem.type === 'tab' && dragItem.sourcePanelId === panelId) {
          return;
        }
        
        const direction = detectEdgeZone(rect, newPosition.x, newPosition.y);
        
        if (direction) {
          foundDropTarget = true;
          setActiveEdgeZone({ panelId, direction });
          
          // Update drop target with edge information
          const target: DropTarget = {
            type: 'edge',
            id: panelId,
            direction,
            rect
          };
          
          console.log(`🔲 Found edge drop target: ${panelId}-${direction}`);
          
          // Update the drop target
          setDropTarget(target);
          return;
        }
      });
    }
    
    // Reset if not in any edge zone
    if (!foundDropTarget && activeEdgeZone) {
      setActiveEdgeZone(null);
    }
    
    // PRIORITY 3: If we didn't find a tab bar or edge zone, check for panel bodies
    if (!foundDropTarget) {
      // Find all panels for dropping into the panel body
      const panels = document.querySelectorAll('[data-panel-body-id]');
      
      panels.forEach(panel => {
        if (foundDropTarget) return; // Skip if we already found a target
        
        const panelId = panel.getAttribute('data-panel-body-id');
        if (!panelId) return;
        
        // Skip if we're dragging a tab from the same panel
        if (dragItem?.type === 'tab' && dragItem.sourcePanelId === panelId) {
          return;
        }
        
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
          
          console.log(`Found drop target: panel ${panelId}`);
          
          // Update the drop target
          setDropTarget(target);
          return;
        }
      });
      
      // If still no target, check tab bars (for tab insertion)
      if (!foundDropTarget) {
        const tabBars = document.querySelectorAll('[data-tabbar-id]');
        
        tabBars.forEach(tabBar => {
          if (foundDropTarget) return; // Skip if we already found a target
          
          const panelId = tabBar.getAttribute('data-tabbar-id');
          if (!panelId) return;
          
          // Skip if we're dragging a tab from the same panel - we're not implementing reordering yet
          if (dragItem?.type === 'tab' && dragItem.sourcePanelId === panelId) {
            return;
          }
          
          const rect = tabBar.getBoundingClientRect();
          
          // Check if mouse is inside this tabbar
          if (
            newPosition.x >= rect.left &&
            newPosition.x <= rect.right &&
            newPosition.y >= rect.top &&
            newPosition.y <= rect.bottom
          ) {
            foundDropTarget = true;
            
            // Create drop target for tabbar
            const target: DropTarget = {
              type: 'tabbar',
              id: panelId,
              rect
            };
            
            console.log(`Found drop target: tabbar ${panelId}`);
            
            // Update the drop target
            setDropTarget(target);
            return;
          }
        });
      }
    }
    
    // If no drop target was found, clear any existing target
    if (!foundDropTarget && dropTarget) {
      // Reset drop target - explicitly passing false since we didn't drop successfully
      setDropTarget(null);
    }
  }, [active, dragItem, edgeZones, detectEdgeZone, activeEdgeZone, updateMousePosition, onDrop, dropTarget, setDropTarget]);
  
  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    console.log('🖱️ Mouse up detected with dragItem:', dragItem);
    
    // Special processing for last-chance detection
    if (!dropTarget && dragItem.type === 'tab') {
      console.log('Attempting last-chance target detection...');
      
      // Find the element under the mouse cursor
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      
      // Look for a panel or tabbar element
      for (const el of elements) {
        // Try to find a panel
        const panelId = el.getAttribute('data-panel-id') || 
                        el.getAttribute('data-panel-body-id');
        
        if (panelId) {
          console.log('Found panel under cursor on mouseup:', panelId);
          const rect = el.getBoundingClientRect();
          
          // Create a drop target for the panel
          const newTarget: DropTarget = {
            type: 'panel',
            id: panelId,
            rect
          };
          
          // Update the drop target in context
          setDropTarget(newTarget);
          break;
        }
        
        // Try to find a tabbar
        const tabBarId = el.getAttribute('data-tabbar-id');
        if (tabBarId) {
          console.log('Found tabbar under cursor on mouseup:', tabBarId);
          const rect = el.getBoundingClientRect();
          
          // Create a drop target for the tabbar
          const newTarget: DropTarget = {
            type: 'tabbar',
            id: tabBarId,
            rect
          };
          
          // Update the drop target in context
          setDropTarget(newTarget);
          break;
        }
      }
    }
    
    // We need to explicitly call the onDrop handler first, then end drag
    // This ensures the drop logic runs with the correct target before drag state is cleaned up
    if (dropTarget) {
      try {
        console.log('🎯 Processing drop in DragOverlay:', dropTarget);
        
        // This will call handlePanelDrop in AdvancedPanelManager with the current drop target
        onDrop(dropTarget);
        
        // Mark drag as completed successfully
        console.log('✅ Drop processed successfully');
        endDrag(true);
      } catch (err) {
        console.error('❌ Error in handleMouseUp drop handler:', err);
        endDrag(false);
      }
    } else {
      // No valid drop target, just cancel the drag
      console.log('❌ No drop target found, cancelling drag');
      endDrag(false);
    }
    
    // Reset state
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
  
  // If not active or no drag item, don't render anything
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
        
        {/* Edge zone indicators - render for all panels */}
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
        
        {/* Drop indicators */}
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
  
  // Function to generate arrow indicators based on direction
  const getArrowIndicator = (direction: DropDirection) => {
    if (!isActive || activeDirection !== direction) return null;
    
    const arrowClasses = "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white animate-pulse";
    
    let position: React.CSSProperties = {};
    let arrowSymbol = "";
    
    switch (direction) {
      case 'top':
        position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        arrowSymbol = "↕"; // Vertical split
        break;
      case 'right':
        position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        arrowSymbol = "↔"; // Horizontal split 
        break;
      case 'bottom':
        position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        arrowSymbol = "↕"; // Vertical split
        break;
      case 'left':
        position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        arrowSymbol = "↔"; // Horizontal split
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
  
  // Panel edge drop preview - used for panel splitting
  if (target.type === 'edge' && target.direction && target.rect) {
    return <SplitPreview rect={target.rect} direction={target.direction} />;
  }
  
  // Tab position drop preview - rendered by the AdvancedTabBar component
  if (target.type === 'position' && target.position) {
    return null;
  }
  
  // Tabbar drop preview - show distinct visual for dropping on tabbar (adding to existing tabs)
  if (target.type === 'tabbar' && target.rect) {
    return (
      <div className="fixed z-50 pointer-events-none" style={{ 
        position: 'absolute',
        left: `${target.rect.left}px`,
        top: `${target.rect.top}px`,
        width: `${target.rect.width}px`,
        height: `${target.rect.height}px`
      }}>
        {/* Tab bar highlight with a different color to distinguish from panel edge */}
        <div 
          className="absolute inset-0 bg-green-500 bg-opacity-15 border-2 border-green-500 rounded-t shadow-lg"
          style={{
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4) inset, 0 0 8px rgba(16, 185, 129, 0.4)'
          }}
        />
        
        {/* Tab indicator label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-green-500 bg-opacity-90 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md">
            Add to Tab Bar
          </div>
        </div>
        
        {/* Add visual "insertion" indicators along the tab bar */}
        <div className="absolute top-0 inset-x-0 flex justify-between items-center" style={{ height: `${target.rect.height}px` }}>
          {/* Insertion markers at regular intervals */}
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="h-full w-0.5 bg-green-400 opacity-70 animate-pulse shadow-sm"
              style={{ 
                animationDelay: `${i * 0.1}s`,
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.7)' 
              }}
            />
          ))}
        </div>
        
        {/* Tab insertion preview */}
        <div className="absolute right-8 top-0 h-full flex items-center">
          <div className="h-[70%] w-0.5 bg-green-400 animate-pulse shadow-lg"
               style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.9)' }} />
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-t opacity-30 animate-pulse" 
             style={{ boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.7)' }} />
      </div>
    );
  }
  
  // Panel drop preview - show distinct visual for dropping on panel content area
  if (target.type === 'panel' && target.rect) {
    return (
      <div
        className="fixed bg-purple-500 bg-opacity-15 border-2 border-purple-500 rounded z-40 pointer-events-none animate-pulse"
        style={{
          left: `${target.rect.left}px`,
          top: `${target.rect.top}px`,
          width: `${target.rect.width}px`,
          height: `${target.rect.height}px`,
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.4) inset, 0 0 8px rgba(139, 92, 246, 0.4)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-purple-500 bg-opacity-90 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md">
            Add to Panel Content
          </div>
        </div>
        
        {/* Corner indicators for visual emphasis */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
    );
  }
  
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
  
  // Define sizes based on percentage of the panel
  const horizontalWidth = rect.width * 0.45; // 45% of panel width
  const verticalHeight = rect.height * 0.45; // 45% of panel height
  
  // Calculate position based on direction
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
  
  // Different gradients based on direction
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
  }
  
  // Determine the split direction label
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
      
      {/* Pulsing edges */}
      <div className="absolute inset-0 border-2 border-blue-400 rounded-md animate-pulse opacity-70"></div>
      
      {/* Corner indicators */}
      <div className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
      <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
    </div>
  );
}