import React from 'react';
import { cn } from '@/lib/utils';

type Direction = 'top' | 'right' | 'bottom' | 'left';

interface EdgeIndicatorProps {
  direction: Direction;
  panelId: string;
  active?: boolean;
  className?: string;
}

export function EdgeIndicator({ 
  direction, 
  panelId, 
  active = false,
  className 
}: EdgeIndicatorProps) {
  // Determine position and dimensions based on direction
  let positionClasses = '';
  let sizeClasses = '';
  
  switch (direction) {
    case 'top':
      positionClasses = 'top-0 left-0 right-0';
      sizeClasses = 'h-2 w-full';
      break;
    case 'right':
      positionClasses = 'top-0 right-0 bottom-0';
      sizeClasses = 'w-2 h-full';
      break;
    case 'bottom':
      positionClasses = 'bottom-0 left-0 right-0';
      sizeClasses = 'h-2 w-full';
      break;
    case 'left':
      positionClasses = 'top-0 left-0 bottom-0';
      sizeClasses = 'w-2 h-full';
      break;
  }
  
  return (
    <div
      data-edge-drop-zone
      data-panel-id={panelId}
      data-edge-direction={direction}
      className={cn(
        'absolute z-30',
        positionClasses,
        sizeClasses,
        active ? 'bg-primary/30' : 'bg-transparent hover:bg-primary/20',
        className
      )}
    />
  );
}