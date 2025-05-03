import React, { useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TabPanel, TabPanelContent } from './TabPanel';
import { Tab } from './TabBar';
import { nanoid } from 'nanoid';
import { PanelConfig, usePanelContext } from '../context/PanelContext';

interface PanelContainerProps {
  layout: PanelConfig;
  onMaximizePanel?: (panelId: string) => void;
  onRestorePanel?: () => void;
  maximizedPanelId?: string | null;
}

export function PanelContainer({
  layout,
  onMaximizePanel,
  onRestorePanel,
  maximizedPanelId
}: PanelContainerProps) {
  const { 
    changeTab, 
    removeTab, 
    addTab, 
    moveTab,
    updateLayout
  } = usePanelContext();
  
  // Function to update panel sizes within a split
  const updatePanelSizes = useCallback((panelConfig: PanelConfig, sizes: number[]): PanelConfig => {
    if (panelConfig.type !== 'split' || !panelConfig.children) return panelConfig;
    
    return {
      ...panelConfig,
      children: panelConfig.children.map((child, i) => ({
        ...child,
        size: sizes[i]
      }))
    };
  }, []);
  
  // Handle panel resize
  const handlePanelResize = useCallback((parentId: string, sizes: number[]) => {
    updateLayout((prevLayout: PanelConfig) => {
      // Find the parent panel and update its children's sizes
      const updateSizes = (layout: PanelConfig): PanelConfig => {
        if (layout.id === parentId) {
          return updatePanelSizes(layout, sizes);
        }
        
        if (layout.children) {
          return {
            ...layout,
            children: layout.children.map(child => updateSizes(child))
          };
        }
        
        return layout;
      };
      
      return updateSizes(prevLayout);
    });
  }, [updateLayout, updatePanelSizes]);
  
  // Handle adding a new tab to a panel
  const handleTabAdd = useCallback((panelId: string, contentType: string) => {
    const newTabId = `tab-${nanoid(8)}`;
    
    const newTab: Tab = {
      id: newTabId,
      title: `New ${contentType}`,
      closeable: true
    };
    
    const newTabContent: TabPanelContent = {
      id: newTabId,
      type: contentType
    };
    
    addTab(panelId, newTab, newTabContent);
  }, [addTab]);
  
  // Handle drag operations
  const handleTabDragStart = useCallback((tabId: string, panelId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      panelId, 
      tabId 
    }));
  }, []);
  
  // Handle drop operations
  const handleTabDrop = useCallback((targetPanelId: string, e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      const { panelId: sourcePanelId, tabId } = JSON.parse(data);
      
      if (sourcePanelId === targetPanelId) return;
      
      moveTab(sourcePanelId, tabId, targetPanelId);
    } catch (err) {
      console.error('Error handling tab drop:', err);
    }
  }, [moveTab]);
  
  // Render a panel element
  const renderPanel = useCallback((panelConfig: PanelConfig, depth = 0): JSX.Element => {
    // Determine if this panel should be visible based on maximized state
    const isHidden = maximizedPanelId !== null && maximizedPanelId !== panelConfig.id && 
                    maximizedPanelId ? !panelConfig.id.includes(maximizedPanelId) : false;
    
    // If this is a regular panel (not a split)
    if (panelConfig.type === 'panel') {
      return (
        <Panel 
          key={panelConfig.id}
          id={panelConfig.id}
          defaultSize={panelConfig.size || 100}
          minSize={panelConfig.minSize || 10}
          style={{ 
            display: isHidden ? 'none' : 'flex',
            flexDirection: 'column'
          }}
          data-panel-drop-zone
          data-panel-id={panelConfig.id}
        >
          <TabPanel
            tabs={panelConfig.tabs || []}
            contents={panelConfig.contents || []}
            activeTabId={panelConfig.activeTabId || ''}
            panelId={panelConfig.id}
            onTabChange={(tabId) => changeTab(panelConfig.id, tabId)}
            onTabClose={(tabId) => removeTab(panelConfig.id, tabId)}
            onTabAdd={() => {
              const contentType = panelConfig.id.includes('email-list') 
                ? 'emailList' 
                : panelConfig.id.includes('email-detail')
                  ? 'emailDetail'
                  : panelConfig.id.includes('sidebar')
                    ? 'leftSidebar'
                    : 'integrations';
                    
              handleTabAdd(panelConfig.id, contentType);
            }}
            onDragStart={(tabId, e) => handleTabDragStart(tabId, panelConfig.id, e)}
            onDrop={(e) => handleTabDrop(panelConfig.id, e)}
            onMaximize={onMaximizePanel ? () => onMaximizePanel(panelConfig.id) : undefined}
            onRestore={onRestorePanel}
            isMaximized={maximizedPanelId === panelConfig.id}
          />
        </Panel>
      );
    }
    
    // If this is a split container
    if (panelConfig.type === 'split' && panelConfig.children) {
      const isMaximized = maximizedPanelId && 
                         panelConfig.children.some(child => 
                           child.id === maximizedPanelId || 
                           (child.type === 'split' && child.id.includes(maximizedPanelId))
                         );
      
      return (
        <Panel
          key={panelConfig.id}
          id={panelConfig.id}
          defaultSize={panelConfig.size || 100}
          style={{ 
            display: maximizedPanelId !== null && !isMaximized && 
              (maximizedPanelId ? !panelConfig.id.includes(maximizedPanelId) : false)
              ? 'none' 
              : 'flex' 
          }}
        >
          <PanelGroup
            direction={panelConfig.direction || 'horizontal'}
            id={`group-${panelConfig.id || 'unknown'}`}
            onLayout={(sizes) => handlePanelResize(panelConfig.id, sizes)}
          >
            {panelConfig.children.flatMap((childPanel, index) => {
              const elements = [];
              
              if (index > 0) {
                elements.push(
                  <PanelResizeHandle 
                    key={`handle-${childPanel.id}`}
                    className={
                      panelConfig.direction === 'horizontal'
                        ? 'w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary'
                        : 'h-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary'
                    }
                  />
                );
              }
              
              elements.push(renderPanel(childPanel, depth + 1));
              return elements;
            })}
          </PanelGroup>
        </Panel>
      );
    }
    
    // Fallback for invalid configuration
    return (
      <Panel key={panelConfig.id || 'unknown'} id={panelConfig.id || 'unknown'}>
        <div className="p-4 text-red-500">Invalid panel configuration</div>
      </Panel>
    );
  }, [
    maximizedPanelId, 
    changeTab, 
    removeTab, 
    handleTabAdd, 
    handleTabDragStart, 
    handleTabDrop, 
    onMaximizePanel, 
    onRestorePanel,
    handlePanelResize
  ]);
  
  // Wrap the top-level Panel in a PanelGroup to avoid the "Panel components must be rendered within a PanelGroup container" error
  return (
    <PanelGroup direction="horizontal">
      {renderPanel(layout)}
    </PanelGroup>
  );
}