import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDragContext } from '../context/DragContext';

export type Direction = 'top' | 'right' | 'bottom' | 'left';

interface EdgeIndicatorProps {
  direction: Direction;
  panelId: string;
  active?: boolean;
  className?: string;
  onDragEnter?: (direction: Direction) => void;
  onDragLeave?: () => void;
}

export function EdgeIndicator({ 
  direction, 
  panelId, 
  active = false,
  className,
  onDragEnter,
  onDragLeave
}: EdgeIndicatorProps) {
  const { isDragging, dragItem } = useDragContext();
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine position and dimensions based on direction
  let positionClasses = '';
  let sizeClasses = '';
  
  switch (direction) {
    case 'top':
      positionClasses = 'top-0 left-0 right-0';
      sizeClasses = 'h-3 w-full';
      break;
    case 'right':
      positionClasses = 'top-0 right-0 bottom-0';
      sizeClasses = 'w-3 h-full';
      break;
    case 'bottom':
      positionClasses = 'bottom-0 left-0 right-0';
      sizeClasses = 'h-3 w-full';
      break;
    case 'left':
      positionClasses = 'top-0 left-0 bottom-0';
      sizeClasses = 'w-3 h-full';
      break;
  }
  
  // Only show when actively dragging a tab or component
  const isVisible = isDragging && (dragItem?.type === 'tab' || dragItem?.type === 'component');
  
  // Handle mouse interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onDragEnter) onDragEnter(direction);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onDragLeave) onDragLeave();
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      data-edge-drop-zone
      data-panel-id={panelId}
      data-edge-direction={direction}
      className={cn(
        'absolute z-30 transition-colors',
        positionClasses,
        sizeClasses,
        active || isHovered ? 'bg-blue-500/30' : 'bg-transparent hover:bg-blue-500/20',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Visual indicator for split direction */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center',
        (isHovered || active) ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-150'
      )}>
        <div className={cn(
          'bg-blue-500/70 rounded-sm',
          direction === 'top' || direction === 'bottom' ? 'h-0.5 w-6' : 'w-0.5 h-6'
        )} />
      </div>
    </div>
  );
}