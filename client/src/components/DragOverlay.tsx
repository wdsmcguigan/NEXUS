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
  const { dragItem, endDrag, dropTarget, setDropTarget } = useDragContext();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [edgeZones, setEdgeZones] = useState<DropZone[]>([]);
  
  // Handle mouse movements during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    setMousePosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Check for panel edges when dragging tabs
    if (dragItem.type === 'tab') {
      // Detect panel edges for potential splitting
      const checkPanelEdges = () => {
        const panels = document.querySelectorAll('[data-panel-id]');
        const edgeThreshold = 30; // pixels from edge to trigger
        const foundEdgeZones: DropZone[] = [];
        
        panels.forEach(panel => {
          const panelId = panel.getAttribute('data-panel-id');
          if (!panelId) return;
          
          const rect = panel.getBoundingClientRect();
          
          // Check left edge
          if (Math.abs(e.clientX - rect.left) < edgeThreshold && 
              e.clientY > rect.top && e.clientY < rect.bottom) {
            foundEdgeZones.push({
              id: panelId,
              rect,
              type: 'edge',
              direction: 'left'
            });
          }
          
          // Check right edge
          if (Math.abs(e.clientX - rect.right) < edgeThreshold && 
              e.clientY > rect.top && e.clientY < rect.bottom) {
            foundEdgeZones.push({
              id: panelId,
              rect,
              type: 'edge',
              direction: 'right'
            });
          }
          
          // Check top edge
          if (Math.abs(e.clientY - rect.top) < edgeThreshold && 
              e.clientX > rect.left && e.clientX < rect.right) {
            foundEdgeZones.push({
              id: panelId,
              rect,
              type: 'edge',
              direction: 'top'
            });
          }
          
          // Check bottom edge
          if (Math.abs(e.clientY - rect.bottom) < edgeThreshold && 
              e.clientX > rect.left && e.clientX < rect.right) {
            foundEdgeZones.push({
              id: panelId,
              rect,
              type: 'edge',
              direction: 'bottom'
            });
          }
        });
        
        setEdgeZones(foundEdgeZones);
        
        // If we're over an edge, update drop target
        if (foundEdgeZones.length > 0) {
          // Sort by distance to find closest edge
          const closestEdge = foundEdgeZones.sort((a, b) => {
            const getDistance = (zone: DropZone) => {
              const { rect, direction } = zone;
              switch (direction) {
                case 'left': return Math.abs(e.clientX - rect.left);
                case 'right': return Math.abs(e.clientX - rect.right);
                case 'top': return Math.abs(e.clientY - rect.top);
                case 'bottom': return Math.abs(e.clientY - rect.bottom);
                default: return Number.MAX_VALUE;
              }
            };
            return getDistance(a) - getDistance(b);
          })[0];
          
          setDropTarget({
            id: closestEdge.id,
            type: 'edge',
            rect: closestEdge.rect,
            direction: closestEdge.direction
          });
        }
      };
      
      checkPanelEdges();
    }
  }, [active, dragItem, setDropTarget]);
  
  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    console.log('Mouse up in DragOverlay, dropTarget:', dropTarget);
    
    // If we have a drop target, perform the drop
    if (dropTarget) {
      console.log('Performing drop on target:', dropTarget);
      onDrop(dropTarget);
    } else {
      // Otherwise just end the drag
      console.log('No drop target, ending drag');
      endDrag();
    }
  }, [active, dragItem, dropTarget, endDrag, onDrop]);
  
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
          className="fixed inset-0 z-50 bg-transparent cursor-grabbing"
        />
        
        {/* Tab drag preview */}
        <div
          ref={previewRef}
          className="fixed z-50 px-4 flex items-center h-[40px] bg-neutral-800 border-t-2 border-t-blue-500 shadow-lg rounded opacity-70 pointer-events-none"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            transform: 'translate(-50%, -50%)',
            width: '150px'
          }}
        >
          <div className="flex items-center overflow-hidden w-full">
            {icon && <span className="mr-2 flex-shrink-0 text-blue-400">{icon}</span>}
            <span className="truncate text-white">{title}</span>
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

// Component to render drop preview based on target type
function DropPreview({ target }: { target: DropTarget }) {
  if (!target) return null;
  
  // Panel edge drop preview
  if (target.type === 'edge' && target.direction && target.rect) {
    return <SplitPreview rect={target.rect} direction={target.direction} />;
  }
  
  // Tab position drop preview
  if (target.type === 'position' && target.position) {
    // This is rendered by the AdvancedTabBar component
    return null;
  }
  
  // Default: highlight the entire panel
  if ((target.type === 'panel' || target.type === 'tabbar') && target.rect) {
    return (
      <div
        className="fixed bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded z-40 pointer-events-none"
        style={{
          left: `${target.rect.left}px`,
          top: `${target.rect.top}px`,
          width: `${target.rect.width}px`,
          height: `${target.rect.height}px`
        }}
      />
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
  
  // Define size of the split preview
  const splitSize = 150; // pixels
  
  // Create container style
  let containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 40,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  // Create split preview style
  let previewStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 41,
    pointerEvents: 'none',
    background: 'rgba(59, 130, 246, 0.3)',
    border: '2px solid rgba(59, 130, 246, 1)',
    borderRadius: '4px',
    boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
  };
  
  // Calculate position based on direction
  if (isHorizontal) {
    previewStyle = {
      ...previewStyle,
      left: isStart ? 0 : 'auto',
      right: isStart ? 'auto' : 0,
      top: 0,
      width: splitSize,
      height: '100%',
    };
  } else {
    previewStyle = {
      ...previewStyle,
      left: 0,
      top: isStart ? 0 : 'auto',
      bottom: isStart ? 'auto' : 0,
      width: '100%',
      height: splitSize,
    };
  }
  
  // Create divider line style
  const dividerStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(59, 130, 246, 1)',
    zIndex: 42,
    ...(isHorizontal 
      ? { 
          width: '3px', 
          height: '100%', 
          left: isStart ? splitSize : 'auto',
          right: isStart ? 'auto' : splitSize,
          top: 0
        } 
      : {
          width: '100%',
          height: '3px',
          top: isStart ? splitSize : 'auto',
          bottom: isStart ? 'auto' : splitSize,
          left: 0
        })
  };
  
  return (
    <div style={containerStyle}>
      <div className="animate-pulse" style={previewStyle}>
        {/* Add a visual cue indicating the area will be a new panel */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-sm font-bold bg-blue-600 px-2 py-1 rounded shadow">
            New Panel
          </span>
        </div>
      </div>
      <div style={dividerStyle} />
    </div>
  );
}