# NEXUS.email Component Registry System

## Overview

The Component Registry System is a core part of NEXUS.email that manages registration, discovery, and instantiation of UI components throughout the application. It enables dynamic loading of components into tabs and panels, enhancing the application's flexibility and extensibility.

## Key Concepts

### Component Definition

A Component Definition is the metadata that describes a component:
- Type and category
- Display information (name, description, icon)
- Configuration options
- Search capabilities
- Placement restrictions

### Component Instance

A Component Instance is a specific instance of a component placed in a tab:
- Unique ID
- Reference to its component definition
- Instance-specific configuration
- Instance-specific state
- Location information (panel, tab)

### Component Wrapper

The Component Wrapper enhances base components with standard features:
- Search integration
- State persistence
- Toolbars and context menu support
- Consistent styling and behavior

## Core Interfaces

### Component Definition

```typescript
interface EnhancedComponentDefinition {
  id: string;                     // Unique identifier
  displayName: string;            // User-friendly name
  description?: string;           // Detailed description
  category: string;               // Organizational category
  tags?: string[];                // Searchable tags
  icon?: React.ComponentType;     // Icon for menus and tabs
  component: React.ComponentType<any>; // The actual component
  defaultConfig?: Record<string, any>; // Default configuration
  supportsSearch?: boolean;       // Whether it supports search
  searchAdapter?: SearchAdapter;  // Search implementation
  supportedPanelTypes?: PanelType[]; // Where it can be placed
  statePersistence?: StatePersistence; // How state is saved
  priority?: ComponentPriority;   // Display priority
  singleton?: boolean;            // Allow only one instance
  visibility?: ComponentVisibility; // UI visibility level
  permissions?: string[];         // Required permissions
  metadata?: Record<string, any>; // Additional metadata
}
```

### Component Instance

```typescript
interface ComponentInstance {
  instanceId: string;             // Unique instance ID
  componentId: string;            // Component definition ID
  panelId: string;                // Panel containing this instance
  tabId: string;                  // Tab containing this instance
  config?: Record<string, any>;   // Instance configuration
  state?: Record<string, any>;    // Current component state
  context?: Record<string, any>;  // Context data
  lastActive?: Date;              // Last active timestamp
  created?: Date;                 // Creation timestamp
}
```

### Search Adapter

```typescript
interface SearchAdapter {
  search(query: string, options?: SearchOptions): SearchResult[];
  getSearchableContent(): string;
  highlightMatch(content: string, match: SearchMatch): React.ReactNode;
  getSearchPlaceholder(): string;
}
```

## Architecture

The Component Registry system consists of several parts:

### Enhanced Component Registry

The `EnhancedComponentRegistry` is the core class that manages components:

```typescript
class EnhancedComponentRegistry {
  // Component registration
  defineComponent(definition: EnhancedComponentDefinition): string;
  registerComponent(component: EnhancedComponentDefinition): string;
  unregisterComponent(id: string): boolean;
  
  // Component retrieval
  getComponent(id: string): EnhancedComponentDefinition | undefined;
  getAllComponents(): EnhancedComponentDefinition[];
  getComponentsByCategory(category: string): EnhancedComponentDefinition[];
  getComponentsByTag(tag: string): EnhancedComponentDefinition[];
  getComponentsForPanelType(panelType: PanelType): EnhancedComponentDefinition[];
  
  // Instance management
  createInstance(componentId: string, panelId: string, tabId: string, config?: Record<string, any>): ComponentInstance | null;
  getInstance(instanceId: string): ComponentInstance | undefined;
  getAllInstances(): ComponentInstance[];
  getInstancesForComponent(componentId: string): ComponentInstance[];
  deleteInstance(instanceId: string): boolean;
  
  // State management
  saveInstanceState(instanceId: string, state: Record<string, any>): boolean;
  loadInstanceState(instanceId: string): Record<string, any> | null;
}
```

### Enhanced Component Wrapper

The `EnhancedComponentWrapper` is a Higher-Order Component (HOC) that wraps base components:

```typescript
function withEnhancedComponent<P>(
  BaseComponent: React.ComponentType<P>,
  options: {
    toolbar?: React.ReactNode;
    searchAdapter?: SearchAdapter;
    statePersistence?: StatePersistence;
  } = {}
): React.ComponentType<P & { instanceId: string }>;
```

### Component Context

The `ComponentContext` provides access to the component's configuration and state:

```typescript
const ComponentContext = React.createContext<ComponentContextValue>({
  instanceId: '',
  state: {},
  updateState: () => {},
  config: {},
  updateConfig: () => {},
  isMaximized: false,
  setIsMaximized: () => {}
});

function useComponentContext(): ComponentContextValue;
```

## Usage Examples

### Defining and Registering a Component

```typescript
import { defineEnhancedComponent, ComponentPriority, StatePersistence } from '../lib/enhancedComponentRegistry';
import { Settings } from 'lucide-react';
import { TextContentSearchAdapter } from '../lib/search/searchAdapters';

// Define a component with all metadata
defineEnhancedComponent({
  id: 'email-list',
  displayName: 'Email List',
  description: 'Displays a list of emails from your inbox',
  category: 'email',
  tags: ['email', 'inbox', 'list', 'messages'],
  icon: Settings,
  component: EmailListComponent,
  defaultConfig: {
    showUnreadOnly: false,
    sortBy: 'date',
    sortDirection: 'desc'
  },
  supportsSearch: true,
  searchAdapter: new TextContentSearchAdapter({ containerSelector: '.email-content' }),
  supportedPanelTypes: ['main', 'sidebar'],
  statePersistence: StatePersistence.LOCAL,
  priority: ComponentPriority.HIGH,
  singleton: false,
  visibility: ComponentVisibility.DEFAULT,
  permissions: ['read:email']
});
```

### Creating a Component with Wrapper

```typescript
import { withEnhancedComponent } from '../components/EnhancedComponentWrapper';
import { TextContentSearchAdapter } from '../lib/search/searchAdapters';

// Base component
function EmailList({ instanceId, filter, ...props }) {
  // Component implementation
  return <div>{/* Component content */}</div>;
}

// Enhanced component with wrapper
export const EnhancedEmailList = withEnhancedComponent(EmailList, {
  // Custom toolbar for the component
  toolbar: (
    <div className="flex items-center gap-2">
      <FilterDropdown />
      <SearchInput />
    </div>
  ),
  // Search adapter for integrating with the search system
  searchAdapter: new TextContentSearchAdapter({
    containerSelector: '.email-item',
    textSelector: '.email-content'
  })
});
```

### Using Component Context

```typescript
import { useComponentContext } from '../components/EnhancedComponentWrapper';

function EmailListWithConfig({ instanceId }) {
  // Get access to component configuration and state
  const { 
    state, 
    updateState, 
    config, 
    updateConfig 
  } = useComponentContext();
  
  // Use configuration values
  const { showUnreadOnly, sortBy, sortDirection } = config;
  
  // Use and update state
  const { selectedEmails } = state;
  
  const selectEmail = (emailId) => {
    updateState({
      selectedEmails: [...selectedEmails, emailId]
    });
  };
  
  // Update configuration
  const toggleUnreadOnly = () => {
    updateConfig({
      showUnreadOnly: !showUnreadOnly
    });
  };
  
  // Component implementation
  return (
    <div>
      <div className="toolbar">
        <button onClick={toggleUnreadOnly}>
          {showUnreadOnly ? 'Show All' : 'Show Unread Only'}
        </button>
      </div>
      
      <div className="email-list">
        {/* Email list rendering */}
      </div>
    </div>
  );
}
```

### Creating a Component Instance

```typescript
import { enhancedComponentRegistry } from '../lib/enhancedComponentRegistry';

function openEmailViewer(emailId) {
  // Create a new instance of the email viewer component
  const instance = enhancedComponentRegistry.createInstance(
    'email-viewer',        // Component ID
    'main-panel',          // Panel ID
    `email-tab-${emailId}`, // Tab ID
    { emailId }            // Configuration
  );
  
  if (instance) {
    // Focus the new instance or perform other operations
    return instance.instanceId;
  }
  
  return null;
}
```

### Creating a Searchable Component

```typescript
// Custom search adapter
class EmailSearchAdapter implements SearchAdapter {
  private emails: Email[];
  
  constructor(emails: Email[]) {
    this.emails = emails;
  }
  
  search(query: string): SearchResult[] {
    return this.emails
      .filter(email => 
        email.subject.includes(query) || 
        email.body.includes(query) ||
        email.from.includes(query)
      )
      .map(email => ({
        id: email.id.toString(),
        title: email.subject,
        preview: email.body.substring(0, 100),
        relevance: 1.0, // Calculate relevance based on match quality
        matches: [
          // Identify specific matches for highlighting
          { field: 'subject', text: email.subject, positions: [] },
          { field: 'body', text: email.body, positions: [] }
        ]
      }));
  }
  
  getSearchableContent(): string {
    return this.emails
      .map(email => `${email.subject} ${email.from} ${email.body}`)
      .join(' ');
  }
  
  highlightMatch(content: string, match: SearchMatch): React.ReactNode {
    // Implementation for highlighting matches
    return <HighlightedText text={content} matches={match.positions} />;
  }
  
  getSearchPlaceholder(): string {
    return "Search emails...";
  }
}
```

### Component with State Persistence

```typescript
// Component that saves and restores its state
function PersistentComponent({ instanceId }) {
  const { state, updateState } = useComponentContext();
  
  // State is automatically loaded when component mounts
  // and saved when it updates based on the persistence policy
  
  // STATE_PERSISTENCE.SESSION: Saved for the current browser session
  // STATE_PERSISTENCE.LOCAL: Saved in localStorage
  // STATE_PERSISTENCE.SYNC: Saved in server/cloud storage
  
  const incrementCounter = () => {
    updateState({
      counter: (state.counter || 0) + 1
    });
  };
  
  return (
    <div>
      <p>Counter: {state.counter || 0}</p>
      <button onClick={incrementCounter}>Increment</button>
    </div>
  );
}

// Register with state persistence setting
defineEnhancedComponent({
  id: 'persistent-counter',
  displayName: 'Persistent Counter',
  component: withEnhancedComponent(PersistentComponent),
  statePersistence: StatePersistence.LOCAL
});
```

## Component Categories

NEXUS.email organizes components into these categories:

1. **Email** - Email listing, viewing, and composition
2. **Calendar** - Calendar views and event management
3. **Contacts** - Contact lists and contact details
4. **Tasks** - Task lists and task details
5. **Search** - Search interfaces and saved searches
6. **Settings** - Application settings
7. **Tags** - Tag management
8. **Analytics** - Email usage and analytics
9. **Utility** - Utility components
10. **Custom** - User-created components

## Component Lifecycle

Component instances go through several lifecycle stages:

1. **Creation** - Component instance is created with configuration
2. **Mounting** - Component is placed in a tab and rendered
3. **Activation** - Tab becomes active, component receives focus
4. **Deactivation** - Tab becomes inactive, component loses focus
5. **State Persistence** - Component state is saved based on policy
6. **Unmounting** - Component is removed when tab is closed
7. **Destruction** - Component instance is deleted

These stages trigger events that can be observed for coordination between components.

## Search Integration

Components can integrate with the application's search system by providing a search adapter:

1. **Text Content Search** - Search within component's text content
2. **Field Search** - Search specific fields with advanced query syntax
3. **Metadata Search** - Search component metadata and configuration

Search results are aggregated across all components and presented in a unified interface.

## Component Communication

Enhanced components can communicate through several channels:

1. **Events** - Application-wide event bus (see [Inter-Component Communication](./inter-component-communication.md))
2. **Context** - Shared context for selected items
3. **Direct Messaging** - Request/response pattern between components
4. **State** - Shared state through React Context

## Component UI Customization

Components can customize their appearance:

1. **Toolbar** - Component-specific toolbar content
2. **Context Menu** - Custom context menu items
3. **Tab Appearance** - Custom tab rendering
4. **Status Indicators** - Badges, icons, and colors

## Component Configuration

Components can define their configuration schema and UI:

```typescript
// Configuration schema
const emailListConfigSchema = z.object({
  showUnreadOnly: z.boolean().default(false),
  sortBy: z.enum(['date', 'sender', 'subject']).default('date'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  refreshInterval: z.number().min(30).default(300)
});

// Configuration UI component
function EmailListConfig({ config, updateConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Label htmlFor="showUnreadOnly">Show Unread Only</Label>
        <Switch 
          id="showUnreadOnly" 
          checked={config.showUnreadOnly} 
          onCheckedChange={(checked) => updateConfig({ showUnreadOnly: checked })} 
        />
      </div>
      
      {/* Other configuration fields */}
    </div>
  );
}
```

## Best Practices

### 1. Component Boundaries

Define clear component boundaries with well-defined props and minimal dependencies.

```typescript
// Good: Clear props interface
interface EmailListProps {
  instanceId: string;
  filter?: EmailFilter;
  onEmailSelected?: (emailId: string) => void;
}

// Bad: Unclear boundaries, too many responsibilities
interface UnclearProps {
  data: any;
  handlers: any;
  layout?: any;
  // ...many other unclear props
}
```

### 2. State Management

Use the component context for state that needs to persist, local state for ephemeral UI state.

```typescript
// Local UI state - doesn't need to persist
const [isOpen, setIsOpen] = useState(false);

// Persistent state - should use context
const { state, updateState } = useComponentContext();
const { selectedItem, expandedSections } = state;
```

### 3. Performance Optimization

Memoize expensive computations and prevent unnecessary re-renders.

```typescript
// Memoize expensive data transformations
const sortedEmails = useMemo(() => {
  return [...emails].sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc' 
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime();
    }
    // Other sort logic...
  });
}, [emails, sortBy, sortDirection]);

// Prevent unnecessary re-renders
const EmailItem = React.memo(function EmailItem({ email, isSelected, onSelect }) {
  // Implementation
});
```

### 4. Error Handling

Implement proper error boundaries and fallbacks.

```typescript
function EmailListWithErrorHandling({ instanceId }) {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }
  
  return (
    <ErrorBoundary onError={(e) => setError(e)}>
      <EmailList instanceId={instanceId} />
    </ErrorBoundary>
  );
}
```

### 5. Component Registration

Register components during application initialization.

```typescript
// In a setup file or initialization function
function registerApplicationComponents() {
  // Core components
  registerEmailComponents();
  registerCalendarComponents();
  registerContactComponents();
  
  // Utility components
  registerSearchComponents();
  registerAnalyticsComponents();
  
  // User components (if any)
  registerUserComponents();
}
```

## Troubleshooting Common Issues

### Issue: Component state isn't persisting

**Solution**: Ensure the component's `statePersistence` property is set correctly and that the component is using `useComponentContext()` to manage state.

### Issue: Component doesn't appear in component selector

**Solution**: Check that the component is properly registered and that its `visibility` property is not set to `HIDDEN`.

### Issue: Component shows in the wrong category

**Solution**: Verify the `category` property in the component definition.

### Issue: Search doesn't work for a component

**Solution**: Ensure the component has a proper `searchAdapter` implementation and that `supportsSearch` is set to `true`.

### Issue: Component doesn't resize properly

**Solution**: Use proper CSS for responsive design, including flex or grid layouts, and handle the component's dimensions appropriately.

## Migration Guide

### From Basic to Enhanced Components

If you have existing basic components, you can migrate them to enhanced components:

```typescript
// Before: Basic component
class ComponentRegistry {
  register(component: ComponentDefinition) {
    // Basic registration
  }
}

// After: Enhanced component
const myEnhancedComponent = withEnhancedComponent(MyComponent, {
  toolbar: <MyComponentToolbar />,
  searchAdapter: new TextContentSearchAdapter()
});

enhancedComponentRegistry.registerComponent({
  id: 'my-component',
  displayName: 'My Component',
  component: myEnhancedComponent,
  // Enhanced metadata...
});
```

## Advanced Topics

### Custom Component Types

You can create custom component types with specialized behavior:

```typescript
// Custom email viewer with specialized behavior
class EmailViewerComponent extends EnhancedComponent {
  constructor(props) {
    super(props);
    // Custom initialization
  }
  
  // Override standard methods
  getToolbarContent() {
    return <EmailViewerToolbar onReply={this.handleReply} />;
  }
  
  getSearchAdapter() {
    return new EmailContentSearchAdapter(this.props.email);
  }
  
  // Custom methods
  handleReply = () => {
    // Implementation
  };
}

// Register with type information
registerComponent({
  id: 'email-viewer',
  displayName: 'Email Viewer',
  component: EmailViewerComponent,
  metadata: {
    type: 'email-viewer',
    capabilities: ['reply', 'forward', 'print']
  }
});
```

### Component Extensions

You can create extensions that enhance existing components:

```typescript
// Extension for the email list component
registerComponentExtension('email-list', {
  id: 'priority-indicator',
  displayName: 'Priority Indicator',
  render: (props, component) => {
    // Render additional UI elements inside the component
    return (
      <div className="priority-indicator">
        {props.email.priority === 'high' && <HighPriorityIcon />}
      </div>
    );
  }
});
```

### Dynamic Component Loading

Load components dynamically based on user preferences or other factors:

```typescript
// Dynamic component loader
async function loadUserComponents() {
  try {
    const userComponentConfigs = await api.getUserComponents();
    
    for (const config of userComponentConfigs) {
      // Dynamically import the component
      const module = await import(`./user-components/${config.module}`);
      
      // Register the component
      enhancedComponentRegistry.registerComponent({
        id: config.id,
        displayName: config.name,
        component: module.default,
        // Other properties from config
      });
    }
  } catch (error) {
    console.error('Failed to load user components:', error);
  }
}
```

## See Also

- [Inter-Component Communication](./inter-component-communication.md)
- [Panel Management](./panel-management.md)
- [Search System](./search-system.md)