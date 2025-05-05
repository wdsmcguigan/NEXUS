import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DependencyIndicator } from '../dependency/DependencyIndicator';
import { DependencyDataTypes, DependencyStatus } from '../../lib/dependency/DependencyInterfaces';
import { useDependencyContext } from '../../context/DependencyContext';
import { nanoid } from 'nanoid';

// Components for the demo
const DataProducer = ({ id }: { id: string }) => {
  const { registry, manager } = useDependencyContext();
  const [data, setData] = useState<string>('Hello World');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Register as a data provider on mount
  useEffect(() => {
    registry.registerDefinition({
      id: `${id}-provider-text`,
      componentId: id,
      dataType: DependencyDataTypes.SETTINGS,
      role: 'provider',
      description: 'Provides text data to consumers'
    });
    
    return () => {
      registry.removeDefinition(`${id}-provider-text`);
    };
  }, [id, registry]);
  
  // Update data when connected
  useEffect(() => {
    if (isConnected) {
      manager.updateData(id, DependencyDataTypes.SETTINGS, data);
    }
  }, [data, id, manager, isConnected]);
  
  return (
    <Card className="relative h-full">
      <DependencyIndicator componentId={id} variant="dot" className="z-10" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Data Producer</CardTitle>
          <Badge variant="outline" className="font-normal">
            {id}
          </Badge>
        </div>
        <CardDescription>
          Provides text data for consumers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-switch`}>Connected</Label>
            <Switch 
              id={`${id}-switch`} 
              checked={isConnected} 
              onCheckedChange={setIsConnected} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${id}-data`}>Data Value</Label>
            <Select 
              value={data} 
              onValueChange={setData} 
              disabled={!isConnected}
            >
              <SelectTrigger id={`${id}-data`}>
                <SelectValue placeholder="Select data to provide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hello World">Hello World</SelectItem>
                <SelectItem value="Dependency Demo">Dependency Demo</SelectItem>
                <SelectItem value="NEXUS Email">NEXUS Email</SelectItem>
                <SelectItem value="React Component">React Component</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          disabled={!isConnected}
          onClick={() => manager.updateData(id, DependencyDataTypes.SETTINGS, data)}
        >
          Publish Data
        </Button>
      </CardFooter>
    </Card>
  );
};

const DataConsumer = ({ id, providerId }: { id: string, providerId: string }) => {
  const { registry, manager } = useDependencyContext();
  const [receivedData, setReceivedData] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [dependency, setDependency] = useState<string | null>(null);
  
  // Register as a consumer on mount
  useEffect(() => {
    registry.registerDefinition({
      id: `${id}-consumer-text`,
      componentId: id,
      dataType: DependencyDataTypes.SETTINGS,
      role: 'consumer',
      description: 'Consumes text data from providers'
    });
    
    return () => {
      registry.removeDefinition(`${id}-consumer-text`);
    };
  }, [id, registry]);
  
  // Create/remove dependency when connection status changes
  useEffect(() => {
    if (isConnected && !dependency) {
      // Create dependency
      const newDep = registry.createDependency(
        providerId, 
        id, 
        DependencyDataTypes.SETTINGS
      );
      
      if (newDep) {
        setDependency(newDep.id);
      }
    } else if (!isConnected && dependency) {
      // Remove dependency
      registry.removeDependency(dependency);
      setDependency(null);
      setReceivedData(null);
    }
    
    return () => {
      if (dependency) {
        registry.removeDependency(dependency);
      }
    };
  }, [isConnected, dependency, providerId, id, registry]);
  
  // Subscribe to data updates
  useEffect(() => {
    if (!dependency) return;
    
    const unsubscribe = manager.onDataUpdated((depId, data) => {
      if (depId === dependency) {
        setReceivedData(data);
      }
    });
    
    return unsubscribe;
  }, [dependency, manager]);
  
  return (
    <Card className="relative h-full">
      <DependencyIndicator componentId={id} variant="dot" className="z-10" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Data Consumer</CardTitle>
          <Badge variant="outline" className="font-normal">
            {id}
          </Badge>
        </div>
        <CardDescription>
          Receives text data from providers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-switch`}>Connected</Label>
            <Switch 
              id={`${id}-switch`} 
              checked={isConnected} 
              onCheckedChange={setIsConnected} 
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <div className="mt-1 font-mono text-xs bg-muted p-2 rounded">
              {providerId}
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Received Data</Label>
            <div className="mt-1 font-mono text-xs bg-muted p-2 rounded min-h-[40px] flex items-center">
              {receivedData || <span className="text-muted-foreground italic">No data received</span>}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          disabled={!isConnected}
          onClick={() => {
            if (dependency) {
              manager.requestData(id, providerId, DependencyDataTypes.SETTINGS);
            }
          }}
        >
          Request Latest Data
        </Button>
      </CardFooter>
    </Card>
  );
};

const Transformer = ({ id, providerId, consumerId }: { id: string, providerId: string, consumerId: string }) => {
  const { registry, manager } = useDependencyContext();
  const [receivedData, setReceivedData] = useState<string | null>(null);
  const [transformedData, setTransformedData] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [incomingDep, setIncomingDep] = useState<string | null>(null);
  const [outgoingDep, setOutgoingDep] = useState<string | null>(null);
  
  // Register as both consumer and provider
  useEffect(() => {
    registry.registerDefinition({
      id: `${id}-consumer-text`,
      componentId: id,
      dataType: DependencyDataTypes.SETTINGS,
      role: 'consumer',
      description: 'Consumes text data from providers'
    });
    
    registry.registerDefinition({
      id: `${id}-provider-text`,
      componentId: id,
      dataType: DependencyDataTypes.SETTINGS,
      role: 'provider',
      description: 'Provides transformed text data to consumers'
    });
    
    return () => {
      registry.removeDefinition(`${id}-consumer-text`);
      registry.removeDefinition(`${id}-provider-text`);
    };
  }, [id, registry]);
  
  // Transform data when it's received
  useEffect(() => {
    if (receivedData) {
      // Simple transformation: uppercase and add timestamp
      const transformed = `${receivedData.toUpperCase()} (${new Date().toLocaleTimeString()})`;
      setTransformedData(transformed);
      
      // Push transformed data to consumers
      if (isConnected) {
        manager.updateData(id, DependencyDataTypes.SETTINGS, transformed);
      }
    }
  }, [receivedData, id, manager, isConnected]);
  
  // Create/remove dependencies when connection status changes
  useEffect(() => {
    if (isConnected) {
      if (!incomingDep) {
        // Create incoming dependency
        const newInDep = registry.createDependency(
          providerId, 
          id, 
          DependencyDataTypes.SETTINGS
        );
        
        if (newInDep) {
          setIncomingDep(newInDep.id);
        }
      }
      
      if (!outgoingDep) {
        // Create outgoing dependency
        const newOutDep = registry.createDependency(
          id, 
          consumerId, 
          DependencyDataTypes.SETTINGS
        );
        
        if (newOutDep) {
          setOutgoingDep(newOutDep.id);
        }
      }
    } else {
      // Remove dependencies
      if (incomingDep) {
        registry.removeDependency(incomingDep);
        setIncomingDep(null);
      }
      
      if (outgoingDep) {
        registry.removeDependency(outgoingDep);
        setOutgoingDep(null);
      }
      
      setReceivedData(null);
      setTransformedData(null);
    }
    
    return () => {
      if (incomingDep) registry.removeDependency(incomingDep);
      if (outgoingDep) registry.removeDependency(outgoingDep);
    };
  }, [isConnected, incomingDep, outgoingDep, providerId, consumerId, id, registry]);
  
  // Subscribe to data updates
  useEffect(() => {
    if (!incomingDep) return;
    
    const unsubscribe = manager.onDataUpdated((depId, data) => {
      if (depId === incomingDep) {
        setReceivedData(data);
      }
    });
    
    return unsubscribe;
  }, [incomingDep, manager]);
  
  return (
    <Card className="relative h-full">
      <DependencyIndicator componentId={id} variant="dot" className="z-10" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Transformer</CardTitle>
          <Badge variant="outline" className="font-normal">
            {id}
          </Badge>
        </div>
        <CardDescription>
          Transforms data between components
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-switch`}>Connected</Label>
            <Switch 
              id={`${id}-switch`} 
              checked={isConnected} 
              onCheckedChange={setIsConnected} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <div className="mt-1 font-mono text-xs bg-muted p-1 rounded truncate">
                {providerId}
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <div className="mt-1 font-mono text-xs bg-muted p-1 rounded truncate">
                {consumerId}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-xs text-muted-foreground">Input</Label>
            <div className="mt-1 font-mono text-xs bg-muted p-2 rounded min-h-[30px] flex items-center">
              {receivedData || <span className="text-muted-foreground italic">No data received</span>}
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Output</Label>
            <div className="mt-1 font-mono text-xs bg-muted p-2 rounded min-h-[30px] flex items-center">
              {transformedData || <span className="text-muted-foreground italic">No data transformed</span>}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button 
            variant="outline" 
            disabled={!isConnected}
            onClick={() => {
              if (incomingDep) {
                manager.requestData(id, providerId, DependencyDataTypes.SETTINGS);
              }
            }}
            size="sm"
          >
            Request
          </Button>
          
          <Button 
            variant="outline" 
            disabled={!isConnected || !transformedData}
            onClick={() => {
              if (transformedData) {
                manager.updateData(id, DependencyDataTypes.SETTINGS, transformedData);
              }
            }}
            size="sm"
          >
            Publish
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export function DependencyDemo() {
  // Generate stable IDs
  const [ids] = useState(() => ({
    producer: `producer-${nanoid(6)}`,
    transformer: `transformer-${nanoid(6)}`,
    consumer: `consumer-${nanoid(6)}`,
  }));
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Dependency Chain Demo</h2>
        <p className="text-sm text-muted-foreground">
          This demonstrates data flow between components using the dependency system.
          Toggle connections to see how data flows through the chain.
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 flex-1">
        <DataProducer id={ids.producer} />
        <Transformer 
          id={ids.transformer} 
          providerId={ids.producer} 
          consumerId={ids.consumer} 
        />
        <DataConsumer 
          id={ids.consumer} 
          providerId={ids.transformer} 
        />
      </div>
    </div>
  );
}

export default DependencyDemo;