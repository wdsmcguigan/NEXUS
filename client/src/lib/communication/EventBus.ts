/**
 * EventBus System for NEXUS.email
 * 
 * The EventBus provides a central hub for publishing and subscribing to events
 * across the application, enabling loose coupling between components.
 */

import { v4 as uuidv4 } from 'uuid';
import { ComponentEvent, EventPriority, EventSubscriptionOptions } from './ComponentCommunication';

// Event subscription
interface Subscription {
  id: string;
  eventType: string;
  callback: (event: any) => void;
  options: EventSubscriptionOptions;
}

// Base event interface
export interface BaseEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  priority: EventPriority;
}

/**
 * EventBus class for managing application events
 */
export class EventBus {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private eventHistory: Map<string, ComponentEvent[]> = new Map();
  private historyLimit: number = 100;
  private debugMode: boolean = false;
  
  /**
   * Create a new EventBus instance
   * 
   * @param options Configuration options
   */
  constructor(options: { 
    historyLimit?: number; 
    debugMode?: boolean;
  } = {}) {
    const { historyLimit = 100, debugMode = false } = options;
    
    this.historyLimit = historyLimit;
    this.debugMode = debugMode;
  }
  
  /**
   * Subscribe to an event
   * 
   * @param eventType The type of event to subscribe to
   * @param callback The callback to execute when the event occurs
   * @param options Subscription options
   * @returns Subscription ID
   */
  subscribe(
    eventType: string,
    callback: (event: any) => void,
    options: EventSubscriptionOptions = {}
  ): string {
    const subscriptionId = uuidv4();
    
    // Get existing subscriptions for this event type
    const eventSubscriptions = this.subscriptions.get(eventType) || [];
    
    // Create the subscription
    const subscription: Subscription = {
      id: subscriptionId,
      eventType,
      callback,
      options
    };
    
    // Add the subscription
    this.subscriptions.set(eventType, [...eventSubscriptions, subscription]);
    
    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to ${eventType} with ID ${subscriptionId}`);
    }
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from an event
   * 
   * @param subscriptionId The ID of the subscription to remove
   * @returns Whether the subscription was removed
   */
  unsubscribe(subscriptionId: string): boolean {
    let removed = false;
    
    // Iterate through all event types
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      // Find the subscription by ID
      const updatedSubscriptions = subscriptions.filter(sub => {
        if (sub.id === subscriptionId) {
          removed = true;
          return false;
        }
        return true;
      });
      
      // Update the subscriptions
      if (updatedSubscriptions.length !== subscriptions.length) {
        this.subscriptions.set(eventType, updatedSubscriptions);
        
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed from ${eventType} with ID ${subscriptionId}`);
        }
        
        break;
      }
    }
    
    return removed;
  }
  
  /**
   * Publish an event
   * 
   * @param eventType The type of event to publish
   * @param data The event data
   * @param source The source of the event
   * @param priority The priority of the event
   * @returns The published event
   */
  publish<T = any>(
    eventType: string,
    data?: T,
    source: string = 'system',
    priority: EventPriority = EventPriority.NORMAL
  ): ComponentEvent {
    // Create the event
    const event: ComponentEvent = {
      id: uuidv4(),
      type: eventType,
      source,
      timestamp: Date.now(),
      priority,
      data
    };
    
    // Add to history
    this.addToHistory(eventType, event);
    
    // Get subscriptions for this event type
    const eventSubscriptions = this.subscriptions.get(eventType) || [];
    
    if (this.debugMode) {
      console.log(`[EventBus] Publishing ${eventType} to ${eventSubscriptions.length} subscribers`, { event });
    }
    
    // Notify subscribers
    for (const subscription of eventSubscriptions) {
      // Check if the subscriber should receive this event
      if (this.shouldReceiveEvent(subscription, event)) {
        try {
          // Execute the callback
          subscription.callback(event);
          
          // Remove if once option is set
          if (subscription.options.once) {
            this.unsubscribe(subscription.id);
          }
        } catch (error) {
          console.error(`[EventBus] Error in subscriber callback for ${eventType}:`, error);
        }
      }
    }
    
    return event;
  }
  
  /**
   * Check if a subscriber should receive an event
   * 
   * @param subscription The subscription
   * @param event The event
   * @returns Whether the subscriber should receive the event
   */
  private shouldReceiveEvent(subscription: Subscription, event: ComponentEvent): boolean {
    const { options } = subscription;
    
    // Check source whitelist
    if (options.sourcesWhitelist && options.sourcesWhitelist.length > 0) {
      if (!options.sourcesWhitelist.includes(event.source)) {
        return false;
      }
    }
    
    // Check source blacklist
    if (options.sourcesBlacklist && options.sourcesBlacklist.includes(event.source)) {
      return false;
    }
    
    // Check priority
    if (options.minPriority !== undefined && event.priority < options.minPriority) {
      return false;
    }
    
    // Check custom filter
    if (options.filter && !options.filter(event)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Add an event to the history
   * 
   * @param eventType The type of event
   * @param event The event
   */
  private addToHistory(eventType: string, event: ComponentEvent): void {
    // Get existing history for this event type
    const eventHistory = this.eventHistory.get(eventType) || [];
    
    // Add the event
    eventHistory.push(event);
    
    // Limit the history
    if (eventHistory.length > this.historyLimit) {
      eventHistory.shift();
    }
    
    // Update the history
    this.eventHistory.set(eventType, eventHistory);
  }
  
  /**
   * Get the history for an event type
   * 
   * @param eventType The type of event
   * @param limit Maximum number of events to return
   * @returns Event history
   */
  getHistory(eventType: string, limit?: number): ComponentEvent[] {
    const eventHistory = this.eventHistory.get(eventType) || [];
    
    // Apply limit if specified
    if (limit !== undefined && limit > 0) {
      return eventHistory.slice(-limit);
    }
    
    return [...eventHistory];
  }
  
  /**
   * Clear the history for an event type
   * 
   * @param eventType The type of event to clear
   */
  clearHistory(eventType?: string): void {
    if (eventType) {
      this.eventHistory.delete(eventType);
    } else {
      this.eventHistory.clear();
    }
  }
  
  /**
   * Set the debug mode
   * 
   * @param enabled Whether debug mode is enabled
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Get the number of subscribers for an event type
   * 
   * @param eventType The type of event
   * @returns Number of subscribers
   */
  getSubscriberCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }
  
  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
    
    if (this.debugMode) {
      console.log('[EventBus] All subscriptions cleared');
    }
  }
}

// Create a singleton instance
export const eventBus = new EventBus({
  debugMode: process.env.NODE_ENV === 'development'
});