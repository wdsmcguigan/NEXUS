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
} from '@/components/ui/context-menu';
import { useTabContext } from '../context/TabContext';
import { usePanelContext, PanelConfig } from '../context/PanelContext';
import { 
  Copy, 
  X, 
  Maximize2, 
  Minimize2, 
  LayoutGrid, 
  Move, 
  PanelLeft, 
  PanelTop, 
  Plus,
  ArrowRight,
  ExternalLink,
  Pin,
  FileEdit,
  Keyboard,
  Bookmark
} from 'lucide-react';

interface TabContextMenuProps {
  children: React.ReactNode;
  tabId: string;
  panelId: string;
  title: string;
}

export function TabContextMenu({ children, tabId, panelId, title }: TabContextMenuProps) {
  const tabContext = useTabContext();
  const panelContext = usePanelContext();
  
  // Check if the panel is currently maximized
  const isPanelMaximized = panelContext.maximizedPanelId === panelId;

  // Handler to close the tab
  const handleCloseTab = () => {
    tabContext.closeTab(tabId);
  };
  
  // Handler to close all other tabs in this panel
  const handleCloseOthers = () => {
    const panel = tabContext.state.panels[panelId];
    if (!panel) return;
    
    panel.tabs
      .filter(id => id !== tabId && tabContext.state.tabs[id]?.closeable)
      .forEach(id => tabContext.closeTab(id));
  };
  
  // Handler to duplicate the tab
  const handleDuplicateTab = () => {
    const tab = tabContext.state.tabs[tabId];
    if (!tab) return;
    
    // Create a new tab with the same properties
    tabContext.addTab(
      tab.componentId,
      panelId,
      tab.props,
      {
        title: `${tab.title} (Copy)`,
        icon: tab.icon,
        closeable: tab.closeable
      }
    );
  };
  
  // Handler to maximize or restore the panel
  const handleToggleMaximize = () => {
    if (isPanelMaximized) {
      panelContext.restorePanel();
    } else {
      panelContext.maximizePanel(panelId);
    }
  };
  
  // Handler to split panel
  const handleSplitPanel = (direction: 'horizontal' | 'vertical') => {
    // Create a new empty panel with the split
    const newPanelId = `panel-${Date.now()}`;
    
    // Move the current tab to the new panel
    const tab = tabContext.state.tabs[tabId];
    if (!tab) return;
    
    // Create a new panel config
    const newPanel: PanelConfig = {
      id: newPanelId,
      type: 'panel',
      tabs: [],
      activeTabId: undefined
    };
    
    // Create the split
    panelContext.splitPanel(panelId, direction, newPanel);
    
    // After a short delay, move the tab to the new panel
    setTimeout(() => {
      tabContext.moveTab(tabId, panelId, newPanelId);
    }, 50);
  };
  
  // Handler to open in new window (if implemented)
  const handleOpenInNewWindow = () => {
    // This functionality would typically launch a new browser window
    // For now we'll just show an alert
    alert('Open in new window functionality not implemented yet');
  };
  
  // Handler to change tab (move it to another panel)
  const handleMoveToPanel = (targetPanelId: string) => {
    if (targetPanelId !== panelId) {
      tabContext.moveTab(tabId, panelId, targetPanelId);
    }
  };
  
  // Handler to rename the tab
  const handleRenameTab = () => {
    const newTitle = prompt('Enter new tab title:', title);
    if (newTitle && newTitle.trim()) {
      tabContext.renameTab(tabId, newTitle.trim());
    }
  };
  
  // Get all available panels to move to
  const otherPanels = Object.entries(tabContext.state.panels)
    .filter(([id]) => id !== panelId)
    .map(([id, panel]) => ({ id, type: panel.type }));
    
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* Change tab and quick actions section */}
        <ContextMenuItem onClick={handleRenameTab} className="flex items-center">
          <FileEdit size={16} className="mr-2" />
          <span>Rename tab</span>
        </ContextMenuItem>
        
        {/* Duplication */}
        <ContextMenuItem onClick={handleDuplicateTab} className="flex items-center">
          <Copy size={16} className="mr-2" />
          <span>Duplicate</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Panel management */}
        <ContextMenuItem onClick={() => handleToggleMaximize()} className="flex items-center">
          {isPanelMaximized ? (
            <>
              <Minimize2 size={16} className="mr-2" />
              <span>Restore panel</span>
            </>
          ) : (
            <>
              <Maximize2 size={16} className="mr-2" />
              <span>Maximize</span>
            </>
          )}
        </ContextMenuItem>
        
        {/* Create a new panel with this tab */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center">
            <Plus size={16} className="mr-2" />
            <span>Add panel</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => handleSplitPanel('horizontal')} className="flex items-center">
              <PanelLeft size={16} className="mr-2" />
              <span>Split horizontally</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleSplitPanel('vertical')} className="flex items-center">
              <PanelTop size={16} className="mr-2" />
              <span>Split vertically</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Move tab to another panel */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center">
            <Move size={16} className="mr-2" />
            <span>Move tab</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {otherPanels.length > 0 ? (
              otherPanels.map(panel => (
                <ContextMenuItem 
                  key={panel.id} 
                  onClick={() => handleMoveToPanel(panel.id)}
                  className="flex items-center"
                >
                  <ArrowRight size={16} className="mr-2" />
                  <span>{panel.id.length > 15 ? panel.id.substring(0, 15) + '...' : panel.id}</span>
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="flex items-center opacity-50">
                <span>No other panels available</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        {/* External actions */}
        <ContextMenuItem onClick={handleOpenInNewWindow} className="flex items-center">
          <ExternalLink size={16} className="mr-2" />
          <span>Open in new window</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Close actions */}
        <ContextMenuItem onClick={handleCloseOthers} className="flex items-center">
          <X size={16} className="mr-2" />
          <span>Close other tabs</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCloseTab} className="flex items-center text-red-500">
          <X size={16} className="mr-2" />
          <span>Close</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default TabContextMenu;