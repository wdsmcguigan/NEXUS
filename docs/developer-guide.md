# NEXUS.email Developer Guide

## Introduction

This guide provides a comprehensive overview of the NEXUS.email architecture, systems, and development practices. It's designed to help developers understand how the various components of the application work together and how to effectively contribute to the codebase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Systems](#core-systems)
   - [Panel Management System](#panel-management-system)
   - [Component Registry](#component-registry)
   - [Inter-Component Communication](#inter-component-communication)
   - [Layout Persistence](#layout-persistence)
   - [Search System](#search-system)
3. [Development Workflow](#development-workflow)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Topics](#advanced-topics)

## Architecture Overview

NEXUS.email is a cutting-edge email client with advanced dynamic layout management, offering unprecedented flexibility in workspace organization and user interface customization.

### Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API, custom state managers
- **Backend**: Node.js, Express
- **Storage**: In-memory, PostgreSQL (optional)
- **Build Tools**: Vite, esbuild

### High-Level Architecture

```
+----------------------------------------------------+
| UI Layer                                           |
|  +----------------+  +------------------------+    |
|  | UI Components  |  | shadcn/ui Components   |    |
|  +----------------+  +------------------------+    |
+----------------------------------------------------+
                        |
+----------------------------------------------------+
| Application Layer                                   |
|  +----------------+  +------------------------+    |
|  | Panel System   |  | Component Registry     |    |
|  +----------------+  +------------------------+    |
|  +----------------+  +------------------------+    |
|  | Event System   |  | Layout Persistence     |    |
|  +----------------+  +------------------------+    |
+----------------------------------------------------+
                        |
+----------------------------------------------------+
| Data Layer                                         |
|  +----------------+  +------------------------+    |
|  | API Services   |  | State Management       |    |
|  +----------------+  +------------------------+    |
+----------------------------------------------------+
                        |
+----------------------------------------------------+
| Backend                                            |
|  +----------------+  +------------------------+    |
|  | REST API       |  | Storage                |    |
|  +----------------+  +------------------------+    |
+----------------------------------------------------+
```

### Directory Structure

```
nexus-email/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   └── [feature]/  # Feature-specific components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Core libraries and utilities
│   │   │   ├── communication/  # Communication system
│   │   │   ├── layouts/    # Layout management
│   │   │   └── search/     # Search system
│   │   ├── pages/          # Page components
│   │   └── services/       # API and service layer
│   └── public/             # Static assets
├── server/                 # Backend code
│   ├── controllers/        # API controllers
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   └── services/           # Backend services
├── shared/                 # Shared code
│   └── schema.ts           # Shared type definitions
└── docs/                   # Documentation
```

## Core Systems

NEXUS.email is built around several core systems that work together to create a flexible, extensible email client. Understanding these systems is crucial for effective development.

### Panel Management System

The Panel Management System provides the foundation for the flexible UI, allowing users to create, split, resize, and arrange panels dynamically.

#### Key Features

- Dynamic panel creation and manipulation
- Tab management within panels
- Drag and drop support for tabs and content
- Resizable panels with responsive behavior
- Panel layouts with persistence

#### Core Components

- `PanelManager`: Manages the overall panel layout
- `PanelContainer`: Renders panels and handles events
- `AdvancedTabBar`: Manages tabs within panels
- `UniversalTabPanel`: Renders tab content

#### Example: Creating a New Panel

```typescript
// Split an existing panel horizontally
function splitPanelHorizontally(panelId: string) {
  panelContext.splitPanel(
    panelId,
    'horizontal',
    {
      id: generateId(),
      type: 'panel',
      tabs: [
        { id: generateId(), title: 'New Panel' }
      ],
      activeTabId: tabs[0].id
    }
  );
}
```

For more details, see the [Panel Management Documentation](./panel-management.md).

### Component Registry

The Component Registry system manages registration, discovery, and instantiation of UI components throughout the application.

#### Key Features

- Component registration with metadata
- Component instance management
- Search integration
- State persistence
- Consistent component wrapping

#### Core Components

- `EnhancedComponentRegistry`: Manages component definitions and instances
- `EnhancedComponentWrapper`: HOC that adds standard features to components
- `ComponentContext`: Provides access to component state and configuration

#### Example: Registering a Component

```typescript
// Register a component
defineEnhancedComponent({
  id: 'email-list',
  displayName: 'Email List',
  description: 'Displays a list of emails',
  category: 'email',
  component: EmailListComponent,
  supportsSearch: true,
  searchAdapter: new EmailSearchAdapter(),
  statePersistence: StatePersistence.LOCAL
});
```

For more details, see the [Component Registry Documentation](./component-registry-documentation.md).

### Inter-Component Communication

The Inter-Component Communication system enables components to communicate with each other through various mechanisms.

#### Key Features

- Event Bus for application-wide events
- Direct component communication
- Shared context data
- Drag and drop operations
- Command system with keyboard shortcuts

#### Core Components

- `EventBus`: Global publish/subscribe event system
- `ComponentCommunication`: Direct component interaction
- `ContextProvider`: Shared application state
- `DragDropManager`: Cross-component drag and drop
- `CommandRegistry`: Global commands and shortcuts

#### Example: Component Communication

```typescript
// Publishing an event
eventBus.publish(
  EmailEventType.EMAIL_SELECTED,
  {
    emailId: 123,
    accountId: 1,
    preview: false
  }
);

// Subscribing to events
const subscriptionId = eventBus.subscribe<EmailSelectedEvent>(
  EmailEventType.EMAIL_SELECTED,
  (event) => {
    console.log(`Email selected: ${event.emailId}`);
    // Handle email selection
  }
);
```

For more details, see the [Inter-Component Communication Documentation](./inter-component-communication.md).

### Layout Persistence

The Layout Persistence system enables saving, loading, and synchronizing workspace layouts.

#### Key Features

- Layout serialization
- Layout templates
- Multi-device sync
- Layout import/export
- User customization

#### Core Components

- `LayoutSerialization`: Converts layouts to/from serializable format
- `LayoutPersistenceService`: Manages saving and loading layouts
- `LayoutSyncService`: Handles device synchronization
- `LayoutTemplates`: Provides predefined layouts

#### Example: Saving and Loading Layouts

```typescript
// Save the current layout
layoutPersistenceService.saveCurrentLayout('My Custom Layout');

// Load a saved layout
layoutPersistenceService.loadLayout('My Custom Layout');
```

For more details, see the [Layout Persistence Documentation](./layout-persistence-documentation.md).

### Search System

The Search System provides powerful and flexible search capabilities across all components of the application.

#### Key Features

- Universal search across all components
- Component-specific search
- Search adapters for component integration
- Saved search management
- Advanced search with multiple fields

#### Core Components

- `SearchService`: Core search functionality
- `SearchAdapter`: Interface for component search integration
- `UniversalSearchBar`: Global search UI
- `AdvancedSearchPanel`: Complex search UI
- `SavedSearchManager`: Manages saved searches

#### Example: Implementing Search in a Component

```typescript
// Create a search adapter
class EmailSearchAdapter implements SearchAdapter {
  search(query: string, options?: SearchOptions): SearchResult[] {
    // Implementation
    return searchResults;
  }
}

// Use the search adapter
function EmailListWithSearch() {
  const { searchQuery, searchResults, search } = useSearchAdapter(
    new EmailSearchAdapter()
  );
  
  // Component implementation
}
```

For more details, see the [Search System Documentation](./search-system.md).

## Development Workflow

### Setting Up the Development Environment

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Access the application at `http://localhost:3000`

### Creating a New Component

1. **Define the component interface**:
   ```typescript
   interface EmailViewerProps {
     emailId?: number;
     tabId?: string;
     panelId?: string;
   }
   ```

2. **Create the base component**:
   ```typescript
   function EmailViewer({ emailId, tabId, panelId }: EmailViewerProps) {
     // Component implementation
     return <div>Email Viewer Component</div>;
   }
   ```

3. **Add communication capabilities**:
   ```typescript
   function EmailViewerWithCommunication({ emailId, tabId, panelId }: EmailViewerProps) {
     // Register with component registry
     const { componentId, sendRequest } = useComponentRegistration(
       ComponentType.EMAIL_VIEWER,
       {
         tabId,
         panelId,
         title: 'Email Viewer'
       }
     );
     
     // Subscribe to events
     useEvent(
       EmailEventType.EMAIL_SELECTED,
       (event) => {
         // Handle event
       }
     );
     
     // Component implementation
   }
   ```

4. **Register the component**:
   ```typescript
   defineEnhancedComponent({
     id: 'email-viewer',
     displayName: 'Email Viewer',
     description: 'Displays email content',
     category: 'email',
     component: EmailViewerWithCommunication,
     // Additional configuration
   });
   ```

### Adding a New Feature

1. **Plan the feature**: Define the requirements and design
2. **Create new components**: Implement the UI components
3. **Add communication**: Integrate with existing systems
4. **Test the feature**: Verify functionality
5. **Document the feature**: Update documentation

### Testing Changes

1. **Manual testing**: Test the feature in the development environment
2. **Integration testing**: Verify interaction with other components
3. **Performance testing**: Ensure the feature performs well

## Best Practices

### Code Organization

1. **Component Structure**:
   - Keep components focused on a single responsibility
   - Use composition for complex UIs
   - Keep state management close to where it's used

2. **File Naming Conventions**:
   - Use PascalCase for component files (`EmailViewer.tsx`)
   - Use camelCase for utility files (`layoutUtils.ts`)
   - Use kebab-case for CSS files (`email-viewer.css`)

3. **Import Organization**:
   - Group imports by type (React, third-party, project)
   - Use absolute imports for project files
   - Minimize unnecessary imports

### React Best Practices

1. **Component Design**:
   - Use functional components with hooks
   - Break large components into smaller ones
   - Use React.memo for performance when appropriate

2. **State Management**:
   - Use useState for simple component state
   - Use useReducer for complex state logic
   - Use context for shared state

3. **Effect Management**:
   - Include all dependencies in dependency arrays
   - Clean up effects that create subscriptions
   - Use appropriate dependency arrays

### Performance Considerations

1. **Rendering Optimization**:
   - Memoize expensive computations with useMemo
   - Prevent unnecessary renders with React.memo
   - Use virtualization for long lists

2. **Event Handling**:
   - Debounce or throttle frequent events
   - Use event delegation where appropriate
   - Clean up event listeners

3. **Data Loading**:
   - Implement pagination for large datasets
   - Show loading states during data fetching
   - Handle errors gracefully

### TypeScript Usage

1. **Type Definitions**:
   - Define interfaces for component props
   - Use type inference where possible
   - Avoid using `any` type

2. **Generics**:
   - Use generics for reusable components and functions
   - Provide sensible defaults for generic types
   - Constrain generics when appropriate

3. **Type Guards**:
   - Use type guards to narrow types
   - Define custom type guards for complex types
   - Use discriminated unions for type narrowing

## Troubleshooting

### Common Issues and Solutions

1. **Component Not Appearing in Registry**:
   - Verify the component is properly registered
   - Check for console errors during registration
   - Verify the component metadata is correct

2. **Events Not Being Received**:
   - Check event type spelling and case
   - Verify the subscriber is registered before events occur
   - Check for proper unsubscription in useEffect cleanup

3. **Panel Layout Issues**:
   - Check panel IDs for uniqueness
   - Verify panel structure follows the expected format
   - Check for circular references in panel configuration

4. **Search Not Working**:
   - Verify the component has a proper search adapter
   - Check search adapter implementation for errors
   - Verify searchable content is properly provided

5. **Layout Not Saving/Loading**:
   - Check for localStorage availability and permissions
   - Verify layout serialization is correct
   - Check for layout validation errors

### Debugging Tips

1. **React Component Debugging**:
   - Use React DevTools to inspect component hierarchy
   - Check props and state for unexpected values
   - Verify render cycles with useEffect console logs

2. **Event Debugging**:
   - Add subscribers that log all events for debugging
   - Verify event payloads match expected format
   - Check subscriber registration timing

3. **Layout Debugging**:
   - Visualize layout structure with console.log
   - Check serialized layout format
   - Verify panel IDs and references

## Advanced Topics

### Creating Custom Implementations

1. **Custom Search Adapters**:
   Create search adapters for specific data types:
   ```typescript
   class CustomSearchAdapter implements SearchAdapter {
     search(query: string, options?: SearchOptions): SearchResult[] {
       // Custom implementation
       return results;
     }
   }
   ```

2. **Custom Panel Types**:
   Extend the panel system with custom panel types:
   ```typescript
   const customPanelConfig: PanelConfig = {
     id: 'custom-panel',
     type: 'custom-panel',
     // Custom configuration
   };
   
   function CustomPanelRenderer({ config }) {
     // Custom rendering logic
   }
   ```

3. **Custom Communication Channels**:
   Implement specialized communication channels:
   ```typescript
   // Create a specialized event bus
   const emailEventBus = createEventBus<EmailEvent>();
   
   // Create a typed subscription handler
   const useEmailEvent = createTypedSubscribe<EmailEvent>(emailEventBus);
   ```

### Performance Optimization

1. **Virtualized Rendering**:
   Implement virtualized lists for large datasets:
   ```tsx
   import { FixedSizeList } from 'react-window';
   
   function VirtualizedEmailList({ emails }) {
     return (
       <FixedSizeList
         height={500}
         width="100%"
         itemCount={emails.length}
         itemSize={50}
       >
         {({ index, style }) => (
           <EmailListItem
             style={style}
             email={emails[index]}
           />
         )}
       </FixedSizeList>
     );
   }
   ```

2. **Lazy Loading Components**:
   Implement lazy loading for components:
   ```tsx
   const LazyEmailViewer = React.lazy(() => import('./EmailViewer'));
   
   function EmailViewerTab() {
     return (
       <React.Suspense fallback={<div>Loading...</div>}>
         <LazyEmailViewer />
       </React.Suspense>
     );
   }
   ```

3. **Worker Offloading**:
   Offload heavy computations to web workers:
   ```typescript
   // In worker.ts
   self.onmessage = (e) => {
     const { data, taskId } = e.data;
     const result = performHeavyComputation(data);
     self.postMessage({ result, taskId });
   };
   
   // In component
   function ComponentWithWorker() {
     const [result, setResult] = useState(null);
     
     useEffect(() => {
       const worker = new Worker('./worker.js');
       worker.onmessage = (e) => {
         setResult(e.data.result);
       };
       
       worker.postMessage({ data, taskId: 'task-1' });
       
       return () => worker.terminate();
     }, [data]);
     
     return <div>{result}</div>;
   }
   ```

### Advanced Integration

1. **External Service Integration**:
   Integrate with third-party services:
   ```typescript
   // OAuth integration example
   async function authenticateWithExternalService() {
     const authWindow = window.open(
       'https://api.service.com/oauth/authorize',
       'auth',
       'width=600,height=600'
     );
     
     return new Promise((resolve, reject) => {
       window.addEventListener('message', (event) => {
         if (event.origin !== window.location.origin) return;
         
         if (event.data.type === 'oauth-callback') {
           resolve(event.data.token);
         }
       });
     });
   }
   ```

2. **Plugin System**:
   Implement a plugin system for extensions:
   ```typescript
   // Plugin registry
   class PluginRegistry {
     private plugins: Map<string, Plugin> = new Map();
     
     registerPlugin(plugin: Plugin): void {
       this.plugins.set(plugin.id, plugin);
       plugin.initialize();
     }
     
     getPlugin(id: string): Plugin | undefined {
       return this.plugins.get(id);
     }
     
     executeHook(hookName: string, ...args: any[]): any[] {
       const results = [];
       
       for (const plugin of this.plugins.values()) {
         if (typeof plugin[hookName] === 'function') {
           results.push(plugin[hookName](...args));
         }
       }
       
       return results;
     }
   }
   ```

### Accessibility Enhancements

1. **Keyboard Navigation**:
   Implement comprehensive keyboard navigation:
   ```typescript
   function KeyboardNavigableList({ items }) {
     const [selectedIndex, setSelectedIndex] = useState(0);
     
     const handleKeyDown = (e: KeyboardEvent) => {
       switch (e.key) {
         case 'ArrowDown':
           setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
           break;
         case 'ArrowUp':
           setSelectedIndex(prev => Math.max(prev - 1, 0));
           break;
         case 'Enter':
           selectItem(items[selectedIndex]);
           break;
       }
     };
     
     useEffect(() => {
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [items, selectedIndex]);
     
     return (
       <div role="listbox" aria-activedescendant={`item-${selectedIndex}`}>
         {items.map((item, index) => (
           <div
             role="option"
             id={`item-${index}`}
             aria-selected={index === selectedIndex}
             tabIndex={index === selectedIndex ? 0 : -1}
           >
             {item.name}
           </div>
         ))}
       </div>
     );
   }
   ```

2. **Screen Reader Support**:
   Enhance components for screen reader users:
   ```tsx
   function EmailListItem({ email, isUnread }) {
     return (
       <div 
         role="listitem"
         aria-labelledby={`email-${email.id}-subject`}
       >
         <div 
           id={`email-${email.id}-subject`}
           aria-describedby={`email-${email.id}-details`}
         >
           {email.subject}
         </div>
         <div id={`email-${email.id}-details`}>
           From {email.sender} on {formatDate(email.date)}
           {isUnread && <span aria-label="Unread email">•</span>}
         </div>
       </div>
     );
   }
   ```

## Related Documentation

For more detailed information about specific subsystems, refer to:

- [Architecture Overview](./architecture-overview.md)
- [Panel Management Documentation](./panel-management.md)
- [Component Registry Documentation](./component-registry-documentation.md)
- [Inter-Component Communication Documentation](./inter-component-communication.md)
- [Layout Persistence Documentation](./layout-persistence-documentation.md)
- [Search System Documentation](./search-system.md)