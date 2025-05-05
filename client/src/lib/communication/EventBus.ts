/**
 * Event Bus System for NEXUS.email
 * 
 * A centralized event system for application-wide communication between components.
 * Supports typed events, prioritization, cancellation, and scoped subscriptions.
 */

import { nanoid } from 'nanoid';
import { debugLog } from '../utils/debug';

/**
 * Base event interface
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  id: string;
  source?: string;
  cancelable?: boolean;
  canceled?: boolean;
  propagationStopped?: boolean;
  scope?: string | string[];
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * Event listener/handler function
 */
export type EventListener<T extends BaseEvent = BaseEvent> = (event: T) => void | boolean | Promise<void | boolean>;

/**
 * Subscription information
 */
interface Subscription {
  id: string;
  eventType: string;
  listener: EventListener;
  scope?: string | string[];
  priority: number;
  once: boolean;
}

/**
 * Options for subscribing to events
 */
export interface SubscriptionOptions {
  scope?: string | string[];
  priority?: number;
  once?: boolean;
}

/**
 * Options for publishing events
 */
export interface PublishOptions {
  scope?: string | string[];
  source?: string;
  cancelable?: boolean;
  metadata?: Record<string, any>;
  async?: boolean;
  priority?: number;
}

/**
 * Event Bus for centralized application events
 */
export class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, Subscription[]> = new Map();
  private paused: boolean = false;
  private eventQueue: Array<{ event: BaseEvent, options: PublishOptions }> = [];

  /**
   * Get the singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    debugLog('EventBus', 'EventBus initialized');
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends BaseEvent>(
    eventType: string, 
    listener: EventListener<T>, 
    options: SubscriptionOptions = {}
  ): string {
    const { scope, priority = 0, once = false } = options;
    
    const subscriptionId = nanoid();
    const subscription: Subscription = {
      id: subscriptionId,
      eventType,
      listener: listener as EventListener,
      scope,
      priority,
      once
    };
    
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    
    const subscriptions = this.subscriptions.get(eventType)!;
    
    // Insert the subscription in priority order (higher priority first)
    let insertIndex = subscriptions.findIndex(sub => sub.priority < priority);
    if (insertIndex === -1) {
      insertIndex = subscriptions.length;
    }
    
    subscriptions.splice(insertIndex, 0, subscription);
    
    debugLog('EventBus', `Subscribed to ${eventType} with ID ${subscriptionId}`);
    
    // Return an unsubscribe function
    return subscriptionId;
  }

  /**
   * Subscribe to an event type for a single occurrence
   */
  once<T extends BaseEvent>(
    eventType: string, 
    listener: EventListener<T>, 
    options: Omit<SubscriptionOptions, 'once'> = {}
  ): string {
    return this.subscribe(eventType, listener, { ...options, once: true });
  }

  /**
   * Unsubscribe from an event using the subscription ID
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      
      if (index !== -1) {
        subscriptions.splice(index, 1);
        debugLog('EventBus', `Unsubscribed from ${eventType} with ID ${subscriptionId}`);
        
        // Remove the event type if there are no more subscriptions
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Publish an event to all subscribers
   */
  async publish<T extends BaseEvent>(
    eventType: string, 
    eventData: Partial<T>, 
    options: PublishOptions = {}
  ): Promise<T> {
    const { 
      scope, 
      source, 
      cancelable = false, 
      metadata = {}, 
      async = false,
      priority = 0 
    } = options;
    
    // Create the event object
    const event: BaseEvent = {
      type: eventType,
      timestamp: Date.now(),
      id: nanoid(),
      source,
      cancelable,
      canceled: false,
      propagationStopped: false,
      scope,
      priority,
      metadata,
      ...eventData
    };
    
    debugLog('EventBus', `Published event ${eventType} (ID: ${event.id})`);
    
    // If the event bus is paused, queue the event for later
    if (this.paused) {
      this.eventQueue.push({ event, options });
      return event as T;
    }
    
    // Get subscribers for this event type
    const subscribers = this.subscriptions.get(eventType) || [];
    
    // Filter subscribers by scope if needed
    const filteredSubscribers = this.filterSubscribersByScope(subscribers, scope);
    
    // Process the event
    if (async) {
      this.processEventAsync(event, filteredSubscribers);
    } else {
      await this.processEvent(event, filteredSubscribers);
    }
    
    return event as T;
  }

  /**
   * Process an event and notify subscribers
   */
  private async processEvent(event: BaseEvent, subscribers: Subscription[]): Promise<void> {
    for (const subscription of subscribers) {
      if (event.canceled || event.propagationStopped) {
        break;
      }
      
      try {
        // Call the listener
        const result = await subscription.listener(event);
        
        // If the listener returns false explicitly, cancel the event
        if (result === false && event.cancelable) {
          event.canceled = true;
        }
        
        // Remove one-time listeners after they're called
        if (subscription.once) {
          this.unsubscribe(subscription.id);
        }
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }

  /**
   * Process an event asynchronously without awaiting results
   */
  private processEventAsync(event: BaseEvent, subscribers: Subscription[]): void {
    for (const subscription of subscribers) {
      if (event.canceled || event.propagationStopped) {
        break;
      }
      
      // Call each listener without waiting for completion
      Promise.resolve().then(() => {
        try {
          const result = subscription.listener(event);
          
          if (result === false && event.cancelable) {
            event.canceled = true;
          }
          
          if (subscription.once) {
            this.unsubscribe(subscription.id);
          }
        } catch (error) {
          console.error(`Error in async event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Filter subscribers by scope
   */
  private filterSubscribersByScope(subscribers: Subscription[], scope?: string | string[]): Subscription[] {
    if (!scope) {
      return subscribers;
    }
    
    const scopes = Array.isArray(scope) ? scope : [scope];
    
    return subscribers.filter(sub => {
      // If the subscriber has no scope, it receives all events
      if (!sub.scope) {
        return true;
      }
      
      const subScopes = Array.isArray(sub.scope) ? sub.scope : [sub.scope];
      
      // Check if any of the event scopes match any of the subscription scopes
      return scopes.some(s => subScopes.includes(s));
    });
  }

  /**
   * Cancel an event
   */
  cancelEvent(event: BaseEvent): boolean {
    if (!event.cancelable) {
      return false;
    }
    
    event.canceled = true;
    return true;
  }

  /**
   * Stop event propagation to lower-priority listeners
   */
  stopPropagation(event: BaseEvent): void {
    event.propagationStopped = true;
  }

  /**
   * Pause the event bus (events will be queued)
   */
  pause(): void {
    this.paused = true;
    debugLog('EventBus', 'EventBus paused');
  }

  /**
   * Resume the event bus and process queued events
   */
  resume(): void {
    this.paused = false;
    debugLog('EventBus', 'EventBus resumed');
    
    // Process queued events
    const queuedEvents = [...this.eventQueue];
    this.eventQueue = [];
    
    for (const { event, options } of queuedEvents) {
      this.publish(event.type, event, options);
    }
  }

  /**
   * Remove all subscriptions for cleanup
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventQueue = [];
    debugLog('EventBus', 'EventBus cleared');
  }

  /**
   * Get subscription count (useful for debugging)
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subscriptions of this.subscriptions.values()) {
      count += subscriptions.length;
    }
    return count;
  }

  /**
   * Get the number of queued events (useful for debugging)
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Export a utility for creating typed event classes
export function createEvent<T extends Partial<BaseEvent>>(
  type: string, 
  data: Omit<T, 'type' | 'timestamp' | 'id'>
): T & BaseEvent {
  return {
    type,
    timestamp: Date.now(),
    id: nanoid(),
    ...data
  } as T & BaseEvent;
}

// Export a utility for creating typed subscribe functions
export function createTypedSubscribe<T extends BaseEvent>(eventType: string) {
  return (listener: EventListener<T>, options?: SubscriptionOptions): string => {
    return eventBus.subscribe<T>(eventType, listener, options);
  };
}

export default eventBus;