import React, { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelConfig, TabConfig, useLayout } from '../context/LayoutContext';
import { TabContainer } from './TabContainer';

interface PanelContainerProps {
  layout: PanelConfig;
  onMaximizePanel?: (panelId: string) => void;
  onRestorePanel?: () => void;
  maximizedPanelId?: string;
}

export function PanelContainer({
  layout,
  onMaximizePanel,
  onRestorePanel,
  maximizedPanelId
}: PanelContainerProps) {
  const { setActiveTab, closeTab, addTab, moveTab, updateLayout } = useLayout();
  const [dragState, setDragState] = useState<{
    tabId: string;
    panelId: string;
  } | null>(null);

  // Handle tab drag start
  const handleTabDragStart = useCallback((tabId: string, panelId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('application/nexus-tab', JSON.stringify({ tabId, panelId }));
    setDragState({ tabId, panelId });
  }, []);

  // Handle drop on a panel
  const handleDrop = useCallback((e: React.DragEvent, targetPanelId: string) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/nexus-tab');
      if (!data) return;
      
      const { tabId, panelId } = JSON.parse(data);
      if (panelId === targetPanelId) return;
      
      // Move tab to the target panel
      moveTab(tabId, panelId, targetPanelId);
    } catch (err) {
      console.error('Error handling tab drop:', err);
    } finally {
      setDragState(null);
    }
  }, [moveTab]);

  // Handle panel layout change
  const handlePanelResize = useCallback((panelId: string, sizes: number[]) => {
    // Update panel sizes in the layout
    const updatePanelSizes = (panel: PanelConfig, sizes: number[]): PanelConfig => {
      if (panel.id === panelId && panel.children) {
        return {
          ...panel,
          children: panel.children.map((child, index) => ({
            ...child,
            defaultSize: sizes[index]
          }))
        };
      }
      
      if (panel.children) {
        return {
          ...panel,
          children: panel.children.map(child => updatePanelSizes(child, sizes))
        };
      }
      
      return panel;
    };
    
    const newLayout = updatePanelSizes(layout, sizes);
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // Function to create a new tab
  const handleAddTab = useCallback((panelId: string) => {
    const newTab: TabConfig = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      contentType: 'empty',
      closeable: true
    };
    
    addTab(newTab, panelId);
  }, [addTab]);

  // Recursive function to render the panel structure
  const renderPanel = useCallback((panelConfig: PanelConfig, depth = 0): JSX.Element => {
    const isMaximized = maximizedPanelId === panelConfig.id;
    
    // If this panel has children, render them as a nested PanelGroup
    if (panelConfig.children && panelConfig.children.length > 0) {
      return (
        <Panel 
          key={panelConfig.id} 
          id={panelConfig.id} 
          minSize={panelConfig.minSize || 10} 
          defaultSize={panelConfig.defaultSize}
        >
          <PanelGroup 
            direction={panelConfig.direction || 'horizontal'} 
            onLayout={(sizes) => handlePanelResize(panelConfig.id, sizes)}
          >
            {panelConfig.children.map((child, i) => (
              <React.Fragment key={child.id}>
                {renderPanel(child, depth + 1)}
                {i < panelConfig.children!.length - 1 && (
                  <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary cursor-col-resize" />
                )}
              </React.Fragment>
            ))}
          </PanelGroup>
        </Panel>
      );
    }
    
    // Otherwise, render a panel with tabs
    return (
      <Panel 
        key={panelConfig.id} 
        id={panelConfig.id} 
        minSize={panelConfig.minSize || 10} 
        defaultSize={panelConfig.defaultSize}
      >
        <div 
          className="h-full" 
          onDrop={(e) => handleDrop(e, panelConfig.id)}
          onDragOver={(e) => e.preventDefault()}
        >
          <TabContainer 
            panelId={panelConfig.id}
            tabs={panelConfig.tabs} 
            activeTabId={panelConfig.activeTabId}
            onTabChange={(tabId) => setActiveTab(tabId, panelConfig.id)}
            onTabClose={(tabId) => closeTab(tabId, panelConfig.id)}
            onTabAdd={() => handleAddTab(panelConfig.id)}
            onDragStart={handleTabDragStart}
            onMaximizePanel={onMaximizePanel ? () => onMaximizePanel(panelConfig.id) : undefined}
            onRestorePanel={onRestorePanel}
            isMaximized={isMaximized}
          />
        </div>
      </Panel>
    );
  }, [
    closeTab, 
    handleAddTab, 
    handleDrop, 
    handlePanelResize, 
    handleTabDragStart, 
    maximizedPanelId, 
    onMaximizePanel, 
    onRestorePanel, 
    setActiveTab
  ]);

  return (
    <PanelGroup direction={layout.direction || 'horizontal'}>
      {renderPanel(layout)}
    </PanelGroup>
  );
}