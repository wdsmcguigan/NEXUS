import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { LucideIcon } from 'lucide-react';
import componentRegistry, { ComponentDefinition } from '../lib/componentRegistry';

// Define the types for tab state
export interface Tab {
  id: string;
  componentId: string;
  title: string;
  icon?: React.ReactNode;
  props?: Record<string, any>;
  closeable: boolean;
  panelId: string;
  active: boolean;
  lastActive?: number; // Timestamp for tracking most recently used tabs
}

// Panel types
export type PanelType = 'main' | 'sidebar' | 'bottom';

export interface Panel {
  id: string;
  type: PanelType;
  tabs: string[]; // Tab IDs
  activeTabId?: string;
  parentId?: string; // For nested panels
  direction?: 'horizontal' | 'vertical'; // For split panels
  size?: number; // Flex size (0-100)
  childPanels?: string[]; // For split panels containing other panels
}

// State structure
interface TabState {
  tabs: Record<string, Tab>;
  panels: Record<string, Panel>;
  activeTabId?: string;
  activePanelId?: string;
  tabHistory: string[]; // Track tab activation history for navigation
}

// Action types
type TabAction =
  | { type: 'ADD_TAB'; payload: { componentId: string; panelId: string; props?: any; title?: string; icon?: React.ReactNode; closeable?: boolean } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'ACTIVATE_TAB'; payload: { tabId: string; panelId: string } }
  | { type: 'UPDATE_TAB_PROPS'; payload: { tabId: string; props: any } }
  | { type: 'RENAME_TAB'; payload: { tabId: string; title: string } }
  | { type: 'MOVE_TAB'; payload: { tabId: string; sourcePanelId: string; toPanelId: string; index?: number } }
  | { type: 'ADD_PANEL'; payload: { type: PanelType; parentId?: string; direction?: 'horizontal' | 'vertical'; size?: number } }
  | { type: 'REMOVE_PANEL'; payload: { panelId: string } }
  | { type: 'SPLIT_PANEL'; payload: { panelId: string; direction: 'horizontal' | 'vertical'; options?: { newPanelId?: string; positionAfter?: boolean } } }
  | { type: 'MOVE_PANEL'; payload: { panelId: string; targetId: string; position: 'before' | 'after' | 'inside' } };

// Context type
interface TabContextType {
  state: TabState;
  dispatch: React.Dispatch<TabAction>;
  addTab: (componentId: string, panelId: string, props?: any, options?: { title?: string; icon?: React.ReactNode; closeable?: boolean }) => string;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string, panelId: string) => void;
  updateTabProps: (tabId: string, props: any) => void;
  renameTab: (tabId: string, title: string) => void;
  moveTab: (tabId: string, sourcePanelId: string, toPanelId: string, index?: number) => void;
  addPanel: (type: PanelType, parentId?: string, options?: { direction?: 'horizontal' | 'vertical', size?: number }) => string;
  removePanel: (panelId: string) => void;
  splitPanel: (panelId: string, direction: 'horizontal' | 'vertical', options?: { newPanelId?: string; positionAfter?: boolean }) => void;
  movePanel: (panelId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  getComponentForTab: (tabId: string) => ComponentDefinition | undefined;
  isPanelMaximized: boolean;
  maximizePanel: (panelId: string) => void;
  restorePanel: () => void;
  closePanel: (panelId: string) => void;
  restoreMaximizedPanel: () => void;
}

// Initial state
const initialState: TabState = {
  tabs: {},
  panels: {
    mainPanel: {
      id: 'mainPanel',
      type: 'main',
      tabs: [],
    },
    leftSidebar: {
      id: 'leftSidebar',
      type: 'sidebar',
      tabs: [],
    },
    rightSidebar: {
      id: 'rightSidebar',
      type: 'sidebar',
      tabs: [],
    },
    bottomPanel: {
      id: 'bottomPanel',
      type: 'bottom',
      tabs: [],
    }
  },
  tabHistory: [],
};

// Reducer function
function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'ADD_TAB': {
      const { componentId, panelId, props = {}, title, icon, closeable = true } = action.payload;
      
      // Verify the component exists in the registry
      const component = componentRegistry.getComponent(componentId);
      if (!component) {
        console.error(`Component with ID ${componentId} not found in registry`);
        return state;
      }

      // Generate a unique ID for the tab
      const tabId = nanoid();
      
      // Create the new tab
      const newTab: Tab = {
        id: tabId,
        componentId,
        title: title || component.displayName,
        icon: icon || (component.icon ? React.createElement(component.icon, { size: 16 }) : undefined),
        props: props || component.defaultConfig || {},
        closeable,
        panelId,
        active: false,
        lastActive: Date.now(),
      };

      // Update the panel's tabs list
      const panel = state.panels[panelId];
      if (!panel) {
        console.error(`Panel with ID ${panelId} not found`);
        return state;
      }

      // Check if component is singleton and already open
      if (component.singleton) {
        const existingTabId = Object.values(state.tabs).find(tab => 
          tab.componentId === componentId && tab.panelId === panelId
        )?.id;

        if (existingTabId) {
          // Update the existing tab's props and activate it
          return {
            ...state,
            tabs: {
              ...state.tabs,
              [existingTabId]: {
                ...state.tabs[existingTabId],
                props: props || state.tabs[existingTabId].props,
                active: true,
                lastActive: Date.now(),
              }
            },
            panels: {
              ...state.panels,
              [panelId]: {
                ...panel,
                activeTabId: existingTabId,
              }
            },
            activeTabId: existingTabId,
            activePanelId: panelId,
            tabHistory: [existingTabId, ...state.tabHistory.filter(id => id !== existingTabId)],
          };
        }
      }

      // Add the new tab
      return {
        ...state,
        tabs: {
          ...state.tabs,
          [tabId]: {
            ...newTab,
            active: true,
          },
        },
        panels: {
          ...state.panels,
          [panelId]: {
            ...panel,
            tabs: [...panel.tabs, tabId],
            activeTabId: tabId,
          },
        },
        activeTabId: tabId,
        activePanelId: panelId,
        tabHistory: [tabId, ...state.tabHistory],
      };
    }

    case 'CLOSE_TAB': {
      const { tabId } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        return state;
      }

      const { panelId } = tab;
      const panel = state.panels[panelId];
      
      if (!panel) {
        return state;
      }

      // Remove the tab
      const { [tabId]: removedTab, ...remainingTabs } = state.tabs;
      
      // Update the panel's tabs
      const updatedPanelTabs = panel.tabs.filter(id => id !== tabId);
      
      // Determine new active tab in the panel
      let newActiveTabId = panel.activeTabId;
      
      if (panel.activeTabId === tabId && updatedPanelTabs.length > 0) {
        // Find the most recently active tab to activate
        const lastActiveTimes = updatedPanelTabs
          .map(id => ({ id, time: state.tabs[id]?.lastActive || 0 }))
          .sort((a, b) => b.time - a.time);
        
        newActiveTabId = lastActiveTimes[0]?.id || undefined;
      } else if (updatedPanelTabs.length === 0) {
        newActiveTabId = undefined;
      }

      // Update tab history
      const updatedHistory = state.tabHistory.filter(id => id !== tabId);

      // Update the global active tab if the closed tab was active
      const newGlobalActiveTabId = state.activeTabId === tabId
        ? (updatedHistory[0] || undefined)
        : state.activeTabId;

      // Determine new active panel
      let newActivePanelId = state.activePanelId;
      if (state.activePanelId === panelId && newActiveTabId === undefined) {
        // If panel has no tabs, find another panel with tabs
        const panelsWithTabs = Object.values(state.panels)
          .filter(p => p.tabs.length > 0 && p.id !== panelId);

        if (panelsWithTabs.length > 0) {
          const newActivePanel = panelsWithTabs[0];
          newActivePanelId = newActivePanel.id;
        } else {
          newActivePanelId = undefined;
        }
      }

      return {
        ...state,
        tabs: remainingTabs,
        panels: {
          ...state.panels,
          [panelId]: {
            ...panel,
            tabs: updatedPanelTabs,
            activeTabId: newActiveTabId,
          },
        },
        activeTabId: newGlobalActiveTabId,
        activePanelId: newActivePanelId,
        tabHistory: updatedHistory,
      };
    }

    case 'ACTIVATE_TAB': {
      const { tabId, panelId } = action.payload;
      
      // Make sure the tab exists and is in the specified panel
      const tab = state.tabs[tabId];
      const panel = state.panels[panelId];
      
      if (!tab || !panel || !panel.tabs.includes(tabId)) {
        return state;
      }

      // Update all tabs in the panel to be inactive
      const updatedTabs = { ...state.tabs };
      panel.tabs.forEach(id => {
        if (updatedTabs[id]) {
          updatedTabs[id] = {
            ...updatedTabs[id],
            active: id === tabId,
            ...(id === tabId ? { lastActive: Date.now() } : {})
          };
        }
      });

      // Update tab history
      const updatedHistory = [
        tabId,
        ...state.tabHistory.filter(id => id !== tabId)
      ];

      return {
        ...state,
        tabs: updatedTabs,
        panels: {
          ...state.panels,
          [panelId]: {
            ...panel,
            activeTabId: tabId,
          },
        },
        activeTabId: tabId,
        activePanelId: panelId,
        tabHistory: updatedHistory,
      };
    }

    case 'UPDATE_TAB_PROPS': {
      const { tabId, props } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        return state;
      }

      return {
        ...state,
        tabs: {
          ...state.tabs,
          [tabId]: {
            ...tab,
            props: {
              ...tab.props,
              ...props,
            },
          },
        },
      };
    }

    case 'RENAME_TAB': {
      const { tabId, title } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        return state;
      }

      return {
        ...state,
        tabs: {
          ...state.tabs,
          [tabId]: {
            ...tab,
            title,
          },
        },
      };
    }

    case 'MOVE_TAB': {
      const { tabId, sourcePanelId, toPanelId, index } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        return state;
      }

      const sourcePanel = state.panels[sourcePanelId];
      const targetPanel = state.panels[toPanelId];
      
      if (!sourcePanel || !targetPanel) {
        return state;
      }

      // Check if tab is in the source panel
      if (!sourcePanel.tabs.includes(tabId)) {
        console.error(`Tab ${tabId} not found in source panel ${sourcePanelId}`);
        return state;
      }

      // Remove from source panel
      const sourceTabsUpdated = sourcePanel.tabs.filter(id => id !== tabId);
      
      // Add to target panel at specified index or end
      let targetTabsUpdated = [...targetPanel.tabs];
      if (typeof index === 'number') {
        targetTabsUpdated.splice(index, 0, tabId);
      } else {
        targetTabsUpdated.push(tabId);
      }

      // Update the tab with new panel ID
      const updatedTab: Tab = {
        ...tab,
        panelId: toPanelId,
      };

      // Update source panel's active tab if needed
      let updatedSourcePanel = { ...sourcePanel, tabs: sourceTabsUpdated };
      if (sourcePanel.activeTabId === tabId) {
        updatedSourcePanel.activeTabId = sourceTabsUpdated.length > 0 
          ? sourceTabsUpdated[0]
          : undefined;
      }

      return {
        ...state,
        tabs: {
          ...state.tabs,
          [tabId]: updatedTab,
        },
        panels: {
          ...state.panels,
          [sourcePanel.id]: updatedSourcePanel,
          [targetPanel.id]: {
            ...targetPanel,
            tabs: targetTabsUpdated,
            activeTabId: tabId, // Activate the moved tab in the target panel
          },
        },
        // If tab was active, activate it in the new panel
        activeTabId: state.activeTabId === tabId ? tabId : state.activeTabId,
        activePanelId: state.activeTabId === tabId ? toPanelId : state.activePanelId,
      };
    }

    case 'ADD_PANEL': {
      const { type, parentId, direction, size } = action.payload;
      const panelId = nanoid();
      
      const newPanel: Panel = {
        id: panelId,
        type,
        tabs: [],
        parentId,
        direction,
        size,
      };

      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: newPanel,
        },
      };
    }

    case 'REMOVE_PANEL': {
      const { panelId } = action.payload;
      const panel = state.panels[panelId];
      
      if (!panel) {
        return state;
      }

      // Close all tabs in the panel
      const tabsToClose = panel.tabs;
      const remainingTabs = { ...state.tabs };
      tabsToClose.forEach(tabId => {
        delete remainingTabs[tabId];
      });

      // Remove the panel
      const { [panelId]: removedPanel, ...remainingPanels } = state.panels;

      // Update tab history
      const updatedHistory = state.tabHistory.filter(id => !tabsToClose.includes(id));

      // Update active tab and panel if needed
      const newActiveTabId = state.activeTabId && 
        tabsToClose.includes(state.activeTabId) ? 
        updatedHistory[0] || undefined : 
        state.activeTabId;

      const newActivePanelId = state.activePanelId === panelId ?
        undefined :
        state.activePanelId;

      return {
        ...state,
        tabs: remainingTabs,
        panels: remainingPanels,
        activeTabId: newActiveTabId,
        activePanelId: newActivePanelId,
        tabHistory: updatedHistory,
      };
    }

    case 'SPLIT_PANEL': {
      const { panelId, direction, options } = action.payload;
      const panel = state.panels[panelId];
      
      if (!panel) {
        return state;
      }

      // Create a new panel with optional custom ID
      const newPanelId = options?.newPanelId || nanoid();
      
      // First child panel (original tabs go here)
      const childPanel1Id = `${panelId}-child1-${Date.now()}`;
      const childPanel1: Panel = {
        id: childPanel1Id,
        type: panel.type,
        tabs: [...panel.tabs], // Copy all tabs from original panel
        activeTabId: panel.activeTabId,
        parentId: panelId,
        size: 50, // Default 50% split
      };
      
      // Second child panel (new empty panel)
      const childPanel2Id = `${panelId}-child2-${Date.now()}`;
      const childPanel2: Panel = {
        id: childPanel2Id,
        type: panel.type,
        tabs: [],
        parentId: panelId,
        size: 50, // Default 50% split
      };
      
      // If positionAfter is specified, we may need to swap the panels
      const firstChildId = options?.positionAfter ? childPanel1Id : childPanel2Id;
      const secondChildId = options?.positionAfter ? childPanel2Id : childPanel1Id;
      
      // Update the original panel to be a container for the split
      const updatedPanel: Panel = {
        ...panel,
        tabs: [], // Remove tabs since they're now in childPanel1
        activeTabId: undefined, // No active tab in container panel
        direction, // Set the split direction
        childPanels: [firstChildId, secondChildId], // Add child panel references
      };

      console.log('SPLIT_PANEL executed:', {
        originalPanel: panel,
        newContainer: updatedPanel,
        child1: childPanel1,
        child2: childPanel2,
        direction,
        options
      });

      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: updatedPanel,
          [childPanel1Id]: childPanel1,
          [childPanel2Id]: childPanel2,
        },
      };
    }

    case 'MOVE_PANEL': {
      // Simplified implementation - full implementation would need to handle 
      // complex reorganization of the panel tree
      const { panelId, targetId, position } = action.payload;
      
      // This would require a more complex implementation that updates the 
      // hierarchy of panels. For now, this is a placeholder.
      
      return state;
    }

    default:
      return state;
  }
}

// Create context
const TabContext = createContext<TabContextType | undefined>(undefined);

// Create provider
interface TabProviderProps {
  children: ReactNode;
}

export function TabProvider({ children }: TabProviderProps) {
  const [state, dispatch] = useReducer(tabReducer, initialState);
  const [maximizedPanelId, setMaximizedPanelId] = React.useState<string | null>(null);

  const addTab = useCallback((componentId: string, panelId: string, props?: any, options?: { title?: string; icon?: React.ReactNode; closeable?: boolean }): string => {
    const tabId = nanoid();
    dispatch({
      type: 'ADD_TAB',
      payload: {
        componentId,
        panelId,
        props,
        title: options?.title,
        icon: options?.icon,
        closeable: options?.closeable,
      },
    });
    return tabId;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    dispatch({
      type: 'CLOSE_TAB',
      payload: { tabId },
    });
  }, []);

  const activateTab = useCallback((tabId: string, panelId: string) => {
    dispatch({
      type: 'ACTIVATE_TAB',
      payload: { tabId, panelId },
    });
  }, []);

  const updateTabProps = useCallback((tabId: string, props: any) => {
    dispatch({
      type: 'UPDATE_TAB_PROPS',
      payload: { tabId, props },
    });
  }, []);

  const renameTab = useCallback((tabId: string, title: string) => {
    dispatch({
      type: 'RENAME_TAB',
      payload: { tabId, title },
    });
  }, []);

  const moveTab = useCallback((tabId: string, sourcePanelId: string, toPanelId: string, index?: number) => {
    dispatch({
      type: 'MOVE_TAB',
      payload: { tabId, sourcePanelId, toPanelId, index },
    });
  }, []);

  const addPanel = useCallback((type: PanelType, parentId?: string, options?: { direction?: 'horizontal' | 'vertical', size?: number }) => {
    const panelId = nanoid();
    dispatch({
      type: 'ADD_PANEL',
      payload: {
        type,
        parentId,
        direction: options?.direction,
        size: options?.size,
      },
    });
    return panelId;
  }, []);

  const removePanel = useCallback((panelId: string) => {
    dispatch({
      type: 'REMOVE_PANEL',
      payload: { panelId },
    });
  }, []);

  const splitPanel = useCallback((panelId: string, direction: 'horizontal' | 'vertical', options?: { newPanelId?: string; positionAfter?: boolean }) => {
    dispatch({
      type: 'SPLIT_PANEL',
      payload: { panelId, direction, options },
    });
  }, []);

  const movePanel = useCallback((panelId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    dispatch({
      type: 'MOVE_PANEL',
      payload: { panelId, targetId, position },
    });
  }, []);

  const getComponentForTab = useCallback((tabId: string): ComponentDefinition | undefined => {
    const tab = state.tabs[tabId];
    if (!tab) return undefined;
    
    return componentRegistry.getComponent(tab.componentId);
  }, [state.tabs]);

  const maximizePanel = useCallback((panelId: string) => {
    setMaximizedPanelId(panelId);
  }, []);
  
  // Reset the maximized panel to normal view
  const restorePanel = useCallback(() => {
    setMaximizedPanelId(null);
  }, []);
  
  // Alias for restorePanel for backward compatibility
  const restoreMaximizedPanel = useCallback(() => {
    setMaximizedPanelId(null);
  }, []);
  
  // Close a panel and all its tabs
  const closePanel = useCallback((panelId: string) => {
    removePanel(panelId);
  }, [removePanel]);

  const value: TabContextType = {
    state,
    dispatch,
    addTab,
    closeTab,
    activateTab,
    updateTabProps,
    renameTab,
    moveTab,
    addPanel,
    removePanel,
    splitPanel,
    movePanel,
    getComponentForTab,
    isPanelMaximized: maximizedPanelId !== null,
    maximizePanel,
    restorePanel,
    restoreMaximizedPanel,
    closePanel,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

// Custom hook to use the context
export function useTabContext(): TabContextType {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

export default TabContext;