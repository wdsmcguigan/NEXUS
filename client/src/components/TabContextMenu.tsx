import React, { useEffect, useState } from 'react';
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
import { useTabContext } from '../context/TabContext';
import { usePanelContext, PanelConfig } from '../context/PanelContext';
import { useComponentRegistry } from '../context/ComponentContext';
import { 
  Copy, 
  X, 
  Maximize2, 
  Minimize2, 
  LayoutGrid, 
  Move, 
  PanelLeft, 
  PanelRight,
  PanelTop, 
  PanelBottomOpen,
  Plus,
  ArrowRight,
  ExternalLink,
  Pin,
  FileEdit,
  Keyboard,
  Bookmark,
  RotateCcw,
  Check
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { nanoid } from 'nanoid';
import { HotkeyRegistry, KeyboardShortcut } from '../lib/hotkeyRegistry';

// Define interface for tab context menu props
interface TabContextMenuProps {
  children: React.ReactNode;
  tabId: string;
  panelId: string;
  title?: string;
}

// Create a keyboard shortcut registry
const hotkeyRegistry = new HotkeyRegistry();

export function TabContextMenu({ children, tabId, panelId, title }: TabContextMenuProps) {
  const tabContext = useTabContext();
  const panelContext = usePanelContext();
  const componentRegistry = useComponentRegistry();
  const [registeredComponents, setRegisteredComponents] = useState<any[]>([]);
  
  // Check if the panel is currently maximized
  const isPanelMaximized = panelContext.maximizedPanelId === panelId;
  
  // Get current tab info
  const currentTab = tabContext.state.tabs[tabId];
  const currentTitle = title || (currentTab?.title || 'Tab');
  
  // Load available components
  useEffect(() => {
    if (componentRegistry) {
      const components = componentRegistry.getComponents();
      setRegisteredComponents(components);
    }
  }, [componentRegistry]);

  // Register keyboard shortcuts
  useEffect(() => {
    // Close tab: Ctrl+W
    hotkeyRegistry.register('tab:close', 'Ctrl+W', () => {
      if (currentTab?.closeable) handleCloseTab();
    });
    
    // Maximize/Restore: F11
    hotkeyRegistry.register('panel:maximize', 'F11', () => {
      handleToggleMaximize();
    });
    
    // Split horizontally: Ctrl+Alt+H
    hotkeyRegistry.register('panel:splitHorizontal', 'Ctrl+Alt+H', () => {
      handleSplitPanel('horizontal');
    });
    
    // Split vertically: Ctrl+Alt+V
    hotkeyRegistry.register('panel:splitVertical', 'Ctrl+Alt+V', () => {
      handleSplitPanel('vertical');
    });
    
    // Duplicate tab: Ctrl+Shift+D
    hotkeyRegistry.register('tab:duplicate', 'Ctrl+Shift+D', () => {
      handleDuplicateTab();
    });

    return () => {
      // Cleanup
      hotkeyRegistry.unregisterAll();
    };
  }, [tabId, panelId, currentTab]);

  // Handler to close the tab
  const handleCloseTab = () => {
    if (currentTab?.closeable) {
      tabContext.closeTab(tabId);
    }
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
  
  // Handler to float the panel in a new window
  const handleFloatPanel = () => {
    // This would typically detach the panel to a new window
    alert('Float panel feature will be implemented in a future update');
  };
  
  // Handler to split panel
  const handleSplitPanel = (direction: 'horizontal' | 'vertical') => {
    // Create a new empty panel with the split
    const newPanelId = `panel-${nanoid(6)}`;
    
    // Move the current tab to the new panel
    const tab = tabContext.state.tabs[tabId];
    if (!tab) return;
    
    // Create a new panel config
    const newPanel: PanelConfig = {
      id: newPanelId,
      type: 'panel',
      tabs: [],
      contents: [],
      activeTabId: undefined
    };
    
    // Create the split
    panelContext.splitPanel(panelId, direction, newPanel);
    
    // After a short delay, move the tab to the new panel
    setTimeout(() => {
      panelContext.moveTab(panelId, tabId, newPanelId);
    }, 50);
  };
  
  // Handler to open in new window
  const handleOpenInNewWindow = () => {
    // This would launch a new browser window
    window.open(window.location.href, '_blank');
  };
  
  // Handler to move tab to another panel
  const handleMoveToPanel = (targetPanelId: string) => {
    if (targetPanelId !== panelId) {
      panelContext.moveTab(panelId, tabId, targetPanelId);
    }
  };
  
  // Handler to change tab type (component)
  const handleChangeTabComponent = (componentId: string) => {
    if (!currentTab) return;
    
    // Create a new tab with the same ID but different component
    tabContext.changeTabComponent(tabId, componentId);
  };
  
  // Handler to rename the tab
  const handleRenameTab = () => {
    const newTitle = prompt('Enter new tab title:', currentTitle);
    if (newTitle && newTitle.trim()) {
      tabContext.renameTab(tabId, newTitle.trim());
    }
  };
  
  // Handler to pin/unpin tab
  const handleTogglePin = () => {
    if (!currentTab) return;
    tabContext.toggleTabPin(tabId);
  };
  
  // Get all available panels to move to
  const allPanels = Object.entries(panelContext.layout)
    .filter(([id]) => id !== panelId && id !== 'type')
    .map(([id, panel]: [string, any]) => ({ 
      id, 
      name: id.includes('-') ? id.split('-')[0] : id,
      type: panel?.type || 'panel'
    }));
  
  // Get all available component types
  const componentItems = registeredComponents.map(component => ({
    id: component.id,
    name: component.name || component.id,
    description: component.description,
    icon: component.icon
  }));
    
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-neutral-900 border-neutral-700 text-neutral-100">
        {/* Tab Type Selection */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-800">
            <FileEdit size={16} className="mr-2 text-blue-400" />
            <span>Change tab</span>
            <ContextMenuShortcut>⌥T</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-64 bg-neutral-900 border-neutral-700 max-h-[400px] overflow-y-auto">
            {componentItems.length > 0 ? (
              componentItems.map(component => (
                <ContextMenuItem 
                  key={component.id} 
                  onClick={() => handleChangeTabComponent(component.id)}
                  className="flex items-center focus:bg-neutral-800"
                >
                  {component.icon || <LayoutGrid size={16} className="mr-2 text-blue-400" />}
                  <span className="ml-2">{component.name}</span>
                  {currentTab?.componentId === component.id && (
                    <Check size={16} className="ml-auto text-green-500" />
                  )}
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="opacity-50 focus:bg-neutral-800">
                <span>No components available</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Tabs list */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-800">
            <LayoutGrid size={16} className="mr-2 text-blue-400" />
            <span>Tabs</span>
            <Badge className="ml-auto px-1 py-0 h-5 bg-neutral-700">{
              tabContext.state.panels[panelId]?.tabs.length || 0
            }</Badge>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-64 bg-neutral-900 border-neutral-700">
            {tabContext.state.panels[panelId]?.tabs.map(id => {
              const tab = tabContext.state.tabs[id];
              if (!tab) return null;
              
              return (
                <ContextMenuItem 
                  key={id}
                  onClick={() => tabContext.activateTab(panelId, id)}
                  className="flex items-center focus:bg-neutral-800"
                >
                  {tab.icon || <LayoutGrid size={16} className="mr-2 text-blue-400" />}
                  <span className="ml-2 truncate">{tab.title}</span>
                  {id === tabId && (
                    <Check size={16} className="ml-auto text-green-500" />
                  )}
                </ContextMenuItem>
              );
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Add Pane option */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-800">
            <Plus size={16} className="mr-2 text-blue-400" />
            <span>Add pane</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-neutral-900 border-neutral-700">
            <ContextMenuItem 
              onClick={() => handleSplitPanel('horizontal')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelLeft size={16} className="mr-2 text-blue-400" />
              <span>Left</span>
              <ContextMenuShortcut>⌃⌥H</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitPanel('horizontal')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelRight size={16} className="mr-2 text-blue-400" />
              <span>Right</span>
              <ContextMenuShortcut>⌃⌥L</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitPanel('vertical')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelTop size={16} className="mr-2 text-blue-400" />
              <span>Top</span>
              <ContextMenuShortcut>⌃⌥K</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitPanel('vertical')}
              className="flex items-center focus:bg-neutral-800"
            >
              <PanelBottomOpen size={16} className="mr-2 text-blue-400" />
              <span>Bottom</span>
              <ContextMenuShortcut>⌃⌥J</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Move Tab to another panel */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-800">
            <Move size={16} className="mr-2 text-blue-400" />
            <span>Move tab</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-neutral-900 border-neutral-700">
            {allPanels.length > 0 ? (
              allPanels.map(panel => (
                <ContextMenuItem 
                  key={panel.id} 
                  onClick={() => handleMoveToPanel(panel.id)}
                  className="flex items-center focus:bg-neutral-800"
                >
                  <ArrowRight size={16} className="mr-2 text-blue-400" />
                  <span className="truncate">{panel.name}</span>
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="opacity-50 focus:bg-neutral-800">
                <span>No other panels available</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Move Group (feature to be implemented) */}
        <ContextMenuItem disabled className="flex items-center opacity-50 focus:bg-neutral-800">
          <LayoutGrid size={16} className="mr-2 text-blue-400" />
          <span>Move group</span>
        </ContextMenuItem>
        
        {/* Maximize/Restore */}
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
        
        {/* Float */}
        <ContextMenuItem 
          onClick={handleFloatPanel}
          className="flex items-center focus:bg-neutral-800"
        >
          <ExternalLink size={16} className="mr-2 text-blue-400" />
          <span>Float</span>
        </ContextMenuItem>
        
        {/* Open in new window */}
        <ContextMenuItem 
          onClick={handleOpenInNewWindow}
          className="flex items-center focus:bg-neutral-800"
        >
          <ExternalLink size={16} className="mr-2 text-blue-400" />
          <span>New window</span>
          <ContextMenuShortcut>⌘+Shift+N</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-neutral-700" />
        
        {/* Additional Actions */}
        <ContextMenuItem 
          onClick={handleRenameTab}
          className="flex items-center focus:bg-neutral-800"
        >
          <FileEdit size={16} className="mr-2 text-blue-400" />
          <span>Rename</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handleDuplicateTab}
          className="flex items-center focus:bg-neutral-800"
        >
          <Copy size={16} className="mr-2 text-blue-400" />
          <span>Duplicate</span>
          <ContextMenuShortcut>⌘+Shift+D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handleTogglePin}
          className="flex items-center focus:bg-neutral-800"
        >
          <Pin size={16} className="mr-2 text-blue-400" />
          <span>{currentTab?.pinned ? 'Unpin' : 'Pin'}</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-neutral-700" />
        
        {/* Close Actions */}
        <ContextMenuItem 
          onClick={handleCloseOthers}
          className="flex items-center focus:bg-neutral-800"
          disabled={!currentTab?.closeable}
        >
          <X size={16} className="mr-2 text-blue-400" />
          <span>Close others</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handleCloseTab}
          className="flex items-center text-red-400 focus:bg-neutral-800"
          disabled={!currentTab?.closeable}
        >
          <X size={16} className="mr-2" />
          <span>Close</span>
          <ContextMenuShortcut>⌘+W</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Create a class to handle keyboard shortcuts
export class KeyboardShortcutManager {
  static init() {
    // Initialize global keyboard shortcut handlers
    document.addEventListener('keydown', (e) => {
      // Global shortcuts
      if (e.ctrlKey && e.key === 'w') {
        // Ctrl+W: Close tab
        hotkeyRegistry.trigger('tab:close');
        e.preventDefault();
      }
      
      if (e.key === 'F11') {
        // F11: Maximize/restore panel
        hotkeyRegistry.trigger('panel:maximize');
        e.preventDefault();
      }
      
      if (e.ctrlKey && e.altKey && e.key === 'h') {
        // Ctrl+Alt+H: Split horizontally
        hotkeyRegistry.trigger('panel:splitHorizontal');
        e.preventDefault();
      }
      
      if (e.ctrlKey && e.altKey && e.key === 'v') {
        // Ctrl+Alt+V: Split vertically
        hotkeyRegistry.trigger('panel:splitVertical');
        e.preventDefault();
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'd') {
        // Ctrl+Shift+D: Duplicate tab
        hotkeyRegistry.trigger('tab:duplicate');
        e.preventDefault();
      }
    });
  }
}

export default TabContextMenu;