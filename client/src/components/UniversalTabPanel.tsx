import React, { useCallback, useState, useEffect } from 'react';
import { X as XIcon, Maximize2 as MaximizeIcon, Minimize2 as MinimizeIcon, Plus as PlusIcon } from 'lucide-react';
import { Tab, useTabContext } from '../context/TabContext';
import componentRegistry, { ComponentDefinition } from '../lib/componentRegistry';
import { cn } from '../lib/utils';

interface TabHeaderProps {
  tab: Tab;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

function TabHeader({ tab, active, onActivate, onClose, onDragStart }: TabHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center h-full px-3 text-xs font-medium border-r border-neutral-800 cursor-pointer select-none transition-colors group',
        active
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
      )}
      onClick={onActivate}
      draggable={tab.closeable}
      onDragStart={onDragStart}
    >
      {tab.icon && <span className="mr-1.5 text-neutral-400">{tab.icon}</span>}
      <span>{tab.title}</span>
      {tab.closeable && (
        <button
          className="w-4 h-4 ml-2 rounded-full opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

interface DragState {
  isDragging: boolean;
  draggedTabId: string | null;
}

interface TabBarProps {
  tabs: Tab[];
  panelId: string;
  activeTabId: string | undefined;
  onTabAdd: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

function UniversalTabBar({ tabs, panelId, activeTabId, onTabAdd, onMaximize, onRestore, isMaximized }: TabBarProps) {
  const { activateTab, closeTab, moveTab } = useTabContext();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTabId: null
  });

  const handleDragStart = useCallback((tabId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ 
      type: 'tab',
      tabId,
      sourcePanelId: panelId
    }));
    
    setDragState({
      isDragging: true,
      draggedTabId: tabId
    });
  }, [panelId]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedTabId: null
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.type === 'tab' && data.sourcePanelId && data.tabId) {
        // Move tab from source panel to this panel
        moveTab(data.tabId, panelId);
      }
    } catch (error) {
      console.error('Error handling tab drop:', error);
    }
    
    setDragState({
      isDragging: false,
      draggedTabId: null
    });
  }, [moveTab, panelId]);

  return (
    <div 
      className="flex items-center h-9 bg-neutral-950 border-b border-neutral-800"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <TabHeader
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
            onActivate={() => activateTab(tab.id, panelId)}
            onClose={() => closeTab(tab.id)}
            onDragStart={(e) => handleDragStart(tab.id, e)}
          />
        ))}
        
        {/* Add tab button right after tabs */}
        <button 
          onClick={onTabAdd}
          className="flex items-center justify-center w-8 h-full text-neutral-400 hover:text-white hover:bg-neutral-900/50 border-r border-neutral-800 transition-colors"
          title="Add tab"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex items-center ml-auto">
        {onMaximize && onRestore && (
          <button
            className="flex items-center justify-center w-7 h-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={isMaximized ? onRestore : onMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <MinimizeIcon className="w-3.5 h-3.5" />
            ) : (
              <MaximizeIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface TabContentProps {
  tab: Tab;
  component: ComponentDefinition;
}

function TabContent({ tab, component }: TabContentProps) {
  const Component = component.component;
  
  return (
    <div className="h-full overflow-hidden">
      <Component {...tab.props} tabId={tab.id} />
    </div>
  );
}

interface UniversalTabPanelProps {
  panelId: string;
  onAddTab?: () => void;
  showTabBar?: boolean; // Optional - hide tab bar for certain panels
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

export function UniversalTabPanel({ 
  panelId, 
  onAddTab, 
  showTabBar = true,
  onMaximize,
  onRestore,
  isMaximized
}: UniversalTabPanelProps) {
  const { state, activateTab, getComponentForTab } = useTabContext();
  const panel = state.panels[panelId];
  
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<Tab | undefined>(undefined);
  
  // Update tabs and active tab when state changes
  useEffect(() => {
    if (panel) {
      const panelTabs = panel.tabs
        .map(tabId => state.tabs[tabId])
        .filter(Boolean) as Tab[];
      
      setTabs(panelTabs);
      
      if (panel.activeTabId) {
        const activeTab = state.tabs[panel.activeTabId];
        if (activeTab) {
          setActiveTab(activeTab);
        } else if (panelTabs.length > 0) {
          // If active tab was removed, select the first available tab
          activateTab(panelTabs[0].id, panelId);
        } else {
          setActiveTab(undefined);
        }
      } else {
        setActiveTab(undefined);
      }
    }
  }, [state.tabs, state.panels, panel, panelId, activateTab]);

  const handleAddTab = useCallback(() => {
    if (onAddTab) {
      onAddTab();
    }
  }, [onAddTab]);

  // Render content for active tab
  const renderActiveTabContent = useCallback(() => {
    if (!activeTab) {
      return (
        <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
          No active tab
        </div>
      );
    }

    const component = getComponentForTab(activeTab.id);
    if (!component) {
      return (
        <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
          Component not found
        </div>
      );
    }

    return <TabContent tab={activeTab} component={component} />;
  }, [activeTab, getComponentForTab]);

  if (!panel) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
        Panel not found: {panelId}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {showTabBar && (
        <UniversalTabBar
          tabs={tabs}
          panelId={panelId}
          activeTabId={panel.activeTabId}
          onTabAdd={handleAddTab}
          onMaximize={onMaximize}
          onRestore={onRestore}
          isMaximized={isMaximized}
        />
      )}
      
      <div className="flex-grow overflow-auto">
        {renderActiveTabContent()}
      </div>
    </div>
  );
}

export default UniversalTabPanel;