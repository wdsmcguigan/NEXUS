/**
 * Component Communication Service for NEXUS.email
 * 
 * Provides direct communication between components, tab instances,
 * and supports request/response patterns.
 */

import { nanoid } from 'nanoid';
import { eventBus, BaseEvent } from './EventBus';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Component types that can be registered
 */
export enum ComponentType {
  EMAIL_LIST = 'email-list',
  EMAIL_VIEWER = 'email-viewer',
  EMAIL_COMPOSER = 'email-composer',
  CALENDAR = 'calendar',
  CONTACT_LIST = 'contact-list',
  CONTACT_VIEWER = 'contact-viewer',
  FILE_EXPLORER = 'file-explorer',
  SEARCH = 'search',
  SETTINGS = 'settings',
  TAG_MANAGER = 'tag-manager',
  TASK_LIST = 'task-list',
  NOTE_EDITOR = 'note-editor',
  DASHBOARD = 'dashboard',
  ANALYTICS = 'analytics',
  CHAT = 'chat',
  CUSTOM = 'custom'
}

/**
 * Interface for component metadata
 */
export interface ComponentMetadata {
  id: string;
  type: ComponentType | string;
  tabId?: string;
  panelId?: string;
  title?: string;
  supportsRequests?: string[];
  api?: Record<string, Function>;
  state?: ComponentState;
  createdAt: number;
  lastActive?: number;
}

/**
 * Interface for component state
 */
export interface ComponentState {
  [key: string]: any;
}

/**
 * Message types for component communication
 */
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error'
}

/**
 * Base message interface
 */
export interface ComponentMessage {
  id: string;
  type: MessageType;
  action: string;
  sourceId: string;
  targetId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Request message with expected response
 */
export interface RequestMessage extends ComponentMessage {
  type: MessageType.REQUEST;
  responseTimeout?: number;
}

/**
 * Response message
 */
export interface ResponseMessage extends ComponentMessage {
  type: MessageType.RESPONSE;
  requestId: string;
  success: boolean;
  error?: string;
}

/**
 * Error message
 */
export interface ErrorMessage extends ComponentMessage {
  type: MessageType.ERROR;
  errorCode?: string;
  errorMessage: string;
}

/**
 * Notification message with no expected response
 */
export interface NotificationMessage extends ComponentMessage {
  type: MessageType.NOTIFICATION;
}

/**
 * Request handler function
 */
export type RequestHandler = (
  request: RequestMessage, 
  source: ComponentMetadata
) => Promise<any> | any;

/**
 * Interface for requests waiting for responses
 */
interface PendingRequest {
  message: RequestMessage;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: any;
}

/**
 * Component communication event types
 */
enum ComponentEventType {
  COMPONENT_REGISTERED = 'component:registered',
  COMPONENT_UNREGISTERED = 'component:unregistered',
  COMPONENT_MESSAGE = 'component:message'
}

/**
 * Component Communication Service
 */
export class ComponentCommunicationService {
  private static instance: ComponentCommunicationService;
  private components: Map<string, ComponentMetadata> = new Map();
  private requestHandlers: Map<string, Map<string, RequestHandler>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Get singleton instance
   */
  static getInstance(): ComponentCommunicationService {
    if (!ComponentCommunicationService.instance) {
      ComponentCommunicationService.instance = new ComponentCommunicationService();
    }
    return ComponentCommunicationService.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Subscribe to component message events
    eventBus.subscribe(ComponentEventType.COMPONENT_MESSAGE, this.handleComponentMessage.bind(this));
    debugLog('ComponentCommunication', 'ComponentCommunicationService initialized');
  }

  /**
   * Register a component
   */
  registerComponent(metadata: Omit<ComponentMetadata, 'id' | 'createdAt'>): string {
    const id = nanoid();
    const componentMetadata: ComponentMetadata = {
      ...metadata,
      id,
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    this.components.set(id, componentMetadata);
    
    // Initialize request handlers for this component
    this.requestHandlers.set(id, new Map());
    
    // Publish registration event
    eventBus.publish(ComponentEventType.COMPONENT_REGISTERED, { 
      componentId: id, 
      componentType: metadata.type
    });
    
    debugLog('ComponentCommunication', `Component registered: ${id} (${metadata.type})`);
    
    return id;
  }

  /**
   * Unregister a component
   */
  unregisterComponent(componentId: string): boolean {
    const component = this.components.get(componentId);
    if (!component) {
      return false;
    }
    
    // Remove component metadata
    this.components.delete(componentId);
    
    // Remove request handlers
    this.requestHandlers.delete(componentId);
    
    // Reject any pending requests for this component
    for (const [requestId, pendingRequest] of this.pendingRequests.entries()) {
      if (pendingRequest.message.sourceId === componentId || 
          pendingRequest.message.targetId === componentId) {
        pendingRequest.reject(new Error(`Component ${componentId} was unregistered`));
        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(requestId);
      }
    }
    
    // Publish unregistration event
    eventBus.publish(ComponentEventType.COMPONENT_UNREGISTERED, { 
      componentId,
      componentType: component.type
    });
    
    debugLog('ComponentCommunication', `Component unregistered: ${componentId}`);
    
    return true;
  }

  /**
   * Register a request handler for a component
   */
  registerRequestHandler(
    componentId: string,
    action: string,
    handler: RequestHandler
  ): boolean {
    if (!this.components.has(componentId)) {
      errorLog('ComponentCommunication', `Cannot register handler: Component ${componentId} not found`);
      return false;
    }
    
    const handlers = this.requestHandlers.get(componentId);
    if (!handlers) {
      errorLog('ComponentCommunication', `Cannot register handler: Handlers map not found for ${componentId}`);
      return false;
    }
    
    handlers.set(action, handler);
    
    // Update supported requests in component metadata
    const metadata = this.components.get(componentId)!;
    metadata.supportsRequests = metadata.supportsRequests || [];
    if (!metadata.supportsRequests.includes(action)) {
      metadata.supportsRequests.push(action);
    }
    
    debugLog('ComponentCommunication', `Handler registered for ${componentId}: ${action}`);
    return true;
  }

  /**
   * Unregister a request handler
   */
  unregisterRequestHandler(componentId: string, action: string): boolean {
    const handlers = this.requestHandlers.get(componentId);
    if (!handlers) {
      return false;
    }
    
    const result = handlers.delete(action);
    
    // Update supported requests in component metadata
    if (result) {
      const metadata = this.components.get(componentId);
      if (metadata && metadata.supportsRequests) {
        metadata.supportsRequests = metadata.supportsRequests.filter(a => a !== action);
      }
    }
    
    return result;
  }

  /**
   * Send a request to a component and wait for a response
   */
  async sendRequest(
    sourceId: string, 
    targetId: string, 
    action: string, 
    data?: any, 
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<any> {
    // Verify both components exist
    if (!this.components.has(sourceId)) {
      throw new Error(`Source component ${sourceId} not found`);
    }
    
    if (!this.components.has(targetId)) {
      throw new Error(`Target component ${targetId} not found`);
    }
    
    // Update last active timestamp for the source component
    const sourceComponent = this.components.get(sourceId)!;
    sourceComponent.lastActive = Date.now();
    
    // Create the request message
    const requestId = nanoid();
    const message: RequestMessage = {
      id: requestId,
      type: MessageType.REQUEST,
      action,
      sourceId,
      targetId,
      data,
      timestamp: Date.now(),
      responseTimeout: timeout
    };
    
    // Create a promise that will be resolved when the response is received
    return new Promise((resolve, reject) => {
      // Set a timeout to reject the promise if no response is received
      const timeoutId = setTimeout(() => {
        // Clean up the pending request
        this.pendingRequests.delete(requestId);
        
        // Create and send an error response
        const errorMessage: ErrorMessage = {
          id: nanoid(),
          type: MessageType.ERROR,
          action,
          sourceId: targetId,
          targetId: sourceId,
          timestamp: Date.now(),
          errorCode: 'TIMEOUT',
          errorMessage: `Request ${action} timed out after ${timeout}ms`
        };
        
        this.publishMessage(errorMessage);
        
        // Reject the promise
        reject(new Error(`Request ${action} to ${targetId} timed out after ${timeout}ms`));
      }, timeout);
      
      // Store the pending request
      this.pendingRequests.set(requestId, {
        message,
        resolve,
        reject,
        timeout: timeoutId
      });
      
      // Publish the request message via the event bus
      this.publishMessage(message);
      
      debugLog('ComponentCommunication', `Request sent ${requestId}: ${sourceId} -> ${targetId} (${action})`);
    });
  }

  /**
   * Send a notification to a component (no response expected)
   */
  sendNotification(
    sourceId: string,
    targetId: string | undefined,
    action: string,
    data?: any
  ): void {
    // Verify source component exists
    if (!this.components.has(sourceId)) {
      errorLog('ComponentCommunication', `Source component ${sourceId} not found`);
      return;
    }
    
    // If target is specified, verify it exists
    if (targetId && !this.components.has(targetId)) {
      errorLog('ComponentCommunication', `Target component ${targetId} not found`);
      return;
    }
    
    // Update last active timestamp for the source component
    const sourceComponent = this.components.get(sourceId)!;
    sourceComponent.lastActive = Date.now();
    
    // Create and publish the notification message
    const message: NotificationMessage = {
      id: nanoid(),
      type: MessageType.NOTIFICATION,
      action,
      sourceId,
      targetId,
      data,
      timestamp: Date.now()
    };
    
    this.publishMessage(message);
    
    debugLog('ComponentCommunication', `Notification sent: ${sourceId} -> ${targetId || 'broadcast'} (${action})`);
  }

  /**
   * Broadcast a notification to all components or components of a specific type
   */
  broadcastNotification(
    sourceId: string,
    action: string,
    data?: any,
    targetType?: ComponentType | string
  ): void {
    // Verify source component exists
    if (!this.components.has(sourceId)) {
      errorLog('ComponentCommunication', `Source component ${sourceId} not found`);
      return;
    }
    
    // Update last active timestamp for the source component
    const sourceComponent = this.components.get(sourceId)!;
    sourceComponent.lastActive = Date.now();
    
    // Create the notification message (without specific target)
    const message: NotificationMessage = {
      id: nanoid(),
      type: MessageType.NOTIFICATION,
      action,
      sourceId,
      data,
      timestamp: Date.now()
    };
    
    // Add metadata about the broadcast
    message.data = {
      ...(message.data || {}),
      _broadcast: true,
      _targetType: targetType
    };
    
    this.publishMessage(message);
    
    debugLog('ComponentCommunication', `Broadcast sent: ${sourceId} -> ${targetType || 'all'} (${action})`);
  }

  /**
   * Send a response to a request
   */
  sendResponse(
    requestMessage: RequestMessage,
    data: any,
    success: boolean = true,
    error?: string
  ): void {
    // Create the response message
    const responseMessage: ResponseMessage = {
      id: nanoid(),
      type: MessageType.RESPONSE,
      action: requestMessage.action,
      sourceId: requestMessage.targetId!,
      targetId: requestMessage.sourceId,
      requestId: requestMessage.id,
      data,
      success,
      error,
      timestamp: Date.now()
    };
    
    // Publish the response message
    this.publishMessage(responseMessage);
    
    debugLog('ComponentCommunication', `Response sent for ${requestMessage.id}: ${success ? 'success' : 'failure'}`);
  }

  /**
   * Find a component by ID
   */
  getComponent(componentId: string): ComponentMetadata | undefined {
    return this.components.get(componentId);
  }

  /**
   * Find a component by tab ID
   */
  getComponentByTabId(tabId: string): ComponentMetadata | undefined {
    for (const component of this.components.values()) {
      if (component.tabId === tabId) {
        return component;
      }
    }
    return undefined;
  }

  /**
   * Find components by type
   */
  getComponentsByType(type: ComponentType | string): ComponentMetadata[] {
    const result: ComponentMetadata[] = [];
    for (const component of this.components.values()) {
      if (component.type === type) {
        result.push(component);
      }
    }
    return result;
  }

  /**
   * Find components by panel ID
   */
  getComponentsByPanelId(panelId: string): ComponentMetadata[] {
    const result: ComponentMetadata[] = [];
    for (const component of this.components.values()) {
      if (component.panelId === panelId) {
        result.push(component);
      }
    }
    return result;
  }

  /**
   * Find components that support a specific request action
   */
  getComponentsSupportingRequest(action: string): ComponentMetadata[] {
    const result: ComponentMetadata[] = [];
    for (const component of this.components.values()) {
      if (component.supportsRequests && component.supportsRequests.includes(action)) {
        result.push(component);
      }
    }
    return result;
  }

  /**
   * Update component metadata
   */
  updateComponentMetadata(
    componentId: string, 
    updates: Partial<Omit<ComponentMetadata, 'id' | 'createdAt'>>
  ): boolean {
    const component = this.components.get(componentId);
    if (!component) {
      return false;
    }
    
    // Update the component metadata
    Object.assign(component, updates);
    
    return true;
  }

  /**
   * Handle a message received via the event bus
   */
  private async handleComponentMessage(event: BaseEvent & { message: ComponentMessage }): Promise<void> {
    const message = event.message;
    
    if (!message) {
      return;
    }
    
    // Handle different message types
    switch (message.type) {
      case MessageType.REQUEST:
        await this.handleRequestMessage(message as RequestMessage);
        break;
        
      case MessageType.RESPONSE:
        this.handleResponseMessage(message as ResponseMessage);
        break;
        
      case MessageType.NOTIFICATION:
        this.handleNotificationMessage(message as NotificationMessage);
        break;
        
      case MessageType.ERROR:
        this.handleErrorMessage(message as ErrorMessage);
        break;
    }
  }

  /**
   * Handle a request message
   */
  private async handleRequestMessage(message: RequestMessage): Promise<void> {
    // If no target ID is specified, find a component that supports this action
    if (!message.targetId) {
      const supportingComponents = this.getComponentsSupportingRequest(message.action);
      if (supportingComponents.length > 0) {
        // Use the first supporting component
        message.targetId = supportingComponents[0].id;
      } else {
        // No components support this action
        this.sendErrorResponse(
          message,
          'NO_HANDLER',
          `No components found that support the action: ${message.action}`
        );
        return;
      }
    }
    
    const targetComponent = this.components.get(message.targetId);
    if (!targetComponent) {
      this.sendErrorResponse(
        message,
        'COMPONENT_NOT_FOUND',
        `Target component not found: ${message.targetId}`
      );
      return;
    }
    
    // Update last active timestamp for the target component
    targetComponent.lastActive = Date.now();
    
    // Get the request handler for this action
    const handlers = this.requestHandlers.get(message.targetId);
    if (!handlers) {
      this.sendErrorResponse(
        message,
        'NO_HANDLERS',
        `No handlers registered for component: ${message.targetId}`
      );
      return;
    }
    
    const handler = handlers.get(message.action);
    if (!handler) {
      this.sendErrorResponse(
        message,
        'HANDLER_NOT_FOUND',
        `No handler found for action: ${message.action}`
      );
      return;
    }
    
    // Find the source component
    const sourceComponent = this.components.get(message.sourceId);
    if (!sourceComponent) {
      this.sendErrorResponse(
        message,
        'SOURCE_NOT_FOUND',
        `Source component not found: ${message.sourceId}`
      );
      return;
    }
    
    try {
      // Execute the handler
      const result = await handler(message, sourceComponent);
      
      // Send the response
      this.sendResponse(message, result);
    } catch (error) {
      // Send error response
      this.sendErrorResponse(
        message,
        'HANDLER_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Handle a response message
   */
  private handleResponseMessage(message: ResponseMessage): void {
    // Find the pending request
    const pendingRequest = this.pendingRequests.get(message.requestId);
    if (!pendingRequest) {
      // No pending request found, the response might be late or for a canceled request
      debugLog('ComponentCommunication', `Received response for unknown request: ${message.requestId}`);
      return;
    }
    
    // Clear the timeout
    clearTimeout(pendingRequest.timeout);
    
    // Remove the pending request
    this.pendingRequests.delete(message.requestId);
    
    // Resolve or reject the promise
    if (message.success) {
      pendingRequest.resolve(message.data);
    } else {
      pendingRequest.reject(new Error(message.error || 'Unknown error'));
    }
    
    debugLog('ComponentCommunication', `Response handled for ${message.requestId}`);
  }

  /**
   * Handle a notification message
   */
  private handleNotificationMessage(message: NotificationMessage): void {
    // Check if this is a broadcast
    const isBroadcast = message.data && message.data._broadcast;
    const targetType = isBroadcast ? message.data._targetType : undefined;
    
    // If this is a broadcast, notify all relevant components
    if (isBroadcast) {
      let targets = Array.from(this.components.values());
      
      // Filter by component type if specified
      if (targetType) {
        targets = targets.filter(component => component.type === targetType);
      }
      
      // Don't send to the source component
      targets = targets.filter(component => component.id !== message.sourceId);
      
      // Send individual notifications
      for (const target of targets) {
        // Create a copy of the message with specific target
        const targetedMessage: NotificationMessage = {
          ...message,
          targetId: target.id,
          id: nanoid() // New ID for each targeted message
        };
        
        // Remove broadcast metadata to avoid confusion
        if (targetedMessage.data) {
          const { _broadcast, _targetType, ...rest } = targetedMessage.data;
          targetedMessage.data = rest;
        }
        
        this.publishMessage(targetedMessage);
      }
    } else if (message.targetId) {
      // This is a targeted notification, make sure the target exists
      const targetComponent = this.components.get(message.targetId);
      if (!targetComponent) {
        debugLog('ComponentCommunication', `Target component not found for notification: ${message.targetId}`);
        return;
      }
      
      // Update last active timestamp for the target component
      targetComponent.lastActive = Date.now();
    }
  }

  /**
   * Handle an error message
   */
  private handleErrorMessage(message: ErrorMessage): void {
    // If there's a target, make sure it exists
    if (message.targetId) {
      const targetComponent = this.components.get(message.targetId);
      if (!targetComponent) {
        return;
      }
      
      // Update last active timestamp for the target component
      targetComponent.lastActive = Date.now();
    }
    
    // Log the error
    errorLog(
      'ComponentCommunication', 
      `Error message: ${message.errorMessage} (${message.errorCode || 'NO_CODE'})`,
      message
    );
  }

  /**
   * Send an error response for a request
   */
  private sendErrorResponse(
    requestMessage: RequestMessage,
    errorCode: string,
    errorMessage: string
  ): void {
    // Create the error response
    const responseMessage: ResponseMessage = {
      id: nanoid(),
      type: MessageType.RESPONSE,
      action: requestMessage.action,
      sourceId: requestMessage.targetId || 'system',
      targetId: requestMessage.sourceId,
      requestId: requestMessage.id,
      data: { errorCode, errorMessage },
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    };
    
    // Publish the error response
    this.publishMessage(responseMessage);
    
    // Also create an error message for logging
    const errorLogMessage: ErrorMessage = {
      id: nanoid(),
      type: MessageType.ERROR,
      action: requestMessage.action,
      sourceId: requestMessage.targetId || 'system',
      targetId: requestMessage.sourceId,
      errorCode,
      errorMessage,
      timestamp: Date.now()
    };
    
    // Log the error
    errorLog(
      'ComponentCommunication',
      `Error response: ${errorMessage} (${errorCode})`,
      { request: requestMessage, error: errorLogMessage }
    );
  }

  /**
   * Publish a message via the event bus
   */
  private publishMessage(message: ComponentMessage): void {
    eventBus.publish(ComponentEventType.COMPONENT_MESSAGE, { message });
  }

  /**
   * Get all registered components
   */
  getAllComponents(): ComponentMetadata[] {
    return Array.from(this.components.values());
  }

  /**
   * Get the count of registered components
   */
  getComponentCount(): number {
    return this.components.size;
  }

  /**
   * Get the count of pending requests
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all components and pending requests (for testing or resets)
   */
  clear(): void {
    // Reject all pending requests
    for (const [requestId, pendingRequest] of this.pendingRequests.entries()) {
      pendingRequest.reject(new Error('Component communication service was cleared'));
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(requestId);
    }
    
    // Clear all components and handlers
    this.components.clear();
    this.requestHandlers.clear();
    
    debugLog('ComponentCommunication', 'ComponentCommunicationService cleared');
  }
}

// Export singleton instance
export const componentCommunication = ComponentCommunicationService.getInstance();

export default componentCommunication;