# NEXUS.email Architecture

## Overview

NEXUS.email is a modern email client application built on a flexible, modular architecture. The application features a dynamic layout management system that allows users to create customized workspaces with multiple panels, tabs, and components. It employs a sophisticated inter-component communication system and dependency management to enable seamless data flow between UI components.

The application follows a client-server architecture, with a React frontend and a Node.js/Express backend. It uses a PostgreSQL database via Drizzle ORM for data persistence.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│                         │     │                         │     │                         │
│   Frontend (React)      │◄────┤   Backend (Express)     │◄────┤   Database (PostgreSQL) │
│                         │     │                         │     │                         │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
           ▲                               ▲                               
           │                               │                               
           ▼                               ▼                               
┌─────────────────────────┐     ┌─────────────────────────┐     
│  Component Registry     │     │     API Routes          │     
│  & Dependency System    │     │                         │     
└─────────────────────────┘     └─────────────────────────┘     
```

### Frontend Architecture

The frontend follows a component-based architecture with several key subsystems:

1. **Panel Management System**: Enables dynamic creation, splitting, and arrangement of UI panels.
2. **Component Registry**: Manages the registration and instantiation of UI components.
3. **Dependency System**: Handles data flow and communication between components.
4. **Layout Persistence**: Manages saving and loading workspace layouts.
5. **Search System**: Provides application-wide search capabilities.

### Backend Architecture

The backend follows a standard Express architecture:

1. **API Routes**: RESTful endpoints for client-server communication
2. **Storage Layer**: Data access layer with ORM integration
3. **Middleware**: Request processing, logging, and error handling

### Database Architecture

The application uses PostgreSQL with Drizzle ORM. The schema includes tables for:

- Users
- Email accounts
- Contacts
- Tags
- Emails
- Email recipients
- Email attachments
- User preferences

## Key Components

### Frontend Components

#### Panel Management System

The Panel Management System is the core of NEXUS.email's flexible UI. It allows users to create, split, resize, and arrange panels dynamically. The system is built around these key concepts:

- **Panels**: Containers that hold one or more tabs
- **Tabs**: Individual UI components or views
- **Layouts**: Overall arrangement of panels and tabs

Key files:
- `client/src/context/PanelContext.ts`
- `client/src/components/AdvancedPanelLayout.tsx`
- `client/src/lib/layoutSerialization.ts`

#### Component Registry

The Component Registry manages the registration, discovery, and instantiation of UI components. It provides:

- Component definitions with metadata
- Component instance management
- Component search and filtering

Key files:
- `client/src/lib/componentRegistry.ts`
- `client/src/lib/enhancedComponentRegistry.ts`
- `client/src/lib/componentRegistry.setup.tsx`

#### Dependency System

The Dependency System enables components to communicate and share data. It comprises:

- **DependencyRegistry**: Manages dependency definitions and relationships
- **DependencyManager**: Handles runtime data exchange
- **React Hooks**: Interface for component integration

Key files:
- `client/src/lib/dependency/DependencyInterfaces.ts`
- `client/src/lib/dependency/DependencyRegistry.ts`
- `client/src/lib/dependency/DependencyManager.ts`
- `client/src/hooks/useDependencyHooks.ts`

#### Communication System

The Communication System provides multiple channels for inter-component communication:

- **Event Bus**: Application-wide publish/subscribe event system
- **Context Provider**: Shared context data for components
- **Command Registry**: Global command system with keyboard shortcuts
- **Drag and Drop**: Cross-component drag and drop operations

Key files:
- `client/src/lib/communication/EventBus.ts`
- `client/src/lib/communication/ContextProvider.ts`
- `client/src/lib/communication/CommandRegistry.ts`
- `client/src/lib/communication/DragDropManager.ts`

#### Layout Persistence

The Layout Persistence System allows users to save, load, and synchronize workspace layouts:

- Layout serialization and deserialization
- Layout templates for different workflows
- Multi-device synchronization

Key files:
- `client/src/services/LayoutPersistenceService.ts`
- `client/src/services/LayoutSyncService.ts`
- `client/src/lib/layoutTemplates.ts`

### Backend Components

#### Express Server

The Express server handles HTTP requests, API routes, and serves the frontend application.

Key files:
- `server/index.ts`: Server initialization and middleware setup
- `server/routes.ts`: API route definitions
- `server/vite.ts`: Development server configuration

#### Storage Layer

The storage layer provides data access patterns for the application's data entities.

Key files:
- `server/storage.ts`: Data access methods
- `shared/schema.ts`: Database schema definitions

## Data Flow

### Client-Server Communication

1. Frontend components make API requests to the backend using React Query
2. Express routes handle the requests and interact with the storage layer
3. The storage layer performs database operations via Drizzle ORM
4. Results are returned to the frontend as JSON responses

### Inter-Component Communication

1. **Direct Dependencies**: Components declare dependencies on each other via the Dependency System
2. **Event-Based**: Components publish and subscribe to events via the Event Bus
3. **Context-Based**: Components access shared state via Context Providers
4. **Command-Based**: Components register and execute commands via the Command Registry

## External Dependencies

### Frontend Dependencies

- **React**: UI library
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **Radix UI**: Primitive UI components
- **wouter**: Routing library
- **Lucide React**: Icon library

### Backend Dependencies

- **Express**: Web framework
- **Drizzle ORM**: Database ORM
- **Drizzle-zod**: Schema validation
- **Neon Serverless**: PostgreSQL client for serverless environments
- **tsx**: TypeScript execution engine
- **Vite**: Build tool and development server

## Deployment Strategy

The application is designed to be deployed on platforms like Replit, as indicated by the `.replit` configuration file. The deployment process consists of:

1. **Build Step**: Vite builds the frontend, and esbuild compiles the backend
   ```
   npm run build
   ```

2. **Runtime**: Node.js serves the compiled application
   ```
   npm run start
   ```

3. **Environment Configuration**: The application relies on environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NODE_ENV`: Environment indicator (development/production)

### Scaling Considerations

- **Database**: Uses Neon's serverless PostgreSQL, which automatically scales
- **Backend**: Stateless Express server can be horizontally scaled
- **Frontend**: Static assets can be served via CDN for better performance

## Security Considerations

- **Database Access**: Limited to backend only, preventing direct client access
- **API Routes**: Express middleware for request validation and authorization
- **Client-Side**: Data validation before submission to the backend

## Future Extensions

The architecture supports several areas for future expansion:

1. **Plugin System**: The Component Registry can be extended to support third-party plugins
2. **Multi-Account Support**: The database schema already supports multiple email accounts per user
3. **Offline Mode**: The architecture could be extended with service workers for offline functionality
4. **Mobile Optimization**: Current architecture supports responsive design and device-specific layouts