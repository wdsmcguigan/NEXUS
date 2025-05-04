import React, { useRef, useState, useCallback } from 'react';
import { X, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDragContext } from '../context/DragContext';

interface DraggableTabProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  panelId: string;
  isActive: boolean;
  closeable?: boolean;
  index: number;
  onClick: () => void;
  onClose?: () => void;
  pinned?: boolean;
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
  onClose,
  pinned = false
}: DraggableTabProps) {
  const tabRef = useRef<HTMLDivElement>(null);
  const [isDragStarted, setIsDragStarted] = useState(false);
  const { startDrag, moveDrag, endDrag } = useDragContext();

  // Handle mouse down event to start drag
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Check if the click is on the close button, ignore it for drag
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }

      // Save the initial position for detecting drag
      setIsDragStarted(true);
      
      // Record starting position
      const startX = e.clientX;
      const startY = e.clientY;

      // Setup drag end handler
      const handleDragEnd = (e: MouseEvent) => {
        setIsDragStarted(false);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('mousemove', handleDragMove);
        endDrag();
      };

      // Setup drag move handler
      const handleDragMove = (e: MouseEvent) => {
        // Detect if we've moved enough to start a real drag
        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);
        
        if (deltaX > 5 || deltaY > 5) {
          // Start the actual drag
          startDrag(id, title, panelId, e.clientX, e.clientY, icon);
          // Update positions as we drag
          moveDrag(e.clientX, e.clientY);
        }
      };

      // Add event listeners for drag and drop
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('mousemove', handleDragMove);
    },
    [id, title, icon, panelId, startDrag, moveDrag, endDrag]
  );

  // Stop event propagation for the close button
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <div
      ref={tabRef}
      className={cn(
        'flex items-center px-3 py-1 text-sm border-r border-gray-800 select-none cursor-pointer relative',
        'transition-colors duration-200 whitespace-nowrap min-w-[100px] max-w-[200px]',
        isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50',
        pinned && 'bg-blue-900/20'
      )}
      onClick={onClick}
      onMouseDown={handleDragStart}
      data-tab-id={id}
      data-tab-index={index}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="truncate">{title}</span>
      <div className="flex ml-2 space-x-1">
        {pinned && <Pin size={12} className="opacity-50" />}
        {closeable && onClose && (
          <button
            className="text-gray-500 hover:text-white focus:outline-none rounded-full p-0.5 hover:bg-gray-700"
            onClick={handleCloseClick}
            title="Close tab"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default DraggableTab;