import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { componentRegistry } from '../registry/ComponentRegistry.js';

// Types for tab state management
export interface Tab {
  id: string;
  componentId: string;         // ID of the component from registry
  title: string;               // Display title (can be dynamic)
  props: Record<string, any>;  // Props to pass to the component
  icon?: React.ReactNode;      // Icon to display in tab
  closeable: boolean;          // Can the tab be closed?
  panelId: string;             // ID of the panel this tab is in
  active: boolean;             // Is this tab currently active?
  pinned: boolean;             // Is this tab pinned (can't be closed automatically)?
  pinnable?: boolean;          // Can this tab be pinned at all?
  lastActive?: number;         // Timestamp of last activation (for tab history)
}

export interface TabPanel {
  id: string;
  tabs: string[];              // IDs of tabs in this panel
  activeTabId?: string;        // ID of the active tab
  direction?: 'horizontal' | 'vertical'; // For split panels
  size?: number;               // Relative size in the layout
  parentId?: string;           // Parent panel ID for nested panels
  children?: string[];         // Child panel IDs
}

export interface TabState {
  tabs: Record<string, Tab>;
  panels: Record<string, TabPanel>;
  tabHistory: string[];        // Ordered list of recently active tabs
}

// Action types for the reducer
type TabAction =
  | { type: 'ADD_TAB'; payload: { componentId: string; panelId: string; props?: any; title?: string; activate?: boolean } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'ACTIVATE_TAB'; payload: { tabId: string } }
  | { type: 'MOVE_TAB'; payload: { tabId: string; targetPanelId: string } }
  | { type: 'PIN_TAB'; payload: { tabId: string; pinned: boolean } }
  | { type: 'UPDATE_TAB_PROPS'; payload: { tabId: string; props: any } }
  | { type: 'UPDATE_TAB_TITLE'; payload: { tabId: string; title: string } }
  | { type: 'ADD_PANEL'; payload: { id?: string; parentId?: string; direction?: 'horizontal' | 'vertical'; size?: number } }
  | { type: 'REMOVE_PANEL'; payload: { panelId: string } }
  | { type: 'SPLIT_PANEL'; payload: { panelId: string; direction: 'horizontal' | 'vertical' } }
  | { type: 'MOVE_PANEL'; payload: { panelId: string; targetParentId: string } }
  | { type: 'RESIZE_PANEL'; payload: { panelId: string; size: number } }
  | { type: 'RESET_LAYOUT'; payload: { initialLayout?: Partial<TabState> } };

// Initial state
const initialTabState: TabState = {
  tabs: {},
  panels: {
    'root': {
      id: 'root',
      tabs: [],
      activeTabId: undefined,
      children: []
    }
  },
  tabHistory: []
};

// Reducer function
function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'ADD_TAB': {
      const { componentId, panelId, props = {}, title, activate = true } = action.payload;
      const componentEntry = componentRegistry.getEntry(componentId);
      
      if (!componentEntry) {
        console.error(`Component ${componentId} not found in registry`);
        return state;
      }

      // Check if this is a singleton component and if it's already open
      if (componentEntry.singleton) {
        const existingTab = Object.values(state.tabs).find(tab => tab.componentId === componentId);
        if (existingTab) {
          // If the singleton component is already open in a different panel, move it
          if (existingTab.panelId !== panelId) {
            return tabReducer(
              state,
              { type: 'MOVE_TAB', payload: { tabId: existingTab.id, targetPanelId: panelId } }
            );
          }
          
          // If it's in the same panel, just activate it
          if (activate) {
            return tabReducer(
              state,
              { type: 'ACTIVATE_TAB', payload: { tabId: existingTab.id } }
            );
          }
          
          return state;
        }
      }

      const tabId = nanoid();
      const newTab: Tab = {
        id: tabId,
        componentId,
        title: title || componentEntry.displayName,
        props: { ...componentEntry.defaultProps, ...props },
        icon: componentEntry.icon,
        closeable: componentEntry.closeable !== false,
        panelId,
        active: activate,
        pinned: false,
        lastActive: Date.now()
      };

      // Create a new tabs object
      const newTabs = { ...state.tabs, [tabId]: newTab };

      // Update the panel to include the new tab
      const panel = state.panels[panelId];
      if (!panel) {
        console.error(`Panel ${panelId} not found`);
        return state;
      }

      // If we're activating this tab, we need to deactivate other tabs in the panel
      if (activate) {
        Object.keys(newTabs).forEach(id => {
          if (newTabs[id].panelId === panelId) {
            newTabs[id] = { ...newTabs[id], active: id === tabId };
          }
        });
      }

      const updatedPanel = {
        ...panel,
        tabs: [...panel.tabs, tabId],
        activeTabId: activate ? tabId : panel.activeTabId
      };

      // Update tab history
      const newTabHistory = activate 
        ? [tabId, ...state.tabHistory.filter(id => id !== tabId)]
        : state.tabHistory;

      return {
        ...state,
        tabs: newTabs,
        panels: {
          ...state.panels,
          [panelId]: updatedPanel
        },
        tabHistory: newTabHistory
      };
    }

    case 'CLOSE_TAB': {
      const { tabId } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
        return state;
      }

      if (tab.pinned) {
        console.log(`Tab ${tabId} is pinned and cannot be closed`);
        return state;
      }

      const panel = state.panels[tab.panelId];
      
      // Remove tab from the panel
      const updatedTabs = panel.tabs.filter(id => id !== tabId);
      
      // Determine the new active tab in the panel
      let newActiveTabId: string | undefined = undefined;
      
      if (panel.activeTabId === tabId && updatedTabs.length > 0) {
        // Try to find the last active tab in this panel
        const lastActiveTabs = state.tabHistory
          .filter(id => state.tabs[id] && state.tabs[id].panelId === panel.id);
        
        // Use the first tab in history that's still in this panel
        for (const historyTabId of lastActiveTabs) {
          if (updatedTabs.includes(historyTabId)) {
            newActiveTabId = historyTabId;
            break;
          }
        }
        
        // If no tab found in history, use the first tab
        if (!newActiveTabId) {
          newActiveTabId = updatedTabs[0];
        }
      } else {
        newActiveTabId = panel.activeTabId;
      }

      // Create a new tabs object without the closed tab
      const { [tabId]: _, ...remainingTabs } = state.tabs;

      // If the tab we're closing is the active tab, activate the new active tab
      if (tab.active && newActiveTabId) {
        remainingTabs[newActiveTabId] = {
          ...remainingTabs[newActiveTabId],
          active: true,
          lastActive: Date.now()
        };
      }

      // Update tab history
      const newTabHistory = state.tabHistory.filter(id => id !== tabId);

      return {
        ...state,
        tabs: remainingTabs,
        panels: {
          ...state.panels,
          [panel.id]: {
            ...panel,
            tabs: updatedTabs,
            activeTabId: newActiveTabId
          }
        },
        tabHistory: newTabHistory
      };
    }

    case 'ACTIVATE_TAB': {
      const { tabId } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
        return state;
      }

      const panel = state.panels[tab.panelId];
      
      // Deactivate all tabs in the panel and activate the specified tab
      const updatedTabs = { ...state.tabs };
      
      // Update all tabs in the panel
      panel.tabs.forEach(id => {
        updatedTabs[id] = {
          ...updatedTabs[id],
          active: id === tabId
        };
      });
      
      // Update the activated tab with a new lastActive timestamp
      updatedTabs[tabId] = {
        ...updatedTabs[tabId],
        active: true,
        lastActive: Date.now()
      };

      // Update tab history
      const newTabHistory = [tabId, ...state.tabHistory.filter(id => id !== tabId)];

      return {
        ...state,
        tabs: updatedTabs,
        panels: {
          ...state.panels,
          [panel.id]: {
            ...panel,
            activeTabId: tabId
          }
        },
        tabHistory: newTabHistory
      };
    }

    case 'MOVE_TAB': {
      const { tabId, targetPanelId } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
        return state;
      }

      const sourcePanel = state.panels[tab.panelId];
      const targetPanel = state.panels[targetPanelId];
      
      if (!targetPanel) {
        console.error(`Target panel ${targetPanelId} not found`);
        return state;
      }

      // Tab is already in the target panel
      if (tab.panelId === targetPanelId) {
        return state;
      }

      // Remove tab from source panel
      const updatedSourceTabs = sourcePanel.tabs.filter(id => id !== tabId);
      
      // Add tab to target panel
      const updatedTargetTabs = [...targetPanel.tabs, tabId];
      
      // Update tab with new panel ID
      const updatedTab = {
        ...tab,
        panelId: targetPanelId,
        active: true
      };

      // Deactivate other tabs in the target panel
      const updatedTabs = { ...state.tabs };
      targetPanel.tabs.forEach(id => {
        updatedTabs[id] = {
          ...updatedTabs[id],
          active: false
        };
      });
      updatedTabs[tabId] = updatedTab;

      // Determine new active tab in source panel if the moved tab was active
      let newSourceActiveTabId: string | undefined = undefined;
      if (sourcePanel.activeTabId === tabId && updatedSourceTabs.length > 0) {
        // Try to find the last active tab
        const lastActiveTabs = state.tabHistory
          .filter(id => state.tabs[id] && state.tabs[id].panelId === sourcePanel.id && id !== tabId);
        
        newSourceActiveTabId = lastActiveTabs[0] || updatedSourceTabs[0];
        
        if (newSourceActiveTabId) {
          updatedTabs[newSourceActiveTabId] = {
            ...updatedTabs[newSourceActiveTabId],
            active: true,
            lastActive: Date.now()
          };
        }
      } else {
        newSourceActiveTabId = sourcePanel.activeTabId;
      }

      return {
        ...state,
        tabs: updatedTabs,
        panels: {
          ...state.panels,
          [sourcePanel.id]: {
            ...sourcePanel,
            tabs: updatedSourceTabs,
            activeTabId: newSourceActiveTabId === tabId ? undefined : newSourceActiveTabId
          },
          [targetPanel.id]: {
            ...targetPanel,
            tabs: updatedTargetTabs,
            activeTabId: tabId
          }
        }
      };
    }

    case 'PIN_TAB': {
      const { tabId, pinned } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
        return state;
      }

      return {
        ...state,
        tabs: {
          ...state.tabs,
          [tabId]: {
            ...tab,
            pinned
          }
        }
      };
    }

    case 'UPDATE_TAB_PROPS': {
      const { tabId, props } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
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
              ...props
            }
          }
        }
      };
    }

    case 'UPDATE_TAB_TITLE': {
      const { tabId, title } = action.payload;
      const tab = state.tabs[tabId];
      
      if (!tab) {
        console.error(`Tab ${tabId} not found`);
        return state;
      }

      return {
        ...state,
        tabs: {
          ...state.tabs,
          [tabId]: {
            ...tab,
            title
          }
        }
      };
    }

    case 'ADD_PANEL': {
      const { id = nanoid(), parentId = 'root', direction = 'horizontal', size = 50 } = action.payload;
      
      // Check if parent panel exists
      const parentPanel = state.panels[parentId];
      if (!parentPanel) {
        console.error(`Parent panel ${parentId} not found`);
        return state;
      }

      // Create new panel
      const newPanel: TabPanel = {
        id,
        tabs: [],
        activeTabId: undefined,
        direction,
        size,
        parentId
      };

      // Update parent panel's children
      const updatedParentPanel = {
        ...parentPanel,
        children: [...(parentPanel.children || []), id]
      };

      return {
        ...state,
        panels: {
          ...state.panels,
          [id]: newPanel,
          [parentId]: updatedParentPanel
        }
      };
    }

    case 'REMOVE_PANEL': {
      const { panelId } = action.payload;
      
      // Don't allow removing the root panel
      if (panelId === 'root') {
        console.error('Cannot remove root panel');
        return state;
      }

      const panel = state.panels[panelId];
      if (!panel) {
        console.error(`Panel ${panelId} not found`);
        return state;
      }

      // If panel has tabs, close them
      let newState = { ...state };
      
      if (panel.tabs.length > 0) {
        panel.tabs.forEach(tabId => {
          if (!newState.tabs[tabId].pinned) {
            newState = tabReducer(newState, { type: 'CLOSE_TAB', payload: { tabId } });
          } else {
            // Move pinned tabs to parent panel or root
            const targetPanelId = panel.parentId || 'root';
            newState = tabReducer(newState, { 
              type: 'MOVE_TAB', 
              payload: { tabId, targetPanelId } 
            });
          }
        });
      }

      // Remove panel from parent's children
      if (panel.parentId) {
        const parentPanel = newState.panels[panel.parentId];
        newState = {
          ...newState,
          panels: {
            ...newState.panels,
            [panel.parentId]: {
              ...parentPanel,
              children: parentPanel.children?.filter(id => id !== panelId) || []
            }
          }
        };
      }

      // Remove panel from panels
      const { [panelId]: _, ...remainingPanels } = newState.panels;

      return {
        ...newState,
        panels: remainingPanels
      };
    }

    case 'SPLIT_PANEL': {
      const { panelId, direction } = action.payload;
      
      const panel = state.panels[panelId];
      if (!panel) {
        console.error(`Panel ${panelId} not found`);
        return state;
      }

      // Create a new panel to be the sibling of the split
      const newPanelId = nanoid();
      const newPanel: TabPanel = {
        id: newPanelId,
        tabs: [],
        activeTabId: undefined,
        parentId: panel.parentId,
        direction,
        size: 50
      };

      // Update the panel being split
      const updatedPanel = {
        ...panel,
        size: 50
      };

      // Update the parent panel's children
      let newState = {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: updatedPanel,
          [newPanelId]: newPanel
        }
      };

      if (panel.parentId) {
        const parentPanel = state.panels[panel.parentId];
        const updatedParentPanel = {
          ...parentPanel,
          children: [...(parentPanel.children || []), newPanelId]
        };

        newState = {
          ...newState,
          panels: {
            ...newState.panels,
            [panel.parentId]: updatedParentPanel
          }
        };
      }

      return newState;
    }

    case 'MOVE_PANEL': {
      const { panelId, targetParentId } = action.payload;
      
      // Don't allow moving the root panel
      if (panelId === 'root') {
        console.error('Cannot move root panel');
        return state;
      }

      const panel = state.panels[panelId];
      if (!panel) {
        console.error(`Panel ${panelId} not found`);
        return state;
      }

      const targetParentPanel = state.panels[targetParentId];
      if (!targetParentPanel) {
        console.error(`Target parent panel ${targetParentId} not found`);
        return state;
      }

      // Same parent, no change needed
      if (panel.parentId === targetParentId) {
        return state;
      }

      // Remove panel from current parent's children
      let newState = { ...state };
      
      if (panel.parentId) {
        const currentParentPanel = newState.panels[panel.parentId];
        newState = {
          ...newState,
          panels: {
            ...newState.panels,
            [panel.parentId]: {
              ...currentParentPanel,
              children: currentParentPanel.children?.filter(id => id !== panelId) || []
            }
          }
        };
      }

      // Add panel to new parent's children
      newState = {
        ...newState,
        panels: {
          ...newState.panels,
          [targetParentId]: {
            ...targetParentPanel,
            children: [...(targetParentPanel.children || []), panelId]
          },
          [panelId]: {
            ...panel,
            parentId: targetParentId
          }
        }
      };

      return newState;
    }

    case 'RESIZE_PANEL': {
      const { panelId, size } = action.payload;
      
      const panel = state.panels[panelId];
      if (!panel) {
        console.error(`Panel ${panelId} not found`);
        return state;
      }

      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: {
            ...panel,
            size
          }
        }
      };
    }

    case 'RESET_LAYOUT': {
      const { initialLayout = initialTabState } = action.payload;
      
      // Close all tabs
      const newState = {
        ...initialLayout,
        tabs: {},
        tabHistory: []
      };
      
      return newState;
    }

    default:
      return state;
  }
}

// Create Context
interface TabContextType {
  state: TabState;
  openTab: (componentId: string, panelId: string, props?: any, title?: string) => string;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  moveTab: (tabId: string, targetPanelId: string) => void;
  pinTab: (tabId: string, pinned: boolean) => void;
  updateTabProps: (tabId: string, props: any) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  addPanel: (parentId?: string, direction?: 'horizontal' | 'vertical', size?: number) => string;
  removePanel: (panelId: string) => void;
  splitPanel: (panelId: string, direction: 'horizontal' | 'vertical') => string;
  movePanel: (panelId: string, targetParentId: string) => void;
  resizePanel: (panelId: string, size: number) => void;
  resetLayout: (initialLayout?: Partial<TabState>) => void;
  getTabComponent: (tabId: string) => React.ComponentType<any> | null;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

// Provider Component
interface TabProviderProps {
  children: ReactNode;
  initialState?: Partial<TabState>;
}

export function TabProvider({ children, initialState = initialTabState }: TabProviderProps) {
  const [state, dispatch] = useReducer(tabReducer, { ...initialTabState, ...initialState });

  // Open a new tab in the specified panel
  const openTab = useCallback((componentId: string, panelId: string, props?: any, title?: string): string => {
    const tabId = nanoid();
    dispatch({ 
      type: 'ADD_TAB', 
      payload: { componentId, panelId, props, title, activate: true }
    });
    return tabId;
  }, []);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: 'CLOSE_TAB', payload: { tabId } });
  }, []);

  // Activate a tab
  const activateTab = useCallback((tabId: string) => {
    dispatch({ type: 'ACTIVATE_TAB', payload: { tabId } });
  }, []);

  // Move a tab to another panel
  const moveTab = useCallback((tabId: string, targetPanelId: string) => {
    dispatch({ type: 'MOVE_TAB', payload: { tabId, targetPanelId } });
  }, []);

  // Pin or unpin a tab
  const pinTab = useCallback((tabId: string, pinned: boolean) => {
    dispatch({ type: 'PIN_TAB', payload: { tabId, pinned } });
  }, []);

  // Update a tab's props
  const updateTabProps = useCallback((tabId: string, props: any) => {
    dispatch({ type: 'UPDATE_TAB_PROPS', payload: { tabId, props } });
  }, []);

  // Update a tab's title
  const updateTabTitle = useCallback((tabId: string, title: string) => {
    dispatch({ type: 'UPDATE_TAB_TITLE', payload: { tabId, title } });
  }, []);

  // Add a new panel
  const addPanel = useCallback((parentId = 'root', direction = 'horizontal', size = 50): string => {
    const id = nanoid();
    dispatch({ 
      type: 'ADD_PANEL', 
      payload: { id, parentId, direction, size }
    });
    return id;
  }, []);

  // Remove a panel
  const removePanel = useCallback((panelId: string) => {
    dispatch({ type: 'REMOVE_PANEL', payload: { panelId } });
  }, []);

  // Split a panel
  const splitPanel = useCallback((panelId: string, direction: 'horizontal' | 'vertical'): string => {
    const newPanelId = nanoid();
    dispatch({ 
      type: 'SPLIT_PANEL', 
      payload: { panelId, direction, newPanelId }
    });
    return newPanelId;
  }, []);

  // Move a panel to a new parent
  const movePanel = useCallback((panelId: string, targetParentId: string) => {
    dispatch({ type: 'MOVE_PANEL', payload: { panelId, targetParentId } });
  }, []);

  // Resize a panel
  const resizePanel = useCallback((panelId: string, size: number) => {
    dispatch({ type: 'RESIZE_PANEL', payload: { panelId, size } });
  }, []);

  // Reset the layout
  const resetLayout = useCallback((initialLayout?: Partial<TabState>) => {
    dispatch({ type: 'RESET_LAYOUT', payload: { initialLayout } });
  }, []);

  // Get the component for a tab
  const getTabComponent = useCallback((tabId: string): React.ComponentType<any> | null => {
    const tab = state.tabs[tabId];
    if (!tab) return null;
    
    const component = componentRegistry.getEntry(tab.componentId);
    return component ? component.component : null;
  }, [state.tabs]);

  const contextValue: TabContextType = {
    state,
    openTab,
    closeTab,
    activateTab,
    moveTab,
    pinTab,
    updateTabProps,
    updateTabTitle,
    addPanel,
    removePanel,
    splitPanel,
    movePanel,
    resizePanel,
    resetLayout,
    getTabComponent
  };

  return (
    <TabContext.Provider value={contextValue}>
      {children}
    </TabContext.Provider>
  );
}

// Custom hook to use the tab context
export function useTabContext() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

// Utility hooks for common tab operations
export function useTabAction() {
  const { openTab, closeTab, activateTab, moveTab, pinTab } = useTabContext();
  
  // Open a component in the specified panel
  const openComponent = useCallback((
    componentId: string, 
    panelId: string, 
    props?: any, 
    title?: string
  ) => {
    return openTab(componentId, panelId, props, title);
  }, [openTab]);

  // Open a component in a new tab
  const openComponentInTab = useCallback((
    componentId: string,
    panelId: string,
    props?: any,
    title?: string
  ) => {
    return openTab(componentId, panelId, props, title);
  }, [openTab]);

  return {
    openComponent,
    openComponentInTab,
    closeTab,
    activateTab,
    moveTab,
    pinTab,
  };
}

// Hook to get all tabs in a panel
export function usePanelTabs(panelId: string) {
  const { state } = useTabContext();
  const panel = state.panels[panelId];
  
  if (!panel) {
    return {
      tabs: [],
      activeTabId: undefined
    };
  }
  
  const tabs = panel.tabs.map(tabId => state.tabs[tabId]).filter(Boolean);
  
  return {
    tabs,
    activeTabId: panel.activeTabId
  };
}