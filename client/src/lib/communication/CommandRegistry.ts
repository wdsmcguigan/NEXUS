/**
 * Command Registry for NEXUS.email
 * 
 * Provides a central registry for application commands, keyboard shortcuts,
 * and allows components to register and handle commands.
 */

import { nanoid } from 'nanoid';
import { eventBus } from './EventBus';
import { CommandEventType, CommandExecutedEvent } from './Events';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Command categories
 */
export enum CommandCategory {
  EMAIL = 'email',
  CALENDAR = 'calendar',
  CONTACTS = 'contacts',
  NAVIGATION = 'navigation',
  EDITING = 'editing',
  VIEW = 'view',
  LAYOUT = 'layout',
  SEARCH = 'search',
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

/**
 * Command context - defines where a command is available
 */
export enum CommandContext {
  GLOBAL = 'global',
  EMAIL_LIST = 'email-list',
  EMAIL_VIEW = 'email-view',
  EMAIL_COMPOSE = 'email-compose',
  CALENDAR = 'calendar',
  CONTACTS = 'contacts',
  SEARCH = 'search',
  EDITOR = 'editor',
  PANEL = 'panel',
  CUSTOM = 'custom'
}

/**
 * Command metadata
 */
export interface CommandDefinition {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  contexts: CommandContext[];
  shortcut?: string | string[];
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  order?: number;
  metadata?: Record<string, any>;
}

/**
 * Command handler function
 */
export type CommandHandler = (
  commandId: string, 
  parameters?: any
) => Promise<any> | any;

/**
 * Keyboard shortcut mapping
 */
export interface ShortcutMapping {
  shortcut: string;
  commandId: string;
  context?: CommandContext;
}

/**
 * Command execution options
 */
export interface ExecuteCommandOptions {
  parameters?: any;
  source?: string;
  context?: CommandContext;
}

/**
 * Command Registry Service
 */
export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, CommandDefinition> = new Map();
  private handlers: Map<string, CommandHandler> = new Map();
  private shortcuts: ShortcutMapping[] = [];
  private shortcutPressedHandlers: Set<(shortcut: string) => void> = new Set();
  private activeContext: CommandContext = CommandContext.GLOBAL;

  /**
   * Get singleton instance
   */
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /**
   * Private constructor for singleton
   */
  private constructor() {
    // Initialize keyboard event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    debugLog('CommandRegistry', 'CommandRegistry initialized');
  }

  /**
   * Register a command
   */
  registerCommand(
    command: Omit<CommandDefinition, 'id'>,
    handler?: CommandHandler
  ): string {
    const commandId = command.title.toLowerCase().replace(/\s+/g, '-');
    
    const commandDefinition: CommandDefinition = {
      ...command,
      id: commandId,
      enabled: command.enabled !== false,
      visible: command.visible !== false
    };
    
    this.commands.set(commandId, commandDefinition);
    
    if (handler) {
      this.handlers.set(commandId, handler);
    }
    
    // Register shortcuts if provided
    if (command.shortcut) {
      const shortcuts = Array.isArray(command.shortcut) 
        ? command.shortcut 
        : [command.shortcut];
      
      for (const shortcut of shortcuts) {
        this.registerShortcut(shortcut, commandId);
      }
    }
    
    debugLog('CommandRegistry', `Command registered: ${commandId}`);
    
    // Publish command registered event
    eventBus.publish(
      CommandEventType.COMMAND_REGISTERED,
      {
        commandId,
        metadata: { command: commandDefinition }
      }
    );
    
    return commandId;
  }

  /**
   * Unregister a command
   */
  unregisterCommand(commandId: string): boolean {
    const command = this.commands.get(commandId);
    if (!command) {
      return false;
    }
    
    // Remove command
    this.commands.delete(commandId);
    
    // Remove handler
    this.handlers.delete(commandId);
    
    // Remove shortcuts
    this.shortcuts = this.shortcuts.filter(s => s.commandId !== commandId);
    
    debugLog('CommandRegistry', `Command unregistered: ${commandId}`);
    
    // Publish command unregistered event
    eventBus.publish(
      CommandEventType.COMMAND_UNREGISTERED,
      {
        commandId,
        metadata: { command }
      }
    );
    
    return true;
  }

  /**
   * Register a command handler
   */
  registerHandler(commandId: string, handler: CommandHandler): boolean {
    if (!this.commands.has(commandId)) {
      errorLog('CommandRegistry', `Cannot register handler: Command ${commandId} not found`);
      return false;
    }
    
    this.handlers.set(commandId, handler);
    
    debugLog('CommandRegistry', `Handler registered for command: ${commandId}`);
    
    return true;
  }

  /**
   * Unregister a command handler
   */
  unregisterHandler(commandId: string): boolean {
    return this.handlers.delete(commandId);
  }

  /**
   * Register a keyboard shortcut for a command
   */
  registerShortcut(shortcut: string, commandId: string, context?: CommandContext): boolean {
    if (!this.commands.has(commandId)) {
      errorLog('CommandRegistry', `Cannot register shortcut: Command ${commandId} not found`);
      return false;
    }
    
    // Normalize shortcut format
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    
    // Check for conflicts
    const existingMapping = this.shortcuts.find(s => 
      s.shortcut === normalizedShortcut && 
      (!s.context || !context || s.context === context)
    );
    
    if (existingMapping) {
      errorLog('CommandRegistry', `Shortcut conflict: ${normalizedShortcut} already mapped to ${existingMapping.commandId}`);
      return false;
    }
    
    // Add the shortcut mapping
    this.shortcuts.push({
      shortcut: normalizedShortcut,
      commandId,
      context
    });
    
    // Update command definition if needed
    const command = this.commands.get(commandId)!;
    if (!command.shortcut) {
      command.shortcut = normalizedShortcut;
    } else if (Array.isArray(command.shortcut)) {
      if (!command.shortcut.includes(normalizedShortcut)) {
        command.shortcut.push(normalizedShortcut);
      }
    } else if (command.shortcut !== normalizedShortcut) {
      command.shortcut = [command.shortcut, normalizedShortcut];
    }
    
    debugLog('CommandRegistry', `Shortcut registered: ${normalizedShortcut} → ${commandId}`);
    
    return true;
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(shortcut: string, context?: CommandContext): boolean {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    
    const initialLength = this.shortcuts.length;
    
    // Remove the shortcut mapping
    this.shortcuts = this.shortcuts.filter(s => 
      s.shortcut !== normalizedShortcut || 
      (context && s.context && s.context !== context)
    );
    
    // Return true if anything was removed
    return this.shortcuts.length < initialLength;
  }

  /**
   * Execute a command
   */
  async executeCommand(
    commandId: string, 
    options: ExecuteCommandOptions = {}
  ): Promise<any> {
    const { parameters, source, context } = options;
    
    const command = this.commands.get(commandId);
    if (!command) {
      const error = `Command not found: ${commandId}`;
      errorLog('CommandRegistry', error);
      
      this.publishCommandExecuted(commandId, false, undefined, error, source);
      
      throw new Error(error);
    }
    
    // Check if command is enabled
    if (!command.enabled) {
      const error = `Command is disabled: ${commandId}`;
      errorLog('CommandRegistry', error);
      
      this.publishCommandExecuted(commandId, false, undefined, error, source);
      
      throw new Error(error);
    }
    
    // Check if command is available in current context
    if (context && !command.contexts.includes(context) && !command.contexts.includes(CommandContext.GLOBAL)) {
      const error = `Command not available in context ${context}: ${commandId}`;
      errorLog('CommandRegistry', error);
      
      this.publishCommandExecuted(commandId, false, undefined, error, source);
      
      throw new Error(error);
    }
    
    // Get handler
    const handler = this.handlers.get(commandId);
    if (!handler) {
      const error = `No handler registered for command: ${commandId}`;
      errorLog('CommandRegistry', error);
      
      this.publishCommandExecuted(commandId, false, undefined, error, source);
      
      throw new Error(error);
    }
    
    try {
      debugLog('CommandRegistry', `Executing command: ${commandId}`);
      
      // Execute handler
      const result = await handler(commandId, parameters);
      
      // Publish command executed event
      this.publishCommandExecuted(commandId, true, result, undefined, source);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errorLog('CommandRegistry', `Error executing command ${commandId}: ${errorMessage}`);
      
      // Publish command executed event with error
      this.publishCommandExecuted(commandId, false, undefined, errorMessage, source);
      
      throw error;
    }
  }

  /**
   * Get a command by ID
   */
  getCommand(commandId: string): CommandDefinition | undefined {
    return this.commands.get(commandId);
  }

  /**
   * Get all commands
   */
  getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: CommandCategory): CommandDefinition[] {
    return Array.from(this.commands.values()).filter(
      command => command.category === category
    );
  }

  /**
   * Get commands available in a specific context
   */
  getCommandsByContext(context: CommandContext): CommandDefinition[] {
    return Array.from(this.commands.values()).filter(command => 
      command.contexts.includes(context) || command.contexts.includes(CommandContext.GLOBAL)
    );
  }

  /**
   * Get all keyboard shortcuts
   */
  getAllShortcuts(): ShortcutMapping[] {
    return [...this.shortcuts];
  }

  /**
   * Get shortcuts for a specific command
   */
  getShortcutsForCommand(commandId: string): string[] {
    const command = this.commands.get(commandId);
    if (!command || !command.shortcut) {
      return [];
    }
    
    return Array.isArray(command.shortcut) ? command.shortcut : [command.shortcut];
  }

  /**
   * Set active context
   */
  setActiveContext(context: CommandContext): void {
    this.activeContext = context;
    debugLog('CommandRegistry', `Active context set to: ${context}`);
  }

  /**
   * Get active context
   */
  getActiveContext(): CommandContext {
    return this.activeContext;
  }

  /**
   * Enable or disable a command
   */
  setCommandEnabled(commandId: string, enabled: boolean): boolean {
    const command = this.commands.get(commandId);
    if (!command) {
      return false;
    }
    
    command.enabled = enabled;
    return true;
  }

  /**
   * Set command visibility
   */
  setCommandVisible(commandId: string, visible: boolean): boolean {
    const command = this.commands.get(commandId);
    if (!command) {
      return false;
    }
    
    command.visible = visible;
    return true;
  }

  /**
   * Check if a command is available in the current context
   */
  isCommandAvailable(commandId: string): boolean {
    const command = this.commands.get(commandId);
    if (!command || !command.enabled) {
      return false;
    }
    
    return command.contexts.includes(this.activeContext) || 
           command.contexts.includes(CommandContext.GLOBAL);
  }

  /**
   * Register a shortcut pressed handler
   */
  onShortcutPressed(handler: (shortcut: string) => void): () => void {
    this.shortcutPressedHandlers.add(handler);
    
    return () => {
      this.shortcutPressedHandlers.delete(handler);
    };
  }

  /**
   * Normalize shortcut format
   */
  private normalizeShortcut(shortcut: string): string {
    // Split by '+' and sort modifiers alphabetically
    const parts = shortcut.split('+').map(p => p.trim());
    
    // Separate modifiers from the main key
    const modifiers = parts
      .filter(p => ['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(p.toLowerCase()))
      .map(p => p.toLowerCase());
    
    // Replace 'cmd' with 'meta' for consistency
    const normalizedModifiers = modifiers.map(m => m === 'cmd' ? 'meta' : m);
    
    // Sort modifiers for consistent representation
    normalizedModifiers.sort();
    
    // Get the main key (the non-modifier part)
    const mainKey = parts.find(p => 
      !['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(p.toLowerCase())
    ) || '';
    
    // Capitalize main key for better readability
    const normalizedKey = mainKey.length === 1 ? mainKey.toUpperCase() : mainKey;
    
    // Combine modifiers and main key
    return [...normalizedModifiers, normalizedKey].join('+');
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Build shortcut string from event
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    // Add the key
    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    parts.push(key);
    
    const shortcut = parts.join('+');
    
    debugLog('CommandRegistry', `Key pressed: ${key}, Ctrl: ${event.ctrlKey}, Alt: ${event.altKey}, Shift: ${event.shiftKey}`);
    
    // Notify shortcut pressed handlers
    this.shortcutPressedHandlers.forEach(handler => {
      try {
        handler(shortcut);
      } catch (error) {
        errorLog('CommandRegistry', `Error in shortcut pressed handler: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    // Find matching shortcut
    const matchingShortcuts = this.shortcuts.filter(s => {
      // Exact match
      if (s.shortcut === shortcut) {
        // Check context if specified
        if (!s.context || s.context === this.activeContext) {
          return true;
        }
      }
      return false;
    });
    
    if (matchingShortcuts.length > 0) {
      // Sort by specificity (commands with context take precedence)
      matchingShortcuts.sort((a, b) => {
        if (a.context && !b.context) return -1;
        if (!a.context && b.context) return 1;
        return 0;
      });
      
      const shortcutMapping = matchingShortcuts[0];
      
      // Execute the command
      this.executeCommand(shortcutMapping.commandId, {
        source: 'shortcut',
        context: this.activeContext
      }).catch(error => {
        errorLog('CommandRegistry', `Error executing command from shortcut: ${error instanceof Error ? error.message : String(error)}`);
      });
      
      // Publish shortcut triggered event
      eventBus.publish(
        CommandEventType.SHORTCUT_TRIGGERED,
        {
          commandId: shortcutMapping.commandId,
          shortcut: shortcutMapping.shortcut,
          context: this.activeContext
        }
      );
      
      // Prevent default browser behavior if we handled the shortcut
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Publish command executed event
   */
  private publishCommandExecuted(
    commandId: string,
    success: boolean,
    result?: any,
    error?: string,
    source?: string
  ): void {
    eventBus.publish<CommandExecutedEvent>(
      CommandEventType.COMMAND_EXECUTED,
      {
        commandId,
        success,
        result,
        error,
        source
      }
    );
  }

  /**
   * Clear all commands and shortcuts (for testing or resets)
   */
  clear(): void {
    this.commands.clear();
    this.handlers.clear();
    this.shortcuts = [];
    this.activeContext = CommandContext.GLOBAL;
    
    debugLog('CommandRegistry', 'CommandRegistry cleared');
  }
}

// Export singleton instance
export const commandRegistry = CommandRegistry.getInstance();

/**
 * Default built-in commands and utilities
 */
export const Commands = {
  // Email commands
  COMPOSE_EMAIL: 'compose-email',
  REPLY_EMAIL: 'reply-email',
  REPLY_ALL_EMAIL: 'reply-all-email',
  FORWARD_EMAIL: 'forward-email',
  DELETE_EMAIL: 'delete-email',
  ARCHIVE_EMAIL: 'archive-email',
  MARK_AS_READ: 'mark-as-read',
  MARK_AS_UNREAD: 'mark-as-unread',
  
  // Navigation commands
  GOTO_INBOX: 'goto-inbox',
  GOTO_CALENDAR: 'goto-calendar',
  GOTO_CONTACTS: 'goto-contacts',
  GOTO_SETTINGS: 'goto-settings',
  
  // Layout commands
  TOGGLE_SIDEBAR: 'toggle-sidebar',
  SPLIT_PANEL_HORIZONTAL: 'split-panel-horizontal',
  SPLIT_PANEL_VERTICAL: 'split-panel-vertical',
  MAXIMIZE_PANEL: 'maximize-panel',
  RESTORE_PANEL: 'restore-panel',
  
  // Tab commands
  NEW_TAB: 'new-tab',
  CLOSE_TAB: 'close-tab',
  NEXT_TAB: 'next-tab',
  PREVIOUS_TAB: 'previous-tab',
  
  // Search commands
  SEARCH: 'search',
  ADVANCED_SEARCH: 'advanced-search',
  
  // System commands
  SAVE_LAYOUT: 'save-layout',
  LOAD_LAYOUT: 'load-layout',
  HELP: 'help',
  SETTINGS: 'settings',
  LOGOUT: 'logout'
};

export default commandRegistry;