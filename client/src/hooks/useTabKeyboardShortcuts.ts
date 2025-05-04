import { useEffect, useCallback } from 'react';
import tabFactory from '../services/TabFactory';
import { useTabContext } from '../context/TabContext';

interface UseTabKeyboardShortcutsOptions {
  openCommandPalette: () => void;
}

export function useTabKeyboardShortcuts({ 
  openCommandPalette 
}: UseTabKeyboardShortcutsOptions) {
  const tabContext = useTabContext();

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Ctrl+P or Cmd+P for command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    // Check for Ctrl+T or Cmd+T for new tab
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      // Default to opening email list in current panel
      tabFactory.createTab(
        tabContext,
        { componentId: 'email-list' }
      );
      return;
    }

    // Check for Ctrl+W or Cmd+W to close current tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault();
      if (tabContext.state.activeTabId) {
        tabContext.closeTab(tabContext.state.activeTabId);
      }
      return;
    }

    // Check for Alt+[number] to switch to specific tab in active panel
    if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) >= 1 && parseInt(e.key) <= 9) {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      const activePanelId = tabContext.state.activePanelId;
      
      if (activePanelId) {
        const activePanel = tabContext.state.panels[activePanelId];
        if (activePanel && activePanel.tabs.length > index) {
          const tabId = activePanel.tabs[index];
          tabContext.activateTab(tabId, activePanelId);
        }
      }
      return;
    }

    // Check for Ctrl+Tab or Cmd+Tab to switch to next tab in active panel
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      const activePanelId = tabContext.state.activePanelId;
      
      if (activePanelId) {
        const activePanel = tabContext.state.panels[activePanelId];
        if (activePanel && activePanel.tabs.length > 1) {
          const currentTabIndex = activePanel.tabs.findIndex(id => id === activePanel.activeTabId);
          const nextIndex = (currentTabIndex + 1) % activePanel.tabs.length;
          const nextTabId = activePanel.tabs[nextIndex];
          tabContext.activateTab(nextTabId, activePanelId);
        }
      }
      return;
    }

    // Check for Ctrl+Shift+Tab or Cmd+Shift+Tab to switch to previous tab in active panel
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      const activePanelId = tabContext.state.activePanelId;
      
      if (activePanelId) {
        const activePanel = tabContext.state.panels[activePanelId];
        if (activePanel && activePanel.tabs.length > 1) {
          const currentTabIndex = activePanel.tabs.findIndex(id => id === activePanel.activeTabId);
          const prevIndex = (currentTabIndex - 1 + activePanel.tabs.length) % activePanel.tabs.length;
          const prevTabId = activePanel.tabs[prevIndex];
          tabContext.activateTab(prevTabId, activePanelId);
        }
      }
      return;
    }
  }, [tabContext, openCommandPalette]);

  // Add and remove event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useTabKeyboardShortcuts;