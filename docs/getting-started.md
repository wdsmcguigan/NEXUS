# Getting Started with NEXUS.email Development

## Introduction

Welcome to NEXUS.email development! This guide will help you get started with the project, understand its architecture, and contribute effectively. NEXUS.email is a cutting-edge email client with advanced dynamic layout management, offering unprecedented flexibility in workspace organization and user interface customization.

## Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (v18+)
- npm (v9+)
- Git

## Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/nexus-email.git
cd nexus-email
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

This will start:
- A Node.js server for the backend API
- A Vite development server for the frontend

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

NEXUS.email follows a structured organization:

```
nexus-email/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Core libraries
│   │   ├── pages/          # Page components
│   │   └── services/       # API and service layer
├── server/                 # Backend code
├── shared/                 # Shared code
└── docs/                   # Documentation
```

### Key Directories

- **client/src/components**: Contains all React components, organized by feature
- **client/src/lib**: Contains core libraries including communication systems
- **client/src/hooks**: Custom React hooks for reusable logic
- **server**: Backend API implementation
- **shared**: Shared code between frontend and backend
- **docs**: Comprehensive documentation

## Core Concepts

NEXUS.email is built around several core systems:

### 1. Panel Management System

The Panel Management System provides the flexible UI framework:

- Dynamic panel creation and manipulation
- Tab management within panels
- Resizable panels with responsive behavior

[Learn more about the Panel Management System](./panel-management.md)

### 2. Component Registry

The Component Registry manages UI components:

- Component registration with metadata
- Component instance management
- State persistence

[Learn more about the Component Registry](./component-registry-documentation.md)

### 3. Inter-Component Communication

The Communication System enables component interaction:

- Event Bus for application-wide events
- Direct component communication
- Shared context data
- Drag and drop operations
- Command system with keyboard shortcuts

[Learn more about Inter-Component Communication](./inter-component-communication.md)

### 4. Layout Persistence

The Layout Persistence system saves workspace configurations:

- Layout serialization
- Layout templates
- Multi-device sync

[Learn more about Layout Persistence](./layout-persistence-documentation.md)

### 5. Search System

The Search System provides powerful search capabilities:

- Universal search across all components
- Component-specific search
- Saved search management

[Learn more about the Search System](./search-system.md)

## Adding Your First Component

Let's create a simple component to understand how the system works.

### 1. Create a Basic Component

Create a new file at `client/src/components/examples/SimpleGreeting.tsx`:

```tsx
import React from 'react';

interface SimpleGreetingProps {
  name?: string;
}

export function SimpleGreeting({ name = 'Developer' }: SimpleGreetingProps) {
  return (
    <div className="p-4 bg-card rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Hello, {name}!</h2>
      <p>Welcome to NEXUS.email development.</p>
    </div>
  );
}
```

### 2. Register the Component

Create a file at `client/src/lib/registrations/exampleComponents.ts`:

```tsx
import { defineEnhancedComponent } from '../enhancedComponentRegistry';
import { SimpleGreeting } from '../../components/examples/SimpleGreeting';
import { MessageSquare } from 'lucide-react';

export function registerExampleComponents() {
  // Register the simple greeting component
  defineEnhancedComponent({
    id: 'simple-greeting',
    displayName: 'Simple Greeting',
    description: 'A simple greeting component to welcome developers',
    category: 'examples',
    icon: MessageSquare,
    component: SimpleGreeting,
    defaultConfig: {
      name: 'Developer'
    }
  });
}
```

### 3. Add Component Registration to Initialization

In `client/src/lib/enhancedComponentRegistry.setup.tsx`, import and call your registration function:

```tsx
import { registerExampleComponents } from './registrations/exampleComponents';

export function setupComponentRegistry() {
  // Other registrations...
  
  // Register example components
  registerExampleComponents();
}
```

### 4. Test Your Component

Your component is now available in the Component Registry. You can create an instance of it through:

- Command Palette (Ctrl+P or Cmd+P)
- Add Tab button in any panel
- Programmatically creating a tab with this component

## Working with the Core Systems

### Using the Communication System

```tsx
import { useEvent } from '../../hooks/useCommunication';
import { EmailEventType } from '../../lib/communication/Events';

function MyComponent() {
  // Subscribe to events
  useEvent(
    EmailEventType.EMAIL_SELECTED,
    (event) => {
      console.log('Email selected:', event.emailId);
      // Handle the event
    }
  );
  
  // Rest of component implementation
}
```

### Using the Panel System

```tsx
import { usePanelContext } from '../../context/PanelContext';

function PanelOperationsExample() {
  const { 
    addTab, 
    removeTab, 
    splitPanel 
  } = usePanelContext();
  
  const handleAddTab = () => {
    addTab('main-panel', {
      id: 'new-tab',
      title: 'New Tab',
      closeable: true
    }, <div>New Tab Content</div>);
  };
  
  // Rest of component implementation
}
```

### Using the Component Registry

```tsx
import { useComponentRegistry } from '../../hooks/useComponentRegistry';

function ComponentManagementExample() {
  const { 
    getAllComponents,
    createComponentInstance 
  } = useComponentRegistry();
  
  const handleCreateInstance = (componentId: string) => {
    const instanceId = createComponentInstance(
      componentId,
      'main-panel',
      'new-component-tab'
    );
    
    console.log('Created instance:', instanceId);
  };
  
  // Rest of component implementation
}
```

## Common Development Tasks

### 1. Adding a New Feature

1. **Understand the requirements**: Clearly define what the feature should do
2. **Plan the implementation**: Determine which systems the feature will interact with
3. **Create the components**: Implement the UI components
4. **Register the components**: Add them to the Component Registry
5. **Implement communication**: Integrate with the Communication System
6. **Test the feature**: Verify it works correctly
7. **Update documentation**: Document the new feature

### 2. Fixing a Bug

1. **Reproduce the issue**: Create a reliable way to reproduce the bug
2. **Locate the source**: Use debugging tools to find where the issue occurs
3. **Understand the cause**: Analyze why the bug is happening
4. **Create a fix**: Implement the solution
5. **Test the fix**: Verify the bug is fixed without introducing new issues
6. **Document the fix**: Update documentation if needed

### 3. Improving Performance

1. **Identify bottlenecks**: Use performance tools to find slow areas
2. **Analyze the cause**: Determine why performance is poor
3. **Implement optimizations**: Use techniques like memoization, virtualization, etc.
4. **Measure improvement**: Verify that performance has improved
5. **Document the changes**: Update documentation with performance considerations

## Communication and Messaging Architecture 

NEXUS.email uses a sophisticated multi-tier communication architecture:

### Tier 1: Event Bus (Global Communication)

```
Component A                Component B
    |                          |
    |                          |
    v                          v
+-------------------------------------------+
|                 Event Bus                 |
+-------------------------------------------+
            ^                  ^
            |                  |
            |                  |
        Component C        Component D
```

- **Use for**: Application-wide events that multiple components might be interested in
- **Example**: Email selection events, UI state changes, global notifications

### Tier 2: Direct Component Communication

```
Component A         request         Component B
    |        ------------------------>  |
    |                                   |
    |         response                  |
    |        <------------------------  |
```

- **Use for**: Direct interactions between specific components
- **Example**: Requesting data from a specific component, sending commands

### Tier 3: Context Provider (Shared State)

```
              Context Provider
                     |
                     |
      +--------------+--------------+
      |              |              |
      v              v              v
Component A     Component B     Component C
```

- **Use for**: Shared state that multiple components need to access
- **Example**: Currently selected email, application theme, user preferences

### Tier 4: Drag and Drop (UI Interactions)

```
Component A (source)                Component B (target)
    |         drag start                    |
    |        ------------>                  |
    |                                       |
    |         drag over                     |
    |        ------------>                  |
    |                                       |
    |         drop                          |
    |        ------------>                  |
```

- **Use for**: User-initiated drag and drop operations
- **Example**: Moving emails to folders, reordering tabs

### Tier 5: Command Registry (User Actions)

```
       Keyboard Shortcut (Ctrl+N)
                  |
                  v
        +------------------+
        | Command Registry |
        +------------------+
                  |
                  v
          "new-email" command
                  |
                  v
         Email Composer Component
```

- **Use for**: User-initiated actions, especially via keyboard shortcuts
- **Example**: Creating a new email, archiving, navigating

## Next Steps

After setting up your development environment and understanding the basics, you can:

1. **Explore the codebase**: Familiarize yourself with the existing code
2. **Complete a starter task**: Pick a simple task to get hands-on experience
3. **Dive deeper into documentation**: Read detailed documentation for areas of interest
4. **Join the community**: Engage with other developers working on the project

## Additional Resources

- [Developer Guide](./developer-guide.md): Comprehensive guide for developers
- [Architecture Overview](./architecture-overview.md): High-level architecture overview
- [API Documentation](./api-documentation.md): Backend API documentation

## Troubleshooting

### Common Issues

1. **Development server not starting**:
   - Check Node.js version (should be v18+)
   - Verify all dependencies are installed (`npm install`)
   - Check for port conflicts on 3000

2. **Changes not reflected in the browser**:
   - Verify the development server is running
   - Check the browser console for errors
   - Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

3. **TypeScript errors**:
   - Check error messages in the terminal or IDE
   - Verify types are properly defined
   - Check import paths for accuracy

4. **Component registration issues**:
   - Verify the component is exported correctly
   - Check registration function is called during initialization
   - Verify component ID is unique

### Getting Help

If you encounter issues not covered in this guide:

1. Check the existing documentation
2. Look for similar issues in the issue tracker
3. Ask for help in the developer community
4. Create a detailed issue with steps to reproduce

## Contributing

We welcome contributions to NEXUS.email! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Update documentation
6. Submit a pull request

Please follow the [contribution guidelines](./contributing.md) for detailed information.