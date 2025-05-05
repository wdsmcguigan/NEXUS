# NEXUS.email Layout Persistence System

## Overview

The Layout Persistence System allows users to save, load, and synchronize their workspace layouts across multiple devices. This system provides a robust way to customize the NEXUS.email interface to suit different workflows and seamlessly transition between them.

## Features

1. **Layout Serialization**: Convert the entire workspace state to a serializable format
2. **Local Storage**: Save layouts to browser storage for persistence between sessions
3. **Remote Sync**: Synchronize layouts between multiple devices (when logged in)
4. **Layout Templates**: Predefined workspace arrangements for different workflows
5. **Export/Import**: Share layouts between users via JSON export/import
6. **Device Adaptation**: Layouts can be optimized for different screen sizes
7. **Preview Thumbnails**: Visual representation of layouts for easy selection

## Key Components

### Layout Persistence Service

The `LayoutPersistenceService` provides the core functionality for saving and loading layouts:

```typescript
// Initialize the service
await layoutPersistenceService.init({ autoSave: true });

// Save the current layout
layoutPersistenceService.saveCurrentLayout('My Layout');

// Load a saved layout
layoutPersistenceService.loadLayout('My Layout');

// Reset to the default layout
layoutPersistenceService.resetToDefault();
```

### Layout Sync Service

The `LayoutSyncService` handles synchronization between devices:

```typescript
// Initialize with auto-sync enabled
layoutSyncService.init({ autoSync: true });

// Manually trigger a sync
await layoutSyncService.syncLayouts();

// Sync a specific layout
await layoutSyncService.syncLayout('My Layout');
```

### Layout Management Hook

The `useLayoutManagement` hook integrates the panel system with the persistence services:

```typescript
const {
  currentLayoutId,
  isInitialized,
  saveCurrentLayout,
  loadLayout,
  resetToDefault,
  createLayout,
  syncCurrentLayout
} = useLayoutManagement();
```

### Layout UI Components

#### 1. Layout Management Dialog

A comprehensive dialog for managing all layouts:

```tsx
<LayoutManagementDialog 
  onLayoutSelected={handleLayoutSelected}
  onTemplateSelected={handleTemplateSelected}
  onResetToDefault={handleResetToDefault}
/>
```

#### 2. Layout Toolbar

A compact toolbar for quick layout actions:

```tsx
<LayoutToolbar 
  onLayoutSelected={handleLayoutSelected}
  onLayoutCreated={handleLayoutCreated}
  onResetToDefault={handleResetToDefault}
/>
```

#### 3. Layout Settings

A settings panel for configuring layout persistence and sync:

```tsx
<LayoutSettings />
```

## Layout Templates

The system comes with several predefined templates for different workflows:

1. **Default**: A balanced layout for everyday email usage
2. **Email Triage**: Optimized for quickly processing incoming email
3. **Writing Mode**: Focused on composing emails without distractions
4. **Productivity**: Integrated with tasks and calendar for maximum productivity
5. **Communication**: Optimized for messaging and collaboration
6. **Research**: Layout for researching and organizing information
7. **Compact**: Optimized for smaller screens
8. **Expanded**: Maximizes screen real estate for power users
9. **Focused**: Minimizes distractions by focusing on one component at a time

## Usage Examples

### Saving the Current Layout

```tsx
function SaveLayoutButton() {
  const { saveCurrentLayout } = useLayoutManagement();
  
  return (
    <Button onClick={() => saveCurrentLayout('My Custom Layout')}>
      Save Layout
    </Button>
  );
}
```

### Creating a New Template-Based Layout

```tsx
function NewLayoutButton() {
  const { loadLayout } = useLayoutManagement();
  
  const createFromTemplate = (templateId) => {
    const layoutId = layoutPersistenceService.createLayoutFromTemplate(
      templateId,
      `My ${templateId} Layout`
    );
    
    if (layoutId) {
      loadLayout(layoutId);
    }
  };
  
  return (
    <Button onClick={() => createFromTemplate('productivity')}>
      Create Productivity Layout
    </Button>
  );
}
```

### Resetting to Default

```tsx
function ResetButton() {
  const { resetToDefault } = useLayoutManagement();
  
  return (
    <Button variant="outline" onClick={resetToDefault}>
      Reset Layout
    </Button>
  );
}
```

## Serialization Format

The layout is serialized to a JSON structure with the following top-level components:

```typescript
interface SerializedLayout {
  version: string;         // Format version for migrations
  created: string;         // Creation timestamp
  modified: string;        // Last modified timestamp
  name: string;            // Unique layout identifier
  description?: string;    // User-provided description
  thumbnail?: string;      // Base64 encoded preview image
  isDefault?: boolean;     // Whether this is the default layout
  isBuiltIn?: boolean;     // Whether this is a built-in template
  deviceType?: string;     // Target device type
  category?: string;       // Organizational category
  tags?: string[];         // Searchable tags
  rootPanel: {...};        // Panel configuration
  componentInstances: [...]; // Component state and configuration
  metadata?: {...};        // Additional metadata
}
```

## Best Practices

1. **Name your layouts** clearly to identify their purpose (e.g., "Email Triage" or "Research Mode")
2. **Create different layouts** for different workflows or tasks
3. **Use templates** as starting points instead of creating layouts from scratch
4. **Export important layouts** to back them up or share with colleagues
5. **Optimize layouts for device types** when working across multiple devices

## Troubleshooting

### Layout Not Saving

- Check that you have sufficient storage space in your browser
- Ensure you have permissions to save data to localStorage
- Try clearing browser cache if issues persist

### Layout Not Loading Correctly

- Verify that the layout is compatible with your current version
- Check for any missing components that might have been removed
- Try resetting to the default layout as a fallback

### Sync Issues

- Ensure you're logged in to enable multi-device sync
- Check your internet connection
- Verify that the sync service is enabled in settings

## Future Enhancements

1. **Collaborative Layouts**: Share layouts with team members
2. **Time-based Layouts**: Automatically switch layouts based on time of day
3. **Layout Transitions**: Smooth animations when switching layouts
4. **Layout Versions**: Track changes and allow reverting to previous versions
5. **Layout Analytics**: Insights into which layouts optimize productivity