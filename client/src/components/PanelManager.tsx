import React, { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useTabContext, TabPanel as TabPanelType } from '../context/TabContext';
import { UniversalTabPanel, NewTabDialog } from './UniversalTabPanel';
import { componentRegistry, ensureRegistryInitialized } from '../registry/ComponentRegistry.js';

// Ensure component registry is initialized
ensureRegistryInitialized();

interface PanelLayoutProps {
  panelId: string;
  maximizedPanelId?: string;
  onMaximizePanel: (panelId: string) => void;
  onRestorePanel: () => void;
}

// Recursive component to render panels and their children
function PanelLayout({ 
  panelId, 
  maximizedPanelId,
  onMaximizePanel,
  onRestorePanel
}: PanelLayoutProps) {
  const { state, openTab } = useTabContext();
  const panel = state.panels[panelId];
  const [showNewTabDialog, setShowNewTabDialog] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  
  if (!panel) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        <p>Panel not found: {panelId}</p>
      </div>
    );
  }

  const handleDragStart = (tabId: string, e: React.DragEvent) => {
    setDraggedTabId(tabId);
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a drag image (optional)
    const tab = state.tabs[tabId];
    if (tab) {
      const dragImage = document.createElement('div');
      dragImage.textContent = tab.title;
      dragImage.className = 'bg-neutral-800 text-white px-3 py-2 rounded shadow';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 10, 10);
      
      // Remove the element after drag is complete
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tabId = e.dataTransfer.getData('text/plain');
    
    if (tabId && state.tabs[tabId]) {
      const { moveTab } = useTabContext();
      moveTab(tabId, panelId);
    }
    
    setDraggedTabId(null);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleTabAdd = () => {
    setShowNewTabDialog(true);
  };
  
  const handleComponentSelect = (componentId: string) => {
    openTab(componentId, panelId);
  };
  
  // If this panel is not the maximized one and there is a maximized panel, hide it
  if (maximizedPanelId && panelId !== maximizedPanelId) {
    return null;
  }
  
  // If this panel has children, render them recursively
  if (panel.children && panel.children.length > 0) {
    const direction = panel.direction || 'horizontal';
    
    return (
      <div 
        className={`h-full flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} overflow-hidden`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {panel.children.map((childId, index) => (
          <div 
            key={childId}
            className="flex-grow overflow-hidden"
            style={{ 
              flexBasis: `${state.panels[childId]?.size || 100 / panel.children!.length}%`,
              minWidth: direction === 'horizontal' ? '150px' : undefined,
              minHeight: direction === 'vertical' ? '150px' : undefined
            }}
          >
            <PanelLayout 
              panelId={childId}
              maximizedPanelId={maximizedPanelId}
              onMaximizePanel={onMaximizePanel}
              onRestorePanel={onRestorePanel}
            />
            
            {/* Add resizer between panels (except after the last one) */}
            {index < panel.children.length - 1 && (
              <div 
                className={`
                  ${direction === 'horizontal' ? 'cursor-col-resize w-1 hover:w-2 -mx-0.5 bg-transparent hover:bg-blue-500/50' : 
                                                'cursor-row-resize h-1 hover:h-2 -my-0.5 bg-transparent hover:bg-blue-500/50'}
                  flex-shrink-0 z-10
                `}
                // Add resize logic here
              />
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // Otherwise, render the tab panel
  return (
    <div 
      className="h-full overflow-hidden relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <UniversalTabPanel
        panelId={panelId}
        onTabAdd={handleTabAdd}
        onDragStart={handleDragStart}
        onMaximize={() => onMaximizePanel(panelId)}
        onRestore={onRestorePanel}
        isMaximized={maximizedPanelId === panelId}
      />
      
      {showNewTabDialog && (
        <NewTabDialog 
          onSelect={handleComponentSelect}
          onClose={() => setShowNewTabDialog(false)}
        />
      )}
    </div>
  );
}

interface PanelManagerProps {
  initialPanelId?: string;
}

// Main component to manage all panels
export function PanelManager({ initialPanelId = 'root' }: PanelManagerProps) {
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | undefined>();
  
  const handleMaximizePanel = (panelId: string) => {
    setMaximizedPanelId(panelId);
  };
  
  const handleRestorePanel = () => {
    setMaximizedPanelId(undefined);
  };
  
  return (
    <div className="h-full overflow-hidden bg-neutral-950">
      <PanelLayout 
        panelId={initialPanelId}
        maximizedPanelId={maximizedPanelId}
        onMaximizePanel={handleMaximizePanel}
        onRestorePanel={handleRestorePanel}
      />
    </div>
  );
}

// Example usage for creating a default layout
export function createDefaultLayout() {
  const { state, addPanel, openTab } = useTabContext();
  
  // Create a 3-panel layout: sidebar, main content, details
  const leftPanelId = addPanel('root', 'horizontal', 20);
  const mainPanelId = addPanel('root', 'horizontal', 60);
  const rightPanelId = addPanel('root', 'horizontal', 20);
  
  // Split the main panel into a top and bottom section
  const bottomPanelId = addPanel(mainPanelId, 'vertical', 30);
  
  // Open default tabs in each panel
  openTab('leftSidebar', leftPanelId);
  openTab('emailList', mainPanelId);
  openTab('rightSidebar', rightPanelId);
  openTab('integrations', bottomPanelId);
  
  return state;
}

// Example usage for creating an email view layout
export function createEmailViewLayout(emailId: string) {
  const { state, addPanel, openTab } = useTabContext();
  
  // Create a 3-panel layout: sidebar, email content, details
  const leftPanelId = addPanel('root', 'horizontal', 20);
  const mainPanelId = addPanel('root', 'horizontal', 60);
  const rightPanelId = addPanel('root', 'horizontal', 20);
  
  // Open email-specific tabs
  openTab('leftSidebar', leftPanelId);
  openTab('emailDetail', mainPanelId, { emailId });
  openTab('rightSidebar', rightPanelId, { contactId: 123 }); // Assuming this comes from the email
  
  return state;
}