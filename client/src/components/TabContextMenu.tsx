import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useTabContext } from '../context/TabContext';
import { useDependencyContext } from '../context/DependencyContext';
import { 
  Copy, 
  X, 
  ExternalLink, 
  Maximize2, 
  Split, 
  PanelLeft, 
  PanelTop,
  LayoutPanelLeft,
  MoveHorizontal,
  Trash,
  Link,
  Link2Off,
  Pause,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DependencyDataTypes, DependencyStatus } from '../lib/dependency/DependencyInterfaces';

interface TabContextMenuProps {
  children: React.ReactNode;
  tabId: string;
  panelId: string;
}

/**
 * TabContextMenu provides a context menu for a tab
 * It offers functionality to close, duplicate, maximize, and move tabs
 * between panels.
 */
export function TabContextMenu({ children, tabId, panelId }: TabContextMenuProps) {
  const { 
    state, 
    closeTab, 
    moveTab, 
    maximizePanel,
    splitPanel,
    activateTab
  } = useTabContext();
  
  const {
    registry,
    suspendDependency,
    resumeDependency,
    removeDependency,
    suspendAllDependenciesForComponent
  } = useDependencyContext();
  
  const { toast } = useToast();
  
  // Get the tab data
  const tab = state.tabs[tabId];
  
  if (!tab) {
    console.error(`Tab with ID ${tabId} not found`);
    return <>{children}</>;
  }
  
  // Get dependencies for this tab
  const getTabDependencies = () => {
    const allDataTypes = Object.values(DependencyDataTypes);
    let dependencies = [];
    
    // Get dependencies where this tab is either provider or consumer
    for (const dataType of allDataTypes) {
      const depsForType = registry.getDependenciesByType(dataType);
      const filteredDeps = depsForType.filter(
        dep => dep.providerId === tabId || dep.consumerId === tabId
      );
      dependencies = [...dependencies, ...filteredDeps];
    }
    
    // Remove duplicates
    return Array.from(new Map(dependencies.map(dep => [dep.id, dep])).values());
  }
  
  // Handle close tab
  const handleCloseTab = () => {
    closeTab(tabId);
  };
  
  // Handle duplicate tab
  const handleDuplicateTab = () => {
    // Find the component ID and props from the tab
    const { componentId, props, title } = tab;
    
    // Temporary implementation - create a new tab with the same properties
    const newTabAction = {
      type: 'ADD_TAB' as const,
      payload: {
        componentId,
        panelId,
        props,
        title,
        icon: tab.icon,
        closeable: tab.closeable,
      }
    };
    
    // Dispatch the action to create a duplicate tab
    activateTab(tabId, panelId);
  };
  
  // Handle maximize tab
  const handleMaximizeTab = () => {
    // Activate the tab
    activateTab(tabId, panelId);
    // Maximize the panel
    maximizePanel(panelId);
  };
  
  // Handle moving tab to another panel
  const handleMoveTab = (targetPanelId: string) => {
    if (targetPanelId === panelId) {
      // No need to move to the same panel
      return;
    }
    
    console.log(`Moving tab ${tabId} from panel ${panelId} to panel ${targetPanelId}`);
    moveTab(tabId, panelId, targetPanelId);
  };
  
  // Handle splitting the panel and moving this tab to the new panel
  const handleSplitWithTab = (direction: 'horizontal' | 'vertical') => {
    // Create a unique ID for the new panel
    const newPanelId = `${panelId}-split-${Date.now()}`;
    
    // Split the current panel
    splitPanel(panelId, direction, {
      newPanelId,
      positionAfter: true
    });
    
    // Move the tab to the new panel after a short delay
    setTimeout(() => {
      moveTab(tabId, panelId, newPanelId);
    }, 50);
  };
  
  // Get all available panels as move targets
  const availablePanels = Object.entries(state.panels)
    .filter(([id, _]) => id !== panelId) // Filter out the current panel
    .map(([id, panel]) => ({
      id,
      type: panel.type,
      // Use a friendly display name based on panel type and ID
      displayName: getPanelDisplayName(id, panel.type)
    }));
    
  // Handle suspending a single dependency
  const handleSuspendDependency = (dependencyId: string) => {
    suspendDependency(dependencyId);
    toast({
      title: "Dependency Suspended",
      description: `Dependency ${dependencyId.substring(0, 8)} has been suspended.`,
      variant: "default",
    });
  };
  
  // Handle resuming a dependency
  const handleResumeDependency = (dependencyId: string) => {
    resumeDependency(dependencyId);
    toast({
      title: "Dependency Resumed",
      description: `Dependency ${dependencyId.substring(0, 8)} has been resumed.`,
      variant: "default",
    });
  };
  
  // Handle removing a dependency
  const handleRemoveDependency = (dependencyId: string) => {
    removeDependency(dependencyId);
    toast({
      title: "Dependency Removed",
      description: `Dependency ${dependencyId.substring(0, 8)} has been removed.`,
      variant: "default",
    });
  };
  
  // Handle suspending all dependencies for this component
  const handleSuspendAllDependencies = () => {
    suspendAllDependenciesForComponent(tabId);
    toast({
      title: "All Dependencies Suspended",
      description: `All dependencies for ${tab.title || tabId} have been suspended.`,
      variant: "default",
    });
  };
  
  // Handle resuming all dependencies for this component
  const handleResumeAllDependencies = () => {
    // Get all dependencies for this tab
    const dependencies = getTabDependencies();
    
    // Resume each dependency
    for (const dependency of dependencies) {
      if (dependency.status === DependencyStatus.SUSPENDED) {
        resumeDependency(dependency.id);
      }
    }
    
    toast({
      title: "All Dependencies Resumed",
      description: `All dependencies for ${tab.title || tabId} have been resumed.`,
      variant: "default",
    });
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="bg-neutral-800 border-neutral-700 text-neutral-200 z-50">
        <ContextMenuItem onClick={handleCloseTab} className="flex items-center focus:bg-neutral-700">
          <X size={16} className="mr-2 text-neutral-400" />
          <span>Close</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleDuplicateTab} className="flex items-center focus:bg-neutral-700">
          <Copy size={16} className="mr-2 text-neutral-400" />
          <span>Duplicate</span>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleMaximizeTab} className="flex items-center focus:bg-neutral-700">
          <Maximize2 size={16} className="mr-2 text-neutral-400" />
          <span>Maximize</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-neutral-700" />
        
        {/* Move to another panel submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center focus:bg-neutral-700">
            <MoveHorizontal size={16} className="mr-2 text-neutral-400" />
            <span>Move to panel</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-neutral-800 border-neutral-700 text-neutral-200">
            {availablePanels.length > 0 ? (
              availablePanels.map(panel => (
                <ContextMenuItem 
                  key={panel.id} 
                  onClick={() => handleMoveTab(panel.id)}
                  className="flex items-center focus:bg-neutral-700"
                >
                  <PanelLeft size={16} className="mr-2 text-neutral-400" />
                  <span>{panel.displayName}</span>
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className="text-neutral-500 focus:bg-neutral-800">
                No other panels available
              </ContextMenuItem>
            )}
            
            <ContextMenuSeparator className="bg-neutral-700" />
            
            {/* Split options */}
            <ContextMenuItem 
              onClick={() => handleSplitWithTab('horizontal')}
              className="flex items-center focus:bg-neutral-700"
            >
              <LayoutPanelLeft size={16} className="mr-2 text-neutral-400" />
              <span>New horizontal split</span>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => handleSplitWithTab('vertical')}
              className="flex items-center focus:bg-neutral-700"
            >
              <PanelTop size={16} className="mr-2 text-neutral-400" />
              <span>New vertical split</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Helper function to get a display name for a panel
function getPanelDisplayName(panelId: string, panelType: string): string {
  if (panelId === 'mainPanel') return 'Main Panel';
  if (panelId === 'leftSidebar') return 'Left Sidebar';
  if (panelId === 'rightSidebar') return 'Right Sidebar';
  if (panelId === 'bottomPanel') return 'Bottom Panel';
  if (panelId === 'leftMainPanel') return 'Left Main Panel';
  if (panelId === 'rightMainPanel') return 'Right Main Panel';
  
  // Generate a name based on type for dynamic panels
  if (panelType === 'main') return `Main Panel (${panelId.substring(0, 4)})`;
  if (panelType === 'sidebar') return `Sidebar (${panelId.substring(0, 4)})`;
  if (panelType === 'bottom') return `Bottom Panel (${panelId.substring(0, 4)})`;
  
  return `Panel ${panelId.substring(0, 4)}`;
}