import React, { useRef } from 'react';
import { useDragContext } from '../context/DragContext';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

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
  const handleDragStart = (e: React.MouseEvent) => {
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
      onClick={onClick}
      onMouseDown={(e) => {
        // Left mouse button (0) to start drag without any modifiers
        if (e.button === 0) {
          handleDragStart(e);
        }
      }}
      draggable="true"
      onDragStart={handleDragStart}
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