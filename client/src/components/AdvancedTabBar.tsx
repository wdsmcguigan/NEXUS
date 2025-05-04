import React, { useRef, useEffect } from 'react';
import { Plus, Maximize2, Minimize2 } from 'lucide-react';
import { DraggableTab } from './DraggableTab';
import { useDragContext, DropTarget } from '../context/DragContext';
import { useAppContext } from '../context/AppContext';

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
  const { settings } = useAppContext();
  const { dragItem, dropTarget, endDrag } = useDragContext();
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Handle a tab being dropped into this tabbar
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dragItem || dragItem.type !== 'tab' || !dragItem.sourcePanelId) return;
    
    // If we have a drop target, notify parent
    if (dropTarget && onTabDrop) {
      onTabDrop(dropTarget, dragItem.id, dragItem.sourcePanelId);
    }
    
    // End the drag operation
    endDrag(true);
  };
  
  // Scroll to active tab when it changes
  useEffect(() => {
    if (!tabBarRef.current || !activeTabId) return;
    
    const activeTab = tabBarRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeTab) {
      // Get the scroll parent
      const scrollContainer = tabBarRef.current;
      
      // Calculate position to scroll to keep the tab in view
      const tabLeft = (activeTab as HTMLElement).offsetLeft;
      const tabWidth = (activeTab as HTMLElement).offsetWidth;
      const containerWidth = scrollContainer.offsetWidth;
      const scrollLeft = scrollContainer.scrollLeft;
      
      // Scroll if tab is not fully visible
      if (tabLeft < scrollLeft) {
        // Tab is to the left of the viewport
        scrollContainer.scrollTo({ left: tabLeft, behavior: 'smooth' });
      } else if (tabLeft + tabWidth > scrollLeft + containerWidth) {
        // Tab is to the right of the viewport
        scrollContainer.scrollTo({ 
          left: tabLeft + tabWidth - containerWidth, 
          behavior: 'smooth' 
        });
      }
    }
  }, [activeTabId, tabs]);
  
  return (
    <div className="flex relative h-[40px] min-h-[40px] border-b border-neutral-800 bg-neutral-900">
      {/* Using a wrapper with hidden overflow to remove visible scrollbars */}
      <div 
        ref={tabBarRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-none" 
        style={{ scrollbarWidth: 'none' }}
        data-tabbar-drop-zone
        data-panel-id={panelId}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {tabs.map((tab, index) => (
          <DraggableTab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            icon={tab.icon}
            panelId={panelId}
            isActive={tab.id === activeTabId}
            closeable={tab.closeable !== false}
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
    </div>
  );
}