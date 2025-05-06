import React, { useState, useEffect } from 'react';
import { FlexibleEmailDependencyBridge } from '../lib/dependency/FlexibleEmailDependencyBridge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Info, AlertCircle, Check, X, Link2, RefreshCw, Zap, RotateCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePanelDependencyContext } from '../context/PanelDependencyContext';

interface FlexibleEmailDebugPanelProps {
  emailBridge: FlexibleEmailDependencyBridge;
}

export function FlexibleEmailDebugPanel({ emailBridge }: FlexibleEmailDebugPanelProps) {
  const { autoConnectEnabled, setAutoConnectEnabled } = usePanelDependencyContext();
  const [listPaneIds, setListPaneIds] = useState<string[]>([]);
  const [detailPaneIds, setDetailPaneIds] = useState<string[]>([]);
  const [connections, setConnections] = useState<{ [key: string]: string[] }>({});
  const [selectedListPane, setSelectedListPane] = useState<string | null>(null);
  const [selectedDetailPane, setSelectedDetailPane] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Sync autoConnectEnabled with FlexibleEmailDependencyBridge
  useEffect(() => {
    emailBridge.setAutoConnect(autoConnectEnabled);
  }, [emailBridge, autoConnectEnabled]);
  
  // Listen for bridge events to update the UI
  useEffect(() => {
    // Handler for connection created events
    const handleConnectionCreated = (data: any) => {
      console.log('[FlexibleEmailDebugPanel] Connection created:', data);
      refreshConnections();
    };
    
    // Handler for connection removed events
    const handleConnectionRemoved = (data: any) => {
      console.log('[FlexibleEmailDebugPanel] Connection removed:', data);
      refreshConnections();
    };
    
    // Handler for all connections created event
    const handleAllConnectionsCreated = (data: any) => {
      console.log('[FlexibleEmailDebugPanel] All connections created:', data);
      refreshConnections();
    };
    
    // Subscribe to events
    emailBridge.on('connectionCreated', handleConnectionCreated);
    emailBridge.on('connectionRemoved', handleConnectionRemoved);
    emailBridge.on('allConnectionsCreated', handleAllConnectionsCreated);
    
    // Cleanup listeners on unmount
    return () => {
      emailBridge.off('connectionCreated', handleConnectionCreated);
      emailBridge.off('connectionRemoved', handleConnectionRemoved);
      emailBridge.off('allConnectionsCreated', handleAllConnectionsCreated);
    };
  }, [emailBridge]);

  // Refresh the connection data
  useEffect(() => {
    try {
      const listIds = emailBridge.getListPaneIds();
      const detailIds = emailBridge.getDetailPaneIds();
      
      setListPaneIds(listIds);
      setDetailPaneIds(detailIds);
      
      // Build the connections object
      const connectionMap: { [key: string]: string[] } = {};
      
      listIds.forEach(listId => {
        const connections = emailBridge.getConnectionsForListPane(listId);
        connectionMap[listId] = connections;
        
        // Log detailed connection information for debugging
        if (connections.length > 0) {
          console.log(`[FlexibleEmailDebugPanel] List pane ${listId} has ${connections.length} connections:`, 
            connections.map(id => getDisplayName(id)).join(', ')
          );
        }
      });
      
      setConnections(connectionMap);
      
      // Clear selections if they're no longer valid
      if (selectedListPane && !listIds.includes(selectedListPane)) {
        setSelectedListPane(null);
      }
      
      if (selectedDetailPane && !detailIds.includes(selectedDetailPane)) {
        setSelectedDetailPane(null);
      }
    } catch (error) {
      console.error('Error refreshing connections:', error);
      toast({
        title: "Connection Refresh Error",
        description: "Failed to refresh connection data.",
        variant: "destructive"
      });
    }
  }, [emailBridge, refreshCounter]);

  const refreshConnections = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const createConnection = () => {
    if (!selectedListPane || !selectedDetailPane) {
      toast({
        title: "Connection Error",
        description: "Please select both a list pane and a detail pane.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      emailBridge.createConnection(selectedListPane, selectedDetailPane);
      toast({
        title: "Connection Created",
        description: `Created connection from ${selectedListPane} to ${selectedDetailPane}`,
        variant: "default"
      });
      refreshConnections();
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to create connection.",
        variant: "destructive"
      });
    }
  };

  const removeConnection = (listId: string, detailId: string) => {
    try {
      emailBridge.removeConnection(listId, detailId);
      toast({
        title: "Connection Removed",
        description: `Removed connection from ${listId} to ${detailId}`,
        variant: "default"
      });
      refreshConnections();
    } catch (error) {
      toast({
        title: "Remove Error",
        description: "Failed to remove connection.",
        variant: "destructive"
      });
    }
  };

  const connectAllPanes = () => {
    try {
      emailBridge.connectAllPanes();
      toast({
        title: "All Panes Connected",
        description: "Connected all list panes to all detail panes.",
        variant: "default"
      });
      refreshConnections();
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect all panes.",
        variant: "destructive"
      });
    }
  };
  
  const forceUpdateConnection = (listId: string, detailId: string) => {
    try {
      emailBridge.forceUpdateConnection(listId, detailId);
      toast({
        title: "Connection Updated",
        description: `Force-refreshed data for connection: ${getDisplayName(listId)} → ${getDisplayName(detailId)}`,
        variant: "default",
        duration: 1500
      });
    } catch (error) {
      console.error("Error forcing connection update:", error);
      toast({
        title: "Update Error",
        description: "Failed to force update the connection.",
        variant: "destructive"
      });
    }
  };
  
  const forceUpdateAllConnections = () => {
    try {
      emailBridge.forceUpdateAllConnections();
      toast({
        title: "All Connections Updated",
        description: `Force-refreshed data for all active connections`,
        variant: "default",
        duration: 1500
      });
    } catch (error) {
      console.error("Error updating all connections:", error);
      toast({
        title: "Update Error",
        description: "Failed to update all connections",
        variant: "destructive"
      });
    }
  };

  // Generate a display name for component IDs by removing UUIDs
  const getDisplayName = (id: string | null) => {
    if (!id) return 'unknown';
    // Remove UUID pattern at the end if present
    return id.replace(/-[a-zA-Z0-9]{6,}$/, '');
  };

  return (
    <Card className="w-full h-full overflow-auto text-white bg-neutral-900 border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Email Dependency Debug</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshConnections}
            className="h-8 w-8 p-0"
          >
            <RefreshCw size={16} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {/* Connection summary */}
          <div className="rounded-md bg-neutral-800 p-3">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Info size={14} className="mr-1.5" /> Connection Summary
            </h3>
            <div className="space-y-1 text-neutral-300 text-xs">
              <div className="flex justify-between">
                <span>List Panes:</span>
                <span>{listPaneIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Detail Panes:</span>
                <span>{detailPaneIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Connections:</span>
                <span>
                  {Object.values(connections).reduce((total, details) => total + details.length, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-700">
                <Label htmlFor="auto-connect" className="text-xs cursor-pointer">
                  Auto-Connect Components
                </Label>
                <Switch
                  id="auto-connect"
                  checked={autoConnectEnabled}
                  onCheckedChange={setAutoConnectEnabled}
                />
              </div>
            </div>
          </div>
          
          {/* Global actions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button size="sm" variant="default" onClick={connectAllPanes} className="text-xs">
              <Link2 size={14} className="mr-1" /> Connect All
            </Button>
            <Button size="sm" variant="outline" onClick={refreshConnections} className="text-xs">
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={forceUpdateAllConnections} 
              className="text-xs"
              disabled={Object.values(connections).reduce((total, details) => total + details.length, 0) === 0}
            >
              <Zap size={14} className="mr-1" /> Force Update All
            </Button>
          </div>
          
          <Separator className="my-2 bg-neutral-700" />
          
          {/* Create new connection */}
          <div className="rounded-md bg-neutral-800 p-3">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Link2 size={14} className="mr-1.5" /> Create Connection
            </h3>
            
            <div className="space-y-3">
              {/* List pane selector */}
              <div>
                <p className="text-xs text-neutral-300 mb-1">Select List Pane:</p>
                <div className="flex flex-wrap gap-1.5">
                  {listPaneIds.map(id => (
                    <Badge 
                      key={id} 
                      variant={selectedListPane === id ? "default" : "outline"}
                      className="cursor-pointer text-xs py-0.5"
                      onClick={() => setSelectedListPane(id)}
                    >
                      {getDisplayName(id)}
                    </Badge>
                  ))}
                  {listPaneIds.length === 0 && (
                    <p className="text-xs text-neutral-500 italic">No list panes available</p>
                  )}
                </div>
              </div>
              
              {/* Detail pane selector */}
              <div>
                <p className="text-xs text-neutral-300 mb-1">Select Detail Pane:</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailPaneIds.map(id => (
                    <Badge 
                      key={id} 
                      variant={selectedDetailPane === id ? "default" : "outline"}
                      className="cursor-pointer text-xs py-0.5"
                      onClick={() => setSelectedDetailPane(id)}
                    >
                      {getDisplayName(id)}
                    </Badge>
                  ))}
                  {detailPaneIds.length === 0 && (
                    <p className="text-xs text-neutral-500 italic">No detail panes available</p>
                  )}
                </div>
              </div>
              
              <Button 
                size="sm" 
                className="w-full text-xs"
                disabled={!selectedListPane || !selectedDetailPane}
                onClick={createConnection}
              >
                <Link2 size={14} className="mr-1" /> Create Connection
              </Button>
            </div>
          </div>
          
          <Separator className="my-2 bg-neutral-700" />
          
          {/* Existing connections */}
          <div>
            <h3 className="text-sm font-medium mb-2">Existing Connections</h3>
            <div className="space-y-3">
              {Object.keys(connections).length === 0 ? (
                <p className="text-xs text-neutral-500 italic">No connections available</p>
              ) : (
                Object.entries(connections).map(([listId, detailIds]) => (
                  <div key={listId} className="rounded-md bg-neutral-800 p-2">
                    <p className="text-xs font-medium text-neutral-200 mb-1">
                      {getDisplayName(listId)}
                    </p>
                    
                    {detailIds.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">No connections</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {detailIds.map(detailId => (
                            <Badge 
                              key={detailId} 
                              variant="secondary"
                              className="text-xs py-0.5 flex items-center gap-1"
                            >
                              {getDisplayName(detailId)}
                              <X 
                                size={12} 
                                className="cursor-pointer hover:text-red-400"
                                onClick={() => removeConnection(listId, detailId)}
                              />
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {detailIds.map(detailId => (
                            <Button 
                              key={`force-${detailId}`}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                              onClick={() => forceUpdateConnection(listId, detailId)}
                              title={`Force update data flow: ${getDisplayName(listId)} → ${getDisplayName(detailId)}`}
                            >
                              <Zap size={12} className="mr-0.5" /> 
                              {getDisplayName(detailId)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}