import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useDependencyContext } from '../../context/DependencyContext';
import { 
  DependencyDataTypes, 
  DependencyStatus,
  DependencyDefinition,
  Dependency
} from '../../lib/dependency/DependencyInterfaces';
import DependencyManager from './DependencyManager';
import DependencyIndicator from './DependencyIndicator';
import DependencyStatusIndicator from './DependencyStatusIndicator';
import { 
  Link, 
  Link2, 
  Network, 
  Activity, 
  TableProperties, 
  AreaChart, 
  Settings,
  RefreshCcw,
  Filter,
  ExternalLink
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { nanoid } from 'nanoid';
import { cn } from '../../lib/utils';

interface DependencyPanelProps {
  componentId?: string;
  tabId?: string;
}

export function DependencyPanel({ componentId = 'dependency-panel', tabId }: DependencyPanelProps) {
  const { registry, manager } = useDependencyContext();
  const [activeDependencies, setActiveDependencies] = useState<Dependency[]>([]);
  const [chainView, setChainView] = useState<boolean>(false);
  const [selectedDataType, setSelectedDataType] = useState<DependencyDataTypes | null>(null);
  
  // Get all active dependencies
  useEffect(() => {
    const refreshDependencies = () => {
      // Get all dependencies from the registry
      const allDependencies = Array.from(registry.getDependenciesByType(
        // Get dependencies of all types 
        Object.values(DependencyDataTypes)[0]
      ));
      
      // Also get other types
      Object.values(DependencyDataTypes).slice(1).forEach(type => {
        const typeDependencies = registry.getDependenciesByType(type);
        allDependencies.push(...typeDependencies);
      });
      
      setActiveDependencies(allDependencies);
    };
    
    refreshDependencies();
    
    // Set up interval to refresh periodically
    const interval = setInterval(refreshDependencies, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [registry]);
  
  // Filter dependencies by data type if selected
  const filteredDependencies = selectedDataType 
    ? activeDependencies.filter(dep => dep.dataType === selectedDataType)
    : activeDependencies;
  
  // Count dependencies by data type
  const dependencyCountsByType = activeDependencies.reduce((acc, dep) => {
    acc[dep.dataType] = (acc[dep.dataType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count dependencies by status
  const dependencyCountsByStatus = activeDependencies.reduce((acc, dep) => {
    acc[dep.status] = (acc[dep.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Format data type for display
  const formatDataType = (dataType: string) => {
    return dataType
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Function to calculate chains
  const dependencyChains = React.useMemo(() => {
    const chains: { 
      id: string;
      components: string[];
      dataType: DependencyDataTypes;
      length: number;
    }[] = [];
    
    // First pass - identify all starting points (components that provide data but don't consume it)
    const startingComponents = new Set<string>();
    const consumers = new Set<string>();
    
    activeDependencies.forEach(dep => {
      startingComponents.add(dep.providerId);
      consumers.add(dep.consumerId);
    });
    
    // Remove components that are also consumers
    consumers.forEach(consumer => {
      startingComponents.delete(consumer);
    });
    
    // For each starting component, follow the chain
    startingComponents.forEach(startComponent => {
      // For each data type this component provides
      const dataTypes = new Set(
        activeDependencies
          .filter(dep => dep.providerId === startComponent)
          .map(dep => dep.dataType)
      );
      
      dataTypes.forEach(dataType => {
        const findChains = (
          currentComponent: string, 
          currentChain: string[], 
          visited = new Set<string>()
        ) => {
          if (visited.has(currentComponent)) {
            return; // Prevent cycles
          }
          
          visited.add(currentComponent);
          const nextComponents = activeDependencies
            .filter(dep => 
              dep.providerId === currentComponent && 
              dep.dataType === dataType
            )
            .map(dep => dep.consumerId);
          
          if (nextComponents.length === 0) {
            // End of chain
            if (currentChain.length > 1) {
              chains.push({
                id: nanoid(),
                components: [...currentChain],
                dataType,
                length: currentChain.length
              });
            }
            return;
          }
          
          // Continue the chain for each next component
          nextComponents.forEach(nextComponent => {
            findChains(
              nextComponent, 
              [...currentChain, nextComponent],
              new Set(visited)
            );
          });
        };
        
        // Start the chain with the current component
        findChains(startComponent, [startComponent]);
      });
    });
    
    return chains;
  }, [activeDependencies]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center">
                <AreaChart className="h-4 w-4 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center">
                <TableProperties className="h-4 w-4 mr-1.5" />
                Components
              </TabsTrigger>
              <TabsTrigger value="chains" className="flex items-center">
                <Link2 className="h-4 w-4 mr-1.5" />
                Chains
              </TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center">
                <Activity className="h-4 w-4 mr-1.5" />
                Monitor
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => setSelectedDataType(null)}
              >
                <Filter className="h-3 w-3" />
                {selectedDataType ? formatDataType(selectedDataType) : 'All Types'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {}}
              >
                <RefreshCcw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>
          
          <TabsContent value="overview" className="flex-1 outline-none flex flex-col space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dependency System Overview</CardTitle>
                <CardDescription>
                  Visualize and manage component dependencies in your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-1 pt-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Network className="h-4 w-4 mr-1.5 text-blue-500" />
                        Active Dependencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">{activeDependencies.length}</div>
                      <div className="text-xs text-muted-foreground">
                        Between {new Set([
                          ...activeDependencies.map(d => d.providerId), 
                          ...activeDependencies.map(d => d.consumerId)
                        ]).size} components
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-1 pt-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Link2 className="h-4 w-4 mr-1.5 text-purple-500" />
                        Dependency Chains
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">{dependencyChains.length}</div>
                      <div className="text-xs text-muted-foreground">
                        Longest: {dependencyChains.reduce((max, chain) => Math.max(max, chain.length), 0)} components
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-1 pt-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <TableProperties className="h-4 w-4 mr-1.5 text-teal-500" />
                        Data Types
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold">{Object.keys(dependencyCountsByType).length}</div>
                      <div className="text-xs text-muted-foreground">
                        Most common: {Object.entries(dependencyCountsByType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Data Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dependencyCountsByType).map(([dataType, count]) => (
                      <Badge 
                        key={dataType} 
                        variant={selectedDataType === dataType ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedDataType(selectedDataType === dataType ? null : dataType as DependencyDataTypes)}
                      >
                        {formatDataType(dataType)}
                        <span className="ml-1.5 text-xs">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dependencyCountsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <DependencyStatusIndicator status={status as DependencyStatus} />
                        <span className="text-sm">{status}</span>
                        <span className="text-xs text-muted-foreground">({count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Active Dependencies</CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {filteredDependencies.length} active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-2">
                    {filteredDependencies.map(dependency => (
                      <Card key={dependency.id} className="border-muted/50">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <DependencyStatusIndicator status={dependency.status} />
                              <span className="font-medium text-sm">{dependency.providerId}</span>
                              <span className="text-muted-foreground mx-1">→</span>
                              <span className="font-medium text-sm">{dependency.consumerId}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatDataType(dependency.dataType)}
                            </Badge>
                          </div>
                          {dependency.lastUpdated && (
                            <div className="text-xs text-muted-foreground mt-1.5">
                              Last updated: {new Date(dependency.lastUpdated).toLocaleTimeString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {filteredDependencies.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        <Network className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No active dependencies {selectedDataType && `for ${formatDataType(selectedDataType)}`}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="components" className="flex-1 outline-none mt-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={60}>
                <Card className="h-full border-0 rounded-none">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <TableProperties className="h-4 w-4 mr-1.5" />
                      Component Registry
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100%-48px)]">
                      <div className="p-3 space-y-3">
                        {Object.entries(
                          // Group definitions by component ID
                          Object.values(DependencyDataTypes).reduce((acc: Record<string, DependencyDefinition[]>, dataType) => {
                            // Get all definitions for this type
                            const defs = registry.getDefinitionsByType(dataType);
                            
                            // Group by component ID
                            defs.forEach(def => {
                              acc[def.componentId] = acc[def.componentId] || [];
                              acc[def.componentId].push(def);
                            });
                            
                            return acc;
                          }, {})
                        ).map(([componentId, definitions]) => (
                          <Card key={componentId} className="border-muted/40">
                            <CardHeader className="py-2 px-3">
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-sm flex items-center">
                                  <DependencyIndicator 
                                    componentId={componentId} 
                                    variant="badge" 
                                    position="inline" 
                                    className="mr-2" 
                                  />
                                  {componentId}
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="py-1 px-3">
                              <div className="text-xs space-y-1">
                                {definitions.length > 0 ? (
                                  <div className="space-y-1">
                                    {definitions.map(def => (
                                      <div key={def.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                          {def.role === 'provider' ? (
                                            <Link2 className="h-3 w-3 text-blue-500" />
                                          ) : (
                                            <Link className="h-3 w-3 text-green-500" />
                                          )}
                                          <span>{formatDataType(def.dataType)}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                                          {def.role}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">No dependency definitions</div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </ResizablePanel>
              
              <ResizableHandle />
              
              <ResizablePanel defaultSize={40}>
                <Card className="h-full border-0 rounded-none">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Settings className="h-4 w-4 mr-1.5" />
                      Component Manager
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a component from the registry to view and manage its dependencies
                    </p>
                    
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm">
                            Dependency Visualization
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md">
                            <div className="text-center text-muted-foreground">
                              <Network className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Interactive visualization coming soon</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="chains" className="flex-1 outline-none mt-0">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center">
                    <Link2 className="h-4 w-4 mr-1.5" />
                    Dependency Chains
                  </CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {dependencyChains.length} chains
                  </Badge>
                </div>
                <CardDescription>
                  Multi-level dependencies between components
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-260px)]">
                  <div className="p-3 space-y-3">
                    {dependencyChains.length > 0 ? (
                      dependencyChains.map(chain => (
                        <Card key={chain.id} className="border-muted/50">
                          <CardHeader className="py-2 px-3">
                            <div className="flex justify-between items-center">
                              <Badge variant="outline">
                                {formatDataType(chain.dataType)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {chain.length} components
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="py-1 px-3">
                            <div className="flex items-center flex-wrap">
                              {chain.components.map((component, index) => (
                                <React.Fragment key={`${chain.id}-${component}`}>
                                  <span className={cn(
                                    "text-sm py-1 px-1.5 rounded", 
                                    index === 0 ? "bg-blue-500/10 text-blue-500" : 
                                    index === chain.components.length - 1 ? "bg-green-500/10 text-green-500" : 
                                    "bg-muted"
                                  )}>
                                    {component}
                                  </span>
                                  {index < chain.components.length - 1 && (
                                    <span className="mx-1 text-muted-foreground">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Link2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No dependency chains found</p>
                        <p className="text-sm mt-1">Create dependencies between components to see chains</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="monitor" className="flex-1 outline-none mt-0">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Activity className="h-4 w-4 mr-1.5" />
                  Dependency Events Monitor
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of dependency events and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        Event Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 p-3 bg-black/80 rounded-md text-xs font-mono text-green-400 overflow-auto">
                        {/* Placeholder for logs - since the registry doesn't directly expose logs */}
                        <div className="text-gray-500 italic">
                          <p>Dependency system initialized</p>
                          <p className="mt-1">Ready to monitor dependency events</p>
                          <p className="mt-1">Add dependencies between components to see events here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                        <div className="text-center text-muted-foreground">
                          <AreaChart className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Performance monitoring coming soon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DependencyPanel;