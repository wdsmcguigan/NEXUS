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
  const { dragItem, endDrag, dropTarget } = useDragContext();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Handle mouse movements during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    setMousePosition({
      x: e.clientX,
      y: e.clientY
    });
  }, [active, dragItem]);
  
  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!active || !dragItem) return;
    
    // If we have a drop target, perform the drop
    if (dropTarget) {
      onDrop(dropTarget);
    } else {
      // Otherwise just end the drag
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
  
  let previewStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 40,
    pointerEvents: 'none'
  };
  
  // Calculate position based on direction
  if (isHorizontal) {
    previewStyle = {
      ...previewStyle,
      left: isStart ? rect.left : rect.right - 150,
      top: rect.top,
      width: 150,
      height: rect.height,
    };
  } else {
    previewStyle = {
      ...previewStyle,
      left: rect.left,
      top: isStart ? rect.top : rect.bottom - 150,
      width: rect.width,
      height: 150,
    };
  }
  
  return (
    <div
      className="bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded"
      style={previewStyle}
    />
  );
}