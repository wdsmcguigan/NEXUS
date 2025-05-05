# NEXUS.email Architecture Overview

## Introduction

NEXUS.email is a cutting-edge email client application with advanced dynamic layout management, offering unprecedented flexibility in workspace organization and user interface customization. This document provides a high-level overview of the application architecture.

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API, custom state management
- **API Communication**: TanStack Query (React Query)
- **Routing**: wouter
- **Build Tool**: Vite
- **Backend**: Node.js with Express

## Architecture Layers

NEXUS.email follows a modular architecture with clear separation of concerns:

```
+------------------------------------------+
| UI Components                            |
+------------------------------------------+
| Feature Components                       |
+------------------------------------------+
| Communication Layer                      |
+------------------------------------------+
| Core Services                            |
+------------------------------------------+
| Data Access Layer                        |
+------------------------------------------+
| API Layer                                |
+------------------------------------------+
```

## Key Subsystems

### 1. Panel Management System

The panel management system provides the foundation for the flexible UI, allowing users to create, split, resize, and arrange panels dynamically.

Key components:
- `PanelManager`: Manages the overall panel layout
- `PanelContainer`: Renders panels, handles resize events
- `AdvancedTabBar`: Manages tabs within panels
- `UniversalTabPanel`: Renders tab content

### 2. Component Registry

The component registry handles registration and discovery of UI components that can be placed in panels.

Key features:
- Component metadata management
- Component instance management
- Component category organization
- Search integration

### 3. Communication System

The communication system enables interactions between different parts of the application.

Subsystems:
- Event Bus: Application-wide events
- Component Communication: Direct component interaction
- Context Provider: Shared application state
- Drag and Drop: Cross-component drag/drop operations
- Command Registry: Application-wide commands and shortcuts

### 4. Layout Management

The layout management system allows saving, loading, and synchronizing workspace layouts.

Key features:
- Layout serialization
- Layout templates
- Layout persistence (local and server)
- Layout sharing
- Multi-device synchronization

### 5. Email Data Management

Handles email data operations including fetching, searching, and organizing emails.

Key features:
- Email synchronization
- Search and filter
- Email categorization
- Tag management

## Directory Structure

```
nexus-email/
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── ui/        # Base UI components (shadcn)
│   │   │   └── layouts/   # Layout components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and services
│   │   │   ├── communication/  # Communication system
│   │   │   └── utils/     # Helper utilities
│   │   ├── pages/         # Page components
│   │   └── services/      # API and business services
│   └── public/            # Static assets
├── server/                # Backend code
│   ├── controllers/       # API controllers
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── services/          # Backend services
└── shared/                # Shared code (frontend/backend)
    └── schema.ts          # Shared type definitions
```

## Application Startup Flow

1. Initialize core services (authentication, API clients)
2. Initialize communication system
3. Register components with component registry
4. Load user preferences and saved layouts
5. Set up default layout if no saved layout exists
6. Initialize panel manager with layout
7. Set up global event listeners and keyboard shortcuts
8. Sync email data when connection is available

## Key Design Patterns

### Component Pattern

UI elements are built as reusable, self-contained components with clear props interfaces.

### Context Provider Pattern

Application state is managed through React Context providers for specific domains.

### Observer Pattern

The Event Bus implements the observer pattern for loosely coupled communication.

### Factory Pattern

Component Registry uses factory patterns to create component instances.

### Strategy Pattern

Layout serialization and persistence use strategy patterns to handle different storage mechanisms.

### Singleton Pattern

Core services like Event Bus and Component Registry are implemented as singletons.

## Workflow Examples

### Example 1: Opening an Email

1. User clicks an email in the list
2. Email list component publishes EMAIL_SELECTED event
3. Email viewer component subscribes to this event
4. Email viewer fetches and displays the email content
5. Email viewer updates the CURRENT_EMAIL context
6. Other components react to context change (toolbar, related panels)

### Example 2: Creating a New Panel Layout

1. User triggers "Split Panel" command
2. Command handler executes the splitPanel function
3. Panel manager updates the layout structure
4. New panels are rendered with default tabs
5. Layout changes are persisted for future sessions

## Extension Points

NEXUS.email is designed to be extensible through various mechanisms:

1. **Component Registry**: Register new component types
2. **Event Types**: Define new event types for domain-specific events
3. **Command Registry**: Add new application commands
4. **Context Types**: Create new context types for sharing additional state
5. **Layout Templates**: Define new layout templates for specific workflows
6. **Custom Tab Types**: Create specialized tab types for specific content

## Performance Considerations

- Component rendering is optimized with React.memo and useMemo
- Virtual lists are used for large data sets
- Expensive operations are debounced or throttled
- Network requests are cached and optimized
- Layout serialization avoids circular references for reliable persistence

## Next Steps

For more detailed information about specific subsystems, refer to:

- [Panel Management Documentation](./panel-management.md)
- [Component Registry Documentation](./component-registry-documentation.md)
- [Inter-Component Communication Documentation](./inter-component-communication.md)
- [Layout Persistence Documentation](./layout-persistence-documentation.md)
- [Email Data Documentation](./email-data.md)