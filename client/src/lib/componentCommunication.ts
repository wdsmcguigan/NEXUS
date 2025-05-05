import { useEffect } from 'react';
import { nanoid } from 'nanoid';

/**
 * Event types that components can subscribe to or emit
 */
export enum ComponentEventType {
  // Data events
  DATA_UPDATED = 'data:updated',
  DATA_SELECTED = 'data:selected',
  DATA_DELETED = 'data:deleted',
  DATA_CREATED = 'data:created',
  DATA_REQUESTED = 'data:requested',
  DATA_RESPONSE = 'data:response',
  
  // UI events
  UI_REFRESH = 'ui:refresh',
  UI_FOCUS = 'ui:focus',
  UI_BLUR = 'ui:blur',
  UI_RESIZE = 'ui:resize',
  UI_THEME_CHANGED = 'ui:theme_changed',
  
  // Navigation events
  NAVIGATE = 'navigate',
  NAVIGATE_BACK = 'navigate:back',
  NAVIGATE_FORWARD = 'navigate:forward',
  
  // Search events
  SEARCH_PERFORMED = 'search:performed',
  SEARCH_RESULT = 'search:result',
  SEARCH_CLEAR = 'search:clear',
  
  // Email-specific events
  EMAIL_SELECTED = 'email:selected',
  EMAIL_READ = 'email:read',
  EMAIL_ARCHIVED = 'email:archived',
  EMAIL_DELETED = 'email:deleted',
  EMAIL_TAGGED = 'email:tagged',
  EMAIL_STARRED = 'email:starred',
  EMAIL_SENT = 'email:sent',
  EMAIL_DRAFT_SAVED = 'email:draft_saved',
  
  // Task events
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_COMPLETED = 'task:completed',
  TASK_DELETED = 'task:deleted',
  
  // Calendar events
  CALENDAR_EVENT_CREATED = 'calendar:event_created',
  CALENDAR_EVENT_UPDATED = 'calendar:event_updated',
  CALENDAR_EVENT_DELETED = 'calendar:event_deleted',
  CALENDAR_VIEW_CHANGED = 'calendar:view_changed',
  
  // Contact events
  CONTACT_CREATED = 'contact:created',
  CONTACT_UPDATED = 'contact:updated',
  CONTACT_DELETED = 'contact:deleted',
  CONTACT_SELECTED = 'contact:selected',
  
  // File events
  FILE_CREATED = 'file:created',
  FILE_UPDATED = 'file:updated',
  FILE_DELETED = 'file:deleted',
  FILE_SELECTED = 'file:selected',
  FILE_UPLOADED = 'file:uploaded',
  FILE_DOWNLOADED = 'file:downloaded',
  
  // Note events
  NOTE_CREATED = 'note:created',
  NOTE_UPDATED = 'note:updated',
  NOTE_DELETED = 'note:deleted',
  NOTE_SELECTED = 'note:selected',
  
  // Browser events
  BROWSER_PAGE_LOADED = 'browser:page_loaded',
  BROWSER_NAV_CHANGED = 'browser:nav_changed',
  BROWSER_BOOKMARK_ADDED = 'browser:bookmark_added',
  
  // Integration events
  INTEGRATION_CONNECTED = 'integration:connected',
  INTEGRATION_DISCONNECTED = 'integration:disconnected',
  INTEGRATION_SYNCED = 'integration:synced',
  INTEGRATION_ERROR = 'integration:error',
  
  // System events
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_NOTIFICATION = 'system:notification',
  
  // User account events
  USER_LOGGED_IN = 'user:logged_in',
  USER_LOGGED_OUT = 'user:logged_out',
  USER_SETTINGS_UPDATED = 'user:settings_updated',
  
  // Application events
  APP_READY = 'app:ready',
  APP_LOADED = 'app:loaded',
  APP_ERROR = 'app:error',
  APP_THEME_CHANGED = 'app:theme_changed',
  APP_LANGUAGE_CHANGED = 'app:language_changed',
  
  // Custom event (for component-specific events)
  CUSTOM = 'custom',
}

/**
 * Event payload structure
 */
export interface ComponentEvent<T = any> {
  id: string;                       // Unique event ID
  type: ComponentEventType | string; // Event type
  source: {                         // Event source information
    componentId: string;            // Component that emitted the event
    instanceId: string;             // Instance that emitted the event
  };
  target?: {                        // Optional target information
    componentId?: string;           // Target component ID
    instanceId?: string;            // Target instance ID
  };
  timestamp: number;                // Event timestamp
  payload: T;                       // Event data payload
  meta?: Record<string, any>;       // Additional metadata
}

// Global event bus for component communication
class ComponentEventBus {
  private listeners: Map<string, Set<(event: ComponentEvent) => void>> = new Map();

  /**
   * Subscribe to events of a specific type
   */
  subscribe(
    eventType: ComponentEventType | string, 
    callback: (event: ComponentEvent) => void
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to multiple event types
   */
  subscribeToMany(
    eventTypes: (ComponentEventType | string)[],
    callback: (event: ComponentEvent) => void
  ): () => void {
    const unsubscribers = eventTypes.map(type => this.subscribe(type, callback));
    
    // Return combined unsubscribe function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(callback: (event: ComponentEvent) => void): () => void {
    return this.subscribe('*', callback);
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = any>(
    type: ComponentEventType | string,
    source: { componentId: string; instanceId: string },
    payload: T,
    meta?: Record<string, any>,
    target?: { componentId?: string; instanceId?: string }
  ): void {
    const event: ComponentEvent<T> = {
      id: nanoid(),
      type,
      source,
      target,
      timestamp: Date.now(),
      payload,
      meta
    };

    // Dispatch to specific event subscribers
    if (this.listeners.has(type)) {
      for (const callback of this.listeners.get(type)!) {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
        }
      }
    }

    // Dispatch to '*' subscribers (listening to all events)
    if (this.listeners.has('*')) {
      for (const callback of this.listeners.get('*')!) {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event handler for all events:`, error);
        }
      }
    }
  }

  /**
   * Get all currently registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.listeners.keys()).filter(type => type !== '*');
  }

  /**
   * Get count of listeners for a specific event type
   */
  getListenerCount(eventType: ComponentEventType | string): number {
    return this.listeners.has(eventType) ? this.listeners.get(eventType)!.size : 0;
  }
}

// Create singleton instance
export const componentEventBus = new ComponentEventBus();

/**
 * React hook to subscribe to component events
 */
export function useComponentEvent(
  eventType: ComponentEventType | string,
  callback: (event: ComponentEvent) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = componentEventBus.subscribe(eventType, callback);
    return unsubscribe;
  }, [eventType, ...deps]);
}

/**
 * React hook to subscribe to multiple component events
 */
export function useComponentEvents(
  eventTypes: (ComponentEventType | string)[],
  callback: (event: ComponentEvent) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = componentEventBus.subscribeToMany(eventTypes, callback);
    return unsubscribe;
  }, [eventTypes, ...deps]);
}

/**
 * Helper to emit a component event
 */
export function emitComponentEvent<T = any>(
  type: ComponentEventType | string,
  componentId: string,
  instanceId: string,
  payload: T,
  meta?: Record<string, any>,
  target?: { componentId?: string; instanceId?: string }
): void {
  componentEventBus.emit(
    type,
    { componentId, instanceId },
    payload,
    meta,
    target
  );
}

export default componentEventBus;