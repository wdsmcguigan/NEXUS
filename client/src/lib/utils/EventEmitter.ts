/**
 * A simple event emitter implementation for TypeScript
 * Used by the PanelDependencyBridge to emit and listen for events
 */

export class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param callback The function to call when the event occurs
   * @returns A function to unsubscribe from the event
   */
  public on<T>(eventName: string, callback: (data: T) => void): () => void {
    // Get or create the event listeners array
    const listeners = this.events.get(eventName) || [];
    
    // Add the callback to the listeners
    listeners.push(callback);
    
    // Store the updated listeners
    this.events.set(eventName, listeners);
    
    // Return an unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param callback The function to remove from the event listeners
   */
  public off(eventName: string, callback: Function): void {
    // Get the event listeners
    const listeners = this.events.get(eventName);
    
    // If there are no listeners, do nothing
    if (!listeners) return;
    
    // Filter out the callback
    const filteredListeners = listeners.filter(listener => listener !== callback);
    
    // Store the updated listeners or remove the event if there are no listeners
    if (filteredListeners.length > 0) {
      this.events.set(eventName, filteredListeners);
    } else {
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event
   * @param eventName The name of the event to emit
   * @param data The data to pass to the listeners
   */
  public emit<T>(eventName: string, data: T): void {
    // Get the event listeners
    const listeners = this.events.get(eventName);
    
    // If there are no listeners, do nothing
    if (!listeners) return;
    
    // Call each listener with the data
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param eventName The name of the event to clear listeners for
   */
  public removeAllListeners(eventName?: string): void {
    if (eventName) {
      // Remove all listeners for the specified event
      this.events.delete(eventName);
    } else {
      // Remove all listeners for all events
      this.events.clear();
    }
  }
}