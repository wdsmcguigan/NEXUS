import React, { useRef, useEffect, useState } from 'react';
import { Plus, MoreVertical, Menu, Maximize2, Minimize2 } from 'lucide-react';
import { DraggableTab } from './DraggableTab';
import { useDragContext, DropTarget } from '../context/DragContext';
import { ComponentContext } from '../context/ComponentContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
} from './ui/dropdown-menu';

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
  onAddTab: (componentId?: string) => void;
  onViewToggle: () => void;
  isMaximized: boolean;
  onTabDrop?: (target: DropTarget, tabId: string, sourcePanel: string) => void;
  onSplitPanel?: (direction: 'horizontal' | 'vertical') => void;
  onClosePanel?: () => void;
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
  onTabDrop,
  onSplitPanel,
  onClosePanel
}: AdvancedTabBarProps) {
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<Array<{index: number, rect: DOMRect}>>([]);
  const { dragItem, isDragging, dropTarget, setDropTarget } = useDragContext();
  const componentRegistry = React.useContext(ComponentContext);
  
  // Get available component types for our menu
  const components = componentRegistry?.components || {};
  const availableComponents = Object.keys(components).map(id => ({
    id,
    name: components[id]?.name || id,
    description: components[id]?.description || '',
    category: components[id]?.category || 'Other'
  }));
  
  // Group components by category for better organization
  const componentsByCategory = availableComponents.reduce((acc, component) => {
    const category = component.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {} as Record<string, typeof availableComponents>);
  
  // Sort categories
  const sortedCategories = Object.keys(componentsByCategory).sort();
  
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
    
    // Skip if we're dragging a tab from the same panel
    if (dragItem.sourcePanelId === panelId) {
      // Only allow internal reordering later when we support index-based moves
      // For now, we'll just avoid setting a drop target within the same panel
      return;
    }
    
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
        // For now, we'll simplify by just allowing drops onto the tabbar
        // Later we can enhance to support position-based tab insertion
        console.log('Mouse in tabbar', panelId);
        
        // Default to dropping in the tabbar (at the end)
        setDropTarget({
          type: 'tabbar',
          id: panelId,
          rect: tabBarRect
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
        data-tabbar-id={panelId}
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
          onClick={() => onAddTab()}
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="absolute right-0 flex items-center h-[40px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 h-[40px] flex items-center text-neutral-400 hover:text-white hover:bg-neutral-800/50 shrink-0">
              <Menu size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-neutral-800 border-neutral-700 min-w-48">
            {/* View commands */}
            <DropdownMenuItem 
              className="flex items-center focus:bg-neutral-700"
              onClick={onViewToggle}
            >
              {isMaximized ? (
                <>
                  <Minimize2 size={16} className="mr-2 text-neutral-400" />
                  <span>Restore panel</span>
                </>
              ) : (
                <>
                  <Maximize2 size={16} className="mr-2 text-neutral-400" />
                  <span>Maximize panel</span>
                </>
              )}
              <DropdownMenuShortcut>⌘↑</DropdownMenuShortcut>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-neutral-700" />
            
            {/* Split commands */}
            <DropdownMenuItem 
              className="flex items-center focus:bg-neutral-700"
              onClick={() => onSplitPanel && onSplitPanel('horizontal')}
            >
              <Menu size={16} className="mr-2 text-neutral-400" />
              <span>Split horizontally</span>
              <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="flex items-center focus:bg-neutral-700"
              onClick={() => onSplitPanel && onSplitPanel('vertical')}
            >
              <Menu size={16} className="mr-2 rotate-90 text-neutral-400" />
              <span>Split vertically</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-neutral-700" />
            
            {/* Add component section */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center focus:bg-neutral-700">
                <Plus size={16} className="mr-2 text-neutral-400" />
                <span>Add component</span>
                <DropdownMenuShortcut>→</DropdownMenuShortcut>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-neutral-800 border-neutral-700 w-64 max-h-80 overflow-y-auto">
                {availableComponents.length > 0 ? (
                  <>
                    {sortedCategories.map(category => (
                      <React.Fragment key={category}>
                        <div className="px-2 py-1 text-xs text-neutral-500 font-semibold">{category}</div>
                        {componentsByCategory[category].map(component => (
                          <DropdownMenuItem 
                            key={component.id} 
                            className="flex items-center focus:bg-neutral-700"
                            onClick={() => onAddTab(component.id)}
                          >
                            <div className="mr-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                              {component.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm">{component.name}</span>
                              {component.description && (
                                <span className="text-xs text-neutral-400">{component.description}</span>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                        {category !== sortedCategories[sortedCategories.length - 1] && (
                          <DropdownMenuSeparator className="bg-neutral-700 my-1" />
                        )}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <DropdownMenuItem disabled className="text-neutral-500">
                    No components available
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator className="bg-neutral-700" />
            
            {/* Close panel */}
            <DropdownMenuItem 
              className="flex items-center text-red-400 focus:bg-neutral-700"
              onClick={() => onClosePanel && onClosePanel()}
            >
              <div className="mr-2 w-4 h-4 rounded-full border border-red-400 flex items-center justify-center">
                <span className="text-red-400 text-xs">×</span>
              </div>
              <span>Close panel</span>
              <DropdownMenuShortcut>⌘W</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Enhanced drop indicators for tab positions */}
      {isDragging && dragItem?.type === 'tab' && dropTarget?.type === 'position' && dropTarget.id.startsWith(`${panelId}-position-`) && (
        <div 
          className="absolute h-[40px] w-2 bg-blue-500 rounded-full opacity-80 transition-all animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
          style={{
            left: dropZones[dropTarget.position?.index || 0]?.rect.left - tabBarRef.current!.getBoundingClientRect().left,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Add a glow effect */}
          <div className="absolute inset-0 bg-blue-400 blur-md opacity-50 rounded-full"></div>
          {/* Add arrow indicators */}
          <div className="absolute top-1 left-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-blue-500 transform -translate-x-1/2"></div>
          <div className="absolute bottom-1 left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-500 transform -translate-x-1/2"></div>
        </div>
      )}
      
      {/* Tabbar drop indicator */}
      {isDragging && dragItem?.type === 'tab' && dropTarget?.type === 'tabbar' && dropTarget.id === panelId && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-t-sm opacity-60 pointer-events-none">
          <div className="absolute inset-0 bg-blue-500 opacity-10"></div>
        </div>
      )}
    </div>
  );
}