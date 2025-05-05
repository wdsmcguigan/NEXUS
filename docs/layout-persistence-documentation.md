# NEXUS.email Layout Persistence System

## Overview

The Layout Persistence System enables NEXUS.email users to save, load, and synchronize their customized workspace layouts. This powerful system allows users to create personalized layouts for different tasks and workflows, and seamlessly transition between them.

## Key Concepts

### Layout

A layout represents the entire workspace configuration including:
- Panel structure (sizes, positions, relationships)
- Tab configurations (titles, order, active states)
- Component instances and their configurations
- Visual customizations and preferences

### Layout Serialization

Layout serialization converts the complex UI structure into a serializable format that can be:
- Stored in browser localStorage
- Saved to a server database
- Exported to JSON for sharing
- Imported from other sources

### Layout Templates

Templates are predefined layouts optimized for specific workflows:
- Email Triage
- Writing Mode
- Research
- Productivity
- Communication
- And more...

### Layout Versioning

The system handles version differences between saved layouts:
- Migrations between versions
- Fallbacks for incompatibilities
- Validation of layout data

## Core Components

### Layout Serialization

The `layoutSerialization.ts` module handles converting layouts to and from serializable formats:

```typescript
// Key interfaces
interface SerializedLayout {
  version: string;
  created: string;
  modified: string;
  name: string;
  description?: string;
  thumbnail?: string; // Base64 encoded screenshot
  isDefault?: boolean;
  isBuiltIn?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile' | 'any';
  category?: string;
  tags?: string[];
  rootPanel: SerializedPanelConfig;
  componentInstances: SerializedComponentInstance[];
  metadata?: Record<string, any>;
}

interface SerializedPanelConfig {
  id: string;
  type: 'panel' | 'split';
  direction?: PanelDirection;
  size?: number;
  minSize?: number;
  children?: SerializedPanelConfig[];
  tabs?: SerializedTab[];
  activeTabId?: string;
}

interface SerializedComponentInstance {
  instanceId: string;
  componentId: string;
  config?: Record<string, any>;
  state?: Record<string, any>;
  created?: string;
  lastActive?: string;
}

// Key functions
function serializeLayout(
  layout: PanelConfig,
  name: string,
  options?: SerializationOptions
): SerializedLayout;

function deserializeLayout(
  serializedLayout: SerializedLayout
): { layout: PanelConfig; componentInstances: ComponentInstance[] };

function validateSerializedLayout(layout: any): boolean;

function migrateLayout(oldLayout: any): SerializedLayout | null;
```

### Layout Persistence Service

The `LayoutPersistenceService` handles saving and loading layouts:

```typescript
class LayoutPersistenceService {
  // Core operations
  init(options?: { autoSave?: boolean }): Promise<boolean>;
  getLayoutSummaries(): LayoutSummary[];
  getLayout(id: string): SerializedLayout | null;
  getCurrentLayout(): SerializedLayout | null;
  getDefaultLayout(): SerializedLayout | null;
  setCurrentLayout(id: string): boolean;
  setDefaultLayout(id: string): boolean;
  saveLayout(layout: SerializedLayout): boolean;
  saveCurrentLayout(name?: string): boolean;
  loadLayout(id: string): boolean;
  deleteLayout(id: string): boolean;
  
  // Layout creation
  createLayoutFromCurrent(name: string, options?: CreateOptions): string | null;
  createLayoutFromTemplate(templateType: LayoutTemplateType, name: string, options?: CreateOptions): string | null;
  
  // Import/Export
  importLayout(jsonString: string): string | null;
  exportLayout(id: string): string | null;
  duplicateLayout(id: string, newName?: string): string | null;
  
  // Utility functions
  resetToDefault(): boolean;
  setAutoSave(enabled: boolean): void;
  triggerAutoSave(): void;
  syncWithServer(): Promise<boolean>;
  
  // Event subscriptions
  subscribeToLayoutChanges(callback: (layout: SerializedLayout) => void): () => void;
  subscribeToLayoutListChanges(callback: (layouts: LayoutSummary[]) => void): () => void;
  subscribeToSyncStateChanges(callback: (state: LayoutSyncState) => void): () => void;
}

// Layout storage types
enum StorageType {
  LOCAL = 'local',    // Browser's localStorage
  SERVER = 'server',  // Server-side storage
  CLOUD = 'cloud',    // Cloud storage
  FILE = 'file'       // File storage (import/export)
}

// Layout summary for UI display
interface LayoutSummary {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  isDefault?: boolean;
  isBuiltIn?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile' | 'any';
  category?: string;
  tags?: string[];
  created: string;
  modified: string;
  storageType: StorageType;
  version: string;
}
```

### Layout Templates

The `layoutTemplates.ts` module provides predefined layouts for different workflows:

```typescript
// Template types
enum DefaultTemplateId {
  DEFAULT = 'default-layout',
  EMAIL_TRIAGE = 'email-triage',
  WRITING_MODE = 'writing-mode',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  RESEARCH = 'research',
  COMPACT = 'compact',
  EXPANDED = 'expanded',
  FOCUSED = 'focused'
}

// Functions
function createDefaultTemplates(): Record<string, SerializedLayout>;
function getTemplateById(id: string): SerializedLayout | null;
function getAllTemplates(): SerializedLayout[];
function getTemplatesByCategory(category: LayoutTemplateType): SerializedLayout[];
```

### Layout Sync Service

The `LayoutSyncService` handles synchronization between devices:

```typescript
class LayoutSyncService {
  // Core functionality
  init(options?: { autoSync?: boolean, interval?: number }): void;
  startAutoSync(): void;
  stopAutoSync(): void;
  syncLayouts(): Promise<SyncStatusResponse>;
  syncLayout(layoutId: string): Promise<boolean>;
  
  // Device management
  getRegisteredDevices(): Promise<DeviceInfo[]>;
  updateDeviceName(name: string): void;
  getDeviceId(): string;
  getDeviceName(): string;
  getDeviceType(): 'desktop' | 'tablet' | 'mobile' | 'other';
  
  // Settings
  setSyncEnabled(enabled: boolean): void;
  setAutoSyncInterval(intervalMs: number): void;
  isSyncEnabled(): boolean;
  getAutoSyncInterval(): number;
  getLastSyncTimestamp(): string | null;
  
  // Events
  subscribeSyncStatus(callback: (status: SyncStatusResponse) => void): () => void;
}
```

### Layout Management Hook

The `useLayoutManagement` hook provides React integration for the layout system:

```typescript
function useLayoutManagement(): {
  currentLayoutId: string | null;
  isInitialized: boolean;
  saveCurrentLayout: (name?: string) => boolean;
  loadLayout: (id: string) => boolean;
  resetToDefault: () => boolean;
  createLayout: (name: string, description?: string) => string | null;
  syncCurrentLayout: () => Promise<boolean>;
};
```

## Layout Templates

NEXUS.email comes with several built-in layout templates:

### Default Layout

A balanced layout with folders on the left and emails on the right:

```
+---------------------------+----------------------------------+
| Folders     | Tags        |                                  |
|             |             |                                  |
|             |             |            Email List            |
|             |             |                                  |
|             |             |                                  |
+---------------------------+                                  |
|                           |                                  |
|        Email View         |                                  |
|                           |                                  |
+---------------------------+----------------------------------+
```

### Email Triage Layout

Optimized for processing large volumes of email quickly:

```
+---------------+----------------------+----------------------+
|               |                      |                      |
|               |                      |                      |
|    Folders    |      Email List      |     Email View       |
|               |                      |                      |
|               |                      |                      |
|               |                      |                      |
+---------------+----------------------+----------------------+
```

### Writing Mode

Focused on composing messages without distractions:

```
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                       Email Composer                        |
|                                                             |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
```

### Productivity Layout

Combines email with tasks and calendars:

```
+---------------+----------------------------------+
|               |                                  |
|    Folders    |              Tasks               |
|               |                                  |
|    & Tags     |                                  |
|               +----------------------------------+
|               |                                  |
|               |              Email               |
|               |                                  |
+---------------+----------------------------------+
|                     Calendar                     |
+-----------------------------------------------------+
```

## Usage Examples

### Basic Layout Operations

#### Initialize the Layout System

```typescript
// In your application initialization
import { layoutPersistenceService } from './services/LayoutPersistenceService';
import { layoutSyncService } from './services/LayoutSyncService';

async function initializeLayoutSystem() {
  // Initialize the persistence service
  await layoutPersistenceService.init({ autoSave: true });
  
  // Initialize the sync service
  layoutSyncService.init({ autoSync: true });
  
  // Load the current or default layout
  const currentLayout = layoutPersistenceService.getCurrentLayout();
  
  if (currentLayout) {
    // Apply the current layout
    applyLayout(currentLayout);
  } else {
    // Fall back to default layout
    const defaultLayout = layoutPersistenceService.getDefaultLayout();
    if (defaultLayout) {
      applyLayout(defaultLayout);
    }
  }
}
```

#### Save the Current Layout

```typescript
function saveCurrentLayout() {
  // Get name from user
  const name = prompt('Enter a name for this layout:');
  if (!name) return;
  
  // Save the current layout with the provided name
  const success = layoutPersistenceService.saveCurrentLayout(name);
  
  if (success) {
    showToast('Layout saved successfully');
  } else {
    showToast('Failed to save layout', 'error');
  }
}
```

#### Load a Saved Layout

```typescript
function loadLayout(layoutId) {
  const success = layoutPersistenceService.loadLayout(layoutId);
  
  if (success) {
    showToast(`Layout "${layoutId}" loaded`);
  } else {
    showToast(`Failed to load layout "${layoutId}"`, 'error');
  }
}
```

#### Reset to Default Layout

```typescript
function resetToDefaultLayout() {
  if (confirm('Are you sure you want to reset to the default layout?')) {
    const success = layoutPersistenceService.resetToDefault();
    
    if (success) {
      showToast('Reset to default layout');
    } else {
      showToast('Failed to reset layout', 'error');
    }
  }
}
```

### Advanced Layout Management

#### Create a Layout from Template

```typescript
function createFromTemplate() {
  // Get template and name from user
  const templateType = 'productivity'; // Or select from UI
  const name = prompt('Enter a name for the new layout:');
  if (!name) return;
  
  // Create a new layout from the template
  const layoutId = layoutPersistenceService.createLayoutFromTemplate(
    templateType,
    name,
    {
      description: `Custom ${templateType} layout`,
      category: 'custom',
      tags: [templateType, 'custom']
    }
  );
  
  if (layoutId) {
    // Load the new layout
    layoutPersistenceService.loadLayout(layoutId);
    showToast(`Created and loaded layout "${name}"`);
  } else {
    showToast('Failed to create layout', 'error');
  }
}
```

#### Export a Layout to JSON

```typescript
function exportLayoutToJson(layoutId) {
  const json = layoutPersistenceService.exportLayout(layoutId);
  
  if (json) {
    // Create a download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layoutId}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  } else {
    showToast('Failed to export layout', 'error');
  }
}
```

#### Import a Layout from JSON

```typescript
function importLayoutFromJson(jsonString) {
  try {
    const layoutId = layoutPersistenceService.importLayout(jsonString);
    
    if (layoutId) {
      showToast(`Layout "${layoutId}" imported successfully`);
      
      // Ask if user wants to load the imported layout
      if (confirm('Do you want to load the imported layout?')) {
        layoutPersistenceService.loadLayout(layoutId);
      }
      
      return true;
    } else {
      showToast('Failed to import layout', 'error');
      return false;
    }
  } catch (error) {
    showToast(`Error importing layout: ${error.message}`, 'error');
    return false;
  }
}
```

### Multi-Device Sync

#### Manually Sync Layouts

```typescript
async function syncLayouts() {
  try {
    // Show sync in progress
    setSyncing(true);
    
    // Sync layouts with server
    const result = await layoutSyncService.syncLayouts();
    
    if (result.success) {
      showToast(`Sync complete: ${result.layoutCount} layouts synchronized`);
    } else {
      showToast(`Sync failed: ${result.message}`, 'error');
    }
  } catch (error) {
    showToast(`Sync error: ${error.message}`, 'error');
  } finally {
    setSyncing(false);
  }
}
```

#### Update Device Name

```typescript
function updateDeviceName() {
  const name = prompt('Enter a name for this device:', layoutSyncService.getDeviceName());
  if (!name) return;
  
  layoutSyncService.updateDeviceName(name);
  showToast(`Device name updated to "${name}"`);
}
```

#### View Connected Devices

```typescript
async function showConnectedDevices() {
  try {
    const devices = await layoutSyncService.getRegisteredDevices();
    
    // Display devices in UI
    setDeviceList(devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      lastSync: device.lastSynced ? new Date(device.lastSynced) : null,
      isCurrentDevice: device.id === layoutSyncService.getDeviceId()
    })));
  } catch (error) {
    showToast(`Error loading devices: ${error.message}`, 'error');
  }
}
```

### React Integration

#### Using the Layout Management Hook

```tsx
import { useLayoutManagement } from '../hooks/useLayoutManagement';

function LayoutManager() {
  const { 
    currentLayoutId,
    isInitialized,
    saveCurrentLayout,
    loadLayout,
    resetToDefault,
    createLayout,
    syncCurrentLayout
  } = useLayoutManagement();
  
  // Get all available layouts
  const [layouts, setLayouts] = useState([]);
  
  useEffect(() => {
    if (isInitialized) {
      setLayouts(layoutPersistenceService.getLayoutSummaries());
      
      // Subscribe to layout list changes
      const unsubscribe = layoutPersistenceService.subscribeToLayoutListChanges(
        (updatedLayouts) => setLayouts(updatedLayouts)
      );
      
      return unsubscribe;
    }
  }, [isInitialized]);
  
  return (
    <div>
      <h2>Layout Manager</h2>
      
      {isInitialized ? (
        <>
          <div>
            <h3>Current Layout: {currentLayoutId || 'None'}</h3>
            <button onClick={() => saveCurrentLayout()}>Save Current Layout</button>
            <button onClick={() => resetToDefault()}>Reset to Default</button>
            <button onClick={() => syncCurrentLayout()}>Sync Layout</button>
          </div>
          
          <div>
            <h3>Saved Layouts</h3>
            <ul>
              {layouts.map(layout => (
                <li key={layout.id}>
                  {layout.name}
                  <button onClick={() => loadLayout(layout.id)}>Load</button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div>Initializing layout system...</div>
      )}
    </div>
  );
}
```

#### Creating a Layout Selection Dropdown

```tsx
import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { layoutPersistenceService } from '../services/LayoutPersistenceService';

function LayoutSelector() {
  const [layouts, setLayouts] = useState([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get layouts from the service
    setLayouts(layoutPersistenceService.getLayoutSummaries());
    
    // Get current layout
    const currentLayout = layoutPersistenceService.getCurrentLayout();
    if (currentLayout) {
      setCurrentLayoutId(currentLayout.name);
    }
    
    // Subscribe to layout changes
    const unsubscribe = layoutPersistenceService.subscribeToLayoutListChanges(
      (updatedLayouts) => setLayouts(updatedLayouts)
    );
    
    return unsubscribe;
  }, []);
  
  const handleLayoutChange = (layoutId: string) => {
    layoutPersistenceService.loadLayout(layoutId);
    setCurrentLayoutId(layoutId);
  };
  
  return (
    <Select value={currentLayoutId || ''} onValueChange={handleLayoutChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select layout" />
      </SelectTrigger>
      <SelectContent>
        {layouts.map(layout => (
          <SelectItem key={layout.id} value={layout.id}>
            {layout.name}
          </SelectItem>
        ))}
        <SelectItem value="default">Default Layout</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

## Best Practices

### 1. Layout Naming and Organization

- Use descriptive names for layouts that reflect their purpose
- Use categories and tags to organize layouts effectively
- Include descriptions that explain when to use each layout

### 2. Performance Considerations

- Avoid extremely complex layouts with deep nesting
- Be mindful of the size of serialized layouts (especially with thumbnails)
- Use the appropriate storage strategy for your needs

### 3. Sync Strategy

- Sync only when necessary to save bandwidth and storage
- Consider using conflict resolution strategies
- Provide visual indication of sync status

### 4. Error Handling

- Validate layouts before applying them
- Have fallbacks when loading a layout fails
- Provide user-friendly error messages

### 5. User Experience

- Automatically save layout changes
- Provide preview thumbnails for layouts
- Make it easy to reset to default
- Allow customization of existing templates

## Troubleshooting

### Layout Not Saving

**Issue**: Layout changes aren't being saved properly.
**Solution**:
1. Check if autoSave is enabled
2. Manually trigger save with `layoutPersistenceService.saveCurrentLayout()`
3. Verify localStorage has sufficient space
4. Check browser permissions

### Layout Loading Issues

**Issue**: Saved layout fails to load or causes errors.
**Solution**:
1. Check if the layout is valid with `validateSerializedLayout()`
2. Try to migrate the layout with `migrateLayout()`
3. Reset to default as a fallback

### Sync Problems

**Issue**: Layouts aren't syncing between devices.
**Solution**:
1. Verify network connectivity
2. Check that sync is enabled
3. Manually trigger sync with `syncLayouts()`
4. Verify device registration status
5. Check for conflict issues

### Version Compatibility

**Issue**: Layouts saved in different versions aren't compatible.
**Solution**:
1. Use the `migrateLayout()` function to upgrade old layouts
2. Implement version-specific deserialization logic
3. Fall back to templates if migration fails

## Advanced Topics

### Custom Layout Serialization

For specialized needs, you can customize how layouts are serialized:

```typescript
import { serializeLayout, deserializeLayout } from '../lib/layoutSerialization';

// Custom serialization with extra metadata
function serializeWithMetadata(layout, name, userData) {
  return serializeLayout(layout, name, {
    metadata: {
      userData,
      environmentInfo: getEnvironmentInfo(),
      appVersion: APP_VERSION
    }
  });
}

// Custom deserialization with additional processing
function deserializeWithProcessing(serializedLayout) {
  // First apply standard deserialization
  const { layout, componentInstances } = deserializeLayout(serializedLayout);
  
  // Then apply custom processing
  processCustomLayouts(layout);
  
  return { layout, componentInstances };
}
```

### Layout Templates for Different Devices

Create device-specific layout templates:

```typescript
// Mobile-friendly layout template
const mobileLayout = {
  version: CURRENT_LAYOUT_VERSION,
  name: 'mobile-friendly',
  deviceType: 'mobile',
  rootPanel: {
    id: 'root',
    type: 'panel',
    tabs: [
      { id: 'email-list-tab', title: 'Inbox' },
      { id: 'email-view-tab', title: 'Email' },
      { id: 'folders-tab', title: 'Folders' }
    ],
    activeTabId: 'email-list-tab'
  },
  componentInstances: [
    // Simplified components optimized for mobile
  ]
};

// Detect device and apply appropriate layout
function selectDeviceLayout() {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return layoutPersistenceService.loadLayout('mobile-friendly');
    case 'tablet':
      return layoutPersistenceService.loadLayout('tablet-layout');
    default:
      return layoutPersistenceService.loadLayout('default-desktop');
  }
}
```

### Layout Analytics

Track layout usage patterns:

```typescript
// Track layout interactions
function trackLayoutUsage(layoutId) {
  analytics.track('layout_loaded', {
    layoutId,
    timestamp: new Date().toISOString(),
    deviceType: layoutSyncService.getDeviceType(),
    sessionId: getCurrentSessionId()
  });
}

// Analyze layout effectiveness
function analyzePanelUsage(layoutId) {
  // Collect data on which panels are used most frequently
  const panelUsage = getPanelUsageData();
  
  // Report to analytics service
  analytics.track('panel_usage', {
    layoutId,
    panelUsage,
    sessionDuration: getSessionDuration()
  });
}
```

## See Also

- [Panel Management Documentation](./panel-management.md)
- [Component Registry Documentation](./component-registry-documentation.md)
- [Inter-Component Communication Documentation](./inter-component-communication.md)