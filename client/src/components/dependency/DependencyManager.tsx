import React, { useState, useEffect } from 'react';
import { useDependencyContext } from '../../context/DependencyContext';
import { 
  DependencyDataTypes, 
  DependencyStatus,
  Dependency
} from '../../lib/dependency/DependencyInterfaces';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { 
  Link, 
  Link2, 
  Link2Off as LinkOff, 
  RefreshCcw, 
  ChevronDown, 
  ChevronUp, 
  LockOpen, 
  Lock 
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip';
import { Badge } from '../ui/badge';
import DependencyStatusIndicator from './DependencyStatusIndicator';
import DependencySelector from './DependencySelector';

interface DependencyManagerProps {
  componentId: string;
  title?: string;
  description?: string;
  showDetailedInfo?: boolean;
  maxHeight?: string;
}

const DependencyManager: React.FC<DependencyManagerProps> = ({
  componentId,
  title = 'Dependency Manager',
  description = 'Manage data connections for this component',
  showDetailedInfo = true,
  maxHeight = '320px'
}) => {
  const { registry, manager } = useDependencyContext();
  const [dependencies, setDependencies] = useState<{
    asProvider: Dependency[];
    asConsumer: Dependency[];
  }>({
    asProvider: [],
    asConsumer: []
  });
  const [lockedDependencies, setLockedDependencies] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<boolean>(false);

  // Load component dependencies
  useEffect(() => {
    const loadDependencies = () => {
      // Get dependencies where this component is a provider
      const asProvider = registry.getDependenciesByProvider(componentId);
      
      // Get dependencies where this component is a consumer
      const asConsumer = registry.getDependenciesByConsumer(componentId);
      
      setDependencies({
        asProvider,
        asConsumer
      });
    };
    
    loadDependencies();
    
    // Set up an interval to refresh dependencies periodically
    const interval = setInterval(loadDependencies, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [componentId, registry]);

  // Lock/unlock a dependency (prevents auto-disconnection)
  const toggleLockDependency = (dependencyId: string) => {
    const newLockedDependencies = new Set(lockedDependencies);
    
    if (newLockedDependencies.has(dependencyId)) {
      newLockedDependencies.delete(dependencyId);
    } else {
      newLockedDependencies.add(dependencyId);
    }
    
    setLockedDependencies(newLockedDependencies);
  };

  // Refresh dependency data
  const refreshDependency = (dependency: Dependency) => {
    if (dependency.consumerId === componentId) {
      // This component is the consumer, request data from provider
      manager.requestData(componentId, dependency.providerId, dependency.dataType);
    }
  };

  // Disconnect a dependency
  const removeDependency = (dependencyId: string) => {
    if (lockedDependencies.has(dependencyId)) {
      return; // Don't remove locked dependencies
    }
    
    registry.removeDependency(dependencyId);
    
    // Update local state immediately for UI responsiveness
    setDependencies(prev => ({
      asProvider: prev.asProvider.filter(dep => dep.id !== dependencyId),
      asConsumer: prev.asConsumer.filter(dep => dep.id !== dependencyId)
    }));
  };

  // Create a new dependency
  const createDependency = (providerId: string, dataType: DependencyDataTypes) => {
    const dependency = registry.createDependency(providerId, componentId, dataType);
    
    if (dependency) {
      // Request data from the provider
      manager.requestData(componentId, providerId, dataType);
      
      // Update local state immediately for UI responsiveness
      setDependencies(prev => ({
        ...prev,
        asConsumer: [...prev.asConsumer, dependency]
      }));
    }
  };

  // Whether to show the "Add" button based on dependencies
  const shouldShowAddButton = () => {
    // Check if there are any provider definitions available
    const availableProviders = Object.values(DependencyDataTypes)
      .flatMap(dataType => registry.getProviderDefinitions(dataType))
      .filter(provider => provider.componentId !== componentId);
    
    // Exclude providers that are already connected
    const existingProviderIds = new Set(
      dependencies.asConsumer.map(dep => dep.providerId)
    );
    
    const unusedProviders = availableProviders.filter(
      provider => !existingProviderIds.has(provider.componentId)
    );
    
    return unusedProviders.length > 0;
  };

  // Format data type name for display
  const formatDataTypeName = (dataType: string) => {
    return dataType
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get existing provider IDs
  const getExistingProviderIds = () => {
    return dependencies.asConsumer.map(dep => dep.providerId);
  };

  return (
    <Card>
      <CardHeader className={expanded ? 'pb-0' : 'pb-2'}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">{title}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {!expanded && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      {expanded && (
        <>
          <CardContent className={`pt-4 pb-0 ${showDetailedInfo ? 'px-4' : 'px-2'}`}>
            <CardDescription className="mb-3">{description}</CardDescription>
            
            <ScrollArea className={`pr-4 ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
              <Accordion type="multiple" className="w-full" defaultValue={['consumer', 'provider']}>
                {/* Dependencies where this component is a consumer */}
                <AccordionItem value="consumer" className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <span className="flex items-center">
                      <Badge variant="secondary" className="mr-2 text-xs py-0 px-1">
                        {dependencies.asConsumer.length}
                      </Badge>
                      Data Sources
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {dependencies.asConsumer.length === 0 ? (
                      <div className="py-2 px-1 text-sm text-muted-foreground flex items-center">
                        <Link className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/60" />
                        <span>No data sources connected</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dependencies.asConsumer.map(dependency => (
                          <Card key={dependency.id} className="border-muted/40">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <DependencyStatusIndicator status={dependency.status} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Status: {dependency.status}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span className="font-medium text-sm ml-1.5">
                                      {dependency.providerId}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <Badge variant="outline" className="font-normal px-1 py-0 text-[10px]">
                                      {formatDataTypeName(dependency.dataType)}
                                    </Badge>
                                    {showDetailedInfo && dependency.lastUpdated && (
                                      <span className="ml-2">
                                        Updated: {new Date(dependency.lastUpdated).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-6 w-6"
                                          onClick={() => toggleLockDependency(dependency.id)}
                                        >
                                          {lockedDependencies.has(dependency.id) ? (
                                            <Lock className="h-3 w-3" />
                                          ) : (
                                            <LockOpen className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {lockedDependencies.has(dependency.id) ? 
                                          "Unlock (allow disconnection)" : 
                                          "Lock (prevent disconnection)"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-6 w-6"
                                          onClick={() => refreshDependency(dependency)}
                                        >
                                          <RefreshCcw className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Refresh data
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-6 w-6 text-destructive/80 hover:text-destructive"
                                          onClick={() => removeDependency(dependency.id)}
                                          disabled={lockedDependencies.has(dependency.id)}
                                        >
                                          <LinkOff className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Disconnect
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
                
                {/* Dependencies where this component is a provider */}
                <AccordionItem value="provider" className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <span className="flex items-center">
                      <Badge variant="secondary" className="mr-2 text-xs py-0 px-1">
                        {dependencies.asProvider.length}
                      </Badge>
                      Data Consumers
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {dependencies.asProvider.length === 0 ? (
                      <div className="py-2 px-1 text-sm text-muted-foreground flex items-center">
                        <Link2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/60" />
                        <span>No components are consuming data from this component</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dependencies.asProvider.map(dependency => (
                          <Card key={dependency.id} className="border-muted/40">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <DependencyStatusIndicator status={dependency.status} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Status: {dependency.status}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span className="font-medium text-sm ml-1.5">
                                      {dependency.consumerId}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <Badge variant="outline" className="font-normal px-1 py-0 text-[10px]">
                                      {formatDataTypeName(dependency.dataType)}
                                    </Badge>
                                    {showDetailedInfo && dependency.lastUpdated && (
                                      <span className="ml-2">
                                        Updated: {new Date(dependency.lastUpdated).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-6 w-6 text-destructive/80 hover:text-destructive"
                                          onClick={() => removeDependency(dependency.id)}
                                        >
                                          <LinkOff className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Disconnect consumer
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="py-3 flex justify-end">
            {shouldShowAddButton() && (
              <DependencySelector
                currentComponentId={componentId}
                onCreateDependency={createDependency}
                existingProviderIds={getExistingProviderIds()}
                trigger={
                  <Button variant="outline" size="sm" className="flex items-center text-xs">
                    <Link className="w-3.5 h-3.5 mr-1" /> Add Data Source
                  </Button>
                }
              />
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default DependencyManager;