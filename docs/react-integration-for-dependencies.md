# React Integration for the Component Dependency System

## Overview

This document covers the React integration layer for the Component Dependency System in NEXUS.email. The integration layer provides a set of React hooks, contexts, and helper functions that make it easy to use the dependency system in React components.

## Core Components

### DependencyContext

The `DependencyContext` provides React components with access to the dependency system's functionality. It initializes the registry and manager and exposes their methods through a React context.

```tsx
import { DependencyProvider } from '../context/DependencyContext';

function App() {
  return (
    <DependencyProvider>
      {/* Application components */}
    </DependencyProvider>
  );
}
```

The context provides methods for all key dependency system operations:

- Registering and managing dependency definitions
- Creating and removing dependencies between components
- Updating and requesting dependency data
- Managing dependency status
- Validating and querying dependencies

### Basic Hook: useDependency

The `useDependency` hook provides direct access to the dependency context:

```tsx
import { useDependency } from '../hooks/useDependencyHooks';

function MyComponent() {
  const dependency = useDependency();
  
  // Now you can use any dependency system method
  const definitions = dependency.getDependencyDefinitionsByProvider(ComponentType.EMAIL_LIST);
  
  return (
    // Component JSX
  );
}
```

### Enhanced Hooks

The integration layer provides specialized hooks for common dependency patterns:

#### useSourceComponent

This hook is for components that provide data to other components:

```tsx
import { useSourceComponent } from '../hooks/useDependencyHooks';

function EmailList({ id }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Set up as a provider of email data
  const { 
    consumerIds,         // IDs of connected consumers
    updateData,          // Function to update data for all consumers
    hasConsumer,         // Check if a specific consumer is connected
    getDependencyForConsumer // Get dependency for a specific consumer
  } = useSourceComponent(
    id,                  // Component ID
    ComponentType.EMAIL_LIST, // Component type
    DependencyDataType.EMAIL, // Type of data provided
    {
      initialData: null,     // Initial data to provide
      transform: (email) => ({ // Transform data before sending
        id: email.id,
        subject: email.subject,
        // Other fields...
      }),
      onConsumerConnected: (consumerId) => {
        console.log(`Consumer connected: ${consumerId}`);
      },
      onConsumerDisconnected: (consumerId) => {
        console.log(`Consumer disconnected: ${consumerId}`);
      },
      debug: true            // Enable debug logging
    }
  );
  
  // Handle email selection
  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    
    // Update all dependency consumers with the selected email
    updateData(email);
  };
  
  return (
    <div>
      <h2>Email List {consumerIds.length > 0 && `(${consumerIds.length} connected)`}</h2>
      {/* Email list UI */}
    </div>
  );
}
```

#### useDependentComponent

This hook is for components that consume data from other components:

```tsx
import { useDependentComponent } from '../hooks/useDependencyHooks';

function EmailViewer({ id }) {
  // Set up as a consumer of email data
  const {
    data: email,             // The dependency data
    error,                   // Error if any
    isLoading,               // Whether data is loading
    providerId,              // ID of the connected provider
    isConnected,             // Whether connected to a provider
    connectToProvider,       // Function to connect to a provider
    disconnect,              // Function to disconnect
    refreshData              // Function to refresh data
  } = useDependentComponent(
    id,                      // Component ID
    ComponentType.EMAIL_VIEWER, // Component type
    DependencyDataType.EMAIL,   // Type of data needed
    {
      autoConnect: true,     // Auto-connect to available providers
      preferredProviders: ['email-list-main'], // Preferred providers
      autoUpdate: true,      // Auto-update when data changes
      filter: (email) => email && !email.isDeleted, // Filter data
      transform: (email) => ({ // Transform received data
        ...email,
        received: new Date(email.received).toLocaleString()
      }),
      onProviderConnected: (providerId) => {
        console.log(`Connected to provider: ${providerId}`);
      },
      onProviderDisconnected: (providerId) => {
        console.log(`Disconnected from provider: ${providerId}`);
      },
      onDataUpdated: (data) => {
        console.log('Data updated:', data);
      },
      debug: true            // Enable debug logging
    }
  );
  
  // Manual connection example
  const handleConnect = () => {
    connectToProvider('email-list-main');
  };
  
  // Request fresh data
  const handleRefresh = () => {
    refreshData();
  };
  
  return (
    <div>
      <h2>Email Viewer {isConnected && `(Connected to ${providerId})`}</h2>
      
      {!isConnected ? (
        <button onClick={handleConnect}>Connect to Email List</button>
      ) : (
        <button onClick={disconnect}>Disconnect</button>
      )}
      
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : email ? (
        <div>
          <h3>{email.subject}</h3>
          <div>From: {email.sender}</div>
          <div>Received: {email.received}</div>
          <div>{email.body}</div>
          
          <button onClick={handleRefresh}>Refresh</button>
        </div>
      ) : (
        <div>No email selected</div>
      )}
    </div>
  );
}
```

## Helper Functions

### DependencyUtils

The `DependencyUtils` module provides helper functions for working with dependencies:

```typescript
import {
  getDependencyName,
  formatDependency,
  getDependencyStatus,
  createDependencyBetweenComponents,
  canComponentProvideFor,
  createDependencyDefinition,
  findDependenciesBetweenComponents,
  updateDataForAllDependencies,
  getDataTransformers,
  getRecentlyUpdatedDependencies,
  ensureDependency,
  resetDependencies
} from '../lib/dependency/DependencyUtils';

// Create a new dependency definition
const depId = createDependencyDefinition(
  ComponentType.EMAIL_LIST,
  ComponentType.EMAIL_VIEWER,
  DependencyDataType.EMAIL,
  {
    name: 'Email Selection',
    description: 'Email list provides selected email to email viewer'
  }
);

// Create a dependency between components
createDependencyBetweenComponents(
  ComponentType.EMAIL_LIST,
  'email-list-instance',
  ComponentType.EMAIL_VIEWER,
  'email-viewer-instance',
  DependencyDataType.EMAIL
);

// Get formatted dependency for display
const dependency = dependencyManager.getDependency('dependency-id');
const formatted = formatDependency(dependency);
console.log(`${formatted.name}: ${formatted.provider} → ${formatted.consumer}`);

// Get data transformers for a specific data type
const { toConsumer, fromProvider } = getDataTransformers(DependencyDataType.EMAIL);
const transformedData = toConsumer(originalEmailData);
```

## Common Patterns

### Auto-Connection

Components can automatically connect to suitable providers:

```tsx
function AutoConnectingEmailViewer({ id }) {
  const { 
    data: email,
    isConnected,
    providerId
  } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    {
      autoConnect: true,
      preferredProviders: ['email-list-main', 'email-list-secondary']
    }
  );
  
  return (
    <div>
      <h2>
        Email Viewer 
        {isConnected 
          ? `(Connected to ${providerId})` 
          : '(Not connected)'}
      </h2>
      
      {/* Component content */}
    </div>
  );
}
```

### Manual Connection

For more control, components can explicitly connect to providers:

```tsx
function ManualConnectionViewer({ id }) {
  const [selectedProvider, setSelectedProvider] = useState('');
  
  const { 
    data: email,
    isConnected,
    providerId,
    connectToProvider,
    disconnect
  } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    { autoConnect: false }
  );
  
  const handleConnect = () => {
    if (selectedProvider) {
      connectToProvider(selectedProvider);
    }
  };
  
  return (
    <div>
      <h2>Email Viewer</h2>
      
      {!isConnected ? (
        <div>
          <select 
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            <option value="">Select a provider</option>
            <option value="email-list-main">Main Email List</option>
            <option value="email-list-archive">Archive Email List</option>
          </select>
          
          <button 
            onClick={handleConnect}
            disabled={!selectedProvider}
          >
            Connect
          </button>
        </div>
      ) : (
        <div>
          <div>Connected to: {providerId}</div>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
      
      {/* Component content */}
    </div>
  );
}
```

### Data Filtering and Transformation

Components can filter and transform data:

```tsx
function EmailViewerWithFiltering({ id }) {
  const { data: email } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    {
      // Only show unread or important emails
      filter: (email) => !email.read || email.important,
      
      // Add formatted date and shorten preview
      transform: (email) => ({
        ...email,
        formattedDate: new Date(email.received).toLocaleString(),
        shortPreview: email.body.substring(0, 100) + '...'
      })
    }
  );
  
  return (
    <div>
      {email && (
        <div>
          <h3>{email.subject}</h3>
          <div>Date: {email.formattedDate}</div>
          <div>{email.shortPreview}</div>
        </div>
      )}
    </div>
  );
}
```

### Multi-Provider Support

Components can connect to multiple providers:

```tsx
function EmailDashboard({ id }) {
  // Connect to inbox
  const inbox = useDependentComponent(
    `${id}-inbox`,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    {
      autoConnect: true,
      preferredProviders: ['email-list-inbox']
    }
  );
  
  // Connect to sent items
  const sent = useDependentComponent(
    `${id}-sent`,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    {
      autoConnect: true,
      preferredProviders: ['email-list-sent']
    }
  );
  
  return (
    <div className="email-dashboard">
      <div className="inbox">
        <h2>Inbox</h2>
        {inbox.data && <EmailPreview email={inbox.data} />}
      </div>
      
      <div className="sent">
        <h2>Last Sent</h2>
        {sent.data && <EmailPreview email={sent.data} />}
      </div>
    </div>
  );
}
```

### Multi-Consumer Support

Provider components can track and manage multiple consumers:

```tsx
function EmailListWithConsumers({ id }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  const { 
    consumerIds,
    updateData,
    hasConsumer,
    getDependencyForConsumer
  } = useSourceComponent(
    id,
    ComponentType.EMAIL_LIST,
    DependencyDataType.EMAIL
  );
  
  // Handle selecting an email
  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    updateData(email);
  };
  
  // Get info about connected consumers
  const consumerInfo = consumerIds.map(consumerId => {
    const dependency = getDependencyForConsumer(consumerId);
    return {
      id: consumerId,
      lastUpdated: dependency?.lastUpdated 
        ? new Date(dependency.lastUpdated).toLocaleString() 
        : 'Never'
    };
  });
  
  return (
    <div>
      <h2>Email List</h2>
      
      <div className="connected-consumers">
        <h3>Connected Consumers ({consumerIds.length})</h3>
        <ul>
          {consumerInfo.map(consumer => (
            <li key={consumer.id}>
              {consumer.id} - Last Updated: {consumer.lastUpdated}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Email list UI */}
    </div>
  );
}
```

## Error Handling

The hooks provide built-in error handling:

```tsx
function EmailViewerWithErrorHandling({ id }) {
  const { 
    data: email,
    error,
    isLoading,
    refreshData
  } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL
  );
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => refreshData()}>Retry</button>
      </div>
    );
  }
  
  if (!email) {
    return <div>No email selected</div>;
  }
  
  return (
    <div className="email-view">
      {/* Email content */}
    </div>
  );
}
```

## Auto-Reconnection

The system can automatically reconnect components when they mount:

```tsx
function ReconnectingEmailViewer({ id }) {
  // Set up automatic reconnection
  useEffect(() => {
    // Reset dependency status when component mounts
    resetDependencies(id, {
      asConsumer: true,
      resetStatus: true
    });
    
    return () => {
      // Optionally set dependencies inactive when unmounting
      resetDependencies(id, {
        asConsumer: true,
        resetStatus: false  // Don't reset status, just mark inactive
      });
    };
  }, [id]);
  
  const { data: email } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    { autoConnect: true }
  );
  
  // Component implementation
}
```

## Integration with Component Registry

The dependency system can be integrated with the component registry:

```tsx
// When registering a component
componentRegistry.registerComponent({
  id: 'email-list',
  displayName: 'Email List',
  // ... other properties
  
  // Declare dependency capabilities
  providesDependencies: [
    { 
      type: DependencyDataType.EMAIL, 
      forConsumerTypes: [ComponentType.EMAIL_VIEWER] 
    }
  ],
  consumesDependencies: [
    { 
      type: DependencyDataType.FOLDER, 
      fromProviderTypes: [ComponentType.FOLDER_TREE] 
    }
  ]
});

// Component implementation using the dependency system
function EmailListComponent({ instanceId }) {
  const { updateData } = useSourceComponent(
    instanceId,
    ComponentType.EMAIL_LIST,
    DependencyDataType.EMAIL
  );
  
  // Implementation
}
```

## Best Practices

### 1. Initialize DependencyProvider Early

Place `DependencyProvider` high in the component tree to ensure all components have access:

```tsx
function App() {
  return (
    <DependencyProvider>
      <AppLayout>
        <Routes>
          {/* Application routes */}
        </Routes>
      </AppLayout>
    </DependencyProvider>
  );
}
```

### 2. Use Unique Component IDs

Ensure component IDs are unique to avoid conflicts:

```tsx
function createComponentId(baseId, instanceNumber) {
  return `${baseId}-${instanceNumber}`;
}

function EmailPanel({ panelId, tabId }) {
  const componentId = `email-viewer-${panelId}-${tabId}`;
  
  // Use the component ID with dependency hooks
}
```

### 3. Provide Fallback UI

Always provide fallback UI for when dependencies are not connected:

```tsx
function EmailViewer({ id }) {
  const { data: email, isConnected } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL
  );
  
  if (!isConnected) {
    return (
      <div className="not-connected">
        <p>Not connected to an email source</p>
        <p>Please add an Email List component to view emails</p>
      </div>
    );
  }
  
  // Normal component rendering
}
```

### 4. Clean Up Resources

Clean up resources when components unmount:

```tsx
function EmailViewer({ id }) {
  const { disconnect } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL
  );
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  // Component implementation
}
```

### 5. Provide Debugging Options

Enable debugging for development:

```tsx
function EmailViewer({ id }) {
  const { data, logDebug } = useDependentComponent(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    { 
      debug: process.env.NODE_ENV === 'development'
    }
  );
  
  // You can also manually log debug info
  useEffect(() => {
    if (data) {
      logDebug('Email data received:', data);
    }
  }, [data, logDebug]);
  
  // Component implementation
}
```

## Troubleshooting

### Component Not Connecting

If components aren't connecting:

1. Check that both components are using the correct component types
2. Verify that a dependency definition exists for those component types
3. Ensure the provider component is mounted and registered
4. Check if `autoConnect` is disabled (if using manual connection)
5. Look for errors in the console, especially if debug mode is enabled

### Data Not Updating

If data isn't updating:

1. Verify that the provider is calling `updateData` with the new data
2. Check if a filter is blocking the data updates
3. Ensure that the data is actually changing (reference equality)
4. Try manually calling `refreshData` to force an update

### Error Handling

If there are errors:

1. Check the `error` property from the hook
2. Enable debug mode to see more detailed log messages
3. Verify that the dependency definition is properly registered
4. Ensure the component types match between provider and consumer

## See Also

- [Component Dependency System Documentation](./component-dependency-system.md)
- [Component Registry Documentation](./component-registry-documentation.md)
- [Panel Management Documentation](./panel-management.md)