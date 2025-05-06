import React, { useState, useEffect, useRef } from 'react';
import { useDependencyContext } from '../../context/DependencyContext';
import { DependencyDataTypes, DependencyStatus } from '../../lib/dependency/DependencyInterfaces';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { 
  Link2, 
  Link, 
  ChevronRight,
  ArrowRightLeft,
  Pause,
  Play,
  Trash,
  Link2Off
} from 'lucide-react';
import { useTabContext } from '../../context/TabContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface DependencyPickerProps {
  tabId: string;
  className?: string;
}

export function DependencyPicker({ tabId, className }: DependencyPickerProps) {
  const { 
    registry, 
    manager, 
    suspendDependency, 
    resumeDependency, 
    removeDependency,
    suspendAllDependenciesForComponent
  } = useDependencyContext();
  const { state } = useTabContext();
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [selectedDataType, setSelectedDataType] = useState<DependencyDataTypes | null>(null);
  const [isProvider, setIsProvider] = useState(true);
  const [dependencies, setDependencies] = useState<{ 
    providing: { id: string; dataType: DependencyDataTypes; consumerName: string; consumerId: string }[];
    consuming: { id: string; dataType: DependencyDataTypes; providerName: string; providerId: string }[];
  }>({ providing: [], consuming: [] });
  
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
    
    // Get providing dependencies
    const providingDeps = registry.getDependenciesByProvider(tabId).map(dep => ({
      id: dep.id,
      dataType: dep.dataType,
      consumerName: state.tabs[dep.consumerId]?.title || dep.consumerId,
      consumerId: dep.consumerId
    }));
    
    // Get consuming dependencies
    const consumingDeps = registry.getDependenciesByConsumer(tabId).map(dep => ({
      id: dep.id,
      dataType: dep.dataType,
      providerName: state.tabs[dep.providerId]?.title || dep.providerId,
      providerId: dep.providerId
    }));
    
    setDependencies({
      providing: providingDeps,
      consuming: consumingDeps
    });
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
      
      // Show toast to indicate successful connection
      toast({
        title: "Dependency Created",
        description: `Connected ${getTabName(tabId)} (${tabId.substring(0, 6)}...) to ${getTabName(targetTabId)} (${targetTabId.substring(0, 6)}...)`,
        variant: "default"
      });
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
  
  // Handle suspending a dependency
  const handleSuspendDependency = (dependencyId: string) => {
    suspendDependency(dependencyId);
    toast({
      title: "Dependency Suspended",
      description: `Dependency has been suspended.`,
      variant: "default",
    });
  };
  
  // Handle resuming a dependency
  const handleResumeDependency = (dependencyId: string) => {
    resumeDependency(dependencyId);
    toast({
      title: "Dependency Resumed",
      description: `Dependency has been resumed.`,
      variant: "default",
    });
  };
  
  // Handle removing a dependency
  const handleRemoveDependency = (dependencyId: string) => {
    removeDependency(dependencyId);
    toast({
      title: "Dependency Removed",
      description: `Dependency has been removed.`,
      variant: "default",
    });
  };
  
  // Handle suspending all dependencies for this component
  const handleSuspendAllDependencies = () => {
    suspendAllDependenciesForComponent(tabId);
    toast({
      title: "All Dependencies Suspended",
      description: `All dependencies for ${getTabName(tabId)} have been suspended.`,
      variant: "default",
    });
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
            
            <div className="bg-blue-900/20 rounded p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-blue-600/20 mr-2">Source</Badge>
                  <span className="font-medium">{getTabName(tabId)}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  ID: {tabId.substring(0, 8)}...
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isProvider ? 
                  `This tab will provide ${selectedDataType} data to the selected tab.` :
                  `This tab will consume ${selectedDataType} data from the selected tab.`
                }
              </p>
            </div>
            
            <div className="border-b pb-2 mb-2">
              <h4 className="text-sm font-medium mb-1">Available tabs</h4>
              <p className="text-xs text-muted-foreground">
                Select a tab to {isProvider ? 'send data to' : 'receive data from'}
              </p>
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {availableTabs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No other tabs available
                </div>
              ) : (
                availableTabs.map(otherTabId => (
                  <div 
                    key={otherTabId}
                    className="p-2 mb-2 border border-blue-500/20 hover:bg-accent/50 rounded-sm cursor-pointer"
                    onClick={() => handleCreateDependency(otherTabId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center">
                          {getTabName(otherTabId)}
                          <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 bg-blue-900/10">
                            ID: {otherTabId.substring(0, 8)}...
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{getPanelName(otherTabId)}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
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
            className={`h-4 w-4 p-0 rounded-full opacity-70 hover:opacity-100 hover:bg-transparent ${className}`}
            title="Create tab dependencies"
          >
            <Link2 
              className={`h-3 w-3 ${
                dependencies.providing.length > 0 || dependencies.consuming.length > 0
                  ? 'text-blue-400'
                  : 'text-gray-400'
              }`} 
            />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-2" align="end">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Tab Dependencies</h4>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Connect this tab to another tab to share data.
              </p>
              <Badge variant="outline" className="text-xs">
                ID: {tabId.substring(0, 8)}...
              </Badge>
            </div>
            
            {/* Show existing dependencies if any */}
            {(dependencies.providing.length > 0 || dependencies.consuming.length > 0) && (
              <div className="border rounded-md p-2 space-y-2 bg-blue-50/10">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-medium">Active Dependencies</h5>
                  
                  {(dependencies.providing.length > 0 || dependencies.consuming.length > 0) && (
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-amber-400 hover:text-amber-500"
                        onClick={handleSuspendAllDependencies}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Suspend All
                      </Button>
                    </div>
                  )}
                </div>
                
                {dependencies.providing.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Providing data to:</div>
                    {dependencies.providing.map(dep => {
                      const dependency = registry.getDependency(dep.id);
                      const isSuspended = dependency?.status === DependencyStatus.SUSPENDED;
                      
                      return (
                        <div key={dep.id} className="flex items-center p-1 text-xs bg-blue-100/10 rounded group">
                          <ArrowRightLeft className="h-3 w-3 mr-1 text-blue-500" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{dep.consumerName}</span>
                              <span className="text-muted-foreground text-xs">{dep.dataType}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              ID: {dep.consumerId.substring(0, 6)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isSuspended ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-green-400 hover:text-green-500"
                                onClick={() => handleResumeDependency(dep.id)}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-amber-400 hover:text-amber-500"
                                onClick={() => handleSuspendDependency(dep.id)}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-500"
                              onClick={() => handleRemoveDependency(dep.id)}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {dependencies.consuming.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="text-xs text-muted-foreground">Consuming data from:</div>
                    {dependencies.consuming.map(dep => {
                      const dependency = registry.getDependency(dep.id);
                      const isSuspended = dependency?.status === DependencyStatus.SUSPENDED;
                      
                      return (
                        <div key={dep.id} className="flex items-center p-1 text-xs bg-blue-100/10 rounded group">
                          <ArrowRightLeft className="h-3 w-3 mr-1 text-green-500" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{dep.providerName}</span>
                              <span className="text-muted-foreground text-xs">{dep.dataType}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              ID: {dep.providerId.substring(0, 6)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isSuspended ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-green-400 hover:text-green-500"
                                onClick={() => handleResumeDependency(dep.id)}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-amber-400 hover:text-amber-500"
                                onClick={() => handleSuspendDependency(dep.id)}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-500"
                              onClick={() => handleRemoveDependency(dep.id)}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Create new dependencies */}
            <div className="border rounded-md p-2 space-y-2">
              <h5 className="text-xs font-medium">Provide data to another tab</h5>
              <div className="grid grid-cols-2 gap-1">
                {dataTypes.map(type => (
                  <Badge 
                    key={`provide-${type}`}
                    variant="outline"
                    className="justify-start cursor-pointer hover:bg-accent/50 flex items-center"
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
                    className="justify-start cursor-pointer hover:bg-accent/50 flex items-center"
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