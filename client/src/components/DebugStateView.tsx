import React, { useState } from 'react';
import { useTabContext } from '../context/TabContext';

/**
 * DebugStateView is a helper component for visualizing TabContext state
 * This is useful for debugging issues with tabs and panels
 */
export function DebugStateView() {
  const { state } = useTabContext();
  const [expanded, setExpanded] = useState(false);
  
  if (!expanded) {
    return (
      <div className="fixed bottom-2 left-2 bg-gray-800 bg-opacity-90 text-white p-2 rounded z-50 text-xs">
        <button 
          onClick={() => setExpanded(true)}
          className="font-mono"
        >
          Show Panel State Debugger
        </button>
      </div>
    )
  }
  
  // Count the number of panels and tabs
  const panelCount = Object.keys(state.panels).length;
  const tabCount = Object.keys(state.tabs).length;
  
  return (
    <div className="fixed bottom-2 left-2 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg z-50 max-w-3xl max-h-[80vh] overflow-auto text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">TabContext State Debugger</h3>
        <button 
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-400 hover:text-white"
        >
          [close]
        </button>
      </div>
      
      <div className="mb-3 text-green-300">
        Panels: {panelCount} | Tabs: {tabCount} | Active Tab: {state.activeTabId || 'none'} | Active Panel: {state.activePanelId || 'none'}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-bold mb-1 border-b border-gray-700 pb-1">Panels</h4>
          <div className="space-y-2">
            {Object.entries(state.panels).map(([id, panel]) => (
              <div 
                key={id} 
                className={`p-2 rounded ${id === state.activePanelId ? 'bg-blue-900' : 'bg-gray-700'}`}
              >
                <div className="font-mono text-yellow-300 break-all">{id}</div>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <div>Type: {panel.type}</div>
                  <div>Tabs: {panel.tabs.length}</div>
                  <div>Active: {panel.activeTabId?.substring(0, 4) || 'none'}</div>
                </div>
                {panel.childPanels && panel.childPanels.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs text-purple-300">Child Panels:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {panel.childPanels.map(childId => (
                        <div key={childId} className="bg-gray-800 px-1 rounded text-purple-200">
                          {childId.substring(0, 8)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {panel.tabs.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs text-green-300">Tabs:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {panel.tabs.map(tabId => (
                        <div 
                          key={tabId} 
                          className={`px-1 rounded ${tabId === panel.activeTabId ? 'bg-green-700' : 'bg-gray-800'} text-green-200`}
                        >
                          {tabId.substring(0, 6)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-bold mb-1 border-b border-gray-700 pb-1">Tabs</h4>
          <div className="space-y-2">
            {Object.entries(state.tabs).map(([id, tab]) => (
              <div 
                key={id} 
                className={`p-2 rounded ${id === state.activeTabId ? 'bg-green-900' : 'bg-gray-700'}`}
              >
                <div className="font-mono text-yellow-300 break-all">{id}</div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div>Title: {tab.title}</div>
                  <div>Component: {tab.componentId}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}