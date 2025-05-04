import React, { useEffect, useRef } from 'react';
import { useDragContext } from '../context/DragContext';
import { DropTarget } from '../context/TabContext';
import { cn } from '@/lib/utils';

export function DragOverlay() {
  const { dragState } = useDragContext();
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Update the overlay position when drag state changes
  useEffect(() => {
    const updatePosition = () => {
      const overlay = overlayRef.current;
      if (!overlay || !dragState.isDragging) return;
      
      // Position the overlay at the cursor position
      overlay.style.left = `${dragState.lastClientX}px`;
      overlay.style.top = `${dragState.lastClientY}px`;
    };
    
    updatePosition();
  }, [dragState]);
  
  if (!dragState.isDragging) return null;
  
  return (
    <div 
      ref={overlayRef}
      className={cn(
        'fixed z-50 p-2 bg-blue-800 text-white rounded shadow-lg border border-blue-600',
        'transform -translate-x-1/2 -translate-y-1/2 pointer-events-none',
        'flex items-center gap-2 opacity-80'
      )}
    >
      {dragState.draggedTabIcon && (
        <span>{dragState.draggedTabIcon}</span>
      )}
      <span>{dragState.draggedTabTitle}</span>
    </div>
  );
}

export default DragOverlay;