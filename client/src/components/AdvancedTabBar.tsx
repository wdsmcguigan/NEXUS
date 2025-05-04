import React, { useRef, useEffect, useState } from 'react';
import { Plus, Maximize2, Minimize2 } from 'lucide-react';
import { DraggableTab } from './DraggableTab';
import { useDragContext, DropTarget } from '../context/DragContext';

interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  closeable?: boolean;
}

interface AdvancedTabBarProps {
  tabs: Tab[];
  activeTabId: string | undefined;
  panelId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
  onViewToggle: () => void;
  isMaximized: boolean;
  onTabDrop?: (target: DropTarget, tabId: string, sourcePanel: string) => void;
}

export function AdvancedTabBar({
  tabs,
  activeTabId,
  panelId,
  onTabClick,
  onTabClose,
  onAddTab,
  onViewToggle,
  isMaximized,
  onTabDrop
}: AdvancedTabBarProps) {
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<Array<{index: number, rect: DOMRect}>>([]);
  const { dragItem, isDragging, dropTarget, setDropTarget } = useDragContext();
  
  // Update drop zones when tabs change or dragging starts
  useEffect(() => {
    if (!isDragging || !tabBarRef.current || dragItem?.type !== 'tab') return;
    
    // Calculate drop zones between tabs
    const tabElements = Array.from(tabBarRef.current.querySelectorAll('[data-tab-id]'));
    const zones = tabElements.map((el, index) => {
      return {
        index,
        rect: el.getBoundingClientRect()
      };
    });
    
    setDropZones(zones);
  }, [isDragging, tabs, dragItem]);
  
  // Handle mouse move for detecting tab position drop zones
  useEffect(() => {
    if (!isDragging || !tabBarRef.current || dragItem?.type !== 'tab') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Check if mouse is inside the tabbar
      const tabBarRect = tabBarRef.current!.getBoundingClientRect();
      const isInTabbar = (
        e.clientX >= tabBarRect.left &&
        e.clientX <= tabBarRect.right &&
        e.clientY >= tabBarRect.top &&
        e.clientY <= tabBarRect.bottom
      );
      
      if (isInTabbar) {
        // Detect tab position for insertion
        let targetIndex = -1;
        let minDistance = Infinity;
        
        dropZones.forEach((zone) => {
          const distance = Math.abs(e.clientX - (zone.rect.left + zone.rect.width / 2));
          if (distance < minDistance) {
            minDistance = distance;
            targetIndex = zone.index;
          }
        });
        
        // If we have a valid target position
        if (targetIndex !== -1) {
          setDropTarget({
            type: 'position',
            id: `${panelId}-position-${targetIndex}`,
            position: {
              panelId: panelId,
              index: targetIndex
            }
          });
          return;
        }
        
        // Default to dropping in the tabbar (at the end)
        setDropTarget({
          type: 'tabbar',
          id: panelId
        });
      } else if (dropTarget?.id === panelId || dropTarget?.id?.startsWith(`${panelId}-position-`)) {
        // Clear the drop target if we're not in the tabbar anymore
        setDropTarget(null);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, dragItem, dropTarget, dropZones, panelId, setDropTarget]);
  
  return (
    <div className="flex relative h-[40px] min-h-[40px] max-h-[40px] border-b border-neutral-800 bg-neutral-900 overflow-hidden">
      <div 
        ref={tabBarRef}
        className="flex overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab, index) => (
          <DraggableTab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            icon={tab.icon}
            panelId={panelId}
            isActive={tab.id === activeTabId}
            closeable={tab.closeable}
            index={index}
            onClick={() => onTabClick(tab.id)}
            onClose={() => onTabClose(tab.id)}
          />
        ))}
        
        <button
          className="px-3 h-[40px] flex items-center text-neutral-400 hover:text-white hover:bg-neutral-800/50 shrink-0"
          onClick={onAddTab}
        >
          <Plus size={16} />
        </button>
      </div>
      
      <button
        className="absolute right-0 px-3 h-[40px] flex items-center text-neutral-400 hover:text-white hover:bg-neutral-800/50 shrink-0"
        onClick={onViewToggle}
      >
        {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      
      {/* Drop indicators for tab positions */}
      {isDragging && dragItem?.type === 'tab' && dropTarget?.type === 'position' && dropTarget.id.startsWith(`${panelId}-position-`) && (
        <div className="absolute top-0 bottom-0 flex items-center justify-center transition-all duration-150" 
          style={{
            left: dropZones[dropTarget.position?.index || 0]?.rect.left - tabBarRef.current!.getBoundingClientRect().left,
            transform: 'translateX(-50%)',
            zIndex: 60
          }}
        >
          {/* Line indicator */}
          <div className="absolute h-[30px] w-[3px] bg-blue-500 rounded-full animate-pulse" />
          
          {/* Circle top */}
          <div className="absolute top-[5px] w-[9px] h-[9px] rounded-full bg-blue-500 transform translate-y-[-50%]" />
          
          {/* Circle bottom */}
          <div className="absolute bottom-[5px] w-[9px] h-[9px] rounded-full bg-blue-500 transform translate-y-[50%]" />
        </div>
      )}
      
      {/* Highlight for tabbar drop */}
      {isDragging && dragItem?.type === 'tab' && dropTarget?.type === 'tabbar' && dropTarget.id === panelId && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-opacity-40 pointer-events-none" />
      )}
    </div>
  );
}