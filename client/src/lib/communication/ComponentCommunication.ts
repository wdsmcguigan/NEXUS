/**
 * Component Communication Interfaces
 * 
 * This file defines interfaces and types related to component communication
 * in the NEXUS.email application.
 */

// Component Types
export enum ComponentType {
  // Email components
  EMAIL_LIST = 'EMAIL_LIST',
  EMAIL_VIEWER = 'EMAIL_VIEWER',
  EMAIL_COMPOSER = 'EMAIL_COMPOSER',
  
  // Folder components
  FOLDER_TREE = 'FOLDER_TREE',
  FOLDER_MANAGER = 'FOLDER_MANAGER',
  
  // Tag components
  TAG_LIST = 'TAG_LIST',
  TAG_MANAGER = 'TAG_MANAGER',
  
  // Contact components
  CONTACT_LIST = 'CONTACT_LIST',
  CONTACT_VIEWER = 'CONTACT_VIEWER',
  CONTACT_EDITOR = 'CONTACT_EDITOR',
  
  // Calendar components
  CALENDAR = 'CALENDAR',
  EVENT_VIEWER = 'EVENT_VIEWER',
  EVENT_EDITOR = 'EVENT_EDITOR',
  
  // Search components
  SEARCH = 'SEARCH',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  ADVANCED_SEARCH = 'ADVANCED_SEARCH',
  SAVED_SEARCH = 'SAVED_SEARCH',
  
  // Settings components
  SETTINGS = 'SETTINGS',
  ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS',
  DISPLAY_SETTINGS = 'DISPLAY_SETTINGS',
  
  // Template components
  TEMPLATE_LIST = 'TEMPLATE_LIST',
  TEMPLATE_EDITOR = 'TEMPLATE_EDITOR',
  
  // Integration components
  INTEGRATION_MANAGER = 'INTEGRATION_MANAGER',
  SLACK_INTEGRATION = 'SLACK_INTEGRATION',
  ASANA_INTEGRATION = 'ASANA_INTEGRATION',
  
  // Misc components
  TASK_LIST = 'TASK_LIST',
  DASHBOARD = 'DASHBOARD',
  STATISTICS = 'STATISTICS',
  HELP = 'HELP'
}

// Event priority levels
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Base event interface
export interface ComponentEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  priority?: EventPriority;
  data?: any;
}

// Component message interface
export interface ComponentMessage {
  id: string;
  from: string;
  to: string | string[];
  type: string;
  data: any;
  timestamp: number;
  requiresResponse?: boolean;
  responseTimeout?: number;
}

// Component message response
export interface ComponentMessageResponse {
  messageId: string;
  from: string;
  to: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// Event subscription options
export interface EventSubscriptionOptions {
  // Only receive events from specific sources
  sourcesWhitelist?: string[];
  
  // Ignore events from specific sources
  sourcesBlacklist?: string[];
  
  // Filter function to determine if an event should be processed
  filter?: (event: ComponentEvent) => boolean;
  
  // Minimum priority level to receive
  minPriority?: EventPriority;
  
  // Whether to receive events only once (auto-unsubscribe after first event)
  once?: boolean;
}

// Message delivery options
export interface MessageDeliveryOptions {
  // Timeout for message delivery in milliseconds
  timeout?: number;
  
  // Whether to wait for response
  waitForResponse?: boolean;
  
  // Callback for response
  onResponse?: (response: ComponentMessageResponse) => void;
  
  // Callback for timeout
  onTimeout?: () => void;
  
  // Priority of the message
  priority?: EventPriority;
}

// Component context data
export interface ComponentContextData {
  // The key for the context data
  key: string;
  
  // The value of the context data
  value: any;
  
  // The scope of the context data
  scope: 'global' | 'panel' | 'tab' | 'component';
  
  // The ID of the scope (panel ID, tab ID, etc.)
  scopeId?: string;
  
  // Whether the context data can be modified
  readonly?: boolean;
  
  // When the context data was last updated
  updatedAt: number;
  
  // Who updated the context data
  updatedBy?: string;
}

// Component command interface
export interface ComponentCommand {
  id: string;
  name: string;
  description?: string;
  shortcut?: string[];
  icon?: string;
  isEnabled: () => boolean;
  execute: (...args: any[]) => void | Promise<void>;
}