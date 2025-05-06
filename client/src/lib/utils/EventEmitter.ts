/**
 * A simple event emitter that supports typed events
 */
export class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param callback The callback to call when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  on<T>(eventName: string, callback: (data: T) => void): () => void {
    // Get or create the set of callbacks for this event
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    // Add the callback to the set
    this.events.get(eventName)!.add(callback);

    // Return a function to unsubscribe
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param callback The callback to unsubscribe
   */
  off(eventName: string, callback: Function): void {
    if (!this.events.has(eventName)) {
      return;
    }

    this.events.get(eventName)!.delete(callback);

    // Clean up if there are no more callbacks
    if (this.events.get(eventName)!.size === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event
   * @param eventName The name of the event to emit
   * @param data The data to pass to the callbacks
   */
  emit<T>(eventName: string, data: T): void {
    if (!this.events.has(eventName)) {
      return;
    }

    // Call all callbacks for this event with the provided data
    const callbacks = Array.from(this.events.get(eventName)!);
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    }
  }

  /**
   * Remove all subscriptions for an event
   * @param eventName The name of the event to clear
   */
  clearEvent(eventName: string): void {
    this.events.delete(eventName);
  }

  /**
   * Remove all subscriptions
   */
  clearAll(): void {
    this.events.clear();
  }

  /**
   * Get the number of subscribers for an event
   * @param eventName The name of the event
   * @returns The number of subscribers
   */
  subscriberCount(eventName: string): number {
    if (!this.events.has(eventName)) {
      return 0;
    }

    return this.events.get(eventName)!.size;
  }

  /**
   * List all event names that have subscribers
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}