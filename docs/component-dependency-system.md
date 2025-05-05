# NEXUS.email Component Dependency System

## Overview

The Component Dependency System in NEXUS.email enables tabs to respond to selections and data from other tabs. This system serves as a formalized way for components to declare dependencies on each other and establish data flow between them. For example, an Email Viewer tab can depend on an Email List tab to show the currently selected email.

## Key Concepts

### Dependency Types

The system defines different types of data dependencies between components:

- **Email selection**: Email List → Email Viewer
- **Folder selection**: Folder Tree → Email List
- **Tag selection**: Tag Manager → Email List
- **Contact selection**: Contact List → Contact Viewer
- **Calendar event selection**: Calendar → Event Viewer
- **Search query**: Search Component → Search Results

### Dependency Flow

Dependencies establish a clear data flow between provider and consumer components:

```
+----------------+           +----------------+
|   Provider     |  ------>  |   Consumer     |
| (Email List)   |  Data     | (Email Viewer) |
+----------------+           +----------------+
```

### Synchronization Strategies

- **Pull**: Consumer actively requests data from provider when needed
- **Push**: Provider actively notifies consumers when data changes
- **Both**: Combination of pull and push strategies

## Core Components

The Dependency System consists of three main components:

### 1. DependencyRegistry

Manages possible dependencies between component types:

- Registers dependency definitions (e.g., "Email List can provide email data to Email Viewer")
- Provides lookup methods to find possible dependencies
- Validates dependency compatibility

```typescript
// Define a dependency between component types
const emailSelectionDependencyId = dependencyRegistry.registerDependency({
  name: 'Email Selection',
  description: 'Email list provides selected email to email viewer',
  providerType: ComponentType.EMAIL_LIST,
  consumerType: ComponentType.EMAIL_VIEWER,
  dataType: DependencyDataType.EMAIL,
  syncStrategy: DependencySyncStrategy.BOTH,
  isRequired: false,
  isOneToMany: true,
  isManyToOne: false
});
```

### 2. DependencyManager

Handles runtime dependency instances:

- Creates, updates, and removes dependency instances between specific component instances
- Manages data flow between components
- Provides utility methods for querying dependencies

```typescript
// Create a dependency between component instances
const dependencyId = dependencyManager.createDependency(
  emailSelectionDependencyId,  // Definition ID
  'email-list-instance-123',   // Provider instance ID
  'email-viewer-instance-456', // Consumer instance ID,
  { 
    // Optional configuration
    autoUpdate: true,
    options: {
      selectionMode: 'single'
    }
  }
);

// Update dependency data (typically called by provider)
dependencyManager.updateDependencyData(
  dependencyId,
  {
    id: 123,
    subject: 'Team Meeting',
    sender: 'manager@example.com',
    // Other email data...
  }
);

// Request data (typically called by consumer)
const emailData = await dependencyManager.requestData(dependencyId);
```

### 3. React Hooks

For easy integration with React components:

- `useDependencyProvider`: Hook for provider components
- `useDependencyConsumer`: Hook for consumer components
- `useAvailableDependencies`: Hook to discover available dependencies
- `useAutoDependency`: Hook for automatic dependency management

## Usage Examples

### Provider Component Example

```tsx
function EmailList({ id }) {
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  
  // Get dependency definition
  const emailSelectionDependency = dependencyRegistry
    .getDependenciesForProvider(ComponentType.EMAIL_LIST)
    .find(dep => dep.dataType === DependencyDataType.EMAIL);
  
  // Use provider hook
  const { updateData, consumerIds } = useDependencyProvider(
    id,
    emailSelectionDependency?.id || '',
    // Pass initial data if available
    selectedEmail || null
  );
  
  // Handle email selection
  function handleSelectEmail(email) {
    setSelectedEmailId(email.id);
    
    // Update dependency with selected email
    updateData(email);
  }
  
  return (
    <div>
      <h2>Email List {consumerIds.length > 0 && `(Connected to ${consumerIds.length} viewers)`}</h2>
      <div className="email-list">
        {emails.map(email => (
          <div
            key={email.id}
            className={selectedEmailId === email.id ? 'selected' : ''}
            onClick={() => handleSelectEmail(email)}
          >
            {email.subject}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Consumer Component Example

```tsx
function EmailViewer({ id }) {
  // Get dependency definition
  const emailSelectionDependency = dependencyRegistry
    .getDependenciesForConsumer(ComponentType.EMAIL_VIEWER)
    .find(dep => dep.dataType === DependencyDataType.EMAIL);
  
  // Use consumer hook
  const { 
    data: email,
    error,
    isLoading,
    providerId,
    refresh
  } = useDependencyConsumer(
    id,
    emailSelectionDependency?.id || '',
    { autoUpdate: true }
  );
  
  return (
    <div>
      <h2>Email Viewer {providerId && `(Connected to ${providerId})`}</h2>
      
      {isLoading ? (
        <div>Loading email...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : email ? (
        <div className="email-content">
          <h3>{email.subject}</h3>
          <div>From: {email.sender}</div>
          <div>{email.body}</div>
        </div>
      ) : (
        <div>No email selected</div>
      )}
      
      {email && <button onClick={refresh}>Refresh</button>}
    </div>
  );
}
```

## Auto-Dependency Setup

For components that need dependencies automatically:

```tsx
function EmailViewerWithAutoDependency({ id }) {
  // Auto connect to required dependencies
  const { 
    isInitialized,
    error,
    connectedRequiredCount,
    requiredDependencyCount
  } = useAutoDependency(
    id,
    ComponentType.EMAIL_VIEWER,
    {
      autoConnect: true,
      preferredProviders: {
        // Preferred provider component IDs by dependency definition ID
        'email-selection-dep-id': ['email-list-main', 'email-list-sidebar']
      }
    }
  );
  
  // Standard consumer dependency usage
  const { data: email } = useDependencyConsumer(
    id,
    'email-selection-dep-id'
  );
  
  return (
    <div>
      {!isInitialized ? (
        <div>Initializing dependencies...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : connectedRequiredCount < requiredDependencyCount ? (
        <div>Missing required dependencies. Please add an Email List component.</div>
      ) : email ? (
        <div>{email.subject}</div>
      ) : (
        <div>Select an email to view</div>
      )}
    </div>
  );
}
```

## Advanced Features

### Dependency Configuration

Dependencies can be configured with options:

```typescript
// Definition with configuration options
dependencyRegistry.registerDependency({
  // ...other properties
  configOptions: [
    {
      key: 'selectionMode',
      name: 'Selection Mode',
      type: 'select',
      options: [
        { value: 'single', label: 'Single Selection' },
        { value: 'multiple', label: 'Multiple Selection' }
      ],
      defaultValue: 'single',
      required: true
    },
    {
      key: 'autoRefresh',
      name: 'Auto Refresh',
      type: 'boolean',
      defaultValue: true
    }
  ]
});

// Instance with specific configuration
dependencyManager.createDependency(
  definitionId,
  providerId,
  consumerId,
  {
    options: {
      selectionMode: 'multiple',
      autoRefresh: false
    }
  }
);
```

### Data Transformation

Dependencies can transform data between components:

```typescript
// Definition with data transformer
dependencyRegistry.registerDependency({
  // ...other properties
  transformData: (email) => ({
    id: email.id,
    subject: email.subject,
    // Extract only needed fields
  })
});

// Instance with custom transformer
dependencyManager.createDependency(
  definitionId,
  providerId,
  consumerId,
  {
    customTransform: (email) => ({
      title: email.subject,
      content: email.body,
      // Custom transformation
    })
  }
);
```

### Data Filtering

Dependencies can filter data updates:

```typescript
// Only update when the selected email is unread
dependencyManager.createDependency(
  definitionId,
  providerId,
  consumerId,
  {
    filter: (email) => !email.read
  }
);
```

## Dependency Status Management

Dependencies have different status states:

- **Active**: Dependency is active and working correctly
- **Inactive**: Dependency exists but is not currently active
- **Error**: Dependency encountered an error
- **Pending**: Dependency is initializing or waiting for components

```typescript
// Set dependency status
dependencyManager.setDependencyStatus(
  dependencyId,
  DependencyStatus.INACTIVE
);

// Set error status with message
dependencyManager.setDependencyStatus(
  dependencyId,
  DependencyStatus.ERROR,
  'Provider component not found'
);
```

## Integration with Other Systems

### Integration with Component Registry

When a component is registered with the Component Registry, it can declare its dependency capabilities:

```typescript
componentRegistry.registerComponent({
  id: 'email-list',
  // ...other properties
  providesDependencies: [
    { type: DependencyDataType.EMAIL, forConsumerTypes: [ComponentType.EMAIL_VIEWER] }
  ],
  consumesDependencies: [
    { type: DependencyDataType.FOLDER, fromProviderTypes: [ComponentType.FOLDER_TREE] }
  ]
});
```

### Integration with Panel System

When creating a new tab or panel, dependencies can be automatically established:

```typescript
panelManager.addTab(
  'main-panel',
  {
    id: 'email-viewer-tab',
    title: 'Email',
    componentId: 'email-viewer'
  },
  {
    dependencies: [
      {
        definitionId: 'email-selection-dependency',
        providerId: 'email-list-component'
      }
    ]
  }
);
```

### Integration with Event System

The Dependency System publishes events that can be observed:

```typescript
// Subscribe to dependency events
eventBus.subscribe(
  DependencyManagerEvent.DEPENDENCY_DATA_UPDATED,
  (event) => {
    console.log(`Dependency ${event.dependencyId} updated with new data:`, event.data);
  }
);
```

## Best Practices

### 1. Clear Dependency Declarations

Define clear, well-documented dependencies between components:

```typescript
// Good: Clear, descriptive dependency
dependencyRegistry.registerDependency({
  name: 'Email Selection',
  description: 'Email list provides selected email to email viewer',
  providerType: ComponentType.EMAIL_LIST,
  consumerType: ComponentType.EMAIL_VIEWER,
  dataType: DependencyDataType.EMAIL,
  syncStrategy: DependencySyncStrategy.BOTH,
  isRequired: false,
  isOneToMany: true,
  isManyToOne: false
});
```

### 2. Minimal Data Transfer

Only share the necessary data between components:

```typescript
// Good: Only share needed fields
updateData({
  id: email.id,
  subject: email.subject,
  sender: email.sender,
  preview: email.preview
});

// Bad: Sending unnecessary data
updateData(entireEmailObjectWithLargeAttachments);
```

### 3. Proper Error Handling

Always handle potential errors in dependencies:

```typescript
// Consumer component
const { data: email, error, isLoading } = useDependencyConsumer(
  id,
  emailSelectionDependencyId
);

// Show appropriate UI based on state
if (isLoading) return <Loading />;
if (error) return <ErrorDisplay message={error} />;
if (!email) return <NoEmailSelected />;
return <EmailContent email={email} />;
```

### 4. Dependency Cleanup

Clean up dependencies when components unmount:

```typescript
useEffect(() => {
  // Consumer cleanup
  return () => {
    if (dependencyId) {
      dependencyManager.removeDependency(dependencyId);
    }
  };
}, [dependencyId]);
```

### 5. Default Values

Provide sensible defaults for dependencies:

```typescript
// Provider with default/initial value
const { updateData } = useDependencyProvider(
  id,
  dependencyId,
  // Initial data for new connections
  { subject: 'Welcome', body: 'Select an email to view its contents' }
);
```

## Debugging Dependencies

The system provides tools for debugging dependency issues:

```typescript
// Get all dependencies for a specific provider
const providerDependencies = dependencyManager.getDependenciesForProvider('email-list-123');
console.log('Provider dependencies:', providerDependencies);

// Get all dependencies for a specific consumer
const consumerDependencies = dependencyManager.getDependenciesForConsumer('email-viewer-456');
console.log('Consumer dependencies:', consumerDependencies);

// Find a specific dependency between components
const dependency = dependencyManager.findDependency('email-list-123', 'email-viewer-456');
console.log('Found dependency:', dependency);
```

## Common Use Cases

### 1. Master-Detail View

Use dependencies to implement master-detail views, where selecting an item in a list shows its details:

- Email List → Email Viewer
- Contact List → Contact Details
- Task List → Task Details

### 2. Filtering

Use dependencies to implement filtering between components:

- Folder Tree → Email List (filter by folder)
- Tag Manager → Email List (filter by tag)
- Search Component → Search Results (filter by query)

### 3. Context Sharing

Use dependencies to share context between related components:

- Email Composer → Template Library (share email being composed)
- Calendar → Weather Widget (share selected date)
- Contact Viewer → Communication History (share selected contact)

## Conclusion

The Component Dependency System provides a powerful, flexible way to create interactive, connected components in NEXUS.email. By using this system, you can build complex workflows where components work together seamlessly, while still maintaining clear separation of concerns and loose coupling between components.