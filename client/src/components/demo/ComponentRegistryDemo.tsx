import React, { useState, useEffect } from 'react';
import { enhancedComponentRegistry, EnhancedComponentDefinition, ComponentCategory, ComponentVisibility } from '../../lib/enhancedComponentRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { componentEventBus, ComponentEventType, emitComponentEvent } from '../../lib/componentCommunication';

// Demo component to showcase the enhanced component registry capabilities
export function ComponentRegistryDemo() {
  // State for component instances and event logs
  const [components, setComponents] = useState<EnhancedComponentDefinition[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<EnhancedComponentDefinition[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<{id: string, timestamp: string, type: string, source: string, message: string}[]>([]);
  
  // Filter state
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<ComponentVisibility | 'all'>('all');
  
  // State for demo panel
  const [selectedComponent, setSelectedComponent] = useState<EnhancedComponentDefinition | null>(null);
  const [demoInstance, setDemoInstance] = useState<any | null>(null);
  
  // Load components on mount
  useEffect(() => {
    const allComponents = enhancedComponentRegistry.getAllComponents();
    setComponents(allComponents);
    setFilteredComponents(allComponents);
    
    // Subscribe to all events for logging purposes
    const unsubscribe = componentEventBus.subscribeToAll((event) => {
      setEventLogs(prev => [
        {
          id: event.id,
          timestamp: new Date(event.timestamp).toLocaleTimeString(),
          type: event.type,
          source: `${event.source.componentId} (${event.source.instanceId})`,
          message: JSON.stringify(event.payload).substring(0, 50) + (JSON.stringify(event.payload).length > 50 ? '...' : '')
        },
        ...prev.slice(0, 49) // Keep only the last 50 events
      ]);
    });
    
    return unsubscribe;
  }, []);
  
  // Update filtered components when filters change
  useEffect(() => {
    let filtered = components;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(comp => comp.category === activeCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.displayName.toLowerCase().includes(query) || 
        comp.description?.toLowerCase().includes(query) ||
        comp.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(comp => comp.visibility === visibilityFilter);
    }
    
    setFilteredComponents(filtered);
  }, [components, activeCategory, searchQuery, visibilityFilter]);
  
  // Create a demo instance of the selected component
  const createDemoInstance = () => {
    if (!selectedComponent) return;
    
    const instance = enhancedComponentRegistry.createInstance(
      selectedComponent.id,
      'demo-panel',
      `demo-tab-${Date.now()}`,
      selectedComponent.defaultConfig
    );
    
    if (instance) {
      setDemoInstance(instance);
      setInstances(prev => [...prev, instance]);
      
      // Emit a notification event
      emitComponentEvent(
        ComponentEventType.SYSTEM_NOTIFICATION,
        selectedComponent.id,
        instance.instanceId,
        { message: `Created new instance of ${selectedComponent.displayName}` }
      );
    }
  };
  
  // Get all unique categories for filtering
  const categories = ['all', ...new Set(components.map(comp => comp.category))];
  
  return (
    <div className="p-4 bg-neutral-950 text-white h-full overflow-auto">
      <h1 className="text-2xl font-bold mb-4">NEXUS Component Registry</h1>
      <p className="text-gray-400 mb-6">
        Manage and interact with all available NEXUS email components.
      </p>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Component catalog */}
        <div className="flex-1">
          <div className="mb-4 flex flex-col gap-3">
            <h2 className="text-lg font-medium">Component Catalog</h2>
            
            {/* Search and filters */}
            <div className="flex gap-2">
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              
              <Select 
                value={activeCategory} 
                onValueChange={(value: any) => setActiveCategory(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(c => c !== 'all').map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={visibilityFilter} 
                onValueChange={(value: any) => setVisibilityFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value={ComponentVisibility.ALWAYS}>Always</SelectItem>
                  <SelectItem value={ComponentVisibility.DEFAULT}>Default</SelectItem>
                  <SelectItem value={ComponentVisibility.ADVANCED}>Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Component list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {filteredComponents.length > 0 ? (
              filteredComponents.map(component => (
                <div 
                  key={component.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedComponent?.id === component.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedComponent(component)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {component.icon && (
                      <component.icon className="h-5 w-5 text-blue-400" />
                    )}
                    <h3 className="font-medium">{component.displayName}</h3>
                  </div>
                  
                  {component.description && (
                    <p className="text-sm text-gray-400 mb-2">{component.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs">
                      {component.category}
                    </span>
                    
                    {component.singleton && (
                      <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-xs">
                        singleton
                      </span>
                    )}
                    
                    {component.statePersistence && (
                      <span className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded text-xs">
                        {component.statePersistence}
                      </span>
                    )}
                    
                    {component.searchCapability && component.searchCapability !== 'none' && (
                      <span className="px-2 py-0.5 bg-amber-900/30 text-amber-300 rounded text-xs">
                        search: {component.searchCapability}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center border border-gray-700 rounded-lg">
                <p className="text-gray-400">No components match your filters</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right panel - Component details & demo */}
        <div className="lg:w-2/5">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="demo">Demo</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            
            {/* Component Details */}
            <TabsContent value="details" className="border border-gray-800 rounded-lg p-4 mt-2">
              {selectedComponent ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {selectedComponent.icon && (
                      <selectedComponent.icon className="h-6 w-6 text-blue-400" />
                    )}
                    <h2 className="text-xl font-bold">{selectedComponent.displayName}</h2>
                  </div>
                  
                  {selectedComponent.description && (
                    <p className="text-gray-300 mb-4">{selectedComponent.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-900 p-3 rounded">
                      <h3 className="text-sm font-medium text-gray-400">ID</h3>
                      <p className="text-sm font-mono">{selectedComponent.id}</p>
                    </div>
                    
                    <div className="bg-gray-900 p-3 rounded">
                      <h3 className="text-sm font-medium text-gray-400">Category</h3>
                      <p className="text-sm">{selectedComponent.category}</p>
                    </div>
                    
                    <div className="bg-gray-900 p-3 rounded">
                      <h3 className="text-sm font-medium text-gray-400">Panel Types</h3>
                      <p className="text-sm">
                        {selectedComponent.supportedPanelTypes?.join(', ') || 'any'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-900 p-3 rounded">
                      <h3 className="text-sm font-medium text-gray-400">State Persistence</h3>
                      <p className="text-sm">{selectedComponent.statePersistence || 'none'}</p>
                    </div>
                  </div>
                  
                  {selectedComponent.tags && selectedComponent.tags.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedComponent.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedComponent.integrations?.events && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Event Integration</h3>
                      <div className="bg-gray-900 p-3 rounded">
                        <div className="text-xs font-mono max-h-28 overflow-y-auto">
                          {selectedComponent.integrations.events.map(event => (
                            <div key={event} className="mb-1 pb-1 border-b border-gray-800">
                              {event}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={createDemoInstance}
                    className="mt-4 w-full"
                  >
                    Create Instance
                  </Button>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-400">Select a component to view details</p>
                </div>
              )}
            </TabsContent>
            
            {/* Demo Tab */}
            <TabsContent value="demo" className="border border-gray-800 rounded-lg p-4 mt-2">
              <h2 className="text-lg font-medium mb-4">Component Instances</h2>
              
              {instances.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {instances.map(instance => (
                    <div 
                      key={instance.instanceId}
                      className="p-3 border border-gray-700 rounded"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{
                            components.find(c => c.id === instance.componentId)?.displayName || 
                            instance.componentId
                          }</h3>
                          <p className="text-xs text-gray-400">{instance.instanceId}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              enhancedComponentRegistry.focusInstance(instance.instanceId);
                              emitComponentEvent(
                                ComponentEventType.UI_FOCUS,
                                instance.componentId,
                                instance.instanceId,
                                { message: 'Instance focused' }
                              );
                            }}
                          >
                            Focus
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              enhancedComponentRegistry.deleteInstance(instance.instanceId);
                              setInstances(prev => prev.filter(i => i.instanceId !== instance.instanceId));
                              if (demoInstance?.instanceId === instance.instanceId) {
                                setDemoInstance(null);
                              }
                              emitComponentEvent(
                                ComponentEventType.SYSTEM_NOTIFICATION,
                                instance.componentId,
                                instance.instanceId,
                                { message: `Deleted instance of ${
                                  components.find(c => c.id === instance.componentId)?.displayName || 
                                  instance.componentId
                                }` }
                              );
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-gray-700 rounded-lg">
                  <p className="text-gray-400">No instances created yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Select a component and click "Create Instance" to see it here
                  </p>
                </div>
              )}
            </TabsContent>
            
            {/* Events Tab */}
            <TabsContent value="events" className="border border-gray-800 rounded-lg p-4 mt-2">
              <h2 className="text-lg font-medium mb-4">Event Log</h2>
              
              {eventLogs.length > 0 ? (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {eventLogs.map(log => (
                    <div 
                      key={log.id}
                      className="p-2 border border-gray-800 rounded text-xs font-mono"
                    >
                      <div className="flex justify-between text-gray-400 mb-1">
                        <span>{log.timestamp}</span>
                        <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 rounded-sm">
                          {log.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Source: </span>
                        <span>{log.source}</span>
                      </div>
                      <div className="text-gray-300 mt-1 break-all">{log.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-gray-700 rounded-lg">
                  <p className="text-gray-400">No events recorded yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create and interact with instances to see events
                  </p>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    emitComponentEvent(
                      ComponentEventType.SYSTEM_NOTIFICATION,
                      'registry-demo',
                      'demo-instance',
                      { message: 'Test notification event' }
                    );
                  }}
                >
                  Test Event
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => setEventLogs([])}
                >
                  Clear Log
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ComponentRegistryDemo;