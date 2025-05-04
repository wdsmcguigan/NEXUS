import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { usePanelContext } from './PanelContext';

// Define tab interface
export interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  closeable?: boolean;
  pinned?: boolean;
}

// Define tab drop target
export interface DropTarget {
  panelId: string;
  targetZone: 'before' | 'after' | 'inside' | 'edge';
  tabId?: string;
  edge?: 'top' | 'right' | 'bottom' | 'left';
}

// Define TabContext type
interface TabContextType {
  addTab: (componentId: string, panelId: string, props?: any, tabOptions?: Partial<Tab>) => void;
  closeTab: (panelId: string, tabId: string) => void;
  activateTab: (panelId: string, tabId: string) => void;
  moveTabToPanel: (sourceTabId: string, sourcePanelId: string, targetPanelId: string) => void;
  pinTab: (panelId: string, tabId: string, pinned: boolean) => void;
  duplicateTab: (panelId: string, tabId: string) => void;
  handleTabDrop: (target: DropTarget, tabId: string, sourcePanelId: string) => void;
}

// Create TabContext
const TabContext = createContext<TabContextType | undefined>(undefined);

// TabProvider component
export function TabProvider({ children }: { children: ReactNode }) {
  const panelContext = usePanelContext();
  
  // Add a new tab to a panel
  const addTab = useCallback((componentId: string, panelId: string, props: any = {}, tabOptions: Partial<Tab> = {}) => {
    // Create a unique tab ID
    const tabId = tabOptions.id || `tab-${nanoid(6)}`;
    
    // Create the tab object
    const tab: Tab = {
      id: tabId,
      title: tabOptions.title || 'New Tab',
      icon: tabOptions.icon,
      closeable: tabOptions.closeable !== undefined ? tabOptions.closeable : true,
      pinned: tabOptions.pinned || false
    };
    
    // Create tab content
    const content = {
      id: tabId,
      type: componentId,
      props
    };
    
    // Add the tab to the panel
    panelContext.addTab(panelId, tab, content);
  }, [panelContext]);
  
  // Close a tab
  const closeTab = useCallback((panelId: string, tabId: string) => {
    panelContext.removeTab(panelId, tabId);
  }, [panelContext]);
  
  // Activate a tab
  const activateTab = useCallback((panelId: string, tabId: string) => {
    panelContext.changeTab(panelId, tabId);
  }, [panelContext]);
  
  // Move a tab to another panel
  const moveTabToPanel = useCallback((sourceTabId: string, sourcePanelId: string, targetPanelId: string) => {
    panelContext.moveTab(sourcePanelId, sourceTabId, targetPanelId);
  }, [panelContext]);
  
  // Pin/unpin a tab
  const pinTab = useCallback((panelId: string, tabId: string, pinned: boolean) => {
    const panel = panelContext.layout;
    
    // Find the panel and update the tab
    const findAndUpdateTab = (layout: any, panelId: string, tabId: string, pinned: boolean): any => {
      if (layout.id === panelId) {
        if (layout.tabs) {
          const tabs = [...layout.tabs];
          const tabIndex = tabs.findIndex(t => t.id === tabId);
          
          if (tabIndex !== -1) {
            // Update the tab
            tabs[tabIndex] = { ...tabs[tabIndex], pinned };
            
            // Re-order tabs if pinned (move to front) or unpinned (move after pinned)
            if (pinned) {
              // Count pinned tabs
              const pinnedCount = tabs.filter((t, i) => i < tabIndex && t.pinned).length;
              // Move to end of pinned section
              const tab = tabs.splice(tabIndex, 1)[0];
              tabs.splice(pinnedCount, 0, tab);
            } else {
              // Find the last pinned tab
              const lastPinnedIndex = tabs.findLastIndex(t => t.pinned);
              // If this tab is before that, move it after
              if (tabIndex <= lastPinnedIndex) {
                const tab = tabs.splice(tabIndex, 1)[0];
                tabs.splice(lastPinnedIndex + 1, 0, tab);
              }
            }
            
            return {
              ...layout,
              tabs
            };
          }
        }
        return layout;
      }
      
      if (layout.children) {
        return {
          ...layout,
          children: layout.children.map((child: any) => 
            findAndUpdateTab(child, panelId, tabId, pinned)
          )
        };
      }
      
      return layout;
    };
    
    // Update the layout
    const newLayout = findAndUpdateTab(panel, panelId, tabId, pinned);
    panelContext.updateLayout(newLayout);
  }, [panelContext]);
  
  // Duplicate a tab
  const duplicateTab = useCallback((panelId: string, tabId: string) => {
    const panel = panelContext.layout;
    
    // Find the panel and the tab to duplicate
    const findTab = (layout: any, panelId: string, tabId: string): { tab: Tab, content: any } | null => {
      if (layout.id === panelId) {
        if (layout.tabs && layout.contents) {
          const tabIndex = layout.tabs.findIndex((t: Tab) => t.id === tabId);
          const contentIndex = layout.contents.findIndex((c: any) => c.id === tabId);
          
          if (tabIndex !== -1 && contentIndex !== -1) {
            return {
              tab: layout.tabs[tabIndex],
              content: layout.contents[contentIndex]
            };
          }
        }
        return null;
      }
      
      if (layout.children) {
        for (const child of layout.children) {
          const result = findTab(child, panelId, tabId);
          if (result) return result;
        }
      }
      
      return null;
    };
    
    // Find the tab to duplicate
    const tabData = findTab(panel, panelId, tabId);
    
    if (tabData) {
      // Create a new ID for the duplicated tab
      const newTabId = `tab-${nanoid(6)}`;
      
      // Create a duplicate tab with the new ID
      const newTab: Tab = {
        ...tabData.tab,
        id: newTabId,
        title: `${tabData.tab.title} (Copy)`,
        pinned: false // Don't copy pinned status
      };
      
      // Create duplicate content with the new ID
      const newContent = {
        ...tabData.content,
        id: newTabId
      };
      
      // Add the duplicated tab to the panel
      panelContext.addTab(panelId, newTab, newContent);
    }
  }, [panelContext]);
  
  // Handle tab drop to various targets
  const handleTabDrop = useCallback((target: DropTarget, tabId: string, sourcePanelId: string) => {
    const { panelId, targetZone, tabId: targetTabId, edge } = target;
    
    // If dropping inside the same panel or onto a tab in the same panel, just change tab order
    if (targetZone === 'inside' && panelId === sourcePanelId) {
      // This would just be a tab reordering within the same panel
      // Implementation depends on how you handle tab ordering
      console.log('Tab reordering not implemented yet');
      return;
    }
    
    // If dropping on an edge, create a new panel in that direction
    if (targetZone === 'edge' && edge) {
      const direction = edge === 'left' || edge === 'right' ? 'horizontal' : 'vertical';
      const positionAfter = edge === 'right' || edge === 'bottom';
      const newPanelId = `panel-${nanoid(6)}`;
      
      // First create the new panel
      panelContext.splitPanel(panelId, direction, { 
        newPanelId, 
        positionAfter 
      });
      
      // Then move the tab to the new panel
      panelContext.moveTab(sourcePanelId, tabId, newPanelId);
      return;
    }
    
    // If dropping before/after a tab, we need to reorder
    if ((targetZone === 'before' || targetZone === 'after') && targetTabId) {
      // For now, just move the tab to the target panel
      // In a full implementation, you'd reorder the tabs too
      if (panelId !== sourcePanelId) {
        panelContext.moveTab(sourcePanelId, tabId, panelId);
      }
      return;
    }
    
    // Default case - just move the tab to the target panel
    if (panelId !== sourcePanelId) {
      panelContext.moveTab(sourcePanelId, tabId, panelId);
    }
  }, [panelContext]);
  
  // Create context value
  const contextValue = {
    addTab,
    closeTab,
    activateTab,
    moveTabToPanel,
    pinTab,
    duplicateTab,
    handleTabDrop
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