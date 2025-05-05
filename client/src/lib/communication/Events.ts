/**
 * Typed events for the NEXUS.email application
 * 
 * This file defines all the application-specific events and their types.
 */

import { BaseEvent, createEvent, createTypedSubscribe } from './EventBus';

/**
 * Email-related events
 */
export enum EmailEventType {
  EMAIL_SELECTED = 'email:selected',
  EMAIL_OPENED = 'email:opened',
  EMAIL_CLOSED = 'email:closed',
  EMAIL_SENT = 'email:sent',
  EMAIL_DELETED = 'email:deleted',
  EMAIL_ARCHIVED = 'email:archived',
  EMAIL_MARKED_READ = 'email:marked_read',
  EMAIL_MARKED_UNREAD = 'email:marked_unread',
  EMAIL_FLAGGED = 'email:flagged',
  EMAIL_UNFLAGGED = 'email:unflagged',
  EMAIL_MOVED = 'email:moved',
  EMAIL_TAGGED = 'email:tagged',
  EMAIL_UNTAGGED = 'email:untagged',
  EMAIL_REPLIED = 'email:replied',
  EMAIL_FORWARDED = 'email:forwarded',
  EMAILS_LOADED = 'emails:loaded'
}

/**
 * Base Email Event interface
 */
export interface EmailEvent extends BaseEvent {
  emailId?: number | string;
  accountId?: number | string;
  folderId?: number | string;
  subject?: string;
  emailData?: any;
}

/**
 * Selected Email Event
 */
export interface EmailSelectedEvent extends EmailEvent {
  type: EmailEventType.EMAIL_SELECTED;
  emailId: number | string;
  accountId: number | string;
  preview?: boolean;
  fromSearch?: boolean;
}

/**
 * Email Opened Event
 */
export interface EmailOpenedEvent extends EmailEvent {
  type: EmailEventType.EMAIL_OPENED;
  emailId: number | string;
  accountId: number | string;
  tabId?: string;
  panelId?: string;
}

/**
 * Email Sent Event
 */
export interface EmailSentEvent extends EmailEvent {
  type: EmailEventType.EMAIL_SENT;
  emailId: number | string;
  accountId: number | string;
  recipients: string[];
  subject: string;
  hasAttachments: boolean;
}

/**
 * Calendar-related events
 */
export enum CalendarEventType {
  EVENT_SELECTED = 'calendar:event_selected',
  EVENT_CREATED = 'calendar:event_created',
  EVENT_UPDATED = 'calendar:event_updated',
  EVENT_DELETED = 'calendar:event_deleted',
  DATE_SELECTED = 'calendar:date_selected',
  VIEW_CHANGED = 'calendar:view_changed'
}

/**
 * Base Calendar Event interface
 */
export interface CalendarEvent extends BaseEvent {
  eventId?: number | string;
  calendarId?: number | string;
  title?: string;
  eventData?: any;
  date?: string | Date;
}

/**
 * Contact-related events
 */
export enum ContactEventType {
  CONTACT_SELECTED = 'contact:selected',
  CONTACT_CREATED = 'contact:created',
  CONTACT_UPDATED = 'contact:updated',
  CONTACT_DELETED = 'contact:deleted'
}

/**
 * Base Contact Event interface
 */
export interface ContactEvent extends BaseEvent {
  contactId?: number | string;
  name?: string;
  email?: string;
  contactData?: any;
}

/**
 * Panel and tab-related events
 */
export enum UIEventType {
  TAB_CREATED = 'ui:tab_created',
  TAB_CLOSED = 'ui:tab_closed',
  TAB_ACTIVATED = 'ui:tab_activated',
  TAB_MOVED = 'ui:tab_moved',
  PANEL_CREATED = 'ui:panel_created',
  PANEL_CLOSED = 'ui:panel_closed',
  PANEL_SPLIT = 'ui:panel_split',
  PANEL_RESIZED = 'ui:panel_resized',
  LAYOUT_CHANGED = 'ui:layout_changed',
  LAYOUT_SAVED = 'ui:layout_saved',
  LAYOUT_LOADED = 'ui:layout_loaded',
  COMPONENT_ADDED = 'ui:component_added',
  COMPONENT_REMOVED = 'ui:component_removed',
  THEME_CHANGED = 'ui:theme_changed',
  SIDEBAR_TOGGLED = 'ui:sidebar_toggled'
}

/**
 * Base UI Event interface
 */
export interface UIEvent extends BaseEvent {
  tabId?: string;
  panelId?: string;
  componentId?: string;
  layoutId?: string;
}

/**
 * Tab Created Event
 */
export interface TabCreatedEvent extends UIEvent {
  type: UIEventType.TAB_CREATED;
  tabId: string;
  panelId: string;
  title: string;
  componentId?: string;
  componentProps?: any;
}

/**
 * Tab Activated Event
 */
export interface TabActivatedEvent extends UIEvent {
  type: UIEventType.TAB_ACTIVATED;
  tabId: string;
  panelId: string;
  previousTabId?: string;
}

/**
 * Layout Changed Event
 */
export interface LayoutChangedEvent extends UIEvent {
  type: UIEventType.LAYOUT_CHANGED;
  layoutId?: string;
  layoutName?: string;
  isCustom?: boolean;
  isSaved?: boolean;
}

/**
 * Search-related events
 */
export enum SearchEventType {
  SEARCH_PERFORMED = 'search:performed',
  SEARCH_RESULTS_UPDATED = 'search:results_updated',
  SEARCH_CLEARED = 'search:cleared',
  SEARCH_SAVED = 'search:saved',
  FILTER_CHANGED = 'search:filter_changed'
}

/**
 * Base Search Event interface
 */
export interface SearchEvent extends BaseEvent {
  query?: string;
  filters?: any;
  context?: string;
  results?: any[];
  resultsCount?: number;
}

/**
 * Command-related events
 */
export enum CommandEventType {
  COMMAND_EXECUTED = 'command:executed',
  COMMAND_REGISTERED = 'command:registered',
  COMMAND_UNREGISTERED = 'command:unregistered',
  SHORTCUT_TRIGGERED = 'command:shortcut_triggered'
}

/**
 * Base Command Event interface
 */
export interface CommandEvent extends BaseEvent {
  commandId?: string;
  parameters?: any;
  source?: string;
  shortcut?: string;
  success?: boolean;
}

/**
 * Command Executed Event
 */
export interface CommandExecutedEvent extends CommandEvent {
  type: CommandEventType.COMMAND_EXECUTED;
  commandId: string;
  parameters?: any;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Drag and drop events
 */
export enum DragDropEventType {
  DRAG_STARTED = 'dragdrop:started',
  DRAG_ENDED = 'dragdrop:ended',
  DROP_RECEIVED = 'dragdrop:dropped',
  DROP_REJECTED = 'dragdrop:rejected'
}

/**
 * Base Drag and Drop Event interface
 */
export interface DragDropEvent extends BaseEvent {
  itemType?: string;
  itemId?: string | number;
  sourceId?: string;
  targetId?: string;
  data?: any;
  position?: { x: number, y: number };
}

/**
 * Context-related events
 */
export enum ContextEventType {
  CONTEXT_CHANGED = 'context:changed',
  CONTEXT_SHARED = 'context:shared',
  CONTEXT_CLEARED = 'context:cleared'
}

/**
 * Base Context Event interface
 */
export interface ContextEvent extends BaseEvent {
  contextType?: string;
  contextId?: string | number;
  payload?: any;
  sourceComponentId?: string;
  targetComponentId?: string;
}

/**
 * Application-level events
 */
export enum AppEventType {
  APP_INITIALIZED = 'app:initialized',
  APP_ERROR = 'app:error',
  USER_LOGGED_IN = 'app:user_logged_in',
  USER_LOGGED_OUT = 'app:user_logged_out',
  SETTINGS_CHANGED = 'app:settings_changed',
  SYNC_STARTED = 'app:sync_started',
  SYNC_COMPLETED = 'app:sync_completed',
  SYNC_FAILED = 'app:sync_failed',
  NETWORK_STATUS_CHANGED = 'app:network_status_changed'
}

/**
 * Base App Event interface
 */
export interface AppEvent extends BaseEvent {
  details?: any;
  timestamp: number;
}

/**
 * Subscribe helpers for typed events
 */
export const subscribeToEmailEvent = createTypedSubscribe<EmailEvent>(EmailEventType.EMAIL_SELECTED);
export const subscribeToEmailSelected = createTypedSubscribe<EmailSelectedEvent>(EmailEventType.EMAIL_SELECTED);
export const subscribeToEmailOpened = createTypedSubscribe<EmailOpenedEvent>(EmailEventType.EMAIL_OPENED);
export const subscribeToEmailSent = createTypedSubscribe<EmailSentEvent>(EmailEventType.EMAIL_SENT);

export const subscribeToCalendarEvent = createTypedSubscribe<CalendarEvent>(CalendarEventType.EVENT_SELECTED);
export const subscribeToContactEvent = createTypedSubscribe<ContactEvent>(ContactEventType.CONTACT_SELECTED);

export const subscribeToTabCreated = createTypedSubscribe<TabCreatedEvent>(UIEventType.TAB_CREATED);
export const subscribeToTabActivated = createTypedSubscribe<TabActivatedEvent>(UIEventType.TAB_ACTIVATED);
export const subscribeToLayoutChanged = createTypedSubscribe<LayoutChangedEvent>(UIEventType.LAYOUT_CHANGED);

export const subscribeToCommandExecuted = createTypedSubscribe<CommandExecutedEvent>(CommandEventType.COMMAND_EXECUTED);

/**
 * Event creation helpers
 */
// Email events
export const createEmailSelectedEvent = (
  emailId: number | string, 
  accountId: number | string, 
  preview = false,
  fromSearch = false
): EmailSelectedEvent => createEvent<EmailSelectedEvent>(
  EmailEventType.EMAIL_SELECTED, 
  { emailId, accountId, preview, fromSearch }
);

export const createEmailOpenedEvent = (
  emailId: number | string, 
  accountId: number | string,
  tabId?: string,
  panelId?: string
): EmailOpenedEvent => createEvent<EmailOpenedEvent>(
  EmailEventType.EMAIL_OPENED, 
  { emailId, accountId, tabId, panelId }
);

export const createEmailSentEvent = (
  emailId: number | string, 
  accountId: number | string,
  recipients: string[],
  subject: string,
  hasAttachments: boolean
): EmailSentEvent => createEvent<EmailSentEvent>(
  EmailEventType.EMAIL_SENT, 
  { emailId, accountId, recipients, subject, hasAttachments }
);

// UI events
export const createTabCreatedEvent = (
  tabId: string,
  panelId: string,
  title: string,
  componentId?: string,
  componentProps?: any
): TabCreatedEvent => createEvent<TabCreatedEvent>(
  UIEventType.TAB_CREATED,
  { tabId, panelId, title, componentId, componentProps }
);

export const createTabActivatedEvent = (
  tabId: string,
  panelId: string,
  previousTabId?: string
): TabActivatedEvent => createEvent<TabActivatedEvent>(
  UIEventType.TAB_ACTIVATED,
  { tabId, panelId, previousTabId }
);

export const createLayoutChangedEvent = (
  layoutId?: string,
  layoutName?: string,
  isCustom?: boolean,
  isSaved?: boolean
): LayoutChangedEvent => createEvent<LayoutChangedEvent>(
  UIEventType.LAYOUT_CHANGED,
  { layoutId, layoutName, isCustom, isSaved }
);

// Command events
export const createCommandExecutedEvent = (
  commandId: string,
  parameters?: any,
  success: boolean = true,
  result?: any,
  error?: string
): CommandExecutedEvent => createEvent<CommandExecutedEvent>(
  CommandEventType.COMMAND_EXECUTED,
  { commandId, parameters, success, result, error }
);

/**
 * Export all event types together
 */
export const EventTypes = {
  ...EmailEventType,
  ...CalendarEventType,
  ...ContactEventType,
  ...UIEventType,
  ...SearchEventType,
  ...CommandEventType,
  ...DragDropEventType,
  ...ContextEventType,
  ...AppEventType
};