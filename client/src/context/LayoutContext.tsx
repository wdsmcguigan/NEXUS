import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface TabConfig {
  id: string;
  title: string;
  icon?: React.ReactNode;
  contentType: string;
  contentProps?: any;
  closeable?: boolean;
}

export interface PanelConfig {
  id: string;
  minSize?: number;
  defaultSize?: number;
  tabs: TabConfig[];
  activeTabId?: string;
  direction?: 'horizontal' | 'vertical';
  children?: PanelConfig[];
}

interface LayoutContextType {
  currentLayout: PanelConfig;
  savedLayouts: { name: string; layout: PanelConfig }[];
  updateLayout: (layout: PanelConfig) => void;
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  moveTab: (tabId: string, sourcePanelId: string, targetPanelId: string) => void;
  addTab: (tab: TabConfig, panelId: string) => void;
  closeTab: (tabId: string, panelId: string) => void;
  setActiveTab: (tabId: string, panelId: string) => void;
  splitPanel: (panelId: string, direction: 'horizontal' | 'vertical') => void;
}

// Default layout configuration for the email client
const DEFAULT_LAYOUT: PanelConfig = {
  id: 'root',
  direction: 'horizontal',
  children: [
    {
      id: 'left-sidebar',
      minSize: 10,
      defaultSize: 20,
      tabs: [
        {
          id: 'accounts',
          title: 'Accounts',
          contentType: 'leftSidebar',
          closeable: false
        }
      ],
      activeTabId: 'accounts'
    },
    {
      id: 'main-content',
      direction: 'vertical',
      defaultSize: 60,
      children: [
        {
          id: 'email-section',
          direction: 'horizontal',
          defaultSize: 70,
          children: [
            {
              id: 'email-list',
              defaultSize: 40,
              tabs: [
                {
                  id: 'inbox',
                  title: 'Inbox',
                  contentType: 'emailList',
                  contentProps: { view: 'inbox' },
                  closeable: false
                }
              ],
              activeTabId: 'inbox'
            },
            {
              id: 'email-detail',
              defaultSize: 60,
              tabs: [
                {
                  id: 'detail',
                  title: 'Email',
                  contentType: 'emailDetail',
                  closeable: false
                }
              ],
              activeTabId: 'detail'
            }
          ]
        },
        {
          id: 'bottom-pane',
          defaultSize: 30,
          tabs: [
            {
              id: 'integrations',
              title: 'Integrations',
              contentType: 'integrations',
              closeable: false
            }
          ],
          activeTabId: 'integrations'
        }
      ]
    },
    {
      id: 'right-sidebar',
      minSize: 10,
      defaultSize: 20,
      tabs: [
        {
          id: 'contact-info',
          title: 'Contact',
          contentType: 'rightSidebar',
          closeable: false
        }
      ],
      activeTabId: 'contact-info'
    }
  ]
};

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentLayout, setCurrentLayout] = useState<PanelConfig>(DEFAULT_LAYOUT);
  const [savedLayouts, setSavedLayouts] = useState<{name: string; layout: PanelConfig}[]>([]);
  
  // Load saved layouts from local storage on mount
  useEffect(() => {
    const storedLayouts = localStorage.getItem('nexus-email-layouts');
    if (storedLayouts) {
      try {
        setSavedLayouts(JSON.parse(storedLayouts));
      } catch (e) {
        console.error('Failed to parse saved layouts', e);
      }
    }
    
    const lastLayout = localStorage.getItem('nexus-email-current-layout');
    if (lastLayout) {
      try {
        setCurrentLayout(JSON.parse(lastLayout));
      } catch (e) {
        console.error('Failed to parse current layout', e);
      }
    }
  }, []);
  
  // Update the current layout and save to localStorage
  const updateLayout = useCallback((layout: PanelConfig) => {
    setCurrentLayout(layout);
    localStorage.setItem('nexus-email-current-layout', JSON.stringify(layout));
  }, []);
  
  // Save the current layout with a name
  const saveLayout = useCallback((name: string) => {
    const newSavedLayouts = [
      ...savedLayouts.filter(l => l.name !== name),
      { name, layout: currentLayout }
    ];
    setSavedLayouts(newSavedLayouts);
    localStorage.setItem('nexus-email-layouts', JSON.stringify(newSavedLayouts));
  }, [currentLayout, savedLayouts]);
  
  // Load a saved layout by name
  const loadLayout = useCallback((name: string) => {
    const layoutToLoad = savedLayouts.find(l => l.name === name);
    if (layoutToLoad) {
      setCurrentLayout(layoutToLoad.layout);
      localStorage.setItem('nexus-email-current-layout', JSON.stringify(layoutToLoad.layout));
    }
  }, [savedLayouts]);

  // Helper function to find a panel by ID in the layout tree
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

  // Helper function to clone and update the layout
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

  // Move a tab from one panel to another
  const moveTab = useCallback((tabId: string, sourcePanelId: string, targetPanelId: string) => {
    const sourcePanel = findPanel(currentLayout, sourcePanelId);
    const targetPanel = findPanel(currentLayout, targetPanelId);
    
    if (!sourcePanel || !targetPanel) return;
    
    const tabIndex = sourcePanel.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const tab = sourcePanel.tabs[tabIndex];
    
    // Create a new layout with the tab moved
    const newLayout = updatePanelInLayout(
      currentLayout,
      sourcePanelId,
      panel => ({
        ...panel,
        tabs: panel.tabs.filter(t => t.id !== tabId),
        activeTabId: panel.activeTabId === tabId 
          ? panel.tabs.length > 1
            ? panel.tabs[tabIndex === 0 ? 1 : tabIndex - 1].id
            : undefined
          : panel.activeTabId
      })
    );
    
    const finalLayout = updatePanelInLayout(
      newLayout,
      targetPanelId,
      panel => ({
        ...panel,
        tabs: [...panel.tabs, tab],
        activeTabId: tab.id
      })
    );
    
    updateLayout(finalLayout);
  }, [currentLayout, findPanel, updateLayout, updatePanelInLayout]);

  // Add a new tab to a panel
  const addTab = useCallback((tab: TabConfig, panelId: string) => {
    const panel = findPanel(currentLayout, panelId);
    if (!panel) return;
    
    const newLayout = updatePanelInLayout(
      currentLayout,
      panelId,
      panel => ({
        ...panel,
        tabs: [...panel.tabs, tab],
        activeTabId: tab.id
      })
    );
    
    updateLayout(newLayout);
  }, [currentLayout, findPanel, updateLayout, updatePanelInLayout]);

  // Close a tab
  const closeTab = useCallback((tabId: string, panelId: string) => {
    const panel = findPanel(currentLayout, panelId);
    if (!panel) return;
    
    const tabIndex = panel.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const newLayout = updatePanelInLayout(
      currentLayout,
      panelId,
      panel => ({
        ...panel,
        tabs: panel.tabs.filter(t => t.id !== tabId),
        activeTabId: panel.activeTabId === tabId 
          ? panel.tabs.length > 1
            ? panel.tabs[tabIndex === 0 ? 1 : tabIndex - 1].id
            : undefined
          : panel.activeTabId
      })
    );
    
    updateLayout(newLayout);
  }, [currentLayout, findPanel, updateLayout, updatePanelInLayout]);

  // Set the active tab in a panel
  const setActiveTab = useCallback((tabId: string, panelId: string) => {
    const panel = findPanel(currentLayout, panelId);
    if (!panel) return;
    
    const tabExists = panel.tabs.some(tab => tab.id === tabId);
    if (!tabExists) return;
    
    const newLayout = updatePanelInLayout(
      currentLayout,
      panelId,
      panel => ({
        ...panel,
        activeTabId: tabId
      })
    );
    
    updateLayout(newLayout);
  }, [currentLayout, findPanel, updateLayout, updatePanelInLayout]);

  // Split a panel into two
  const splitPanel = useCallback((panelId: string, direction: 'horizontal' | 'vertical') => {
    const panel = findPanel(currentLayout, panelId);
    if (!panel) return;
    
    // Create a new panel with half the tabs
    const halfIndex = Math.ceil(panel.tabs.length / 2);
    const firstHalfTabs = panel.tabs.slice(0, halfIndex);
    const secondHalfTabs = panel.tabs.slice(halfIndex);
    
    if (secondHalfTabs.length === 0) {
      // If there's only one tab, create an empty second panel
      secondHalfTabs.push({
        id: `new-tab-${Date.now()}`,
        title: 'New Tab',
        contentType: 'empty',
        closeable: true
      });
    }
    
    const newPanelId = `panel-${Date.now()}`;
    
    const newLayout = updatePanelInLayout(
      currentLayout,
      panelId,
      panel => ({
        id: panel.id,
        direction,
        minSize: panel.minSize,
        defaultSize: panel.defaultSize,
        children: [
          {
            id: panel.id + '-child',
            defaultSize: 50,
            tabs: firstHalfTabs,
            activeTabId: panel.activeTabId && firstHalfTabs.some(t => t.id === panel.activeTabId)
              ? panel.activeTabId
              : firstHalfTabs[0]?.id
          },
          {
            id: newPanelId,
            defaultSize: 50,
            tabs: secondHalfTabs,
            activeTabId: panel.activeTabId && secondHalfTabs.some(t => t.id === panel.activeTabId)
              ? panel.activeTabId
              : secondHalfTabs[0]?.id
          }
        ]
      })
    );
    
    updateLayout(newLayout);
  }, [currentLayout, findPanel, updateLayout, updatePanelInLayout]);
  
  return (
    <LayoutContext.Provider value={{
      currentLayout,
      savedLayouts,
      updateLayout,
      saveLayout,
      loadLayout,
      moveTab,
      addTab,
      closeTab,
      setActiveTab,
      splitPanel
    }}>
      {children}
    </LayoutContext.Provider>
  );
};