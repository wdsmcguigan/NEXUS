import React, { useEffect, useRef } from 'react';
import { useTabContext } from '../context/TabContext';
import { useAppContext } from '../context/AppContext';
import { useDependencyContext } from '../context/DependencyContext';
import { usePanelDependencyContext } from '../context/PanelDependencyContext';
import { Plus, Maximize2, Minimize2, X, Link, Check, AlertTriangle } from 'lucide-react';
import componentRegistry from '../lib/componentRegistry';
import { cn } from '../lib/utils';
import { AdvancedTabBar } from './AdvancedTabBar';
import { useDragContext, DropTarget } from '../context/DragContext';
import { DependencyDataTypes, DependencyStatus } from '../lib/dependency/DependencyInterfaces';

interface UniversalTabPanelProps {
  panelId: string;
  onAddTab: (componentId?: string) => void;
  onMaximize: () => void;
  onRestore: () => void;
  isMaximized: boolean;
  onSplitPanel?: (direction: 'horizontal' | 'vertical') => void;
  onClosePanel?: () => void;
}

export function UniversalTabPanel({
  panelId,
  onAddTab,
  onMaximize,
  onRestore,
  isMaximized,
  onSplitPanel,
  onClosePanel
}: UniversalTabPanelProps) {
  const { state, activateTab, closeTab } = useTabContext();
  const { registerPanelComponent, unregisterPanelComponent, connectTabs } = usePanelDependencyContext();
  const panel = state.panels[panelId];
  
  if (!panel) {
    return <div>Panel not found</div>;
  }
  
  const { tabs: tabIds, activeTabId } = panel;
  
  // Get actual tab objects
  const tabs = tabIds
    .map(tabId => state.tabs[tabId])
    .filter(Boolean);
  
  // Create compatible dependencies when tabs change
  useEffect(() => {
    // Attempt to create dependencies when tabs change
    if (tabIds.length > 0) {
      // Small delay to ensure all components are registered
      const timer = setTimeout(() => {
        // Check if the function exists before calling it
        if (typeof connectTabs === 'function') {
          console.log('[UniversalTabPanel] Looking for compatible tabs to connect');
          
          // Try to connect all tabs in this panel with each other
          for (let i = 0; i < tabIds.length; i++) {
            for (let j = 0; j < tabIds.length; j++) {
              if (i !== j) {
                // Try to connect in both directions
                connectTabs(tabIds[i], tabIds[j]);
              }
            }
          }
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [tabIds, connectTabs]);
  
  // Handler functions
  const handleTabClick = (tabId: string) => {
    activateTab(tabId, panelId);
  };
  
  const handleTabClose = (tabId: string) => {
    // Notify the bridge that the component is being unmounted
    unregisterPanelComponent(tabId);
    // Close the tab
    closeTab(tabId);
  };
  
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
        onSplitPanel={onSplitPanel}
        onClosePanel={onClosePanel}
      />
      
      {/* Content area */}
      <div 
        className="flex-grow overflow-auto p-0 thin-scrollbar"
        data-content-area={panelId} // Add descriptive data attribute
      >
        {activeTabId ? (
          <RenderActiveTab 
            tabId={activeTabId} 
            panelId={panelId}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <p className="mb-2">No tabs open</p>
              <button
                className="px-3 py-1 text-xs rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white"
                onClick={() => onAddTab()}
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

function RenderActiveTab({ tabId, panelId }: { tabId: string, panelId: string }) {
  const { state, getComponentForTab } = useTabContext();
  const { focusPanelComponent } = usePanelDependencyContext();
  const tab = state.tabs[tabId];
  
  // When tab becomes active, notify the bridge
  useEffect(() => {
    focusPanelComponent(tabId);
    console.log(`[UniversalTabPanel] Tab ${tabId} activated in panel ${panelId}`);
  }, [tabId, panelId, focusPanelComponent]);
  
  if (!tab) {
    return <div>Tab not found</div>;
  }
  
  const componentDef = getComponentForTab(tabId);
  
  if (!componentDef) {
    return <div>Component not found for this tab</div>;
  }
  
  const ComponentToRender = componentDef.component;
  
  // Render the tab content with panel information
  return (
    <div className="h-full overflow-auto thin-scrollbar">
      <ComponentToRender 
        {...(tab.props || {})} 
        tabId={tabId} 
        panelId={panelId}
      />
      <TabDependencyIndicator tabId={tabId} panelId={panelId} />
    </div>
  );
}

// Component to show dependency status for debugging
function TabDependencyIndicator({ tabId, panelId }: { tabId: string, panelId: string }) {
  const { getComponentIdForTab, showDebugInfo } = usePanelDependencyContext();
  const dependencyContext = useDependencyContext();
  const { state } = useTabContext();
  const tab = state.tabs[tabId];
  
  if (!tab || !showDebugInfo) return null;
  
  const componentId = getComponentIdForTab(tabId);
  if (!componentId) return null;
  
  // Check if this component has any dependencies
  const providingDeps = dependencyContext.registry.getDependenciesByProvider(componentId);
  const consumingDeps = dependencyContext.registry.getDependenciesByConsumer(componentId);
  
  if (providingDeps.length === 0 && consumingDeps.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-40 text-xs bg-neutral-900 border border-neutral-700 rounded p-2">
      <h4 className="font-semibold mb-1">Tab Dependencies</h4>
      <div>Component ID: <span className="text-blue-400">{componentId}</span></div>
      
      {providingDeps.length > 0 && (
        <div className="mt-1">
          <div className="text-yellow-400">Providing to:</div>
          <ul className="ml-2">
            {providingDeps.map(dep => (
              <li key={dep.id} className="flex items-center gap-1">
                {dep.status === DependencyStatus.CONNECTED ? (
                  <Check size={12} className="text-green-500" />
                ) : dep.status === DependencyStatus.ERROR ? (
                  <AlertTriangle size={12} className="text-red-500" />
                ) : (
                  <Link size={12} className="text-blue-500" />
                )}
                <span>{dep.consumerId} ({dep.status})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {consumingDeps.length > 0 && (
        <div className="mt-1">
          <div className="text-purple-400">Consuming from:</div>
          <ul className="ml-2">
            {consumingDeps.map(dep => (
              <li key={dep.id} className="flex items-center gap-1">
                {dep.status === DependencyStatus.CONNECTED ? (
                  <Check size={12} className="text-green-500" />
                ) : dep.status === DependencyStatus.ERROR ? (
                  <AlertTriangle size={12} className="text-red-500" />
                ) : (
                  <Link size={12} className="text-blue-500" />
                )}
                <span>{dep.providerId} ({dep.status})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UniversalTabPanel;