import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { usePanelContext } from '../context/PanelContext';
import { useTabContext } from '../context/TabContext';
import { useComponentRegistry } from '../context/ComponentContext';
import { 
  Maximize2, 
  Minimize2,
  PanelLeft, 
  PanelRight,
  PanelTop, 
  PanelBottomOpen, 
  Plus,
  LayoutGrid
} from 'lucide-react';
import { nanoid } from 'nanoid';

interface PanelContextMenuProps {
  children: React.ReactNode;
  panelId: string;
}

export function PanelContextMenu({ children, panelId }: PanelContextMenuProps) {
  const panelContext = usePanelContext();
  const tabContext = useTabContext();
  const componentRegistry = useComponentRegistry();
  
  // Check if the panel is currently maximized
  const isPanelMaximized = panelContext.maximizedPanelId === panelId;
  
  // Get all available components to add as tabs
  const availableComponents = componentRegistry?.getComponents() || [];
  
  // Handler to maximize or restore panel
  const handleToggleMaximize = () => {
    if (isPanelMaximized) {
      panelContext.restorePanel();
    } else {
      panelContext.maximizePanel(panelId);
    }
  };
  
  // Handler to close the panel 
  const handleClosePanel = () => {
    panelContext.closePanel(panelId);
  };
  
  // Handler to add a new tab
  const handleAddTab = (componentId: string) => {
    if (tabContext && componentRegistry) {
      const component = componentRegistry.getComponent(componentId);
      if (component) {
        tabContext.addTab(
          componentId,
          panelId,
          component.defaultProps || {},
          {
            title: component.name,
            icon: component.icon,
            closeable: true
          }
        );
      }
    }
  };
  
  // Handler to split panel
  const handleSplitPanel = (direction: 'horizontal' | 'vertical', position: 'before' | 'after') => {
    // Create a new panel
    const newPanelId = `panel-${nanoid(6)}`;
    
    // Create a split
    panelContext.splitPanel(
      panelId, 
      direction, 
      { 
        newPanelId,
        positionAfter: position === 'after'
      }
    );
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-neutral-900 border-neutral-700 text-neutral-100">
        {/* Add new tab */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-800">
            <Plus size={16} className="mr-2 text-blue-400" />
            <span>Add tab</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-neutral-900 border-neutral-700 max-h-[400px] overflow-y-auto">
            {availableComponents.length > 0 ? (
              availableComponents.map(component => (
                <ContextMenuItem 
                  key={component.id} 
                  onClick={() => handleAddTab(component.id)}
                  className="flex items-center focus:bg-neutral-800"
                >
                  {component.icon || <LayoutGrid size={16} className="mr-2 text-blue-400" />}
                  <span className="ml-2">{component.name}</span>
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="opacity-50 focus:bg-neutral-800">
                <span>No components available</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Split panel options */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-800">
            <LayoutGrid size={16} className="mr-2 text-blue-400" />
            <span>Split panel</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-neutral-900 border-neutral-700">
            <ContextMenuItem 
              onClick={() => handleSplitPanel('horizontal', 'before')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelLeft size={16} className="mr-2 text-blue-400" />
              <span>Split left</span>
              <ContextMenuShortcut>⌃⌥H</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitPanel('horizontal', 'after')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelRight size={16} className="mr-2 text-blue-400" />
              <span>Split right</span>
              <ContextMenuShortcut>⌃⌥L</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitPanel('vertical', 'before')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelTop size={16} className="mr-2 text-blue-400" />
              <span>Split top</span>
              <ContextMenuShortcut>⌃⌥K</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitPanel('vertical', 'after')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelBottomOpen size={16} className="mr-2 text-blue-400" />
              <span>Split bottom</span>
              <ContextMenuShortcut>⌃⌥J</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator className="bg-neutral-700" />
        
        {/* Panel actions */}
        <ContextMenuItem 
          onClick={handleToggleMaximize}
          className="flex items-center focus:bg-neutral-800"
        >
          {isPanelMaximized ? (
            <>
              <Minimize2 size={16} className="mr-2 text-blue-400" />
              <span>Restore</span>
            </>
          ) : (
            <>
              <Maximize2 size={16} className="mr-2 text-blue-400" />
              <span>Maximize</span>
            </>
          )}
          <ContextMenuShortcut>F11</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handleClosePanel}
          className="flex items-center text-red-400 focus:bg-neutral-800"
        >
          <Plus size={16} className="mr-2 rotate-45" />
          <span>Close panel</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default PanelContextMenu;