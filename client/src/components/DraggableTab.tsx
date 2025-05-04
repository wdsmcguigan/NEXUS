import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDragContext, DragItem } from '../context/DragContext';

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
  const { startDrag, isDragging } = useDragContext();
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  
  // Handle starting drag
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // Start the drag operation with tab data
    const dragItem: DragItem = {
      type: 'tab',
      id,
      sourcePanelId: panelId,
      sourceIndex: index,
      data: { title, icon, closeable }
    };
    
    // Create custom drag image
    const ghostElem = document.createElement('div');
    ghostElem.classList.add(
      'px-3', 'py-1', 'bg-blue-800', 'text-white', 
      'rounded-sm', 'border', 'border-blue-700', 'shadow-lg',
      'flex', 'items-center', 'text-sm', 'opacity-80'
    );
    
    if (icon) {
      const iconElem = document.createElement('span');
      iconElem.classList.add('mr-2');
      iconElem.textContent = '📄'; // Fallback icon
      ghostElem.appendChild(iconElem);
    }
    
    const textElem = document.createElement('span');
    textElem.textContent = title;
    ghostElem.appendChild(textElem);
    
    document.body.appendChild(ghostElem);
    
    // Set custom ghost element
    e.dataTransfer.setDragImage(ghostElem, 15, 15);
    e.dataTransfer.effectAllowed = 'move';
    
    // Start the drag in our context system
    startDrag(dragItem);
    
    // Clean up ghost element
    setTimeout(() => {
      document.body.removeChild(ghostElem);
    }, 0);
  };
  
  // Handle drag over effects
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggedOver(true);
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragLeave = () => {
    setIsDraggedOver(false);
  };
  
  // Tab rendering
  return (
    <div
      ref={tabRef}
      draggable
      data-tab-drop-zone
      data-tab-id={id}
      data-panel-id={panelId}
      data-tab-index={index}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={onClick}
      className={cn(
        'group px-4 flex items-center h-[40px] shrink-0 cursor-pointer relative',
        isActive
          ? 'text-white bg-neutral-800 border-t-2 border-t-blue-500 z-10'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50',
        isDraggedOver && 'border-l-2 border-l-blue-500'
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center overflow-hidden">
          {icon && (
            <span className="mr-2 flex-shrink-0 text-blue-400">
              {icon}
            </span>
          )}
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