# NEXUS.email Inter-Component Communication System

## Overview

The Inter-Component Communication System enables components within the NEXUS.email application to communicate with each other flexibly and reliably. This sophisticated system provides multiple communication mechanisms optimized for different use cases, ensuring that components can interact effectively while maintaining loose coupling.

## Key Concepts

### Communication Mechanisms

The system provides several complementary communication mechanisms:

1. **Event Bus**: Application-wide publish/subscribe event system
2. **Component Communication**: Direct request/response between components
3. **Context Provider**: Shared context data accessible to multiple components
4. **Drag and Drop**: Cross-component drag and drop operations
5. **Command Registry**: Global command system with keyboard shortcuts

### Event Types

Events are typed and categorized to enable type-safe event handling:

- Email events (selection, reading, archiving)
- UI events (layout changes, panel operations)
- Data events (synchronization, updates)
- User interaction events (keyboard, mouse, gestures)

### Communication Patterns

Different communication patterns are supported based on specific needs:

- **Broadcast**: One-to-many communication (Event Bus)
- **Direct**: One-to-one communication (Component Communication)
- **Shared State**: Many-to-many communication (Context Provider)
- **Action**: Command invocation (Command Registry)
- **Transfer**: Data movement (Drag and Drop)

## Event Bus System

The Event Bus provides a global publish/subscribe mechanism for loosely coupled communication.

### Core Interfaces

```typescript
// Base event interface
interface BaseEvent {
  type: string;
  timestamp: number;
  source?: string;
}

// Event listener type
type EventListener<T extends BaseEvent> = (event: T) => void;

// Subscription options
interface SubscriptionOptions {
  immediateNotify?: boolean;
  maxRetries?: number;
  priority?: number;
  once?: boolean;
  condition?: (event: BaseEvent) => boolean;
}

// Publish options
interface PublishOptions {
  async?: boolean;
  delay?: number;
  local?: boolean;
}
```

### EventBus Class

```typescript
class EventBus {
  // Core subscription methods
  subscribe<T extends BaseEvent>(
    eventType: string,
    listener: EventListener<T>,
    options?: SubscriptionOptions
  ): string;
  
  unsubscribe(subscriptionId: string): boolean;
  
  // Publishing methods
  publish<T extends BaseEvent>(
    eventType: string,
    eventData: Omit<T, 'type' | 'timestamp'>,
    options?: PublishOptions
  ): string;
  
  // Utility methods
  getSubscribers(eventType: string): number;
  getSubscriptionCount(): Record<string, number>;
  clearSubscriptions(eventType?: string): void;
  hasSubscribers(eventType: string): boolean;
  
  // Event history
  getEventHistory(eventType?: string, limit?: number): BaseEvent[];
  clearEventHistory(): void;
}
```

### Typed Events

```typescript
// Email events
enum EmailEventType {
  EMAIL_SELECTED = 'email:selected',
  EMAIL_OPENED = 'email:opened',
  EMAIL_CLOSED = 'email:closed',
  EMAIL_ARCHIVED = 'email:archived',
  EMAIL_DELETED = 'email:deleted',
  EMAIL_MARKED_READ = 'email:marked-read',
  EMAIL_TAGGED = 'email:tagged',
  EMAIL_FLAGGED = 'email:flagged',
  EMAIL_SENT = 'email:sent',
  EMAIL_DRAFTED = 'email:drafted',
  EMAIL_RECEIVED = 'email:received'
}

// Email selected event
interface EmailSelectedEvent extends BaseEvent {
  type: EmailEventType.EMAIL_SELECTED;
  emailId: number;
  accountId: number;
  preview?: boolean;  // If true, don't navigate to full view
  threadId?: number;  // For thread selection
}

// Calendar events
enum CalendarEventType {
  EVENT_CREATED = 'calendar:event-created',
  EVENT_UPDATED = 'calendar:event-updated',
  EVENT_DELETED = 'calendar:event-deleted',
  EVENT_SELECTED = 'calendar:event-selected',
  VIEW_CHANGED = 'calendar:view-changed',
  DATE_SELECTED = 'calendar:date-selected'
}

// UI events
enum UIEventType {
  TAB_CREATED = 'ui:tab-created',
  TAB_CLOSED = 'ui:tab-closed',
  TAB_CHANGED = 'ui:tab-changed',
  PANEL_CREATED = 'ui:panel-created',
  PANEL_DELETED = 'ui:panel-deleted',
  PANEL_SPLIT = 'ui:panel-split',
  PANEL_RESIZED = 'ui:panel-resized',
  LAYOUT_CHANGED = 'ui:layout-changed',
  THEME_CHANGED = 'ui:theme-changed',
  FULLSCREEN_TOGGLED = 'ui:fullscreen-toggled'
}
```

### Usage Examples

#### Basic Event Subscription

```typescript
import { eventBus, EmailEventType } from '../lib/communication';
import type { EmailSelectedEvent } from '../lib/communication';

// Subscribe to email selection events
const subscriptionId = eventBus.subscribe<EmailSelectedEvent>(
  EmailEventType.EMAIL_SELECTED,
  (event) => {
    console.log(`Email selected: ${event.emailId}`);
    // Handle email selection
  }
);

// Later, unsubscribe when component unmounts
useEffect(() => {
  return () => {
    eventBus.unsubscribe(subscriptionId);
  };
}, []);
```

#### Publishing Events

```typescript
import { eventBus, EmailEventType } from '../lib/communication';

function selectEmail(emailId: number, accountId: number) {
  // Publish an event when an email is selected
  eventBus.publish(
    EmailEventType.EMAIL_SELECTED,
    {
      emailId,
      accountId,
      preview: false
    }
  );
}
```

#### Conditional Subscription

```typescript
// Subscribe only to events from a specific account
eventBus.subscribe(
  EmailEventType.EMAIL_RECEIVED,
  handleNewEmail,
  {
    condition: (event) => event.accountId === currentAccountId
  }
);
```

#### Delayed Events

```typescript
// Publish an event with a delay
eventBus.publish(
  UIEventType.NOTIFICATION_SHOW,
  {
    message: 'Changes saved',
    level: 'info'
  },
  { delay: 500 }  // 500ms delay
);
```

## Component Communication System

The Component Communication system enables direct request/response interactions between components.

### Core Interfaces

```typescript
// Component types
enum ComponentType {
  EMAIL_LIST = 'email-list',
  EMAIL_VIEWER = 'email-viewer',
  EMAIL_COMPOSER = 'email-composer',
  FOLDER_TREE = 'folder-tree',
  CALENDAR = 'calendar',
  CONTACTS = 'contacts',
  SETTINGS = 'settings',
  SEARCH = 'search',
  TAG_MANAGER = 'tag-manager',
  ANALYTICS = 'analytics'
}

// Component metadata
interface ComponentMetadata {
  componentId: string;
  componentType: ComponentType;
  instanceId: string;
  tabId?: string;
  panelId?: string;
  title?: string;
  createdAt: number;
  lastActive?: number;
  supportsRequests?: string[];
  position?: { x: number, y: number };
  isVisible?: boolean;
}

// Message types
interface ComponentMessage {
  id: string;
  timestamp: number;
  source: string;
  messageType: 'request' | 'response' | 'notification' | 'error';
}

interface RequestMessage extends ComponentMessage {
  messageType: 'request';
  targetId: string;
  requestType: string;
  payload?: any;
  timeout?: number;
}

interface ResponseMessage extends ComponentMessage {
  messageType: 'response';
  requestId: string;
  payload?: any;
  error?: string;
}

interface NotificationMessage extends ComponentMessage {
  messageType: 'notification';
  notificationType: string;
  targetId?: string;  // Optional, for direct notifications
  broadcast?: boolean; // If true, sent to all components
  payload?: any;
}
```

### ComponentCommunication Class

```typescript
class ComponentCommunication {
  // Component registration
  registerComponent(
    componentType: ComponentType,
    metadata: Partial<ComponentMetadata>
  ): string;
  
  unregisterComponent(instanceId: string): boolean;
  
  updateComponentMetadata(
    instanceId: string,
    metadata: Partial<ComponentMetadata>
  ): boolean;
  
  // Request handling
  registerRequestHandler<T = any, R = any>(
    instanceId: string,
    requestType: string,
    handler: (payload: T) => Promise<R> | R
  ): void;
  
  unregisterRequestHandler(
    instanceId: string,
    requestType: string
  ): boolean;
  
  // Request/Response
  sendRequest<T = any, R = any>(
    sourceId: string,
    targetId: string,
    requestType: string,
    payload?: T,
    timeout?: number
  ): Promise<R>;
  
  // Notifications
  sendNotification<T = any>(
    sourceId: string,
    targetId: string,
    notificationType: string,
    payload?: T
  ): void;
  
  broadcastNotification<T = any>(
    sourceId: string,
    notificationType: string,
    payload?: T
  ): void;
  
  // Component discovery
  getComponent(instanceId: string): ComponentMetadata | undefined;
  getAllComponents(): ComponentMetadata[];
  getComponentsByType(type: ComponentType): ComponentMetadata[];
  findComponent(
    predicate: (metadata: ComponentMetadata) => boolean
  ): ComponentMetadata | undefined;
}
```

### Usage Examples

#### Component Registration

```typescript
import { componentCommunication, ComponentType } from '../lib/communication';

// Register a component
const instanceId = componentCommunication.registerComponent(
  ComponentType.EMAIL_LIST,
  {
    title: 'Inbox',
    tabId: 'inbox-tab',
    panelId: 'main-panel',
    supportsRequests: ['getEmails', 'markAsRead', 'archiveEmail']
  }
);

// Unregister when component unmounts
useEffect(() => {
  return () => {
    componentCommunication.unregisterComponent(instanceId);
  };
}, []);
```

#### Request Handler Registration

```typescript
import { componentCommunication } from '../lib/communication';

// Register a request handler
componentCommunication.registerRequestHandler(
  instanceId,
  'getEmails',
  async (filters) => {
    // Handle request to get emails with filters
    const emails = await fetchEmails(filters);
    return emails;
  }
);
```

#### Sending Requests

```typescript
import { componentCommunication } from '../lib/communication';

// Send a request to another component
async function openEmailInViewer(emailId: number) {
  try {
    // Find an email viewer component
    const emailViewer = componentCommunication.findComponent(
      (metadata) => 
        metadata.componentType === ComponentType.EMAIL_VIEWER &&
        metadata.isVisible
    );
    
    if (emailViewer) {
      // Send a request to open the email
      await componentCommunication.sendRequest(
        instanceId,
        emailViewer.instanceId,
        'openEmail',
        { emailId }
      );
    } else {
      // No email viewer found, create one
      createEmailViewerTab(emailId);
    }
  } catch (error) {
    console.error('Failed to open email:', error);
  }
}
```

#### Broadcasting Notifications

```typescript
import { componentCommunication } from '../lib/communication';

// Broadcast a notification to all components
function notifyEmailArchived(emailId: number) {
  componentCommunication.broadcastNotification(
    instanceId,
    'emailArchived',
    { emailId }
  );
}
```

## Context Provider System

The Context Provider system enables components to share data through a global context.

### Core Interfaces

```typescript
// Context types
enum ContextType {
  EMAIL = 'email',
  FOLDER = 'folder',
  CONTACT = 'contact',
  CALENDAR = 'calendar',
  SEARCH = 'search',
  SELECTION = 'selection',
  USER = 'user',
  APP_STATE = 'app-state',
  PREFERENCES = 'preferences'
}

// Context callback
type ContextChangeCallback<T = any> = (
  data: T,
  contextType: ContextType,
  contextId: string,
  providerId?: string
) => void;

// Context filter
interface ContextFilter {
  providerId?: string;
  contextType?: ContextType;
  contextId?: string;
}

// Subscriber options
interface ContextSubscriberOptions {
  immediate?: boolean;
  priority?: number;
  filter?: ContextFilter;
}
```

### ContextProvider Class

```typescript
class ContextProvider {
  // Set context data
  setContext<T = any>(
    contextType: ContextType,
    contextId: string,
    data: T,
    providerId?: string
  ): void;
  
  // Get context data
  getContext<T = any>(
    contextType: ContextType,
    contextId: string
  ): T | undefined;
  
  // Check if context exists
  hasContext(
    contextType: ContextType,
    contextId: string
  ): boolean;
  
  // Clear context
  clearContext(
    contextType: ContextType,
    contextId: string,
    providerId?: string
  ): boolean;
  
  // Context subscription
  subscribe<T = any>(
    callback: ContextChangeCallback<T>,
    options?: ContextSubscriberOptions
  ): string;
  
  unsubscribe(subscriptionId: string): boolean;
  
  // Context discovery
  getAllContextTypes(): ContextType[];
  getContextIdsForType(contextType: ContextType): string[];
  getAllActiveContexts(): Array<{ type: ContextType, id: string }>;
}
```

### Usage Examples

#### Setting Context

```typescript
import { contextProvider, ContextType } from '../lib/communication';

// Set the current email in context
function setCurrentEmail(email) {
  contextProvider.setContext(
    ContextType.EMAIL,
    'current-email',
    email,
    'email-viewer-1'  // Provider ID (optional)
  );
}
```

#### Getting Context

```typescript
import { contextProvider, ContextType } from '../lib/communication';

// Get the current email from context
function getCurrentEmail() {
  return contextProvider.getContext(
    ContextType.EMAIL,
    'current-email'
  );
}
```

#### Subscribing to Context Changes

```typescript
import { contextProvider, ContextType } from '../lib/communication';

// Subscribe to current email changes
useEffect(() => {
  const subscriptionId = contextProvider.subscribe(
    (email, contextType, contextId) => {
      if (contextType === ContextType.EMAIL && contextId === 'current-email') {
        setEmail(email);
        updateUI();
      }
    },
    {
      immediate: true,  // Get current value immediately
      filter: {
        contextType: ContextType.EMAIL,
        contextId: 'current-email'
      }
    }
  );
  
  return () => {
    contextProvider.unsubscribe(subscriptionId);
  };
}, []);
```

#### Creating a Custom Context Hook

```typescript
import { useEffect, useState } from 'react';
import { contextProvider, ContextType } from '../lib/communication';

// Custom hook for email context
function useEmailContext(emailContextId = 'current-email') {
  const [email, setEmail] = useState(
    contextProvider.getContext(ContextType.EMAIL, emailContextId)
  );
  
  useEffect(() => {
    const subscriptionId = contextProvider.subscribe(
      (data, type, id) => {
        if (type === ContextType.EMAIL && id === emailContextId) {
          setEmail(data);
        }
      },
      {
        immediate: true,
        filter: {
          contextType: ContextType.EMAIL,
          contextId: emailContextId
        }
      }
    );
    
    return () => {
      contextProvider.unsubscribe(subscriptionId);
    };
  }, [emailContextId]);
  
  return email;
}
```

## Drag and Drop System

The Drag and Drop system enables cross-component dragging and dropping of data.

### Core Interfaces

```typescript
// Drag item types
enum DragItemType {
  EMAIL = 'email',
  FOLDER = 'folder',
  TAG = 'tag',
  CONTACT = 'contact',
  CALENDAR_EVENT = 'calendar-event',
  ATTACHMENT = 'attachment',
  TASK = 'task',
  TEXT = 'text',
  COMPONENT = 'component',
  TAB = 'tab',
  PANEL = 'panel'
}

// Drop target types
enum DropTargetType {
  EMAIL_LIST = 'email-list',
  FOLDER = 'folder',
  TAG_LIST = 'tag-list',
  CALENDAR = 'calendar',
  EMAIL_COMPOSER = 'email-composer',
  TASK_LIST = 'task-list',
  PANEL = 'panel',
  TAB_BAR = 'tab-bar',
  TRASH = 'trash'
}

// Drag operations
enum DragOperation {
  COPY = 'copy',
  MOVE = 'move',
  LINK = 'link'
}

// Drag source
interface DragSource {
  sourceId: string;
  itemType: DragItemType;
  data: any;
  allowedOperations: DragOperation[];
  previewElement?: HTMLElement;
  metadata?: Record<string, any>;
}

// Drop target
interface DropTarget {
  targetId: string;
  targetType: DropTargetType;
  acceptedTypes: DragItemType[];
  allowedOperations?: DragOperation[];
  isValidTarget?: (item: DragItem) => boolean;
  position?: { x: number, y: number, width: number, height: number };
}

// Drag item (during drag)
interface DragItem {
  id: string;
  type: DragItemType;
  source: DragSource;
  data: any;
  operation: DragOperation;
  metadata?: Record<string, any>;
}

// Drop result
interface DropResult {
  success: boolean;
  operation: DragOperation;
  target: DropTarget;
  item: DragItem;
  position?: { x: number, y: number };
  error?: string;
}
```

### DragDropManager Class

```typescript
class DragDropManager {
  // Registration
  registerDragSource(source: DragSource): string;
  unregisterDragSource(sourceId: string): boolean;
  registerDropTarget(target: DropTarget): string;
  unregisterDropTarget(targetId: string): boolean;
  
  // Drag operations
  startDrag(
    sourceId: string,
    item: Omit<DragItem, 'id' | 'source'>,
    event?: MouseEvent
  ): string | null;
  updateDragPosition(x: number, y: number): void;
  cancelDrag(): void;
  endDrag(): void;
  
  // Drop operations
  drop(targetId: string, position?: { x: number, y: number }): DropResult | null;
  
  // Information
  isDragging(): boolean;
  getCurrentDragItem(): DragItem | null;
  getValidDropTargets(item?: DragItem): DropTarget[];
  isValidDropTarget(targetId: string, item?: DragItem): boolean;
  
  // Events
  onDragStart(callback: (item: DragItem) => void): () => void;
  onDragEnd(callback: (result: DropResult | null) => void): () => void;
  onDragEnter(targetId: string, callback: (item: DragItem) => void): () => void;
  onDragLeave(targetId: string, callback: (item: DragItem) => void): () => void;
  onDragOver(targetId: string, callback: (item: DragItem, position: { x: number, y: number }) => void): () => void;
  onDrop(targetId: string, callback: (result: DropResult) => void): () => void;
}
```

### React Hooks

```typescript
// Use drag source
function useDragSource<T = any>(
  itemType: DragItemType,
  data: T,
  options?: {
    previewElement?: HTMLElement | null;
    allowedOperations?: DragOperation[];
    onDragStart?: (item: DragItem) => void;
    onDragEnd?: (result: DropResult | null) => void;
  }
): {
  sourceId: string;
  isDragging: boolean;
  startDrag: (e: React.MouseEvent) => void;
};

// Use drop target
function useDropTarget<T = any>(
  targetType: DropTargetType,
  acceptedTypes: DragItemType[],
  componentId: string,
  onDrop?: (item: DragItem & { data: T }) => Promise<boolean> | boolean,
  options?: {
    allowedOperations?: DragOperation[];
    isValidTarget?: (item: DragItem) => boolean;
  }
): {
  targetId: string;
  isOver: boolean;
  canDrop: boolean;
  item: (DragItem & { data: T }) | null;
};
```

### Usage Examples

#### Creating a Drag Source

```typescript
import { useDragSource, DragItemType, DragOperation } from '../lib/communication';

function EmailItem({ email }) {
  const { sourceId, isDragging, startDrag } = useDragSource(
    DragItemType.EMAIL,
    email,
    {
      allowedOperations: [DragOperation.MOVE, DragOperation.COPY],
      onDragStart: (item) => {
        console.log('Started dragging email:', item);
      },
      onDragEnd: (result) => {
        if (result?.success) {
          console.log('Email dropped successfully:', result);
        }
      }
    }
  );
  
  return (
    <div 
      className={`email-item ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={startDrag}
      data-source-id={sourceId}
    >
      <div className="email-subject">{email.subject}</div>
      <div className="email-sender">{email.sender}</div>
    </div>
  );
}
```

#### Creating a Drop Target

```typescript
import { useDropTarget, DragItemType, DropTargetType } from '../lib/communication';

function FolderItem({ folder, onEmailMove }) {
  const { targetId, isOver, canDrop } = useDropTarget(
    DropTargetType.FOLDER,
    [DragItemType.EMAIL],
    `folder-${folder.id}`,
    async (item) => {
      if (item.type === DragItemType.EMAIL) {
        // Handle the dropped email
        try {
          await onEmailMove(item.data.id, folder.id);
          return true; // Drop successful
        } catch (error) {
          console.error('Error moving email:', error);
          return false; // Drop failed
        }
      }
      return false; // Unsupported item type
    }
  );
  
  return (
    <div 
      className={`folder-item ${isOver ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''}`}
      ref={(el) => el && (el.dataset.targetId = targetId)}
    >
      <div className="folder-name">{folder.name}</div>
      <div className="folder-count">{folder.unreadCount}</div>
    </div>
  );
}
```

#### Custom Drag Preview

```typescript
import { useDragSource, DragItemType } from '../lib/communication';
import { useRef, useEffect } from 'react';

function EmailWithDragPreview({ email }) {
  const previewRef = useRef(null);
  
  const { sourceId, isDragging, startDrag } = useDragSource(
    DragItemType.EMAIL,
    email,
    {
      previewElement: previewRef.current
    }
  );
  
  // Create a custom drag preview
  useEffect(() => {
    if (previewRef.current) {
      const preview = previewRef.current;
      preview.innerHTML = `
        <div class="email-drag-preview">
          <div class="preview-subject">${email.subject}</div>
          <div class="preview-sender">${email.sender}</div>
        </div>
      `;
    }
  }, [email]);
  
  return (
    <>
      <div 
        className="email-item"
        draggable
        onDragStart={startDrag}
        data-source-id={sourceId}
      >
        <div className="email-subject">{email.subject}</div>
        <div className="email-sender">{email.sender}</div>
      </div>
      
      {/* Hidden preview element */}
      <div 
        ref={previewRef}
        className="drag-preview-container"
        style={{ position: 'absolute', top: -9999, left: -9999 }}
      />
    </>
  );
}
```

## Command Registry System

The Command Registry system provides global commands that can be invoked from anywhere in the application.

### Core Interfaces

```typescript
// Command categories
enum CommandCategory {
  EMAIL = 'email',
  NAVIGATION = 'navigation',
  LAYOUT = 'layout',
  EDIT = 'edit',
  VIEW = 'view',
  TOOLS = 'tools',
  SYSTEM = 'system'
}

// Command contexts
enum CommandContext {
  GLOBAL = 'global',
  EMAIL_LIST = 'email-list',
  EMAIL_VIEW = 'email-view',
  EMAIL_COMPOSE = 'email-compose',
  FOLDER_LIST = 'folder-list',
  CALENDAR = 'calendar',
  CONTACTS = 'contacts',
  SEARCH = 'search',
  SETTINGS = 'settings'
}

// Command definition
interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  category: CommandCategory;
  contexts: CommandContext[];
  shortcut?: string | string[];  // e.g., 'Ctrl+N', ['Cmd+N', 'Ctrl+N']
  icon?: React.ReactNode;
  execute: (options?: any) => Promise<any> | any;
  enabled?: () => boolean;
  visible?: () => boolean;
}

// Keyboard shortcut mapping
interface ShortcutMapping {
  shortcut: string;
  commandId: string;
  context?: CommandContext;
}

// Execute options
interface ExecuteCommandOptions {
  args?: any;
  context?: CommandContext;
}
```

### CommandRegistry Class

```typescript
class CommandRegistry {
  // Command registration
  registerCommand(command: CommandDefinition): boolean;
  unregisterCommand(commandId: string): boolean;
  
  // Command execution
  executeCommand(
    commandId: string,
    options?: ExecuteCommandOptions
  ): Promise<any>;
  
  // Command discovery
  getCommand(commandId: string): CommandDefinition | undefined;
  getAllCommands(): CommandDefinition[];
  getCommandsByCategory(category: CommandCategory): CommandDefinition[];
  getCommandsByContext(context: CommandContext): CommandDefinition[];
  
  // Context management
  setActiveContext(context: CommandContext): void;
  getActiveContext(): CommandContext;
  isCommandAvailableInContext(
    commandId: string,
    context: CommandContext
  ): boolean;
  
  // Keyboard shortcuts
  registerShortcut(mapping: ShortcutMapping): boolean;
  unregisterShortcut(shortcut: string, context?: CommandContext): boolean;
  getShortcutsForCommand(commandId: string): string[];
  getCommandForShortcut(
    shortcut: string,
    context?: CommandContext
  ): string | undefined;
}
```

### Predefined Commands

```typescript
// Email commands
const Commands = {
  // Email commands
  EMAIL_NEW: 'email.new',
  EMAIL_REPLY: 'email.reply',
  EMAIL_REPLY_ALL: 'email.replyAll',
  EMAIL_FORWARD: 'email.forward',
  EMAIL_SEND: 'email.send',
  EMAIL_ARCHIVE: 'email.archive',
  EMAIL_DELETE: 'email.delete',
  EMAIL_MARK_READ: 'email.markRead',
  EMAIL_MARK_UNREAD: 'email.markUnread',
  EMAIL_FLAG: 'email.flag',
  EMAIL_MOVE_TO_FOLDER: 'email.moveToFolder',
  
  // Navigation commands
  NAV_NEXT_EMAIL: 'navigation.nextEmail',
  NAV_PREV_EMAIL: 'navigation.prevEmail',
  NAV_NEXT_UNREAD: 'navigation.nextUnread',
  NAV_INBOX: 'navigation.inbox',
  NAV_SEARCH: 'navigation.search',
  NAV_CALENDAR: 'navigation.calendar',
  NAV_CONTACTS: 'navigation.contacts',
  
  // Layout commands
  LAYOUT_SPLIT_HORIZONTAL: 'layout.splitHorizontal',
  LAYOUT_SPLIT_VERTICAL: 'layout.splitVertical',
  LAYOUT_NEW_TAB: 'layout.newTab',
  LAYOUT_CLOSE_TAB: 'layout.closeTab',
  LAYOUT_MAXIMIZE_PANEL: 'layout.maximizePanel',
  LAYOUT_RESTORE_PANEL: 'layout.restorePanel',
  LAYOUT_RESET: 'layout.reset',
  LAYOUT_SAVE: 'layout.save',
  LAYOUT_LOAD: 'layout.load',
  
  // View commands
  VIEW_TOGGLE_SIDEBAR: 'view.toggleSidebar',
  VIEW_TOGGLE_PREVIEW: 'view.togglePreview',
  VIEW_ZOOM_IN: 'view.zoomIn',
  VIEW_ZOOM_OUT: 'view.zoomOut',
  VIEW_RESET_ZOOM: 'view.resetZoom',
  
  // System commands
  SYSTEM_PREFERENCES: 'system.preferences',
  SYSTEM_HELP: 'system.help',
  SYSTEM_LOGOUT: 'system.logout'
};
```

### Usage Examples

#### Registering a Command

```typescript
import { commandRegistry, CommandCategory, CommandContext, Commands } from '../lib/communication';

// Register an email archive command
commandRegistry.registerCommand({
  id: Commands.EMAIL_ARCHIVE,
  name: 'Archive Email',
  description: 'Move the selected email to the archive folder',
  category: CommandCategory.EMAIL,
  contexts: [CommandContext.EMAIL_LIST, CommandContext.EMAIL_VIEW],
  shortcut: ['e', 'a'],  // 'e' then 'a' keys
  execute: async (options) => {
    const { emailId } = options?.args || {};
    
    if (!emailId) {
      // Get the current email ID from context
      const currentEmail = contextProvider.getContext(
        ContextType.EMAIL,
        'current-email'
      );
      
      if (currentEmail) {
        return archiveEmail(currentEmail.id);
      } else {
        throw new Error('No email selected to archive');
      }
    } else {
      return archiveEmail(emailId);
    }
  },
  enabled: () => {
    // Only enable if there's a selected email
    return !!contextProvider.getContext(
      ContextType.EMAIL,
      'current-email'
    );
  }
});
```

#### Executing Commands

```typescript
import { commandRegistry, Commands } from '../lib/communication';

// Execute a command
function handleArchiveClick() {
  commandRegistry.executeCommand(
    Commands.EMAIL_ARCHIVE,
    {
      args: { emailId: selectedEmailId }
    }
  )
  .then(() => {
    showToast('Email archived');
  })
  .catch((error) => {
    showToast(`Error: ${error.message}`, 'error');
  });
}
```

#### Using Multiple Shortcuts

```typescript
// Register command with different shortcuts for different platforms
commandRegistry.registerCommand({
  id: Commands.EMAIL_NEW,
  name: 'New Email',
  category: CommandCategory.EMAIL,
  contexts: [CommandContext.GLOBAL],
  shortcut: [
    'Ctrl+N',  // Windows/Linux
    'Cmd+N'    // MacOS
  ],
  execute: () => {
    return openNewEmailComposer();
  }
});
```

#### Setting Active Context

```typescript
import { commandRegistry, CommandContext } from '../lib/communication';

// When switching to the email list
function EmailListView() {
  useEffect(() => {
    // Set the active command context when this component mounts
    commandRegistry.setActiveContext(CommandContext.EMAIL_LIST);
    
    return () => {
      // Optionally reset to global when unmounting
      commandRegistry.setActiveContext(CommandContext.GLOBAL);
    };
  }, []);
  
  // Component implementation
}
```

#### Creating a Keyboard Shortcut Help Dialog

```tsx
import { commandRegistry, CommandContext } from '../lib/communication';
import { useState, useEffect } from 'react';

function KeyboardShortcutsHelp() {
  const [shortcuts, setShortcuts] = useState<Record<string, any[]>>({});
  const [activeContext, setActiveContext] = useState(
    commandRegistry.getActiveContext()
  );
  
  useEffect(() => {
    // Group commands by category
    const categorizedCommands: Record<string, any[]> = {};
    
    // Get commands for the current context
    const commands = commandRegistry.getCommandsByContext(activeContext);
    
    // Organize by category
    commands.forEach(command => {
      if (!categorizedCommands[command.category]) {
        categorizedCommands[command.category] = [];
      }
      
      // Get shortcuts for this command
      const shortcutKeys = commandRegistry.getShortcutsForCommand(command.id);
      
      categorizedCommands[command.category].push({
        ...command,
        shortcuts: shortcutKeys
      });
    });
    
    setShortcuts(categorizedCommands);
    
    // Subscribe to context changes
    const handleContextChange = () => {
      setActiveContext(commandRegistry.getActiveContext());
    };
    
    // Subscribe to context change events
    const unsubscribe = eventBus.subscribe(
      'command:contextChanged',
      handleContextChange
    );
    
    return unsubscribe;
  }, [activeContext]);
  
  return (
    <div className="shortcuts-help">
      <h2>Keyboard Shortcuts</h2>
      <div>Context: {activeContext}</div>
      
      {Object.entries(shortcuts).map(([category, commands]) => (
        <div key={category} className="shortcut-category">
          <h3>{category}</h3>
          <div className="shortcut-list">
            {commands.map(command => (
              <div key={command.id} className="shortcut-item">
                <div className="shortcut-name">{command.name}</div>
                <div className="shortcut-keys">
                  {command.shortcuts.map((shortcut: string) => (
                    <kbd key={shortcut}>{shortcut}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Unified Communication Hooks

For convenience, several combined hooks are provided to simplify component integration.

### useCommunication Hook

```typescript
import { 
  useEventBus, 
  useComponentCommunication, 
  useContextProvider, 
  useCommandRegistry 
} from '../hooks/useCommunication';

function EmailViewerWithCommunication() {
  // EventBus hooks
  const { 
    subscribe, 
    unsubscribe, 
    publish 
  } = useEventBus();
  
  // Component Communication hooks
  const { 
    registerComponent, 
    unregisterComponent, 
    sendRequest, 
    sendNotification 
  } = useComponentCommunication();
  
  // Context hooks
  const { 
    setContext, 
    getContext, 
    subscribeToContext 
  } = useContextProvider();
  
  // Command hooks
  const { 
    registerCommand, 
    executeCommand 
  } = useCommandRegistry();
  
  // Component implementation
}
```

### Specialized Communication Hooks

```typescript
// Component registration hook
function useComponentRegistration(
  componentType: ComponentType,
  metadata: Partial<ComponentMetadata>
): {
  componentId: string;
  sendRequest: <T, R>(targetId: string, requestType: string, payload?: T) => Promise<R>;
  sendNotification: <T>(targetId: string, notificationType: string, payload?: T) => void;
  broadcastNotification: <T>(notificationType: string, payload?: T) => void;
};

// Request handler hook
function useRequestHandler<T = any, R = any>(
  componentId: string,
  requestType: string,
  handler: (payload: T) => Promise<R> | R
): void;

// Event subscription hook
function useEvent<T extends BaseEvent>(
  eventType: string,
  listener: (event: T) => void,
  options?: SubscriptionOptions
): void;

// Context subscription hook
function useContextSubscription<T = any>(
  contextType: ContextType,
  callback: ContextChangeCallback<T>,
  options?: ContextSubscriberOptions
): void;
```

### Full Example Using Hooks

```tsx
import React, { useState, useEffect } from 'react';
import { 
  useComponentRegistration, 
  useRequestHandler, 
  useEvent, 
  useContextSubscription, 
  useDropTarget 
} from '../hooks/useCommunication';
import { 
  ComponentType, 
  EmailEventType, 
  ContextType, 
  DragItemType, 
  DropTargetType 
} from '../lib/communication';

function EmailViewer({ emailId: initialEmailId, tabId, panelId }) {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Register component
  const { componentId, sendRequest, broadcastNotification } = useComponentRegistration(
    ComponentType.EMAIL_VIEWER,
    {
      tabId,
      panelId,
      title: email?.subject || 'Email Viewer',
      supportsRequests: ['getEmailContent', 'markAsRead']
    }
  );
  
  // Register request handlers
  useRequestHandler(
    componentId,
    'getEmailContent',
    () => email
  );
  
  useRequestHandler(
    componentId,
    'markAsRead',
    async () => {
      await markEmailAsRead(email.id);
      return { success: true };
    }
  );
  
  // Subscribe to email selection events
  useEvent(
    EmailEventType.EMAIL_SELECTED,
    (event) => {
      if (!event.preview) {
        loadEmail(event.emailId);
      }
    }
  );
  
  // Subscribe to context
  useContextSubscription(
    ContextType.EMAIL,
    (emailData, contextType, contextId) => {
      if (contextId === 'current-email' && emailData) {
        setEmail(emailData);
      }
    }
  );
  
  // Set up drop target for attachments
  const { targetId, isOver } = useDropTarget(
    DropTargetType.EMAIL_COMPOSER,
    [DragItemType.ATTACHMENT],
    componentId,
    async (item) => {
      // Handle dropped attachment
      console.log('Attachment dropped:', item.data);
      return true;
    }
  );
  
  // Load initial email or one from props
  useEffect(() => {
    if (initialEmailId) {
      loadEmail(initialEmailId);
    }
  }, [initialEmailId]);
  
  // Load email function
  const loadEmail = async (id) => {
    setLoading(true);
    
    try {
      const result = await fetchEmailById(id);
      setEmail(result);
      
      // Set it as the current email in context
      window.contextProvider?.setContext(
        ContextType.EMAIL,
        'current-email',
        result,
        componentId
      );
      
      // Notify that email has been opened
      window.eventBus?.publish(
        EmailEventType.EMAIL_OPENED,
        {
          emailId: id,
          accountId: result.accountId,
          tabId,
          panelId
        }
      );
    } catch (error) {
      console.error('Error loading email:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Component UI
  return (
    <div className="email-viewer">
      {loading ? (
        <div className="loading">Loading email...</div>
      ) : email ? (
        <div 
          className={`email-content ${isOver ? 'drop-target-active' : ''}`}
          ref={(el) => el && (el.dataset.dropTargetId = targetId)}
        >
          <div className="email-header">
            <h2>{email.subject}</h2>
            <div className="email-meta">
              <div>From: {email.sender}</div>
              <div>To: {email.recipients.join(', ')}</div>
              <div>Date: {new Date(email.date).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="email-body" dangerouslySetInnerHTML={{ __html: email.body }} />
          
          {email.attachments && email.attachments.length > 0 && (
            <div className="email-attachments">
              <h3>Attachments</h3>
              <div className="attachment-list">
                {email.attachments.map(attachment => (
                  <div key={attachment.id} className="attachment-item">
                    {attachment.name} ({formatFileSize(attachment.size)})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-email">No email selected</div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Choose the Right Communication Mechanism

Select the appropriate communication mechanism based on the specific use case:

- **Event Bus**: For loosely coupled, application-wide events (e.g., "email received")
- **Component Communication**: For direct component interaction (e.g., "display this email")
- **Context Provider**: For shared state (e.g., "currently selected email")
- **Command Registry**: For user actions (e.g., "archive email command")
- **Drag and Drop**: For user-initiated data movement (e.g., "move email to folder")

### 2. Use Typed Events

Always define and use typed events for type safety and better code completion:

```typescript
// Define typed events
interface EmailSelectedEvent extends BaseEvent {
  type: EmailEventType.EMAIL_SELECTED;
  emailId: number;
  accountId: number;
}

// Use typed events
eventBus.subscribe<EmailSelectedEvent>(
  EmailEventType.EMAIL_SELECTED,
  (event) => {
    // TypeScript knows event.emailId exists
    console.log(event.emailId);
  }
);
```

### 3. Handle Errors and Timeouts

Always handle error cases and implement timeouts for asynchronous operations:

```typescript
try {
  const result = await componentCommunication.sendRequest(
    sourceId,
    targetId,
    'getEmailContent',
    { emailId },
    5000  // 5 second timeout
  );
  
  // Handle successful result
} catch (error) {
  // Handle errors (component not found, timeout, etc.)
  if (error.message.includes('timeout')) {
    // Handle timeout specifically
  }
}
```

### 4. Clean Up Subscriptions

Always clean up subscriptions when components unmount:

```typescript
useEffect(() => {
  const subscription1 = eventBus.subscribe(eventType, handleEvent);
  const subscription2 = contextProvider.subscribe(handleContextChange);
  
  return () => {
    // Clean up on unmount
    eventBus.unsubscribe(subscription1);
    contextProvider.unsubscribe(subscription2);
  };
}, []);
```

### 5. Throttle or Debounce Frequent Events

For high-frequency events, use throttling or debouncing:

```typescript
import { debounce, throttle } from 'lodash';

// For events that should capture the last value after a delay
const debouncedHandler = debounce((event) => {
  // Handle event
}, 300);

// For events that should fire at a controlled rate
const throttledHandler = throttle((event) => {
  // Handle event
}, 200);

// Subscribe with debounced or throttled handler
eventBus.subscribe(
  UIEventType.PANEL_RESIZED,
  (event) => debouncedHandler(event)
);
```

### 6. Minimize Global Context

Use the Context Provider judiciously; don't overuse it for all state:

- **Good use**: Current selected email, application theme, user information
- **Bad use**: Temporary component UI state, form field values

### 7. Organize Component Communication

Keep component communication organization clean:

- Define all supported request types in a central location
- Document the expected payload and response type for each request
- Group related requests together

### 8. Test Communication Flows

Create tests for communication flows, especially complex ones:

```typescript
test('Email selection flow', async () => {
  // Mock components
  const emailListId = componentCommunication.registerComponent(
    ComponentType.EMAIL_LIST,
    { /* metadata */ }
  );
  
  const emailViewerId = componentCommunication.registerComponent(
    ComponentType.EMAIL_VIEWER,
    { /* metadata */ }
  );
  
  // Setup request handler
  let emailLoadedInViewer = false;
  componentCommunication.registerRequestHandler(
    emailViewerId,
    'loadEmail',
    (payload) => {
      emailLoadedInViewer = true;
      return { success: true };
    }
  );
  
  // Publish event
  eventBus.publish(
    EmailEventType.EMAIL_SELECTED,
    { emailId: 123, accountId: 1 }
  );
  
  // Wait for async operations
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Assert
  expect(emailLoadedInViewer).toBe(true);
});
```

## Troubleshooting

### Event Not Received

**Issue**: Event is published but subscribers don't receive it.
**Solution**:
1. Verify event type matches exactly (case-sensitive)
2. Check that the subscriber is registered before the event is published
3. Verify the subscriber isn't unsubscribed prematurely
4. Check if the event has conditions that prevent delivery

### Component Communication Failures

**Issue**: `sendRequest` fails or times out.
**Solution**:
1. Verify target component exists and is registered
2. Check if target component supports the requested operation
3. Check for errors in the request handler implementation
4. Increase timeout for complex operations

### Context Not Updated

**Issue**: Context updates don't trigger subscribers.
**Solution**:
1. Verify context type and ID match exactly
2. Check if the subscriber options have filters that exclude the update
3. Verify that the context data is actually changed (same reference won't trigger)
4. Check if subscription was created after the context was set

### Command Not Executing

**Issue**: Command doesn't execute when expected.
**Solution**:
1. Check if command is registered properly
2. Verify command is available in the current context
3. Check if command's `enabled` function returns false
4. Verify keyboard shortcut is registered and doesn't conflict

### Drag and Drop Issues

**Issue**: Drop doesn't work or drop target doesn't highlight.
**Solution**:
1. Verify drop target accepts the drag item type
2. Check if `isValidTarget` function returns false
3. Ensure drop target element has the correct data attribute
4. Verify browser drag events aren't being stopped/prevented

## Advanced Topics

### 1. Cross-Window Communication

For communicating between browser windows/tabs:

```typescript
// In the EventBus implementation
class EventBus {
  // Add broadcast capability
  broadcastToOtherWindows<T extends BaseEvent>(
    eventType: string,
    eventData: Omit<T, 'type' | 'timestamp'>
  ): void {
    const event = this.createEvent(eventType, eventData);
    
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('nexus-event-bus');
      channel.postMessage(JSON.stringify(event));
      channel.close();
    } else {
      // Fallback for older browsers
      localStorage.setItem('nexus-event-broadcast', JSON.stringify({
        event,
        timestamp: Date.now()
      }));
    }
  }
  
  // Initialize broadcast listener
  initBroadcastListener(): () => void {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('nexus-event-bus');
      
      const handler = (message: MessageEvent) => {
        try {
          const event = JSON.parse(message.data);
          this.handleLocalEvent(event);
        } catch (error) {
          console.error('Error handling broadcast message:', error);
        }
      };
      
      channel.addEventListener('message', handler);
      return () => {
        channel.removeEventListener('message', handler);
        channel.close();
      };
    } else {
      // Fallback using storage events
      const handler = (e: StorageEvent) => {
        if (e.key === 'nexus-event-broadcast') {
          try {
            const data = JSON.parse(e.newValue || '');
            if (Date.now() - data.timestamp < 1000) {
              this.handleLocalEvent(data.event);
            }
          } catch (error) {
            console.error('Error handling storage event:', error);
          }
        }
      };
      
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  }
}
```

### 2. Middleware for Communication

Add middleware to transform or log events:

```typescript
// EventBus with middleware support
class EventBus {
  private middlewares: Array<(event: BaseEvent, next: () => void) => void> = [];
  
  // Add middleware
  use(middleware: (event: BaseEvent, next: () => void) => void): void {
    this.middlewares.push(middleware);
  }
  
  // Apply middleware chain
  private applyMiddleware(event: BaseEvent, callback: () => void): void {
    let index = 0;
    
    const next = () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        middleware(event, next);
      } else {
        callback();
      }
    };
    
    next();
  }
  
  // Use in publish
  publish<T extends BaseEvent>(
    eventType: string,
    eventData: Omit<T, 'type' | 'timestamp'>,
    options?: PublishOptions
  ): string {
    const event = this.createEvent(eventType, eventData);
    
    this.applyMiddleware(event, () => {
      // Actual event publishing logic
      this.distributeEvent(event, options);
    });
    
    return event.id;
  }
}

// Example middleware
// Logging middleware
eventBus.use((event, next) => {
  console.log('Event:', event.type, event);
  next();
});

// Filtering middleware
eventBus.use((event, next) => {
  if (event.type.startsWith('debug:') && !isDebugMode()) {
    // Skip debug events in production
    return;
  }
  next();
});

// Transformation middleware
eventBus.use((event, next) => {
  if (event.type === EmailEventType.EMAIL_RECEIVED) {
    // Add extra data to the event
    (event as any).receivedLocally = true;
  }
  next();
});
```

### 3. Service Workers Integration

Integrate with service workers for offline support:

```typescript
// Initialize in main application
function initServiceWorkerCommunication() {
  if ('serviceWorker' in navigator) {
    // Send events to service worker
    eventBus.use((event, next) => {
      if (event.persist) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'event',
          event
        });
      }
      next();
    });
    
    // Listen for events from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'event') {
        eventBus.distributeEvent(event.data.event);
      }
    });
  }
}

// In service worker
self.addEventListener('message', (event) => {
  if (event.data?.type === 'event') {
    // Store event for offline handling
    storeEventForSync(event.data.event);
  }
});
```

## See Also

- [Panel Management Documentation](./panel-management.md)
- [Component Registry Documentation](./component-registry-documentation.md)
- [Layout Persistence Documentation](./layout-persistence-documentation.md)