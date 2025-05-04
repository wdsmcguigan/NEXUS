import React from 'react';
import { useDragContext } from '../context/DragContext';

export function DragOverlay() {
  const { dragState } = useDragContext();
  
  if (!dragState.isDragging) return null;
  
  return (
    <div 
      className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 
                 bg-gray-900/90 backdrop-blur-sm border border-blue-500 shadow-lg px-3 py-1.5 rounded-md
                 text-sm text-white flex items-center"
      style={{
        left: dragState.lastClientX,
        top: dragState.lastClientY,
        minWidth: '100px',
        maxWidth: '200px'
      }}
    >
      {dragState.draggedTabIcon && (
        <span className="mr-2 opacity-70">{dragState.draggedTabIcon}</span>
      )}
      <span className="truncate">{dragState.draggedTabTitle || 'Moving Tab'}</span>
    </div>
  );
}

export default DragOverlay;