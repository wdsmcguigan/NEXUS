import React from 'react';
import { useTabContext } from '../context/TabContext';
import { useAppContext } from '../context/AppContext';
import { Plus, Maximize2, Minimize2, X } from 'lucide-react';
import componentRegistry from '../lib/componentRegistry';
import { cn } from '../lib/utils';
import { AdvancedTabBar } from './AdvancedTabBar';
import { useDragContext, DropTarget } from '../context/DragContext';

interface UniversalTabPanelProps {
  panelId: string;
  onAddTab: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  isMaximized: boolean;
}

export function UniversalTabPanel({
  panelId,
  onAddTab,
  onMaximize,
  onRestore,
  isMaximized
}: UniversalTabPanelProps) {
  const { state, activateTab, closeTab } = useTabContext();
  const panel = state.panels[panelId];
  
  if (!panel) {
    return <div>Panel not found</div>;
  }
  
  const { tabs: tabIds, activeTabId } = panel;
  
  // Get actual tab objects
  const tabs = tabIds
    .map(tabId => state.tabs[tabId])
    .filter(Boolean);
  
  // Handler functions
  const handleTabClick = (tabId: string) => activateTab(tabId, panelId);
  const handleTabClose = (tabId: string) => closeTab(tabId);
  const handleViewToggle = isMaximized ? onRestore : onMaximize;
  
  // Handle drops for drag-and-drop operations
  const { moveTab } = useTabContext();
  
  const handleTabDrop = (target: DropTarget, tabId: string, sourcePanelId: string) => {
    if (target.type === 'tabbar') {
      // Move the tab to this panel
      moveTab(tabId, sourcePanelId, panelId);
    } 
    else if (target.type === 'position' && target.position) {
      // Move the tab to a specific position in this panel
      const { index } = target.position;
      moveTab(tabId, sourcePanelId, panelId, index);
    }
  };
  
  // Render the tabs for this panel with fixed heights
  return (
    <div 
      className="flex flex-col h-full bg-neutral-950"
      data-panel-id={panelId} // Add data attribute for edge detection
    >
      {/* Advanced tab bar with drag and drop */}
      <AdvancedTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        panelId={panelId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onAddTab={onAddTab}
        onViewToggle={handleViewToggle}
        isMaximized={isMaximized}
        onTabDrop={handleTabDrop}
      />
      
      {/* Content area */}
      <div 
        className="flex-grow overflow-auto p-0 thin-scrollbar"
        data-content-area={panelId} // Add descriptive data attribute
      >
        {activeTabId ? (
          <RenderActiveTab tabId={activeTabId} />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <p className="mb-2">No tabs open</p>
              <button
                className="px-3 py-1 text-xs rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white"
                onClick={onAddTab}
              >
                Add a tab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Using the advanced tab bar with drag and drop support

function RenderActiveTab({ tabId }: { tabId: string }) {
  const { state, getComponentForTab } = useTabContext();
  const tab = state.tabs[tabId];
  
  if (!tab) {
    return <div>Tab not found</div>;
  }
  
  const componentDef = getComponentForTab(tabId);
  
  if (!componentDef) {
    return <div>Component not found for this tab</div>;
  }
  
  const ComponentToRender = componentDef.component;
  
  return (
    <div className="h-full overflow-auto thin-scrollbar">
      <ComponentToRender {...(tab.props || {})} tabId={tabId} />
    </div>
  );
}

export default UniversalTabPanel;