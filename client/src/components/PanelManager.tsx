import React, { useCallback, useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { useTabContext, Panel as PanelType } from '../context/TabContext';
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
    <div className="h-full w-full">
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
  const { state } = useTabContext();
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);

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