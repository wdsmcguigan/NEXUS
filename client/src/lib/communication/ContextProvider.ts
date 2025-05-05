/**
 * Context Provider for NEXUS.email
 * 
 * Manages shared context between components, including selected entities,
 * filters, and other application state that components might need to share.
 */

import { nanoid } from 'nanoid';
import { eventBus } from './EventBus';
import { ContextEventType, ContextEvent } from './Events';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Types of context that can be shared
 */
export enum ContextType {
  EMAIL = 'email',
  EMAILS = 'emails',
  FOLDER = 'folder',
  CONTACT = 'contact',
  CONTACTS = 'contacts',
  EVENT = 'calendar_event',
  EVENTS = 'calendar_events',
  DATE = 'date',
  DATE_RANGE = 'date_range',
  TAG = 'tag',
  TAGS = 'tags',
  SEARCH_QUERY = 'search_query',
  SEARCH_RESULTS = 'search_results',
  TASK = 'task',
  TASKS = 'tasks',
  FILE = 'file',
  FILES = 'files',
  ACCOUNT = 'account',
  TEXT_SELECTION = 'text_selection',
  COMPOSER_DATA = 'composer_data',
  CUSTOM = 'custom'
}

/**
 * Context update callback
 */
export type ContextChangeCallback<T = any> = (
  context: T, 
  contextType: ContextType | string,
  contextId: string,
  source?: string
) => void;

/**
 * Context filter function
 */
export type ContextFilter<T = any> = (
  context: T, 
  contextType: ContextType | string,
  contextId: string,
  source?: string
) => boolean;

/**
 * Context subscriber options
 */
export interface ContextSubscriberOptions {
  filter?: ContextFilter;
  priority?: number;
  includeSource?: boolean;
  excludeSources?: string[];
  excludeSelf?: boolean;
}

/**
 * Context subscription
 */
interface ContextSubscription {
  id: string;
  contextType: ContextType | string;
  callback: ContextChangeCallback;
  options: ContextSubscriberOptions;
}

/**
 * Context Provider Service
 */
export class ContextProvider {
  private static instance: ContextProvider;
  private contexts: Map<string, Map<string, any>> = new Map();
  private subscriptions: Map<string, ContextSubscription[]> = new Map();
  private activeContexts: Map<ContextType | string, string> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): ContextProvider {
    if (!ContextProvider.instance) {
      ContextProvider.instance = new ContextProvider();
    }
    return ContextProvider.instance;
  }

  /**
   * Private constructor for singleton
   */
  private constructor() {
    // Initialize context maps for all context types
    for (const type in ContextType) {
      const contextType = ContextType[type as keyof typeof ContextType];
      this.contexts.set(contextType, new Map());
      this.subscriptions.set(contextType, []);
    }
    
    // Initialize custom context types map
    this.contexts.set('custom', new Map());
    this.subscriptions.set('custom', []);
    
    debugLog('ContextProvider', 'ContextProvider initialized');
  }

  /**
   * Set a context value
   */
  setContext<T>(
    contextType: ContextType | string,
    contextId: string,
    value: T,
    source?: string
  ): void {
    // Ensure context type map exists
    if (!this.contexts.has(contextType)) {
      this.contexts.set(contextType, new Map());
      this.subscriptions.set(contextType, []);
    }
    
    // Get the context map for this type
    const contextMap = this.contexts.get(contextType)!;
    
    // Store the value
    contextMap.set(contextId, value);
    
    // Update active context for this type
    this.activeContexts.set(contextType, contextId);
    
    debugLog('ContextProvider', `Context set: ${contextType}/${contextId} from ${source || 'unknown'}`);
    
    // Notify subscribers
    this.notifySubscribers(contextType, contextId, value, source);
    
    // Publish event for the event bus
    this.publishContextChanged(contextType, contextId, value, source);
  }

  /**
   * Get a context value
   */
  getContext<T>(contextType: ContextType | string, contextId: string): T | undefined {
    const contextMap = this.contexts.get(contextType);
    if (!contextMap) {
      return undefined;
    }
    
    return contextMap.get(contextId) as T | undefined;
  }

  /**
   * Get the active context for a type
   */
  getActiveContext<T>(contextType: ContextType | string): T | undefined {
    const activeId = this.activeContexts.get(contextType);
    if (!activeId) {
      return undefined;
    }
    
    return this.getContext<T>(contextType, activeId);
  }

  /**
   * Get the active context ID for a type
   */
  getActiveContextId(contextType: ContextType | string): string | undefined {
    return this.activeContexts.get(contextType);
  }

  /**
   * Clear a specific context
   */
  clearContext(contextType: ContextType | string, contextId: string, source?: string): boolean {
    const contextMap = this.contexts.get(contextType);
    if (!contextMap || !contextMap.has(contextId)) {
      return false;
    }
    
    // Remove the context
    contextMap.delete(contextId);
    
    // If this was the active context, clear it
    if (this.activeContexts.get(contextType) === contextId) {
      this.activeContexts.delete(contextType);
    }
    
    debugLog('ContextProvider', `Context cleared: ${contextType}/${contextId} from ${source || 'unknown'}`);
    
    // Publish event for the event bus
    this.publishContextCleared(contextType, contextId, source);
    
    return true;
  }

  /**
   * Clear all contexts of a specific type
   */
  clearContextType(contextType: ContextType | string, source?: string): boolean {
    const contextMap = this.contexts.get(contextType);
    if (!contextMap) {
      return false;
    }
    
    // Clear all contexts of this type
    contextMap.clear();
    
    // Clear active context
    this.activeContexts.delete(contextType);
    
    debugLog('ContextProvider', `Context type cleared: ${contextType} from ${source || 'unknown'}`);
    
    // Publish event for the event bus
    this.publishContextTypeCleared(contextType, source);
    
    return true;
  }

  /**
   * Subscribe to context changes
   */
  subscribe<T>(
    contextType: ContextType | string, 
    callback: ContextChangeCallback<T>,
    options: ContextSubscriberOptions = {}
  ): string {
    // Ensure subscriptions array exists for this context type
    if (!this.subscriptions.has(contextType)) {
      this.subscriptions.set(contextType, []);
    }
    
    const subscriptions = this.subscriptions.get(contextType)!;
    
    // Create subscription
    const subscriptionId = nanoid();
    const subscription: ContextSubscription = {
      id: subscriptionId,
      contextType,
      callback: callback as ContextChangeCallback,
      options
    };
    
    // Add to subscriptions, using priority to determine position
    const { priority = 0 } = options;
    let insertIndex = subscriptions.findIndex(sub => 
      (sub.options.priority || 0) < priority
    );
    
    if (insertIndex === -1) {
      insertIndex = subscriptions.length;
    }
    
    subscriptions.splice(insertIndex, 0, subscription);
    
    debugLog('ContextProvider', `Subscribed to ${contextType} with ID ${subscriptionId}`);
    
    // Return unsubscribe function
    return subscriptionId;
  }

  /**
   * Unsubscribe from context changes
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [contextType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      
      if (index !== -1) {
        // Remove the subscription
        subscriptions.splice(index, 1);
        debugLog('ContextProvider', `Unsubscribed from ${contextType} with ID ${subscriptionId}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a component should receive a context update based on filters
   */
  private shouldReceiveUpdate(
    subscription: ContextSubscription,
    contextType: ContextType | string,
    contextId: string,
    context: any,
    source?: string
  ): boolean {
    const { options } = subscription;
    
    // Check if the subscriber wants to exclude updates from certain sources
    if (source && options.excludeSources && options.excludeSources.includes(source)) {
      return false;
    }
    
    // Check if the subscriber wants to exclude updates from itself
    if (source && options.excludeSelf && source === subscription.id) {
      return false;
    }
    
    // Apply custom filter if provided
    if (options.filter) {
      return options.filter(context, contextType, contextId, source);
    }
    
    return true;
  }

  /**
   * Notify subscribers of a context change
   */
  private notifySubscribers(
    contextType: ContextType | string,
    contextId: string,
    value: any,
    source?: string
  ): void {
    const subscriptions = this.subscriptions.get(contextType);
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }
    
    // Call each subscriber that should receive the update
    for (const subscription of subscriptions) {
      if (this.shouldReceiveUpdate(
        subscription, 
        contextType, 
        contextId, 
        value, 
        source
      )) {
        try {
          subscription.callback(value, contextType, contextId, source);
        } catch (error) {
          errorLog(
            'ContextProvider', 
            `Error in context subscriber: ${error instanceof Error ? error.message : String(error)}`,
            { contextType, contextId, subscriptionId: subscription.id }
          );
        }
      }
    }
  }

  /**
   * Publish a context changed event to the event bus
   */
  private publishContextChanged(
    contextType: ContextType | string,
    contextId: string,
    value: any,
    source?: string
  ): void {
    eventBus.publish<ContextEvent>(
      ContextEventType.CONTEXT_CHANGED,
      {
        contextType,
        contextId,
        payload: value,
        sourceComponentId: source
      }
    );
  }

  /**
   * Publish a context cleared event to the event bus
   */
  private publishContextCleared(
    contextType: ContextType | string,
    contextId: string,
    source?: string
  ): void {
    eventBus.publish<ContextEvent>(
      ContextEventType.CONTEXT_CLEARED,
      {
        contextType,
        contextId,
        sourceComponentId: source
      }
    );
  }

  /**
   * Publish a context type cleared event to the event bus
   */
  private publishContextTypeCleared(
    contextType: ContextType | string,
    source?: string
  ): void {
    eventBus.publish<ContextEvent>(
      ContextEventType.CONTEXT_CLEARED,
      {
        contextType,
        sourceComponentId: source,
        metadata: { entireType: true }
      }
    );
  }

  /**
   * Get all context values of a specific type
   */
  getAllContexts<T>(contextType: ContextType | string): Map<string, T> {
    const contextMap = this.contexts.get(contextType);
    if (!contextMap) {
      return new Map();
    }
    
    return new Map(contextMap as Map<string, T>);
  }

  /**
   * Get all active contexts
   */
  getAllActiveContexts(): Map<ContextType | string, any> {
    const result = new Map();
    
    for (const [contextType, contextId] of this.activeContexts.entries()) {
      const value = this.getContext(contextType, contextId);
      if (value !== undefined) {
        result.set(contextType, value);
      }
    }
    
    return result;
  }

  /**
   * Check if a context exists
   */
  hasContext(contextType: ContextType | string, contextId: string): boolean {
    const contextMap = this.contexts.get(contextType);
    return !!contextMap && contextMap.has(contextId);
  }

  /**
   * Check if a context type has an active context
   */
  hasActiveContext(contextType: ContextType | string): boolean {
    return this.activeContexts.has(contextType);
  }

  /**
   * Clear all contexts (for testing or resets)
   */
  clearAll(): void {
    for (const contextMap of this.contexts.values()) {
      contextMap.clear();
    }
    
    this.activeContexts.clear();
    
    debugLog('ContextProvider', 'All contexts cleared');
    
    // Publish event for the event bus
    eventBus.publish<ContextEvent>(
      ContextEventType.CONTEXT_CLEARED,
      {
        metadata: { allCleared: true }
      }
    );
  }
}

// Export singleton instance
export const contextProvider = ContextProvider.getInstance();

/**
 * Helper to create context hooks for specific types
 */
export function createContextHook<T>(contextType: ContextType | string) {
  return {
    useContext: (contextId: string) => contextProvider.getContext<T>(contextType, contextId),
    useActiveContext: () => contextProvider.getActiveContext<T>(contextType),
    setContext: (contextId: string, value: T, source?: string) => 
      contextProvider.setContext(contextType, contextId, value, source),
    clearContext: (contextId: string, source?: string) => 
      contextProvider.clearContext(contextType, contextId, source),
    subscribe: (callback: ContextChangeCallback<T>, options?: ContextSubscriberOptions) => 
      contextProvider.subscribe<T>(contextType, callback, options),
    unsubscribe: (subscriptionId: string) => 
      contextProvider.unsubscribe(subscriptionId)
  };
}

export default contextProvider;