# NEXUS Email Component Registry System Documentation

## Overview

The NEXUS Email Component Registry is a robust system designed to manage, organize, and facilitate communication between all components in the NEXUS.email application. This registry allows for flexible, dynamic creation of UI components that can be placed in various panels throughout the application.

## Core Features

1. **Component Registration**: Register components with metadata, configurations, and capabilities
2. **Instance Management**: Create, update, and delete component instances
3. **State Persistence**: Multiple options for state persistence (none, session, local, sync)
4. **Search Integration**: Built-in search capabilities for compatible components
5. **Event Communication**: Component-to-component communication via events
6. **Panel Compatibility**: Define where components can be placed in the UI
7. **Access Control**: Permission/authorization requirements for components

## Key Structures

### Registry Interfaces

#### Component Definition

The `EnhancedComponentDefinition` interface defines all metadata and capabilities for a component:

```typescript
interface EnhancedComponentDefinition {
  // Core properties
  id: string;                              // Unique identifier
  displayName: string;                     // User-friendly name
  description?: string;                    // Component description
  category: ComponentCategory;             // Component category
  tags?: string[];                         // Tags for filtering/search
  version?: string;                        // Component version
  
  // Visual properties
  icon?: LucideIcon;                       // Icon for display in UI
  color?: string;                          // Associated color
  
  // Component implementation
  component: React.ComponentType<any>;     // The actual component
  wrapper?: React.ComponentType<any>;      // Optional wrapper component
  
  // Placement and restrictions
  supportedPanelTypes?: PanelType[];       // Where component can be placed
  singleton?: boolean;                     // Only one instance can exist
  maxInstances?: number;                   // Maximum instances allowed
  minSize?: { width: number, height: number }; // Minimum size
  defaultSize?: { width: number, height: number }; // Default size
  
  // Priority and visibility
  priority?: ComponentPriority;            // Display priority
  visibility?: ComponentVisibility;        // Visibility in component lists
  
  // State management
  statePersistence?: StatePersistence;     // How state is persisted
  initialState?: Record<string, any>;      // Initial state
  
  // Search integration
  searchCapability?: SearchCapability;     // Search capabilities
  searchAdapter?: any;                     // Search adapter (if applicable)
  
  // Security and permissions
  permissions?: ComponentPermissions;      // Required permissions
  authentication?: boolean;                // Requires authentication
  
  // Integration capabilities
  integrations?: IntegrationPoints;        // Integration points
  
  // Update and notification settings
  updateSettings?: ComponentUpdateSettings; // Update settings
  
  // Configuration
  defaultConfig?: ComponentConfig;         // Default configuration
  supportedConfig?: string[];              // Supported configuration options
  requiredConfig?: string[];               // Required configuration options
  
  // Lifecycle hooks
  onMount?: (instanceId: string, config?: any) => void;
  onUnmount?: (instanceId: string) => void;
  onFocus?: (instanceId: string) => void;
  onBlur?: (instanceId: string) => void;
  
  // Feature flags
  featureFlags?: string[];                 // Required feature flags
}
```

#### Component Instance

The `ComponentInstance` interface tracks runtime instances of components:

```typescript
interface ComponentInstance {
  instanceId: string;               // Unique instance identifier
  componentId: string;              // Component definition ID
  panelId: string;                  // Panel containing this component
  tabId: string;                    // Tab containing this component
  config?: ComponentConfig;         // Instance-specific configuration
  state?: Record<string, any>;      // Current component state
  context?: Record<string, any>;    // Context data for this instance
  lastActive?: Date;                // When this instance was last active
  created?: Date;                   // When this instance was created
}
```

## Component Communication

The registry includes a robust event system for inter-component communication:

```typescript
// Example event emission
emitComponentEvent(
  ComponentEventType.EMAIL_SELECTED,
  'email-list',
  'instance-123',
  { emailId: 456, subject: 'Meeting tomorrow' }
);

// Example event subscription
useComponentEvent(
  ComponentEventType.EMAIL_SELECTED,
  (event) => {
    console.log('Email selected:', event.payload.emailId);
    // Handle the event...
  },
  [dependencies]
);
```

## Component Wrapper

Components registered with the registry can use the `EnhancedComponentWrapper` to get consistent UI features:

- Standard toolbar with component title
- Search integration
- State persistence
- Configuration options
- Maximize/minimize capabilities

```tsx
const EnhancedComponent = withEnhancedComponent(MyComponent, {
  toolbar: <CustomToolbar />,
  searchAdapter: new SearchAdapter(),
  hideToolbar: false
});
```

## Usage Examples

### Registering a Component

```typescript
defineEnhancedComponent({
  id: 'inbox-list',
  displayName: 'Inbox',
  description: 'View all incoming emails',
  category: 'email',
  tags: ['email', 'inbox', 'messages'],
  icon: InboxIcon,
  component: EnhancedEmailListPane,
  supportedPanelTypes: ['main', 'sidebar', 'any'],
  priority: ComponentPriority.CRITICAL,
  statePersistence: StatePersistence.SESSION,
  searchCapability: SearchCapability.ADVANCED,
  defaultConfig: {
    defaultFilters: { category: 'inbox' },
    refreshOnMount: true,
    refreshOnFocus: true
  },
  integrations: {
    events: [
      ComponentEventType.EMAIL_SELECTED,
      ComponentEventType.EMAIL_READ,
      ComponentEventType.EMAIL_ARCHIVED,
      ComponentEventType.EMAIL_DELETED
    ],
    dataProvider: true
  }
});
```

### Creating a Component Instance

```typescript
const instance = enhancedComponentRegistry.createInstance(
  'email-list',        // Component ID
  'main-panel',        // Panel ID
  'tab-123',           // Tab ID
  { refreshOnMount: false }  // Optional config override
);
```

### Using Component Context in a Component

```tsx
function MyComponent() {
  const { state, updateState, config, updateConfig } = useComponentContext();
  
  return (
    <div>
      <h1>{config.title || 'Default Title'}</h1>
      <button onClick={() => updateState({ count: (state.count || 0) + 1 })}>
        Clicks: {state.count || 0}
      </button>
    </div>
  );
}
```

## Key Concepts

### Component Categories

Components are organized into categories for easier navigation:
- email
- productivity
- settings
- utility
- tags
- calendar
- tasks
- contacts
- notes
- browser
- files
- search
- tools

### Panel Types

Components can be placed in different panel types:
- main (center content area)
- sidebar (left or right sidebar)
- bottom (bottom panel)
- any (can be placed anywhere)

### State Persistence

Component state can be persisted in several ways:
- none (in-memory only)
- session (sessionStorage)
- local (localStorage)
- sync (synchronized with server)

### Search Capabilities

Components can define their search capabilities:
- none (no search support)
- basic (simple text search)
- advanced (search with filters)
- full (complete search with saved searches)

## Migration Guide

If you have existing components using the basic component registry, you can migrate them to the enhanced registry:

```typescript
import { migrateToEnhancedRegistry } from './utils/componentRegistryInitializer';

// This will convert all basic components to enhanced components
migrateToEnhancedRegistry();
```

## Best Practices

1. **Component Isolation**: Make components self-contained to maximize reusability
2. **Consistent Search**: Implement search adapters for all content-heavy components
3. **Meaningful Events**: Use specific event types for clear communication between components
4. **Performance Awareness**: Be mindful of components with heavy state that may need optimization
5. **Descriptive Metadata**: Provide thorough descriptions, tags, and categories for discovery
6. **State Management**: Choose the appropriate state persistence level based on the component's needs
7. **Configuration First**: Make components configurable instead of hard-coding behaviors

## Development Workflow

1. Define component interface and state model
2. Implement core component functionality
3. Wrap with `withEnhancedComponent` to add standard features
4. Register with the registry using `defineEnhancedComponent`
5. Test component in isolation and within panels
6. Document component integration points

## Troubleshooting

Common issues:
- Component not appearing in selectors: Check visibility settings
- State not persisting: Verify statePersistence setting
- Component communication failures: Ensure events are properly defined
- Multiple instances of singleton component: Check singleton flag

## Future Enhancements

Planned improvements:
- Component version management and updates
- Dynamic loading of components from plugin system
- Enhanced analytics for component usage
- Improved performance monitoring

---

This documentation provides an overview of the NEXUS Email Component Registry System. For more detailed implementation examples, refer to the code samples in the repository.