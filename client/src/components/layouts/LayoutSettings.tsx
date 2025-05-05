import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Layout, 
  Refresh, 
  Server,
  HardDrive, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Clock, 
  Edit,
  Download,
  Settings
} from 'lucide-react';
import { LayoutManagementDialog } from './LayoutManagementDialog';
import { layoutPersistenceService } from '../../services/LayoutPersistenceService';
import { layoutSyncService, DeviceInfo } from '../../services/LayoutSyncService';

/**
 * Component for layout settings configuration
 */
export function LayoutSettings() {
  // State for the settings form
  const [deviceName, setDeviceName] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5); // In minutes
  const [registeredDevices, setRegisteredDevices] = useState<DeviceInfo[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({ success: true, message: 'Ready' });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Initialize settings from services
  useEffect(() => {
    // Load sync settings
    setSyncEnabled(layoutSyncService.isSyncEnabled());
    setAutoSaveEnabled(layoutPersistenceService.getAutoSaveEnabled?.() ?? true);
    setSyncInterval(layoutSyncService.getAutoSyncInterval() / (60 * 1000)); // Convert to minutes
    setDeviceName(layoutSyncService.getDeviceName());
    setLastSyncTime(layoutSyncService.getLastSyncTimestamp());
    
    // Load registered devices
    loadRegisteredDevices();
    
    // Set up sync status subscription
    const unsubscribe = layoutSyncService.subscribeSyncStatus((status) => {
      setSyncStatus({
        success: status.success,
        message: status.message
      });
      if (status.lastSynced) {
        setLastSyncTime(status.lastSynced);
      }
      setIsSyncing(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Load registered devices
  const loadRegisteredDevices = async () => {
    const devices = await layoutSyncService.getRegisteredDevices();
    setRegisteredDevices(devices);
  };
  
  // Handle device name update
  const handleDeviceNameUpdate = () => {
    layoutSyncService.updateDeviceName(deviceName);
  };
  
  // Handle sync toggle
  const handleSyncToggle = (enabled: boolean) => {
    setSyncEnabled(enabled);
    layoutSyncService.setSyncEnabled(enabled);
  };
  
  // Handle auto-save toggle
  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    if (layoutPersistenceService.setAutoSave) {
      layoutPersistenceService.setAutoSave(enabled);
    }
  };
  
  // Handle sync interval change
  const handleSyncIntervalChange = (value: number[]) => {
    const minutes = value[0];
    setSyncInterval(minutes);
    layoutSyncService.setAutoSyncInterval(minutes * 60 * 1000); // Convert minutes to ms
  };
  
  // Handle manual sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    await layoutSyncService.syncLayouts();
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Get device type icon
  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Laptop className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };
  
  // Handle layout selection
  const handleLayoutSelected = (layoutId: string) => {
    layoutPersistenceService.loadLayout(layoutId);
  };
  
  // Handle template selection
  const handleTemplateSelected = (templateId: string) => {
    // In a real implementation, this would create a new layout from the template
    console.log(`Template selected: ${templateId}`);
  };
  
  // Handle reset to default
  const handleResetToDefault = () => {
    layoutPersistenceService.resetToDefault();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <span>Layout Management</span>
          </CardTitle>
          <CardDescription>
            Configure how your workspace layouts are managed and synchronized
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="settings">
            <TabsList className="mb-4">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="sync">Sync Status</TabsTrigger>
            </TabsList>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Manage Layouts</h3>
                    <p className="text-sm text-muted-foreground">
                      Create, edit, and organize your workspace layouts
                    </p>
                  </div>
                  <LayoutManagementDialog 
                    trigger={<Button variant="outline"><Settings className="h-4 w-4 mr-2" /> Layout Manager</Button>}
                    onLayoutSelected={handleLayoutSelected}
                    onTemplateSelected={handleTemplateSelected}
                    onResetToDefault={handleResetToDefault}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2 border-t pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-Save Layout Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes to the current layout
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSaveEnabled}
                    onCheckedChange={handleAutoSaveToggle}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2 border-t pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync">Multi-Device Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep your layouts synchronized across all your devices
                    </p>
                  </div>
                  <Switch
                    id="sync"
                    checked={syncEnabled}
                    onCheckedChange={handleSyncToggle}
                  />
                </div>
                
                {syncEnabled && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                        <span className="text-sm text-muted-foreground">
                          {syncInterval} {syncInterval === 1 ? 'minute' : 'minutes'}
                        </span>
                      </div>
                      <Slider
                        id="sync-interval"
                        value={[syncInterval]}
                        min={1}
                        max={60}
                        step={1}
                        onValueChange={handleSyncIntervalChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Devices Tab */}
            <TabsContent value="devices" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="device-name">This Device Name</Label>
                    <Input
                      id="device-name"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="Enter a name for this device"
                    />
                  </div>
                  <Button onClick={handleDeviceNameUpdate}>
                    Update
                  </Button>
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-lg font-medium">Registered Devices</h3>
                  
                  {registeredDevices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No devices registered</p>
                  ) : (
                    <ul className="space-y-2">
                      {registeredDevices.map(device => (
                        <li key={device.id} className="flex items-center justify-between p-2 rounded-md border">
                          <div className="flex items-center gap-2">
                            {getDeviceTypeIcon(device.type)}
                            <span className="font-medium">{device.name}</span>
                            {device.id === layoutSyncService.getDeviceId() && (
                              <Badge variant="outline" className="text-xs">This Device</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last Synced: {formatDate(device.lastSynced || null)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Sync Status Tab */}
            <TabsContent value="sync" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Sync Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {formatDate(lastSyncTime)}
                    </p>
                  </div>
                  <Button 
                    onClick={handleManualSync} 
                    disabled={isSyncing}
                    className="relative"
                  >
                    {isSyncing ? (
                      <>
                        <Refresh className="h-4 w-4 mr-2 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <Refresh className="h-4 w-4 mr-2" />
                        <span>Sync Now</span>
                      </>
                    )}
                  </Button>
                </div>
                
                <div className={`p-4 rounded-md ${syncStatus.success ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <p className={`text-sm ${syncStatus.success ? 'text-success-foreground' : 'text-destructive-foreground'}`}>
                    {syncStatus.message}
                  </p>
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-md font-medium">Sync Options</h3>
                  
                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="download-layouts">Download All Layouts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get layouts from server to this device
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="upload-layouts">Upload All Layouts</Label>
                      <p className="text-sm text-muted-foreground">
                        Push layouts from this device to server
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Server className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between">
          <p className="text-sm text-muted-foreground">
            Layouts are stored locally and can be synced across devices.
          </p>
          <Button variant="outline" onClick={handleResetToDefault}>
            Reset to Default
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}