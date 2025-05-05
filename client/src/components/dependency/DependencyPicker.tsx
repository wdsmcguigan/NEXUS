import React, { useState, useEffect, useRef } from 'react';
import { useDependencyContext } from '../../context/DependencyContext';
import { DependencyDataTypes, DependencyStatus } from '../../lib/dependency/DependencyInterfaces';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { 
  Pipette, 
  Link, 
  ChevronRight 
} from 'lucide-react';
import { useTabContext } from '../../context/TabContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DependencyPickerProps {
  tabId: string;
  className?: string;
}

export function DependencyPicker({ tabId, className }: DependencyPickerProps) {
  const { registry, manager } = useDependencyContext();
  const { state } = useTabContext();
  const [isActive, setIsActive] = useState(false);
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [selectedDataType, setSelectedDataType] = useState<DependencyDataTypes | null>(null);
  const [isProvider, setIsProvider] = useState(true);
  
  // Get available data types for this component
  const dataTypes = Object.values(DependencyDataTypes);
  
  // Create a ref to detect click outside
  const popoverRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Get all tabs except the current one
    const allTabs = Object.values(state.tabs);
    const otherTabs = allTabs.filter(tab => tab.id !== tabId);
    setAvailableTabs(otherTabs.map(tab => tab.id));
    
    // Check if component has any dependency definitions
    const defs = registry.getDefinitionsByComponent(tabId);
    setIsActive(defs.length > 0);
  }, [tabId, registry, state.tabs]);
  
  // Start picking mode
  const handleStartPicking = (dataType: DependencyDataTypes, asProvider: boolean) => {
    setSelectedDataType(dataType);
    setIsProvider(asProvider);
    setIsPickingMode(true);
  };
  
  // Exit picking mode
  const handleCancelPicking = () => {
    setIsPickingMode(false);
    setSelectedDataType(null);
  };
  
  // Create dependency between tabs
  const handleCreateDependency = (targetTabId: string) => {
    if (!selectedDataType) return;
    
    // Register dependency definitions if they don't exist
    const sourceId = `${tabId}-${selectedDataType}-${isProvider ? 'provider' : 'consumer'}-${Math.random().toString(36).substring(2, 8)}`;
    const targetId = `${targetTabId}-${selectedDataType}-${isProvider ? 'consumer' : 'provider'}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Create the source definition
    registry.registerDefinition({
      id: sourceId,
      componentId: tabId,
      dataType: selectedDataType,
      role: isProvider ? 'provider' : 'consumer',
      description: `${isProvider ? 'Provides' : 'Consumes'} ${selectedDataType} data`,
      required: false,
      priority: 1
    });
    
    // Create the target definition
    registry.registerDefinition({
      id: targetId,
      componentId: targetTabId,
      dataType: selectedDataType,
      role: isProvider ? 'consumer' : 'provider',
      description: `${isProvider ? 'Consumes' : 'Provides'} ${selectedDataType} data`,
      required: false,
      priority: 1
    });
    
    // Create the dependency relationship
    const providerId = isProvider ? tabId : targetTabId;
    const consumerId = isProvider ? targetTabId : tabId;
    const dependency = registry.createDependency(providerId, consumerId, selectedDataType);
    
    if (dependency) {
      // Set initial status to connected
      registry.updateDependencyStatus(dependency.id, DependencyStatus.CONNECTED);
      
      // Add initial data if needed
      if (isProvider) {
        // Send some initial data
        manager.updateData(tabId, selectedDataType, { message: "Initial data from provider" });
      }
    }
    
    // Exit picking mode
    handleCancelPicking();
  };
  
  // Get display name for tab
  const getTabName = (tabId: string) => {
    const tab = state.tabs[tabId];
    return tab ? tab.title : tabId;
  };
  
  // Get panel name for tab
  const getPanelName = (tabId: string) => {
    const tab = state.tabs[tabId];
    if (!tab) return 'Unknown Panel';
    
    const panel = state.panels[tab.panelId];
    if (!panel) return 'Unknown Panel';
    
    // Create a readable name based on panel id
    return tab.panelId
      .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/Panel$/, ' Panel'); // Add space before Panel
  };
  
  return (
    <>
      {isPickingMode && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center pointer-events-auto">
          <div className="bg-background rounded-lg shadow-lg p-4 max-w-md w-full" ref={popoverRef}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Choose a tab to {isProvider ? 'receive from' : 'provide to'}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCancelPicking}>
                Cancel
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {isProvider ? 
                `Your tab "${getTabName(tabId)}" will provide ${selectedDataType} data to the selected tab.` :
                `Your tab "${getTabName(tabId)}" will consume ${selectedDataType} data from the selected tab.`
              }
            </p>
            
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {availableTabs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No other tabs available
                </div>
              ) : (
                availableTabs.map(otherTabId => (
                  <div 
                    key={otherTabId}
                    className="p-2 border-b last:border-b-0 hover:bg-accent/50 rounded-sm cursor-pointer"
                    onClick={() => handleCreateDependency(otherTabId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{getTabName(otherTabId)}</div>
                        <div className="text-xs text-muted-foreground">{getPanelName(otherTabId)}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-5 w-5 p-0 rounded-full opacity-70 hover:opacity-100 hover:bg-transparent ${className}`}
            title="Create tab dependencies"
          >
            <Pipette className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-2" align="end">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Create Tab Dependencies</h4>
            <p className="text-xs text-muted-foreground">
              Connect this tab to another tab to share data between them.
            </p>
            
            <div className="border rounded-md p-2 space-y-2">
              <h5 className="text-xs font-medium">Provide data to another tab</h5>
              <div className="grid grid-cols-2 gap-1">
                {dataTypes.map(type => (
                  <Badge 
                    key={`provide-${type}`}
                    variant="outline"
                    className="justify-start cursor-pointer hover:bg-accent/50"
                    onClick={() => handleStartPicking(type, true)}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="border rounded-md p-2 space-y-2">
              <h5 className="text-xs font-medium">Consume data from another tab</h5>
              <div className="grid grid-cols-2 gap-1">
                {dataTypes.map(type => (
                  <Badge 
                    key={`consume-${type}`}
                    variant="outline"
                    className="justify-start cursor-pointer hover:bg-accent/50"
                    onClick={() => handleStartPicking(type, false)}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

export default DependencyPicker;