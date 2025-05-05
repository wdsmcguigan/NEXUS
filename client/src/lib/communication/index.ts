/**
 * Main export file for the NEXUS.email communication system.
 * Exports all communication-related components, hooks, and utilities.
 */

// Event Bus exports
export { 
  eventBus, 
  createEvent, 
  createTypedSubscribe
} from './EventBus';
export type { 
  BaseEvent, 
  EventListener, 
  SubscriptionOptions, 
  PublishOptions 
} from './EventBus';

// Event types exports
export {
  EmailEventType,
  CalendarEventType,
  ContactEventType,
  UIEventType,
  SearchEventType,
  CommandEventType,
  DragDropEventType,
  ContextEventType,
  AppEventType,
  EventTypes
} from './Events';
export type {
  EmailEvent,
  EmailSelectedEvent,
  EmailOpenedEvent,
  EmailSentEvent,
  CalendarEvent,
  ContactEvent,
  UIEvent,
  TabCreatedEvent,
  TabActivatedEvent,
  LayoutChangedEvent,
  SearchEvent,
  CommandEvent,
  CommandExecutedEvent,
  DragDropEvent,
  ContextEvent,
  AppEvent
} from './Events';

// Component Communication exports
export { 
  componentCommunication, 
  ComponentType
} from './ComponentCommunication';
export type { 
  ComponentMetadata, 
  ComponentState, 
  ComponentMessage, 
  RequestMessage, 
  ResponseMessage, 
  NotificationMessage, 
  ErrorMessage, 
  RequestHandler 
} from './ComponentCommunication';

// Context Provider exports
export { 
  contextProvider, 
  ContextType, 
  createContextHook 
} from './ContextProvider';
export type { 
  ContextChangeCallback, 
  ContextFilter, 
  ContextSubscriberOptions 
} from './ContextProvider';

// Drag and Drop exports
export { 
  dragDropManager, 
  DragItemType, 
  DropTargetType, 
  DragOperation 
} from './DragDropManager';
export type { 
  DragSource, 
  DropTarget, 
  DragItem, 
  DropResult, 
  DragEventHandler, 
  DropEventHandler 
} from './DragDropManager';

// Command Registry exports
export { 
  commandRegistry, 
  CommandCategory, 
  CommandContext, 
  Commands 
} from './CommandRegistry';
export type { 
  CommandDefinition, 
  ShortcutMapping, 
  ExecuteCommandOptions 
} from './CommandRegistry';

// Default exports with all systems
export default {
  eventBus,
  componentCommunication,
  contextProvider,
  dragDropManager,
  commandRegistry
};