import React, { useRef } from 'react';
import { useDragContext } from '../context/DragContext';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { TabContextMenu } from './TabContextMenu';

interface TabProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  panelId: string;
  isActive: boolean;
  closeable?: boolean;
  index: number;
  onClick: () => void;
  onClose?: () => void;
}

export function DraggableTab({
  id,
  title,
  icon,
  panelId,
  isActive,
  closeable = true,
  index,
  onClick,
  onClose
}: TabProps) {
  const { settings } = useAppContext();
  const { startDrag } = useDragContext();
  const tabRef = useRef<HTMLDivElement>(null);
  
  // Handle starting a drag operation
  const handleDragStart = (e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tabRef.current) {
      // Create a drag item that represents this tab
      const dragItem = {
        type: 'tab' as const,
        id,
        sourcePanelId: panelId,
        sourceIndex: index,
        data: {
          title,
          icon,
          rect: tabRef.current.getBoundingClientRect()
        }
      };
      
      // Start the drag operation
      startDrag(dragItem);
    }
  };
  
  // Handle mouse down with better detection for drag intent
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag on left mouse button
    if (e.button === 0) {
      // Always allow tab click
      onClick();
      
      // If modifier key is pressed or it's a direct drag event, start drag operation
      if (e.ctrlKey || e.altKey) {
        handleDragStart(e);
      } else {
        // Setup a timeout to detect if this is a drag or a click
        const dragStartPos = { x: e.clientX, y: e.clientY };
        
        // Track mouse movement to detect drag intent
        const handleMouseMove = (moveEvent: MouseEvent) => {
          // Calculate distance moved
          const dx = moveEvent.clientX - dragStartPos.x;
          const dy = moveEvent.clientY - dragStartPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If moved more than 5px, consider it a drag
          if (distance > 5) {
            // Remove listeners
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            
            // Start drag
            handleDragStart(e);
          }
        };
        
        // Clean up on mouse up
        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
        
        // Add listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
    }
  };
  
  return (
    <div
      ref={tabRef}
      className={cn(
        "px-4 flex items-center space-x-2 h-[40px] cursor-pointer",
        isActive 
          ? "text-white bg-neutral-800 border-t-2 border-t-blue-500" 
          : "text-neutral-400 hover:text-white hover:bg-neutral-800/50",
        "select-none"
      )}
      style={{ width: `${settings.tabSize}px` }}
      onMouseDown={handleMouseDown}
      draggable="true"
      onDragStart={(e) => {
        // This is a fallback for the native drag
        handleDragStart(e);
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center overflow-hidden">
          {icon && <span className="mr-2 flex-shrink-0 text-blue-400">{icon}</span>}
          <span className="truncate">{title}</span>
        </div>
        
        {closeable && onClose && (
          <div
            className="ml-2 text-neutral-500 hover:text-white p-1 rounded-sm hover:bg-neutral-700"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={14} />
          </div>
        )}
      </div>
    </div>
  );
}