import React, { useState, useEffect } from 'react';
import { AdvancedTabBar } from './AdvancedTabBar';
import { DragOverlay } from './DragOverlay';
import { useDragContext } from '../context/DragContext';
import { DropTarget } from '../context/TabContext';
import { Mail, FileText, User, Settings } from 'lucide-react';

// Simple panel component for testing
interface Panel {
  id: string;
  tabs: any[];
  activeTabId: string;
}

export function TabDragTestComponent() {
  // Mock panels for testing
  const [panels, setPanels] = useState<Panel[]>([
    {
      id: 'panel-left',
      tabs: [
        { id: 'tab-1', title: 'Email', icon: <Mail className="w-4 h-4 text-blue-400" />, closeable: true },
        { id: 'tab-2', title: 'Documents', icon: <FileText className="w-4 h-4 text-green-400" />, closeable: true },
      ],
      activeTabId: 'tab-1'
    },
    {
      id: 'panel-right',
      tabs: [
        { id: 'tab-3', title: 'Contacts', icon: <User className="w-4 h-4 text-purple-400" />, closeable: true },
        { id: 'tab-4', title: 'Settings', icon: <Settings className="w-4 h-4 text-gray-400" />, closeable: true },
      ],
      activeTabId: 'tab-3'
    }
  ]);

  const dragContext = useDragContext();

  // Log current drag state for debugging
  useEffect(() => {
    if (dragContext.dragState.isDragging) {
      console.log('Current drag state:', {
        tabId: dragContext.dragState.draggedTabId,
        panelId: dragContext.dragState.sourcePanelId,
        dropTarget: dragContext.dragState.dropIndicator
      });
    }
  }, [dragContext.dragState]);

  // Handle clicking a tab
  const handleTabClick = (panelId: string, tabId: string) => {
    setPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === panelId ? { ...panel, activeTabId: tabId } : panel
      )
    );
  };

  // Handle closing a tab
  const handleTabClose = (panelId: string, tabId: string) => {
    setPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === panelId 
          ? { 
              ...panel, 
              tabs: panel.tabs.filter(tab => tab.id !== tabId),
              activeTabId: panel.activeTabId === tabId 
                ? (panel.tabs.length > 1 ? panel.tabs.find(t => t.id !== tabId)?.id : '') 
                : panel.activeTabId
            } 
          : panel
      )
    );
  };

  // Handle adding a new tab
  const handleAddTab = (panelId: string) => {
    const newTabId = `tab-${Date.now()}`;
    setPanels(prevPanels => 
      prevPanels.map(panel => 
        panel.id === panelId 
          ? { 
              ...panel, 
              tabs: [...panel.tabs, { id: newTabId, title: 'New Tab', closeable: true }],
              activeTabId: newTabId
            } 
          : panel
      )
    );
  };

  // We'll handle tab drop via drag context directly
  useEffect(() => {
    const handleDragEnd = () => {
      if (!dragContext.dragState.isDragging) return;
      
      const { draggedTabId, sourcePanelId, dropIndicator } = dragContext.dragState;
      
      if (
        draggedTabId && 
        sourcePanelId && 
        dropIndicator.visible && 
        dropIndicator.targetPanelId && 
        sourcePanelId !== dropIndicator.targetPanelId
      ) {
        console.log(`Dropping tab ${draggedTabId} from panel ${sourcePanelId} to panel ${dropIndicator.targetPanelId}`);
        
        // Find the tab in the source panel
        const sourcePanel = panels.find(p => p.id === sourcePanelId);
        if (!sourcePanel) return;
        
        const tab = sourcePanel.tabs.find(t => t.id === draggedTabId);
        if (!tab) return;
        
        // Remove tab from source panel and add to target panel
        setPanels(prevPanels => 
          prevPanels.map(panel => {
            if (panel.id === sourcePanelId) {
              return {
                ...panel,
                tabs: panel.tabs.filter(t => t.id !== draggedTabId),
                activeTabId: panel.activeTabId === draggedTabId 
                  ? (panel.tabs.length > 1 ? panel.tabs.find(t => t.id !== draggedTabId)?.id || '' : '') 
                  : panel.activeTabId
              };
            }
            
            // Add tab to target panel
            if (panel.id === dropIndicator.targetPanelId) {
              return {
                ...panel,
                tabs: [...panel.tabs, tab],
                activeTabId: tab.id
              };
            }
            
            return panel;
          })
        );
      }
    };
    
    if (!dragContext.dragState.isDragging) {
      handleDragEnd();
    }
  }, [dragContext.dragState.isDragging, dragContext.dragState, panels]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 text-center">
        <h1 className="text-xl font-bold">Tab Drag and Drop Test</h1>
        <p className="text-sm text-gray-400">Try dragging tabs between panels</p>
      </div>
      
      <div className="flex flex-1">
        {panels.map(panel => (
          <div key={panel.id} className="flex-1 border-r border-gray-700 flex flex-col">
            <AdvancedTabBar 
              tabs={panel.tabs}
              activeTabId={panel.activeTabId}
              panelId={panel.id}
              onTabClick={(tabId) => handleTabClick(panel.id, tabId)}
              onTabClose={(tabId) => handleTabClose(panel.id, tabId)}
              onAddTab={() => handleAddTab(panel.id)}
              onViewToggle={() => console.log('Toggle view')}
              isMaximized={false}
            />
            <div className="flex-1 p-4">
              <div className="bg-gray-800 p-4 rounded-md h-full flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">
                    Panel: {panel.id}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Active Tab: {panel.activeTabId}
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    {panel.tabs.length} tabs in this panel
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Drag overlay */}
      <DragOverlay />
      
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-center space-x-4">
          <button 
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            onClick={() => console.log('Current panels state:', panels)}
          >
            Log Panels State
          </button>
          <button 
            className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500" 
            onClick={() => console.log('Current drag context:', dragContext.dragState)}
          >
            Log Drag State
          </button>
        </div>
      </div>
    </div>
  );
}