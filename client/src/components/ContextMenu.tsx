import React from 'react';
import {
  ContextMenu as ContextMenuPrimitive,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useTabContext } from '../context/TabContext';
import tabFactory from '../services/TabFactory';
import { Copy, ExternalLink, Maximize2, Split, LayoutPanelLeft, LayoutPanelTop } from 'lucide-react';

interface ContextMenuProps {
  children: React.ReactNode;
  actionData: {
    componentId: string;
    props?: Record<string, any>;
    title?: string;
  };
}

export function ItemContextMenu({ children, actionData }: ContextMenuProps) {
  const tabContext = useTabContext();
  const { componentId, props, title } = actionData;

  // Handler to open the item in a new tab
  const handleOpenInNewTab = (panelId: string) => {
    tabFactory.createTab(
      tabContext,
      {
        componentId,
        props,
        title
      },
      { targetPanelId: panelId }
    );
  };

  // Handler to open item in split view
  const handleOpenInSplitView = (direction: 'horizontal' | 'vertical') => {
    const currentPanelId = tabContext.state.activePanelId || 'mainPanel';
    
    // Create the tab in a new panel that's a split of the current panel
    tabFactory.createTab(
      tabContext,
      {
        componentId,
        props,
        title
      },
      {
        newPanel: {
          parentId: currentPanelId,
          direction
        }
      }
    );
  };

  // Handler to open the item in a maximized view
  const handleOpenMaximized = () => {
    const tabResult = tabFactory.createTab(
      tabContext,
      {
        componentId,
        props,
        title
      }
    );
    
    if (tabResult.success && tabResult.tabId) {
      setTimeout(() => {
        // Find the panel containing this tab
        const panelId = Object.entries(tabContext.state.panels).find(
          ([_, panel]) => panel.tabs.includes(tabResult.tabId)
        )?.[0];
        
        if (panelId) {
          tabContext.maximizePanel(panelId);
        }
      }, 100);
    }
  };

  // Handler to duplicate a tab
  const handleDuplicate = () => {
    // First need to find if this component is already open in a tab
    const existingTabId = Object.entries(tabContext.state.tabs).find(
      ([_, tab]) => 
        tab.componentId === componentId && 
        JSON.stringify(tab.props) === JSON.stringify(props)
    )?.[0];
    
    if (existingTabId) {
      tabFactory.duplicateTab(tabContext, existingTabId);
    } else {
      // If not open yet, just create a new tab
      handleOpenInNewTab(tabContext.state.activePanelId || 'mainPanel');
    }
  };

  return (
    <ContextMenuPrimitive>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem 
          onClick={() => handleOpenInNewTab(tabContext.state.activePanelId || 'mainPanel')}
          className="flex items-center"
        >
          <ExternalLink size={16} className="mr-2" />
          <span>Open in New Tab</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleDuplicate} className="flex items-center">
          <Copy size={16} className="mr-2" />
          <span>Duplicate</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleOpenMaximized} className="flex items-center">
          <Maximize2 size={16} className="mr-2" />
          <span>Open Maximized</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center">
            <Split size={16} className="mr-2" />
            <span>Open in Split View</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => handleOpenInSplitView('horizontal')} className="flex items-center">
              <LayoutPanelLeft size={16} className="mr-2" />
              <span>Split Horizontally</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleOpenInSplitView('vertical')} className="flex items-center">
              <LayoutPanelTop size={16} className="mr-2" />
              <span>Split Vertically</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center">
            <ExternalLink size={16} className="mr-2" />
            <span>Open in Panel</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {Object.entries(tabContext.state.panels).map(([panelId, panel]) => (
              <ContextMenuItem 
                key={panelId}
                onClick={() => handleOpenInNewTab(panelId)}
                className="flex items-center"
              >
                <span>{panelId}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenuPrimitive>
  );
}

export default ItemContextMenu;