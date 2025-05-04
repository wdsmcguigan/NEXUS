import React, { useEffect, useCallback, useMemo } from 'react';
import { MaximizeIcon, MinimizeIcon, X as CloseIcon, Pin, PinOff } from 'lucide-react';
import { useTabContext, Tab } from '../context/TabContext';
import { componentRegistry } from '../registry/ComponentRegistry.js';

interface UniversalTabComponentProps {
  tab: Tab;
  onClose: () => void;
  onPin: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

// This component wraps any component to be displayed in a tab
export function UniversalTabComponent({
  tab,
  onClose,
  onPin,
  onMaximize,
  onRestore,
  isMaximized
}: UniversalTabComponentProps) {
  const { getTabComponent } = useTabContext();
  
  // Get the component from the registry based on the tab's componentId
  const Component = useMemo(() => getTabComponent(tab.id), [getTabComponent, tab.id]);
  
  if (!Component) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        <p>Component not found: {tab.componentId}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Component {...tab.props} tabId={tab.id} />
    </div>
  );
}

interface TabHeaderProps {
  tab: Tab;
  onClose: () => void;
  onPin: () => void;
  onActivate: () => void;
  onMaximize?: () => void; 
  onRestore?: () => void;
  isMaximized?: boolean;
}

// Tab header/title component with actions
export function TabHeader({
  tab,
  onClose,
  onPin,
  onActivate,
  onMaximize,
  onRestore,
  isMaximized
}: TabHeaderProps) {
  return (
    <div 
      className={`
        flex items-center px-2 py-1 rounded-t cursor-pointer
        ${tab.active ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'}
        group relative
      `}
      onClick={onActivate}
    >
      <div className="flex-grow flex items-center overflow-hidden">
        {tab.icon && <div className="mr-1.5">{tab.icon}</div>}
        <div className="truncate text-sm">{tab.title}</div>
      </div>
      
      <div className="flex items-center ml-1 space-x-1">
        {tab.pinnable !== false && (
          <button
            className={`p-1 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity ${tab.pinned ? 'text-blue-400' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
          >
            {tab.pinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
        )}
        
        {onMaximize && onRestore && (
          <button
            className="p-1 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              isMaximized ? onRestore() : onMaximize();
            }}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <MinimizeIcon size={14} /> : <MaximizeIcon size={14} />}
          </button>
        )}
        
        {tab.closeable && (
          <button
            className="p-1 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close tab"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

interface UniversalTabBarProps {
  panelId: string;
  onTabAdd?: () => void;
  onDragStart?: (tabId: string, e: React.DragEvent) => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

// Tab bar that renders all tabs in a panel
export function UniversalTabBar({ 
  panelId, 
  onTabAdd,
  onDragStart,
  onMaximize,
  onRestore,
  isMaximized
}: UniversalTabBarProps) {
  const { state, activateTab, closeTab, pinTab } = useTabContext();
  const panel = state.panels[panelId];
  
  if (!panel) {
    return null;
  }
  
  const tabs = panel.tabs.map(tabId => state.tabs[tabId]).filter(Boolean);
  
  return (
    <div className="flex items-center border-b border-neutral-800 bg-neutral-900">
      <div className="flex-grow flex items-center overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <TabHeader
            key={tab.id}
            tab={tab}
            onActivate={() => activateTab(tab.id)}
            onClose={() => closeTab(tab.id)}
            onPin={() => pinTab(tab.id, !tab.pinned)}
            onMaximize={onMaximize}
            onRestore={onRestore}
            isMaximized={isMaximized}
          />
        ))}
        
        {onTabAdd && (
          <button
            className="ml-2 px-2 py-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-sm transition-colors"
            onClick={onTabAdd}
            title="New tab"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

interface UniversalTabPanelProps {
  panelId: string;
  onTabAdd?: () => void;
  onDragStart?: (tabId: string, e: React.DragEvent) => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

// Main component that combines tab bar and content
export function UniversalTabPanel({
  panelId,
  onTabAdd,
  onDragStart,
  onMaximize,
  onRestore,
  isMaximized
}: UniversalTabPanelProps) {
  const { state, activateTab, closeTab, pinTab } = useTabContext();
  const panel = state.panels[panelId];
  
  if (!panel) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        <p>Panel not found: {panelId}</p>
      </div>
    );
  }
  
  const tabs = panel.tabs.map(tabId => state.tabs[tabId]).filter(Boolean);
  const activeTab = tabs.find(tab => tab.id === panel.activeTabId);
  
  return (
    <div className="flex flex-col h-full bg-neutral-900 rounded-md overflow-hidden">
      <UniversalTabBar
        panelId={panelId}
        onTabAdd={onTabAdd}
        onDragStart={onDragStart}
        onMaximize={onMaximize}
        onRestore={onRestore}
        isMaximized={isMaximized}
      />
      
      <div className="flex-grow overflow-hidden">
        {activeTab ? (
          <UniversalTabComponent
            tab={activeTab}
            onClose={() => closeTab(activeTab.id)}
            onPin={() => pinTab(activeTab.id, !activeTab.pinned)}
            onMaximize={onMaximize}
            onRestore={onRestore}
            isMaximized={isMaximized}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-500">
            <p>No active tab</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component to render a new tab dialog/menu
export function NewTabDialog({ 
  onSelect, 
  onClose,
  category 
}: { 
  onSelect: (componentId: string) => void; 
  onClose: () => void;
  category?: string 
}) {
  const components = useMemo(() => {
    if (category) {
      return componentRegistry.getEntriesByCategory(category as any);
    }
    return componentRegistry.getAllEntries();
  }, [category]);
  
  return (
    <div className="absolute top-12 left-0 mt-1 w-64 bg-neutral-800 rounded-md shadow-lg overflow-hidden z-50">
      <div className="p-2 border-b border-neutral-700 flex justify-between items-center">
        <div className="text-sm font-medium text-neutral-200">New Tab</div>
        <button
          className="p-1 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-700"
          onClick={onClose}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      
      <div className="py-2 max-h-64 overflow-y-auto">
        {components.map(component => (
          <div
            key={component.id}
            className="px-3 py-2 flex items-center hover:bg-neutral-700 cursor-pointer"
            onClick={() => {
              onSelect(component.id);
              onClose();
            }}
          >
            {component.icon && <div className="mr-2">{component.icon}</div>}
            <div className="text-sm text-neutral-200">{component.displayName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}