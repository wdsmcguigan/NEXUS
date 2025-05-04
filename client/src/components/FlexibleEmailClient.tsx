import React, { useEffect } from 'react';
import { TabProvider, useTabContext } from '../context/TabContext';
import { PanelManager } from './PanelManager';
import { ensureRegistryInitialized } from '../registry/ComponentRegistry.js';

// Make sure components are registered
ensureRegistryInitialized();

interface FlexibleEmailClientProps {
  // Add any props needed for the email client
}

// Define layout action functions without hooks
const createDefaultLayout = (resetLayout: Function, addPanel: Function, openTab: Function) => {
  resetLayout();
  
  const leftPanelId = addPanel('root', 'horizontal', 20);
  const centerPanelId = addPanel('root', 'horizontal', 60);
  const rightPanelId = addPanel('root', 'horizontal', 20);
  
  // Split the center panel horizontally
  const bottomPanelId = addPanel(centerPanelId, 'vertical', 30);
  
  openTab('leftSidebar', leftPanelId);
  openTab('emailList', centerPanelId);
  openTab('rightSidebar', rightPanelId);
  openTab('integrations', bottomPanelId);
};

const createCompactLayout = (resetLayout: Function, addPanel: Function, openTab: Function) => {
  resetLayout();
  
  const leftPanelId = addPanel('root', 'horizontal', 15);
  const rightPanelId = addPanel('root', 'horizontal', 85);
  
  openTab('leftSidebar', leftPanelId);
  openTab('emailList', rightPanelId);
};

const createFocusLayout = (resetLayout: Function, addPanel: Function, openTab: Function) => {
  resetLayout();
  
  const centerPanelId = addPanel('root', 'horizontal', 100);
  const bottomPanelId = addPanel(centerPanelId, 'vertical', 30);
  
  openTab('emailList', centerPanelId);
  openTab('integrations', bottomPanelId);
};

const createProductivityLayout = (resetLayout: Function, addPanel: Function, openTab: Function) => {
  resetLayout();
  
  const leftPanelId = addPanel('root', 'horizontal', 15);
  const centerPanelId = addPanel('root', 'horizontal', 45);
  const rightPanelId = addPanel('root', 'horizontal', 40);
  const bottomPanelId = addPanel(rightPanelId, 'vertical', 50);
  
  openTab('leftSidebar', leftPanelId);
  openTab('emailList', centerPanelId);
  openTab('templates', rightPanelId);
  openTab('settings', bottomPanelId);
};

// Component that sets up the initial layout
function EmailClientContent() {
  const { state, resetLayout, addPanel, openTab } = useTabContext();
  
  // Initialize the layout once on component mount
  useEffect(() => {
    // Check if we already have panels set up
    if (Object.keys(state.panels).length <= 1 && state.panels.root?.tabs?.length === 0) {
      createDefaultLayout(resetLayout, addPanel, openTab);
    }
  }, [state.panels, resetLayout, addPanel, openTab]);
  
  // Function to reset to default layout
  const handleResetLayout = () => {
    createDefaultLayout(resetLayout, addPanel, openTab);
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

// Component for applying a layout preset
export function LayoutPresetApplier({ presetName }: { presetName: string }) {
  const { resetLayout, addPanel, openTab } = useTabContext();
  
  useEffect(() => {
    switch(presetName) {
      case 'Default':
        createDefaultLayout(resetLayout, addPanel, openTab);
        break;
      case 'Compact':
        createCompactLayout(resetLayout, addPanel, openTab);
        break;
      case 'Focus':
        createFocusLayout(resetLayout, addPanel, openTab);
        break;
      case 'Productivity':
        createProductivityLayout(resetLayout, addPanel, openTab);
        break;
      default:
        // Default to standard layout
        createDefaultLayout(resetLayout, addPanel, openTab);
    }
  }, [presetName, resetLayout, addPanel, openTab]);
  
  return null; // This component doesn't render anything
}

// Example layout presets that could be added to the app
export const layoutPresets: LayoutPreset[] = [
  {
    name: 'Default',
    description: 'Standard email client layout with sidebar, email list, and details panel',
    createLayout: function() {
      // This will be implemented by the LayoutPresetApplier component
      console.log('Applying Default layout');
    }
  },
  {
    name: 'Compact',
    description: 'Space-efficient layout with minimized panels',
    createLayout: function() {
      // This will be implemented by the LayoutPresetApplier component
      console.log('Applying Compact layout');
    }
  },
  {
    name: 'Focus',
    description: 'Distraction-free layout focused on email content',
    createLayout: function() {
      // This will be implemented by the LayoutPresetApplier component
      console.log('Applying Focus layout');
    }
  },
  {
    name: 'Productivity',
    description: 'Layout optimized for managing tasks and emails together',
    createLayout: function() {
      // This will be implemented by the LayoutPresetApplier component
      console.log('Applying Productivity layout');
    }
  }
];