import React, { useCallback, useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { useTabContext, Panel as PanelType, PanelType as TPanelType } from '../context/TabContext';
import { UniversalTabPanel } from './UniversalTabPanel';
import { ComponentSelector } from './ComponentSelector';

interface PanelLayoutProps {
  panelId: string;
  maximizedPanelId: string | null;
  onMaximizePanel: (panelId: string) => void;
  onRestorePanel: () => void;
}

// Recursive component for rendering panels (supports nested panels)
function PanelLayout({ panelId, maximizedPanelId, onMaximizePanel, onRestorePanel }: PanelLayoutProps) {
  const { state, addTab } = useTabContext();
  const panel = state.panels[panelId];
  const [showComponentSelector, setShowComponentSelector] = useState(false);

  const handleAddTab = useCallback(() => {
    setShowComponentSelector(true);
  }, []);

  const handleSelectComponent = useCallback((componentId: string) => {
    addTab(componentId, panelId);
    setShowComponentSelector(false);
  }, [addTab, panelId]);

  if (!panel) {
    return <div>Panel not found: {panelId}</div>;
  }

  // For panels with children (split panels)
  if (panel.direction) {
    const childPanels = Object.values(state.panels).filter(
      p => p.parentId === panelId
    );

    if (childPanels.length === 0) {
      return <div>No child panels found for split panel {panelId}</div>;
    }

    return (
      <div className="h-full w-full">
        <ResizablePanelGroup
          direction={panel.direction}
          className="h-full w-full"
        >
          {childPanels.map((childPanel, index) => (
            <React.Fragment key={childPanel.id}>
              <ResizablePanel defaultSize={childPanel.size || 100 / childPanels.length}>
                <PanelLayout 
                  panelId={childPanel.id} 
                  maximizedPanelId={maximizedPanelId}
                  onMaximizePanel={onMaximizePanel}
                  onRestorePanel={onRestorePanel}
                />
              </ResizablePanel>
              
              {index < childPanels.length - 1 && (
                <ResizableHandle withHandle />
              )}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      </div>
    );
  }

  // For leaf panels (panels with tabs)
  return (
    <div className="h-full w-full" data-panel-id={panelId}>
      <UniversalTabPanel
        panelId={panelId}
        onAddTab={handleAddTab}
        onMaximize={() => onMaximizePanel(panelId)}
        onRestore={onRestorePanel}
        isMaximized={maximizedPanelId === panelId}
      />
      
      {showComponentSelector && (
        <ComponentSelector
          onSelect={handleSelectComponent}
          onCancel={() => setShowComponentSelector(false)}
          panelType={panel.type}
        />
      )}
    </div>
  );
}

export function PanelManager() {
  const { state, addTab } = useTabContext();
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);
  
  // Initialize default tabs for each panel if empty
  useEffect(() => {
    // Check if panels have tabs
    const hasNoTabs = Object.values(state.panels).every(panel => panel.tabs.length === 0);
    
    if (hasNoTabs) {
      // Add default tabs to each panel
      setTimeout(() => {
        // Left sidebar - Folder Explorer
        addTab('folder-explorer', 'leftSidebar');
        
        // We need to manually create the split panels since we don't have direct access to splitPanel
        // First create the child panels
        const leftMainPanel: PanelType = {
          id: 'leftMainPanel',
          parentId: 'mainPanel',
          type: 'main' as TPanelType,
          direction: undefined,
          tabs: [],
          activeTabId: undefined,
          size: 50
        };
        
        const rightMainPanel: PanelType = {
          id: 'rightMainPanel',
          parentId: 'mainPanel',
          type: 'main' as TPanelType,
          direction: undefined,
          tabs: [],
          activeTabId: undefined,
          size: 50
        };
        
        // Then update the parent panel to be a container
        const mainPanel = state.panels['mainPanel'];
        if (mainPanel) {
          mainPanel.direction = 'horizontal';
          mainPanel.tabs = [];
          mainPanel.activeTabId = undefined;
          
          // Add the child panels to the state
          state.panels['leftMainPanel'] = leftMainPanel;
          state.panels['rightMainPanel'] = rightMainPanel;
        }
        addTab('email-list', 'leftMainPanel');
        addTab('email-detail', 'rightMainPanel');
        
        // Bottom panel
        addTab('settings', 'bottomPanel');
        addTab('integrations', 'bottomPanel');
        addTab('templates', 'bottomPanel');
        
        // Right sidebar
        addTab('contact-details', 'rightSidebar');
        addTab('tag-manager', 'rightSidebar');
      }, 100);
    }
  }, [state.panels, addTab]);

  const handleMaximizePanel = useCallback((panelId: string) => {
    setMaximizedPanelId(panelId);
  }, []);

  const handleRestorePanel = useCallback(() => {
    setMaximizedPanelId(null);
  }, []);

  // If a panel is maximized, only show that panel
  if (maximizedPanelId) {
    return (
      <div className="h-full w-full">
        <PanelLayout 
          panelId={maximizedPanelId} 
          maximizedPanelId={maximizedPanelId}
          onMaximizePanel={handleMaximizePanel}
          onRestorePanel={handleRestorePanel}
        />
      </div>
    );
  }

  // Main layout with the four primary panels: main, left sidebar, right sidebar, bottom
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-neutral-900">
          <PanelLayout 
            panelId="leftSidebar" 
            maximizedPanelId={maximizedPanelId}
            onMaximizePanel={handleMaximizePanel}
            onRestorePanel={handleRestorePanel}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Content Area */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Main Content */}
            <ResizablePanel defaultSize={70}>
              <PanelLayout 
                panelId="mainPanel" 
                maximizedPanelId={maximizedPanelId}
                onMaximizePanel={handleMaximizePanel}
                onRestorePanel={handleRestorePanel}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Bottom Panel */}
            <ResizablePanel defaultSize={30} className="bg-neutral-900">
              <PanelLayout 
                panelId="bottomPanel" 
                maximizedPanelId={maximizedPanelId}
                onMaximizePanel={handleMaximizePanel}
                onRestorePanel={handleRestorePanel}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-neutral-900">
          <PanelLayout 
            panelId="rightSidebar" 
            maximizedPanelId={maximizedPanelId}
            onMaximizePanel={handleMaximizePanel}
            onRestorePanel={handleRestorePanel}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default PanelManager;