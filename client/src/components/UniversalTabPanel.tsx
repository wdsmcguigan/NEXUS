import React from 'react';
import { useTabContext } from '../context/TabContext';
import { Plus, Maximize2, Minimize2, X } from 'lucide-react';
import componentRegistry from '../lib/componentRegistry';

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
  
  // Render the tabs for this panel
  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <div className="flex h-[40px] border-b border-neutral-800 bg-neutral-900 overflow-x-auto overflow-y-hidden thin-scrollbar">
        {tabIds.map(tabId => {
          const tab = state.tabs[tabId];
          if (!tab) return null;
          
          const isActive = tabId === activeTabId;
          
          return (
            <div
              key={tabId}
              className={`px-4 flex items-center space-x-2 w-[160px] h-[40px] cursor-pointer ${
                isActive 
                  ? 'text-white bg-neutral-800 border-t-2 border-t-blue-500' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
              onClick={() => activateTab(tabId, panelId)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center overflow-hidden">
                  {tab.icon && (
                    <span className="mr-2 flex-shrink-0 text-blue-400">
                      {tab.icon}
                    </span>
                  )}
                  <span className="truncate">{tab.title}</span>
                </div>
                
                {tab.closeable && (
                  <div
                    className="ml-2 text-neutral-500 hover:text-white p-1 rounded-sm hover:bg-neutral-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tabId);
                    }}
                  >
                    <X size={14} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <button
          className="px-3 h-[40px] flex items-center text-neutral-400 hover:text-white hover:bg-neutral-800/50"
          onClick={onAddTab}
        >
          <Plus size={16} />
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          className="px-3 h-[40px] flex items-center text-neutral-400 hover:text-white hover:bg-neutral-800/50"
          onClick={isMaximized ? onRestore : onMaximize}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
      
      <div className="flex-grow overflow-auto p-0 thin-scrollbar">
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