import React, { createContext, useContext, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Tab } from '../components/TabBar';
import { TabPanelContent } from '../components/TabPanel';

// Define panel direction types
export type PanelDirection = 'horizontal' | 'vertical';

// Define panel configuration type
export interface PanelConfig {
  id: string;
  type: 'panel' | 'split';
  direction?: PanelDirection;
  size?: number;
  minSize?: number;
  children?: PanelConfig[];
  tabs?: Tab[];
  activeTabId?: string;
  contents?: TabPanelContent[];
}

// Define context type
interface PanelContextType {
  layout: PanelConfig;
  updateLayout: (newLayout: PanelConfig | ((prev: PanelConfig) => PanelConfig)) => void;
  maximizedPanelId: string | null;
  maximizePanel: (panelId: string) => void;
  restorePanel: () => void;
  addTab: (panelId: string, tab: Tab, content: TabPanelContent) => void;
  removeTab: (panelId: string, tabId: string) => void;
  changeTab: (panelId: string, tabId: string) => void;
  moveTab: (sourceId: string, sourceTabId: string, targetId: string) => void;
  splitPanel: (panelId: string, direction: PanelDirection, newPanel: PanelConfig) => void;
  findPanel: (layout: PanelConfig, panelId: string) => PanelConfig | null;
  savedLayouts: { name: string; data: PanelConfig }[];
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  currentLayoutName: string | null;
}

// Create context
const PanelContext = createContext<PanelContextType | undefined>(undefined);

// Initial panel layout
const initialLayout: PanelConfig = {
  id: 'root',
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      id: 'left-sidebar',
      type: 'panel',
      size: 20,
      minSize: 15,
      tabs: [
        { id: 'accounts', title: 'Accounts', closeable: false }
      ],
      activeTabId: 'accounts',
      contents: [
        { id: 'accounts', type: 'leftSidebar' }
      ]
    },
    {
      id: 'main-area',
      type: 'split',
      direction: 'vertical',
      size: 60,
      children: [
        {
          id: 'main-content',
          type: 'split',
          direction: 'horizontal',
          size: 70,
          children: [
            {
              id: 'email-list',
              type: 'panel',
              size: 40,
              tabs: [
                { id: 'inbox', title: 'Inbox', closeable: false },
                { id: 'starred', title: 'Starred', closeable: true }
              ],
              activeTabId: 'inbox',
              contents: [
                { id: 'inbox', type: 'emailList', props: { view: 'inbox' } },
                { id: 'starred', type: 'emailList', props: { view: 'starred' } }
              ]
            },
            {
              id: 'email-detail',
              type: 'panel',
              size: 60,
              tabs: [
                { id: 'detail', title: 'Email', closeable: false }
              ],
              activeTabId: 'detail',
              contents: [
                { id: 'detail', type: 'emailDetail' }
              ]
            }
          ]
        },
        {
          id: 'bottom-pane',
          type: 'panel',
          size: 30,
          tabs: [
            { id: 'integrations', title: 'Integrations', closeable: false },
            { id: 'templates', title: 'Templates', closeable: false },
            { id: 'settings', title: 'Settings', closeable: false }
          ],
          activeTabId: 'integrations',
          contents: [
            { id: 'integrations', type: 'integrations' },
            { id: 'templates', type: 'templates' },
            { id: 'settings', type: 'settings' }
          ]
        }
      ]
    },
    {
      id: 'right-sidebar',
      type: 'panel',
      size: 20,
      minSize: 15,
      tabs: [
        { id: 'contact', title: 'Contact', closeable: false }
      ],
      activeTabId: 'contact',
      contents: [
        { id: 'contact', type: 'rightSidebar' }
      ]
    }
  ]
};

// Provider component
export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<PanelConfig>(initialLayout);
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<{ name: string; data: PanelConfig }[]>([]);
  const [currentLayoutName, setCurrentLayoutName] = useState<string | null>(null);

  // Function to find a panel by ID
  const findPanel = useCallback((layout: PanelConfig, panelId: string): PanelConfig | null => {
    if (layout.id === panelId) {
      return layout;
    }

    if (layout.children) {
      for (const child of layout.children) {
        const found = findPanel(child, panelId);
        if (found) return found;
      }
    }

    return null;
  }, []);

  // Function to update a panel in the layout
  const updatePanelInLayout = useCallback((layout: PanelConfig, panelId: string, updater: (panel: PanelConfig) => PanelConfig): PanelConfig => {
    if (layout.id === panelId) {
      return updater(layout);
    }

    if (layout.children) {
      return {
        ...layout,
        children: layout.children.map(child => updatePanelInLayout(child, panelId, updater))
      };
    }

    return layout;
  }, []);

  // Update the entire layout
  const updateLayout = useCallback((newLayout: PanelConfig | ((prev: PanelConfig) => PanelConfig)) => {
    if (typeof newLayout === 'function') {
      setLayout(prevLayout => newLayout(prevLayout));
    } else {
      setLayout(newLayout);
    }
  }, []);

  // Maximize a panel
  const maximizePanel = useCallback((panelId: string) => {
    setMaximizedPanelId(panelId);
  }, []);

  // Restore from maximized state
  const restorePanel = useCallback(() => {
    setMaximizedPanelId(null);
  }, []);

  // Add a tab to a panel
  const addTab = useCallback((panelId: string, tab: Tab, content: TabPanelContent) => {
    setLayout(prevLayout => {
      const panel = findPanel(prevLayout, panelId);
      if (!panel) return prevLayout;

      return updatePanelInLayout(prevLayout, panelId, panel => ({
        ...panel,
        tabs: [...(panel.tabs || []), tab],
        contents: [...(panel.contents || []), content],
        activeTabId: tab.id
      }));
    });
  }, [findPanel, updatePanelInLayout]);

  // Remove a tab from a panel
  const removeTab = useCallback((panelId: string, tabId: string) => {
    setLayout(prevLayout => {
      const panel = findPanel(prevLayout, panelId);
      if (!panel || !panel.tabs) return prevLayout;

      const tabIndex = panel.tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1) return prevLayout;

      const newTabs = panel.tabs.filter(tab => tab.id !== tabId);
      const newContents = (panel.contents || []).filter(content => content.id !== tabId);

      // Determine new active tab if needed
      let newActiveTabId = panel.activeTabId;
      if (newActiveTabId === tabId && newTabs.length > 0) {
        newActiveTabId = newTabs[Math.min(tabIndex, newTabs.length - 1)].id;
      }

      return updatePanelInLayout(prevLayout, panelId, panel => ({
        ...panel,
        tabs: newTabs,
        contents: newContents,
        activeTabId: newActiveTabId
      }));
    });
  }, [findPanel, updatePanelInLayout]);

  // Change the active tab of a panel
  const changeTab = useCallback((panelId: string, tabId: string) => {
    setLayout(prevLayout => {
      return updatePanelInLayout(prevLayout, panelId, panel => ({
        ...panel,
        activeTabId: tabId
      }));
    });
  }, [updatePanelInLayout]);

  // Move a tab from one panel to another
  const moveTab = useCallback((sourceId: string, sourceTabId: string, targetId: string) => {
    console.log(`🔄 MOVE TAB: from ${sourceId} to ${targetId}, tab ${sourceTabId}`);
    
    // Validate input parameters
    if (!sourceId || !sourceTabId || !targetId) {
      console.error('Invalid parameters for moveTab', { sourceId, sourceTabId, targetId });
      return;
    }
    
    // Skip if source and target are the same
    if (sourceId === targetId) {
      console.log('Source and target panels are the same, no move needed');
      return;
    }
    
    setLayout(prevLayout => {
      try {
        const sourcePanel = findPanel(prevLayout, sourceId);
        const targetPanel = findPanel(prevLayout, targetId);
        
        // Validate panels exist
        if (!sourcePanel) {
          console.error(`Source panel ${sourceId} not found`);
          return prevLayout;
        }
        
        if (!targetPanel) {
          console.error(`Target panel ${targetId} not found`);
          return prevLayout;
        }
        
        if (!sourcePanel.tabs || !targetPanel.tabs) {
          console.error('Panels are missing tabs arrays', { 
            sourceHasTabs: !!sourcePanel.tabs,
            targetHasTabs: !!targetPanel.tabs 
          });
          return prevLayout;
        }
        
        // Find tab in source panel
        const tabIndex = sourcePanel.tabs.findIndex(tab => tab.id === sourceTabId);
        if (tabIndex === -1) {
          console.error(`Tab ${sourceTabId} not found in source panel ${sourceId}`);
          return prevLayout;
        }
        
        // Get tab and content
        const tab = sourcePanel.tabs[tabIndex];
        
        // Non-closeable tab check (optional)
        if (!tab.closeable) {
          console.log(`Tab ${sourceTabId} is not closeable, skipping move`);
          return prevLayout;
        }
        
        // Find associated content
        const content = (sourcePanel.contents || []).find(c => c.id === sourceTabId);
        if (!content) {
          console.error(`Content for tab ${sourceTabId} not found`);
          return prevLayout;
        }
        
        console.log('Found tab to move:', tab.title);
        
        // Create new source panel without the tab
        const newSourcePanel = {
          ...sourcePanel,
          tabs: sourcePanel.tabs.filter(t => t.id !== sourceTabId),
          contents: (sourcePanel.contents || []).filter(c => c.id !== sourceTabId),
          // Update active tab in source panel if needed
          activeTabId: sourcePanel.activeTabId === sourceTabId 
            ? (sourcePanel.tabs.length > 1 
                ? sourcePanel.tabs[tabIndex === 0 ? 1 : tabIndex - 1].id 
                : undefined)
            : sourcePanel.activeTabId
        };
        
        // Create new target panel with the tab
        const newTargetPanel = {
          ...targetPanel,
          tabs: [...targetPanel.tabs, tab],
          contents: [...(targetPanel.contents || []), content],
          activeTabId: tab.id // Make the moved tab active
        };
        
        // Update the layout with the modified panels
        console.log('Updating panels:', { 
          oldSourceTabsCount: sourcePanel.tabs.length,
          newSourceTabsCount: newSourcePanel.tabs.length,
          oldTargetTabsCount: targetPanel.tabs.length,
          newTargetTabsCount: newTargetPanel.tabs.length
        });
        
        // Apply both updates
        let newLayout = updatePanelInLayout(prevLayout, sourceId, () => newSourcePanel);
        newLayout = updatePanelInLayout(newLayout, targetId, () => newTargetPanel);
        
        console.log('Move tab completed successfully');
        return newLayout;
      } catch (err) {
        console.error('Error in moveTab:', err);
        return prevLayout;
      }
    });
  }, [findPanel, updatePanelInLayout]);

  // Split a panel in a certain direction and add a new panel
  const splitPanel = useCallback((panelId: string, direction: PanelDirection, newPanel: PanelConfig) => {
    setLayout(prevLayout => {
      const panel = findPanel(prevLayout, panelId);
      if (!panel) {
        console.error(`Panel with ID ${panelId} not found for split operation`);
        return prevLayout;
      }

      // If the panel is already a split in the same direction, add the new panel as a child
      if (panel.type === 'split' && panel.direction === direction) {
        return updatePanelInLayout(prevLayout, panelId, panel => {
          // Ensure children is an array
          const existingChildren = panel.children || [];
          const childCount = existingChildren.length + 1;
          
          // Calculate new size for proportional distribution
          const newSize = 100 / childCount;
          
          return {
            ...panel,
            children: [...existingChildren, { ...newPanel, size: newSize }]
          };
        });
      }

      // Otherwise, replace the panel with a new split panel containing both panels
      const splitId = `split-${nanoid(6)}`;
      
      // Create a proper deep copy of the original panel
      const originalPanelCopy = {
        ...panel,
        id: `${panel.id}-child`, // Give it a new ID to avoid conflicts
        size: 50
      };
      
      // Don't copy over properties that shouldn't be inherited by child panels
      if (panel.type === 'split') {
        delete originalPanelCopy.children;
      }

      // Create a new split panel
      const splitPanel: PanelConfig = {
        id: splitId,
        type: 'split',
        direction,
        children: [originalPanelCopy, { ...newPanel, size: 50 }]
      };

      // Find the parent of the panel to replace
      const replaceInParent = (layout: PanelConfig): PanelConfig => {
        if (layout.children) {
          const index = layout.children.findIndex(child => child.id === panelId);
          if (index !== -1) {
            const newChildren = [...layout.children];
            newChildren[index] = splitPanel;
            return { ...layout, children: newChildren };
          }
          return {
            ...layout,
            children: layout.children.map(child => replaceInParent(child))
          };
        }
        return layout;
      };

      // If the panel is the root, replace the entire layout
      if (panelId === prevLayout.id) {
        return splitPanel;
      }

      return replaceInParent(prevLayout);
    });
  }, [findPanel, updatePanelInLayout]);

  // Save the current layout with a name
  const saveLayout = useCallback((name: string) => {
    setSavedLayouts(prevLayouts => {
      const newLayouts = prevLayouts.filter(l => l.name !== name);
      newLayouts.push({ name, data: layout });
      
      // Store in localStorage
      localStorage.setItem('nexus-panel-layouts', JSON.stringify(newLayouts));
      
      return newLayouts;
    });
    setCurrentLayoutName(name);
  }, [layout]);

  // Load a layout by name
  const loadLayout = useCallback((name: string) => {
    const layout = savedLayouts.find(l => l.name === name)?.data;
    if (layout) {
      setLayout(layout);
      setCurrentLayoutName(name);
    }
  }, [savedLayouts]);

  // Load saved layouts from localStorage on first render
  React.useEffect(() => {
    try {
      const savedLayoutsJson = localStorage.getItem('nexus-panel-layouts');
      if (savedLayoutsJson) {
        const parsedLayouts = JSON.parse(savedLayoutsJson);
        if (Array.isArray(parsedLayouts)) {
          setSavedLayouts(parsedLayouts);
        }
      }
    } catch (error) {
      console.error('Error loading saved layouts:', error);
    }
  }, []);

  const contextValue: PanelContextType = {
    layout,
    updateLayout,
    maximizedPanelId,
    maximizePanel,
    restorePanel,
    addTab,
    removeTab,
    changeTab,
    moveTab,
    splitPanel,
    findPanel,
    savedLayouts,
    saveLayout,
    loadLayout,
    currentLayoutName
  };

  return (
    <PanelContext.Provider value={contextValue}>
      {children}
    </PanelContext.Provider>
  );
}

// Custom hook to use the panel context
export function usePanelContext() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanelContext must be used within a PanelProvider');
  }
  return context;
}