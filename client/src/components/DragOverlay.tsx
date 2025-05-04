import React, { useEffect, useState, useCallback } from 'react';
import { useDragContext, DropTarget, DropDirection } from '../context/DragContext';
import { cn } from '@/lib/utils';

// Define types for drop zones
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

// Edge detection thresholds
const EDGE_THRESHOLD = 40; // px from edge of panel
const EDGE_SIZE = 40; // px width/height of edge drop zone
const CENTER_THRESHOLD = 0.3; // percentage of center area for panel drop
const TABBAR_HEIGHT = 40; // px height of tab bar

export function DragOverlay({ active, onDrop }: DragOverlayProps) {
  const { dragItem, dragOperation, setDropTarget } = useDragContext();
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [highlightedZone, setHighlightedZone] = useState<DropZone | null>(null);
  
  // Find all drop zones in the application when the overlay becomes active
  useEffect(() => {
    if (!active) {
      setDropZones([]);
      setHighlightedZone(null);
      return;
    }
    
    // Find panel drop zones (all panel content areas)
    const panelEls = document.querySelectorAll('[data-panel-drop-zone]');
    const panelZones: DropZone[] = Array.from(panelEls).map(el => ({
      id: el.getAttribute('data-panel-id') || '',
      rect: el.getBoundingClientRect(),
      type: 'panel'
    }));
    
    // Find edge drop zones - edges of panels
    const edgeEls = document.querySelectorAll('[data-edge-drop-zone]');
    const edgeZones: DropZone[] = Array.from(edgeEls).map(el => ({
      id: el.getAttribute('data-panel-id') || '',
      rect: el.getBoundingClientRect(),
      type: 'edge',
      direction: el.getAttribute('data-edge-direction') as DropDirection
    }));
    
    // Find tabbar drop zones for tab position insertion
    const tabbarEls = document.querySelectorAll('[data-tabbar-drop-zone]');
    const tabbarZones: DropZone[] = Array.from(tabbarEls).map(el => ({
      id: el.getAttribute('data-panel-id') || '',
      rect: el.getBoundingClientRect(),
      type: 'tabbar'
    }));
    
    // Find tab position drop zones
    const tabEls = document.querySelectorAll('[data-tab-drop-zone]');
    const tabPositionZones: DropZone[] = Array.from(tabEls).map(el => {
      const rect = el.getBoundingClientRect();
      // Create two zones - before and after for each tab
      return [
        {
          id: el.getAttribute('data-panel-id') || '',
          rect: new DOMRect(rect.left, rect.top, rect.width / 2, rect.height),
          type: 'position',
          direction: 'before',
          index: parseInt(el.getAttribute('data-tab-index') || '0')
        },
        {
          id: el.getAttribute('data-panel-id') || '',
          rect: new DOMRect(rect.left + rect.width / 2, rect.top, rect.width / 2, rect.height),
          type: 'position',
          direction: 'after',
          index: parseInt(el.getAttribute('data-tab-index') || '0')
        }
      ];
    }).flat();
    
    setDropZones([...panelZones, ...edgeZones, ...tabbarZones, ...tabPositionZones]);
  }, [active]);
  
  // Handle mouse movement to highlight appropriate zone
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!active || dropZones.length === 0 || !dragItem) return;
    
    const { clientX, clientY } = e;
    let bestZone: DropZone | null = null;
    let bestPriority = -1;
    
    // Check if we're dragging a tab and should skip specific zones
    const isTabDrag = dragItem.type === 'tab';
    const sourcePanelId = dragItem.sourcePanelId;
    
    // Process zones in priority order
    dropZones.forEach(zone => {
      const { rect, type } = zone;
      
      // Skip source panel for tab drags 
      if (isTabDrag && sourcePanelId === zone.id && (type === 'panel' || type === 'tabbar')) {
        return;
      }
      
      // Check if mouse is inside the zone
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        let priority = 0;
        
        // Set priority based on zone type (higher is better)
        switch (type) {
          case 'edge':
            priority = 4;
            break;
          case 'position':
            priority = 3;
            break;
          case 'tabbar':
            priority = 2;
            break;
          case 'panel':
            priority = 1;
            break;
        }
        
        // Update best zone if this one has higher priority
        if (priority > bestPriority) {
          bestPriority = priority;
          bestZone = zone;
        }
      }
    });
    
    // For panel zones, refine by checking mouse position relative to panel edges
    if (bestZone && bestZone.type === 'panel') {
      const { rect } = bestZone;
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      
      // Check if we're close to an edge
      if (relX < EDGE_THRESHOLD) {
        bestZone = {
          ...bestZone,
          type: 'edge',
          direction: 'left'
        };
      } else if (relX > rect.width - EDGE_THRESHOLD) {
        bestZone = {
          ...bestZone,
          type: 'edge',
          direction: 'right'
        };
      } else if (relY < EDGE_THRESHOLD) {
        bestZone = {
          ...bestZone,
          type: 'edge',
          direction: 'top'
        };
      } else if (relY > rect.height - EDGE_THRESHOLD) {
        bestZone = {
          ...bestZone,
          type: 'edge',
          direction: 'bottom'
        };
      }
      
      // Check if we're in the tabbar region
      else if (relY < TABBAR_HEIGHT) {
        bestZone = {
          ...bestZone,
          type: 'tabbar'
        };
      }
    }
    
    // Update highlighted zone and drop target
    if (bestZone !== highlightedZone) {
      setHighlightedZone(bestZone);
      
      if (bestZone) {
        // Convert to DropTarget format
        const target: DropTarget = {
          type: bestZone.type,
          id: bestZone.id,
          direction: bestZone.direction,
          rect: bestZone.rect
        };
        
        // Add position information if available
        if (bestZone.type === 'position' && typeof bestZone.index === 'number') {
          target.position = {
            index: bestZone.index + (bestZone.direction === 'after' ? 1 : 0),
            panelId: bestZone.id
          };
        }
        
        setDropTarget(target);
      } else {
        setDropTarget(null);
      }
    }
  }, [active, dropZones, highlightedZone, dragItem, setDropTarget]);
  
  // Handle mouse up to trigger drop
  const handleMouseUp = useCallback(() => {
    if (!active || !highlightedZone) return;
    
    // Convert to DropTarget format
    const target: DropTarget = {
      type: highlightedZone.type,
      id: highlightedZone.id,
      direction: highlightedZone.direction,
      rect: highlightedZone.rect
    };
    
    // Add position information if available
    if (highlightedZone.type === 'position' && typeof highlightedZone.index === 'number') {
      target.position = {
        index: highlightedZone.index + (highlightedZone.direction === 'after' ? 1 : 0),
        panelId: highlightedZone.id
      };
    }
    
    onDrop(target);
    setHighlightedZone(null);
  }, [active, highlightedZone, onDrop]);
  
  // Add and remove event listeners
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
  
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Render overlay for the highlighted drop zone */}
      {highlightedZone && (
        <>
          {/* Main highlight */}
          <div
            className={cn(
              'absolute rounded-sm transition-all duration-100',
              {
                'bg-blue-500/20 border-2 border-blue-500': dragOperation === 'move',
                'bg-green-500/20 border-2 border-green-500': dragOperation === 'copy',
                'bg-purple-500/20 border-2 border-purple-500': dragOperation === 'link',
              }
            )}
            style={{
              left: highlightedZone.rect.left,
              top: highlightedZone.rect.top,
              width: highlightedZone.rect.width,
              height: highlightedZone.rect.height,
              transition: 'all 0.1s ease-in-out'
            }}
          />
          
          {/* Split preview for edge drops */}
          {highlightedZone.type === 'edge' && highlightedZone.direction && (
            <SplitPreview 
              rect={highlightedZone.rect} 
              direction={highlightedZone.direction as DropDirection} 
              operation={dragOperation}
            />
          )}
          
          {/* Tab position preview */}
          {highlightedZone.type === 'position' && (
            <div
              className={cn(
                'absolute w-1 h-[40px] bg-blue-500',
                {
                  'bg-blue-500': dragOperation === 'move',
                  'bg-green-500': dragOperation === 'copy',
                  'bg-purple-500': dragOperation === 'link',
                }
              )}
              style={{
                left: highlightedZone.direction === 'before' 
                  ? highlightedZone.rect.left
                  : highlightedZone.rect.right,
                top: highlightedZone.rect.top,
                height: highlightedZone.rect.height,
                transition: 'all 0.05s ease-in-out'
              }}
            />
          )}
        </>
      )}
      
      {/* Floating preview of dragged item */}
      {dragItem && (
        <div 
          className="absolute px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-sm text-white text-sm shadow-md opacity-90"
          style={{
            transform: 'translate(-50%, -50%)',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
          data-drag-preview
        >
          {dragItem.type === 'tab' ? 'Moving Tab' : dragItem.type}
        </div>
      )}
    </div>
  );
}

// Helper component for split preview
function SplitPreview({ 
  rect, 
  direction, 
  operation 
}: { 
  rect: DOMRect, 
  direction: DropDirection,
  operation: string 
}) {
  const getStyles = (): React.CSSProperties => {
    const colorClass = operation === 'move' ? 'bg-blue-500/30' : 
                      operation === 'copy' ? 'bg-green-500/30' : 
                      'bg-purple-500/30';
    
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      transition: 'all 0.15s ease-in-out',
    };
    
    switch (direction) {
      case 'left':
        return {
          ...baseStyles,
          left: rect.left,
          top: rect.top,
          width: Math.min(EDGE_SIZE * 4, rect.width * 0.4),
          height: rect.height,
        };
      case 'right':
        return {
          ...baseStyles,
          right: window.innerWidth - rect.right,
          top: rect.top,
          width: Math.min(EDGE_SIZE * 4, rect.width * 0.4),
          height: rect.height,
        };
      case 'top':
        return {
          ...baseStyles,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: Math.min(EDGE_SIZE * 4, rect.height * 0.4),
        };
      case 'bottom':
        return {
          ...baseStyles,
          left: rect.left,
          bottom: window.innerHeight - rect.bottom,
          width: rect.width,
          height: Math.min(EDGE_SIZE * 4, rect.height * 0.4),
        };
      default:
        return baseStyles;
    }
  };
  
  return (
    <div
      className={cn(
        'absolute rounded-sm border',
        {
          'bg-blue-500/30 border-blue-500': operation === 'move',
          'bg-green-500/30 border-green-500': operation === 'copy',
          'bg-purple-500/30 border-purple-500': operation === 'link',
        }
      )}
      style={getStyles()}
    />
  );
}