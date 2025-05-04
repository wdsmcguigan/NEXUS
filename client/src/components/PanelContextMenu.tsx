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
} from '../components/ui/context-menu';
import { usePanelContext } from '../context/PanelContext';
import { useComponentRegistry, ComponentContext } from '../context/ComponentContext';
import { useShortcutContext } from '../context/ShortcutContext';
import { 
  Layout, 
  Maximize2, 
  Minimize2, 
  Square, 
  Move, 
  Plus, 
  X, 
  Monitor,
  ArrowRight,
  RefreshCw,
  PanelLeft,
  PanelTop,
  ExternalLink,
  Layers,
  Copy,
} from 'lucide-react';

interface PanelContextMenuProps {
  children: React.ReactNode;
  panelId: string;
  tabId?: string;
}

export function PanelContextMenu({ 
  children, 
  panelId, 
  tabId 
}: PanelContextMenuProps) {
  const { 
    layout, 
    maximizedPanelId, 
    maximizePanel, 
    restorePanel, 
    splitPanel, 
    moveTab,
    findPanel,
    savedLayouts,
    loadLayout,
    saveLayout,
  } = usePanelContext();
  
  // Access component registry from context
  const componentContext = React.useContext(ComponentContext) || {
    components: {},
    createComponent: () => '',
    registerComponent: () => {},
    unregisterComponent: () => {}
  };
  const { registerShortcut } = useShortcutContext();
  
  // Check if this panel is currently maximized
  const isMaximized = maximizedPanelId === panelId;
  
  // Find the panel in the layout
  const panel = findPanel(layout, panelId);
  const activeTabId = panel?.activeTabId;
  
  // Get available tabs from the panel
  const tabs = panel?.tabs || [];
  
  // Get all available panel IDs for moving
  const allPanelIds = React.useMemo(() => {
    const collectPanelIds = (config: any): string[] => {
      if (!config) return [];
      
      const ids: string[] = [];
      if (config.type === 'panel' && config.id !== panelId) {
        ids.push(config.id);
      }
      
      if (config.children) {
        for (const child of config.children) {
          ids.push(...collectPanelIds(child));
        }
      }
      
      return ids;
    };
    
    return collectPanelIds(layout);
  }, [layout, panelId]);
  
  // Get available component types
  const availableComponents = Object.keys(componentContext.components || {}).map(id => ({
    id,
    name: (componentContext.components || {})[id]?.name || id,
    description: (componentContext.components || {})[id]?.description || '',
  }));
  
  // Handle maximize/restore
  const handleToggleMaximize = () => {
    if (isMaximized) {
      restorePanel();
    } else {
      maximizePanel(panelId);
    }
  };
  
  // Register shortcuts
  React.useEffect(() => {
    // Register maximize/restore shortcut
    registerShortcut({
      id: `maximize-panel-${panelId}`,
      name: 'Maximize/Restore Panel',
      keys: ['Meta', 'm'],
      action: handleToggleMaximize,
      when: () => true,
    });
    
    // Register split shortcuts
    registerShortcut({
      id: `split-horizontal-${panelId}`,
      name: 'Split Panel Horizontally',
      keys: ['Meta', 'Shift', 'h'],
      action: () => handleSplitPanel('horizontal'),
      when: () => true,
    });
    
    registerShortcut({
      id: `split-vertical-${panelId}`,
      name: 'Split Panel Vertically',
      keys: ['Meta', 'Shift', 'v'],
      action: () => handleSplitPanel('vertical'),
      when: () => true,
    });
    
    // Register close shortcut if we have a tab
    if (tabId) {
      registerShortcut({
        id: `close-tab-${tabId}`,
        name: 'Close Tab',
        keys: ['Meta', 'w'],
        action: handleCloseTab,
        when: () => activeTabId === tabId,
      });
    }
  }, [panelId, tabId, activeTabId, registerShortcut, handleToggleMaximize]);
  
  // Handle splitting the panel
  const handleSplitPanel = (direction: 'horizontal' | 'vertical') => {
    if (!panel) return;
    
    // Get the panel ID
    const panelId = panel.id;
    
    // Create a new panel ID with sanitized panel ID to avoid special characters
    const timestamp = Date.now();
    const sanitizedId = panelId.replace(/[^a-zA-Z0-9]/g, '');
    const newPanelId = `panel-${sanitizedId}-${timestamp}`;
    
    console.log(`📊 [PANEL_MENU] Splitting panel ${panelId} ${direction}ly with newPanelId: ${newPanelId}`);
    
    // Create options object with newPanelId
    const splitOptions = {
      newPanelId: newPanelId,
      positionAfter: false // By default, put the new panel first in the split
    };
    
    // Perform the split
    splitPanel(panelId, direction, splitOptions);
  };
  
  // Handle changing the tab 
  const handleChangeTab = (newTabId: string) => {
    if (!panel) return;
    
    // Find the panel that matches this ID and change its active tab
    if (panel.activeTabId !== newTabId) {
      panel.activeTabId = newTabId;
    }
  };
  
  // Handle adding a new tab
  const handleAddTab = (componentId: string) => {
    // Use component registry to create a new component in this panel
    componentContext.createComponent(componentId, panelId);
  };
  
  // Handle moving a tab to another panel
  const handleMoveTab = (targetPanelId: string) => {
    if (tabId && targetPanelId !== panelId) {
      moveTab(panelId, tabId, targetPanelId);
    }
  };
  
  // Handle closing the current tab
  const handleCloseTab = () => {
    if (!tabId || !panel) return;
    
    // Remove the tab from the panel
    if (panel.tabs) {
      panel.tabs = panel.tabs.filter((t: { id: string }) => t.id !== tabId);
      
      // Update the active tab if needed
      if (panel.activeTabId === tabId) {
        panel.activeTabId = panel.tabs.length > 0 ? panel.tabs[0].id : undefined;
      }
    }
  };
  
  // Handle opening in a new window
  const handleOpenInNewWindow = () => {
    console.log('Open in new window not implemented');
    alert('Open in new window not implemented');
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-neutral-800 border-neutral-700 text-neutral-100">
        {/* Preview option (placeholder) */}
        <ContextMenuItem className="flex items-center text-neutral-100 focus:bg-neutral-700">
          <Square size={16} className="mr-2 text-neutral-400" />
          <span>Preview</span>
          <ContextMenuShortcut>⌘P</ContextMenuShortcut>
        </ContextMenuItem>
        
        {/* Change tab submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-700">
            <RefreshCw size={16} className="mr-2 text-neutral-400" />
            <span>Change tab</span>
            <ContextMenuShortcut>→</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-neutral-800 border-neutral-700">
            {tabs.length > 0 ? (
              tabs.map((tab: { id: string; title: string }) => (
                <ContextMenuItem 
                  key={tab.id} 
                  className={`flex items-center ${tab.id === activeTabId ? 'bg-neutral-700' : 'focus:bg-neutral-700'}`}
                  onClick={() => handleChangeTab(tab.id)}
                >
                  <span>{tab.title}</span>
                  {tab.id === activeTabId && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-blue-500"></div>
                  )}
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="text-neutral-500">
                No tabs available
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Tabs count (placeholder) */}
        <ContextMenuItem className="flex items-center focus:bg-neutral-700">
          <Layers size={16} className="mr-2 text-neutral-400" />
          <span>Tabs</span>
          <div className="ml-auto flex items-center justify-center h-5 w-5 text-xs bg-neutral-700 rounded-full">
            {tabs.length}
          </div>
          <ContextMenuShortcut>→</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-neutral-700" />
        
        {/* Add pane submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-700">
            <Plus size={16} className="mr-2 text-neutral-400" />
            <span>Add pane</span>
            <ContextMenuShortcut>→</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-neutral-800 border-neutral-700">
            <ContextMenuItem 
              className="flex items-center focus:bg-neutral-700"
              onClick={() => handleSplitPanel('horizontal')}
            >
              <PanelLeft size={16} className="mr-2 text-neutral-400" />
              <span>Split horizontally</span>
              <ContextMenuShortcut>⌘⇧H</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem 
              className="flex items-center focus:bg-neutral-700"
              onClick={() => handleSplitPanel('vertical')}
            >
              <PanelTop size={16} className="mr-2 text-neutral-400" />
              <span>Split vertically</span>
              <ContextMenuShortcut>⌘⇧V</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Move tab submenu - only available if we have a tab */}
        {tabId && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-700">
              <Move size={16} className="mr-2 text-neutral-400" />
              <span>Move tab</span>
              <ContextMenuShortcut>→</ContextMenuShortcut>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="bg-neutral-800 border-neutral-700">
              {allPanelIds.length > 0 ? (
                allPanelIds.map(id => (
                  <ContextMenuItem 
                    key={id} 
                    className="flex items-center focus:bg-neutral-700"
                    onClick={() => handleMoveTab(id)}
                  >
                    <ArrowRight size={16} className="mr-2 text-neutral-400" />
                    <span>{id.length > 15 ? id.substring(0, 15) + '...' : id}</span>
                  </ContextMenuItem>
                ))
              ) : (
                <ContextMenuItem disabled className="text-neutral-500">
                  No other panels available
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        
        {/* Move group submenu (placeholder) */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-700">
            <Layout size={16} className="mr-2 text-neutral-400" />
            <span>Move group</span>
            <ContextMenuShortcut>→</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-neutral-800 border-neutral-700">
            <ContextMenuItem disabled className="text-neutral-500">
              Group movement not implemented
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Maximize/Restore */}
        <ContextMenuItem 
          className="flex items-center focus:bg-neutral-700"
          onClick={handleToggleMaximize}
        >
          {isMaximized ? (
            <>
              <Minimize2 size={16} className="mr-2 text-neutral-400" />
              <span>Restore</span>
            </>
          ) : (
            <>
              <Maximize2 size={16} className="mr-2 text-neutral-400" />
              <span>Maximize</span>
            </>
          )}
          <ContextMenuShortcut>⌘M</ContextMenuShortcut>
        </ContextMenuItem>
        
        {/* Float option (placeholder) */}
        <ContextMenuItem className="flex items-center focus:bg-neutral-700">
          <Monitor size={16} className="mr-2 text-neutral-400" />
          <span>Float</span>
        </ContextMenuItem>
        
        {/* New window option */}
        <ContextMenuItem 
          className="flex items-center focus:bg-neutral-700"
          onClick={handleOpenInNewWindow}
        >
          <ExternalLink size={16} className="mr-2 text-neutral-400" />
          <span>New window</span>
        </ContextMenuItem>
        
        {/* Close option - only available if we have a tab */}
        {tabId && (
          <ContextMenuItem 
            className="flex items-center focus:bg-neutral-700 text-red-400"
            onClick={handleCloseTab}
          >
            <X size={16} className="mr-2" />
            <span>Close</span>
            <ContextMenuShortcut>⌘W</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator className="bg-neutral-700" />
        
        {/* Add component submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-700">
            <Plus size={16} className="mr-2 text-neutral-400" />
            <span>Add component</span>
            <ContextMenuShortcut>→</ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-neutral-800 border-neutral-700 w-64 max-h-80 overflow-y-auto">
            {availableComponents.length > 0 ? (
              availableComponents.map(component => (
                <ContextMenuItem 
                  key={component.id} 
                  className="flex items-center focus:bg-neutral-700"
                  onClick={() => handleAddTab(component.id)}
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
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="text-neutral-500">
                No components available
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Additional controls section */}
        <div className="px-2 py-1.5 text-sm text-neutral-400">
          <div className="flex justify-between items-center mb-2">
            Move focus
            <div className="flex gap-1.5">
              <div className="w-6 h-6 bg-neutral-700 flex items-center justify-center rounded hover:bg-neutral-600 cursor-pointer">
                <Layout size={14} />
              </div>
              <div className="w-6 h-6 bg-neutral-700 flex items-center justify-center rounded hover:bg-neutral-600 cursor-pointer">
                <ArrowRight style={{ transform: 'rotate(270deg)' }} size={14} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            Move pane
            <div className="flex gap-1.5">
              <div className="w-6 h-6 bg-neutral-700 flex items-center justify-center rounded hover:bg-neutral-600 cursor-pointer">
                <Layout size={14} />
              </div>
              <div className="w-6 h-6 bg-neutral-700 flex items-center justify-center rounded hover:bg-neutral-600 cursor-pointer">
                <ArrowRight style={{ transform: 'rotate(90deg)' }} size={14} />
              </div>
              <div className="w-6 h-6 bg-neutral-700 flex items-center justify-center rounded hover:bg-neutral-600 cursor-pointer">
                <ArrowRight style={{ transform: 'rotate(270deg)' }} size={14} />
              </div>
            </div>
          </div>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
}