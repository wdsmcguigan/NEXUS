import React, { useEffect } from 'react';
import { TabProvider, useTabContext } from '../context/TabContext';
import { PanelManager, createDefaultLayout } from './PanelManager';
import { componentRegistry, ensureRegistryInitialized } from '../registry/ComponentRegistry.js';

// Make sure components are registered
ensureRegistryInitialized();

interface FlexibleEmailClientProps {
  // Add any props needed for the email client
}

// Component that sets up the initial layout
function EmailClientContent() {
  const { state, resetLayout, openTab } = useTabContext();
  
  // Initialize the layout once on component mount
  useEffect(() => {
    // Check if we already have panels set up
    if (Object.keys(state.panels).length <= 1 && state.panels.root?.tabs?.length === 0) {
      initializeDefaultLayout();
    }
  }, []);
  
  // Function to set up a default layout
  const initializeDefaultLayout = () => {
    // Create a 2x2 grid layout
    const { addPanel } = useTabContext();
    
    // Create side panels
    const leftPanelId = addPanel('root', 'horizontal', 20);
    const centerPanelId = addPanel('root', 'horizontal', 60);
    const rightPanelId = addPanel('root', 'horizontal', 20);
    
    // Split the center panel horizontally
    const bottomPanelId = addPanel(centerPanelId, 'vertical', 30);
    
    // Open default tabs
    openTab('leftSidebar', leftPanelId);
    openTab('emailList', centerPanelId);
    openTab('rightSidebar', rightPanelId);
    openTab('integrations', bottomPanelId);
  };
  
  // Function to reset to default layout
  const handleResetLayout = () => {
    resetLayout();
    initializeDefaultLayout();
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center bg-neutral-900 p-2 border-b border-neutral-800">
        <h1 className="text-lg font-bold text-white">NEXUS.email</h1>
        <div className="flex-grow"></div>
        <button
          className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded"
          onClick={handleResetLayout}
        >
          Reset Layout
        </button>
      </div>
      
      <div className="flex-grow overflow-hidden">
        <PanelManager initialPanelId="root" />
      </div>
    </div>
  );
}

// Main component that wraps everything with the TabProvider
export function FlexibleEmailClient(props: FlexibleEmailClientProps) {
  return (
    <TabProvider>
      <EmailClientContent {...props} />
    </TabProvider>
  );
}

// Interface for layout preset
interface LayoutPreset {
  name: string;
  description: string;
  createLayout: () => void;
}

// Example layout presets that could be added to the app
export const layoutPresets: LayoutPreset[] = [
  {
    name: 'Default',
    description: 'Standard email client layout with sidebar, email list, and details panel',
    createLayout: () => {
      const { resetLayout, addPanel, openTab } = useTabContext();
      
      resetLayout();
      
      const leftPanelId = addPanel('root', 'horizontal', 20);
      const centerPanelId = addPanel('root', 'horizontal', 60);
      const rightPanelId = addPanel('root', 'horizontal', 20);
      
      openTab('leftSidebar', leftPanelId);
      openTab('emailList', centerPanelId);
      openTab('rightSidebar', rightPanelId);
    }
  },
  {
    name: 'Compact',
    description: 'Space-efficient layout with minimized panels',
    createLayout: () => {
      const { resetLayout, addPanel, openTab } = useTabContext();
      
      resetLayout();
      
      const leftPanelId = addPanel('root', 'horizontal', 15);
      const rightPanelId = addPanel('root', 'horizontal', 85);
      
      openTab('leftSidebar', leftPanelId);
      openTab('emailList', rightPanelId);
    }
  },
  {
    name: 'Focus',
    description: 'Distraction-free layout focused on email content',
    createLayout: () => {
      const { resetLayout, addPanel, openTab } = useTabContext();
      
      resetLayout();
      
      const centerPanelId = addPanel('root', 'horizontal', 100);
      const bottomPanelId = addPanel(centerPanelId, 'vertical', 30);
      
      openTab('emailList', centerPanelId);
      openTab('integrations', bottomPanelId);
    }
  },
  {
    name: 'Productivity',
    description: 'Layout optimized for managing tasks and emails together',
    createLayout: () => {
      const { resetLayout, addPanel, openTab } = useTabContext();
      
      resetLayout();
      
      const leftPanelId = addPanel('root', 'horizontal', 15);
      const centerPanelId = addPanel('root', 'horizontal', 45);
      const rightPanelId = addPanel('root', 'horizontal', 40);
      const bottomPanelId = addPanel(rightPanelId, 'vertical', 50);
      
      openTab('leftSidebar', leftPanelId);
      openTab('emailList', centerPanelId);
      openTab('templates', rightPanelId);
      openTab('settings', bottomPanelId);
    }
  },
];