# NEXUS.email Panel Management System

## Overview

The Panel Management System is the core of NEXUS.email's flexible UI. It enables users to create, split, resize, and arrange panels dynamically, similar to modern IDEs and development environments. This system provides the foundation for the application's workspace customization capabilities.

## Core Concepts

### Panels

A panel is a container that can hold one or more tabs. Panels can be:
- Split horizontally or vertically to create more panels
- Resized by dragging dividers
- Maximized to take up the full workspace
- Restored to their original size and position

### Tabs

Tabs are contained within panels and represent individual UI components or views:
- Each tab contains a specific component (email list, email viewer, calendar, etc.)
- Tabs can be reordered within a panel
- Tabs can be moved between panels via drag-and-drop
- Tabs can be closed, pinned, or duplicated

### Layouts

A layout is the overall arrangement of panels and tabs:
- Layouts can be saved, loaded, and shared
- Predefined templates are available for common workflows
- Layouts adapt to different screen sizes and orientations

## Architecture

### PanelContext

`PanelContext` is a React Context that provides the state and operations for the panel system:

```typescript
interface PanelContextType {
  layout: PanelConfig;
  updateLayout: (newLayout: PanelConfig | ((prev: PanelConfig) => PanelConfig)) => void;
  maximizedPanelId: string | null;
  maximizePanel: (panelId: string) => void;
  restorePanel: () => void;
  addTab: (panelId: string, tab: Tab, content: TabPanelContent) => void;
  removeTab: (panelId: string, tabId: string) => void;
  changeTab: (panelId: string, tabId: string) => void;
  moveTab: (sourceId: string, sourceTabId: string, targetId: string) => void;
  splitPanel: (panelId: string, direction: PanelDirection, newPanel: PanelConfig) => void;
  findPanel: (layout: PanelConfig, panelId: string) => PanelConfig | null;
  savedLayouts: { name: string; data: PanelConfig }[];
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  currentLayoutName: string | null;
}
```

### Panel Configuration

Panels are described by the `PanelConfig` interface:

```typescript
interface PanelConfig {
  id: string;
  type: 'panel' | 'split';
  direction?: PanelDirection;
  size?: number;
  minSize?: number;
  children?: PanelConfig[];
  tabs?: Tab[];
  activeTabId?: string;
}
```

### Tab Structure

Tabs are described by the `Tab` interface:

```typescript
interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  closeable?: boolean;
  componentInstance?: string;
  pinned?: boolean;
  color?: string;
}
```

## Key Components

### PanelManager

The PanelManager is the root component of the panel system. It:
- Renders the entire panel hierarchy
- Handles global panel operations
- Integrates with the layout persistence system

```tsx
<PanelManager 
  initialLayout={layout}
  onChange={handleLayoutChange} 
  onMaximize={handlePanelMaximize}
  customComponents={registeredComponents}
/>
```

### PanelContainer

The PanelContainer renders a specific panel configuration:
- Renders either a panel with tabs or a split container with child panels
- Handles panel-specific operations (adding tabs, changing active tab)
- Manages resize events for split panels

### AdvancedTabBar

The AdvancedTabBar provides a rich tabbed interface:
- Tab rendering with icons, colors, and states
- Tab reordering via drag and drop
- Tab context menu for operations
- Support for pinned tabs
- Visual indicators for tab state (unread, error, etc.)

### UniversalTabPanel

The UniversalTabPanel renders the content of tabs:
- Efficiently manages tab content rendering
- Handles tab activation and deactivation
- Supports "lazy" content loading
- Manages tab content lifecycle

## Core Operations

### Creating Panels

Panels are created through splitting existing panels:

```typescript
// Split a panel horizontally
splitPanel(panelId, 'horizontal', newPanelConfig);

// Split a panel vertically
splitPanel(panelId, 'vertical', newPanelConfig);
```

### Managing Tabs

Tabs can be added, removed, or moved:

```typescript
// Add a new tab to a panel
addTab(panelId, {
  id: 'new-tab-id',
  title: 'New Tab',
  closeable: true
}, tabContent);

// Change the active tab
changeTab(panelId, tabId);

// Remove a tab
removeTab(panelId, tabId);

// Move a tab between panels
moveTab(sourcePanelId, tabId, targetPanelId);
```

### Panel Operations

Panels can be maximized, restored, or updated:

```typescript
// Maximize a panel
maximizePanel(panelId);

// Restore the maximized panel
restorePanel();

// Update panel layout
updateLayout(newLayout);
```

## Panel Traversal

The panel system provides utilities for finding and manipulating panels:

```typescript
// Find a panel by ID
const panel = findPanel(layout, panelId);

// Update a specific panel
updateLayout(prevLayout => {
  return updatePanelInLayout(prevLayout, panelId, panel => ({
    ...panel,
    // modifications
  }));
});
```

## Integration with Component Registry

The panel system integrates with the Component Registry to create tabs with specific components:

```typescript
// Create a tab with a registered component
const componentId = 'email-list';
const instanceId = componentRegistry.createInstance(componentId);

addTab(panelId, {
  id: tabId,
  title: 'Email List',
  componentInstance: instanceId
}, null); // Content is managed by the component system
```

## Panel Context Menu

Each panel has a context menu with operations:

- Split Panel (Horizontal/Vertical)
- Maximize/Restore Panel
- Add Tab with Component Type
- Close All Tabs
- Close Other Tabs
- Save Layout

## Tab Context Menu

Each tab has a context menu with operations:

- Close Tab
- Close Other Tabs
- Close All Tabs
- Move to New Panel
- Move to Specific Panel
- Duplicate Tab
- Pin/Unpin Tab

## Events

The panel system emits events that can be observed by other parts of the application:

- `panel:created` - A new panel was created
- `panel:removed` - A panel was removed
- `tab:added` - A new tab was added
- `tab:removed` - A tab was removed
- `tab:changed` - The active tab changed
- `tab:moved` - A tab was moved to another panel
- `layout:changed` - The overall layout changed

## Drag and Drop

The panel system implements a specialized drag and drop system:

- Tabs can be dragged between panels
- Visual indicators show valid drop targets
- Drop zones include panel edges for splitting
- Custom preview elements show during drag operations

## Keyboard Shortcuts

The panel system supports keyboard shortcuts for common operations:

- `Ctrl+Tab` - Next tab in panel
- `Ctrl+Shift+Tab` - Previous tab in panel
- `Ctrl+W` - Close current tab
- `Ctrl+Shift+W` - Close all tabs in panel
- `Alt+1-9` - Go to tab by index
- `Ctrl+Shift+]` - Split panel horizontally
- `Ctrl+Shift+[` - Split panel vertically
- `F11` - Maximize/restore current panel

## Layout Persistence

The panel system integrates with the Layout Persistence System:

```typescript
// Save the current layout
saveLayout('My Custom Layout');

// Load a saved layout
loadLayout('My Custom Layout');

// Reset to default layout
loadLayout('default');
```

## Advanced Usage

### Creating Dynamic Layouts

Create complex layouts programmatically:

```typescript
const complexLayout: PanelConfig = {
  id: 'root',
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      id: 'left',
      type: 'panel',
      size: 30,
      tabs: [
        { id: 'folders', title: 'Folders' },
        { id: 'tags', title: 'Tags' }
      ],
      activeTabId: 'folders'
    },
    {
      id: 'right',
      type: 'split',
      direction: 'vertical',
      size: 70,
      children: [
        {
          id: 'top',
          type: 'panel',
          size: 70,
          tabs: [
            { id: 'inbox', title: 'Inbox' }
          ],
          activeTabId: 'inbox'
        },
        {
          id: 'bottom',
          type: 'panel',
          size: 30,
          tabs: [
            { id: 'preview', title: 'Preview' }
          ],
          activeTabId: 'preview'
        }
      ]
    }
  ]
};

updateLayout(complexLayout);
```

### Custom Tab Rendering

Customize how tabs are rendered:

```tsx
<AdvancedTabBar
  tabs={panel.tabs}
  activeTabId={panel.activeTabId}
  onTabChange={(tabId) => changeTab(panel.id, tabId)}
  onTabClose={(tabId) => removeTab(panel.id, tabId)}
  renderTabContent={(tab) => (
    <>
      {tab.icon && <span className="mr-2">{tab.icon}</span>}
      <span className="truncate">{tab.title}</span>
      {tab.badge && (
        <Badge variant="outline" className="ml-2">{tab.badge}</Badge>
      )}
    </>
  )}
/>
```

### Panel Resize Constraints

Control panel resizing behavior:

```typescript
const panelWithConstraints: PanelConfig = {
  id: 'constrained-panel',
  type: 'panel',
  size: 50,
  minSize: 30, // Minimum size percentage
  tabs: [...]
};
```

## Best Practices

1. **Unique IDs**: Always use unique IDs for panels and tabs (consider using `nanoid()`)
2. **Panel Hierarchy**: Keep panel hierarchies shallow to avoid performance issues
3. **Default Sizes**: Provide sensible default sizes for panels
4. **Tab Lifecycle**: Handle tab content lifecycle properly (creation, activation, deactivation)
5. **Layout Validation**: Validate layouts before applying them
6. **Error Handling**: Handle errors gracefully during panel operations
7. **Performance**: Use React.memo for panel components that don't need frequent re-renders
8. **Accessibility**: Ensure keyboard navigation works properly for panels and tabs

## Common Issues

### Issue: Tabs disappear when moving between panels
**Solution**: Ensure the tab's ID remains consistent, and the tab is properly removed from the source panel.

### Issue: Panel resizing is jerky
**Solution**: Use proper debouncing and ensure child elements don't interfere with resize handlers.

### Issue: Maximized panel doesn't cover the entire workspace
**Solution**: Check z-index settings and ensure maximized panels use fixed positioning.

### Issue: Layout doesn't save properly
**Solution**: Check for circular references in the layout object before serialization.

## Examples

### Basic Panel Manager Setup

```tsx
function MyWorkspace() {
  const [layout, setLayout] = useState<PanelConfig>(defaultLayout);
  
  return (
    <PanelProvider>
      <div className="h-screen w-full">
        <PanelManager 
          initialLayout={layout} 
          onChange={setLayout} 
        />
      </div>
    </PanelProvider>
  );
}
```

### Creating a New Tab Programmatically

```tsx
function addEmailViewerTab(email) {
  const { addTab } = usePanelContext();
  
  const tabId = `email-${email.id}`;
  
  addTab('main-panel', {
    id: tabId,
    title: email.subject,
    closeable: true,
    icon: <Mail />,
  }, (
    <EmailViewer email={email} />
  ));
}
```

### Custom Layout Template

```tsx
const emailTriageLayout: PanelConfig = {
  id: 'root',
  type: 'split',
  direction: 'horizontal',
  children: [
    {
      id: 'folders-panel',
      type: 'panel',
      size: 20,
      tabs: [
        { id: 'folders-tab', title: 'Folders' }
      ],
      activeTabId: 'folders-tab'
    },
    {
      id: 'emails-panel',
      type: 'panel',
      size: 30,
      tabs: [
        { id: 'inbox-tab', title: 'Inbox' }
      ],
      activeTabId: 'inbox-tab'
    },
    {
      id: 'content-panel',
      type: 'panel',
      size: 50,
      tabs: [
        { id: 'preview-tab', title: 'Preview' }
      ],
      activeTabId: 'preview-tab'
    }
  ]
};
```

## See Also

- [Layout Persistence Documentation](./layout-persistence-documentation.md)
- [Component Registry Documentation](./component-registry-documentation.md)
- [Drag and Drop Documentation](./drag-drop-system.md)