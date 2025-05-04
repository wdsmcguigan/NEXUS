/**
 * Keyboard Shortcut System for NEXUS.email
 * 
 * This utility provides a lightweight keyboard shortcut registry
 * and management system. It allows registering, triggering, and 
 * handling keyboard shortcuts throughout the application.
 */

export interface KeyboardShortcut {
  id: string;
  keys: string;
  callback: () => void;
  description?: string;
  category?: string;
}

export class HotkeyRegistry {
  private shortcuts: Map<string, KeyboardShortcut>;
  
  constructor() {
    this.shortcuts = new Map();
  }
  
  /**
   * Register a new keyboard shortcut
   * 
   * @param id Unique identifier for the shortcut
   * @param keys Key combination (e.g. "Ctrl+S", "Alt+F4")
   * @param callback Function to execute when shortcut is triggered
   * @param description Optional description of what the shortcut does
   * @param category Optional category for grouping shortcuts
   */
  register(
    id: string, 
    keys: string, 
    callback: () => void, 
    description?: string,
    category: string = 'general'
  ): void {
    this.shortcuts.set(id, {
      id,
      keys,
      callback,
      description,
      category
    });
    
    console.log(`Registered shortcut: ${id} (${keys})`);
  }
  
  /**
   * Unregister a keyboard shortcut
   * 
   * @param id Identifier of the shortcut to remove
   */
  unregister(id: string): void {
    if (this.shortcuts.has(id)) {
      this.shortcuts.delete(id);
      console.log(`Unregistered shortcut: ${id}`);
    }
  }
  
  /**
   * Unregister all shortcuts
   */
  unregisterAll(): void {
    this.shortcuts.clear();
    console.log('All shortcuts unregistered');
  }
  
  /**
   * Trigger a shortcut programmatically
   * 
   * @param id Identifier of the shortcut to trigger
   * @returns true if the shortcut was found and triggered, false otherwise
   */
  trigger(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    
    if (shortcut) {
      console.log(`Triggering shortcut: ${id}`);
      try {
        shortcut.callback();
        return true;
      } catch (error) {
        console.error(`Error triggering shortcut ${id}:`, error);
      }
    }
    
    return false;
  }
  
  /**
   * Get all registered shortcuts
   * 
   * @returns Array of all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * Get shortcuts by category
   * 
   * @param category Category to filter by
   * @returns Array of shortcuts in the specified category
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
      .filter(shortcut => shortcut.category === category);
  }
  
  /**
   * Parse a keyboard event to check if it matches a shortcut's key combination
   * 
   * @param event Keyboard event to check
   * @param keyCombination Key combination string to match against (e.g. "Ctrl+S")
   * @returns true if the event matches the key combination
   */
  static matchesKeyCombination(event: KeyboardEvent, keyCombination: string): boolean {
    // Normalize key combination format
    const normalizedCombination = keyCombination
      .toLowerCase()
      .replace(/\s+/g, '')
      .split('+');
    
    // Check for modifiers
    const hasCtrl = normalizedCombination.includes('ctrl') || normalizedCombination.includes('control');
    const hasAlt = normalizedCombination.includes('alt');
    const hasShift = normalizedCombination.includes('shift');
    const hasMeta = normalizedCombination.includes('meta') || normalizedCombination.includes('cmd') || normalizedCombination.includes('command');
    
    // Extract the actual key (last part of the combination that's not a modifier)
    const key = normalizedCombination
      .filter(part => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(part))
      .pop();
    
    // Match modifiers
    if (Boolean(event.ctrlKey) !== hasCtrl) return false;
    if (Boolean(event.altKey) !== hasAlt) return false;
    if (Boolean(event.shiftKey) !== hasShift) return false;
    if (Boolean(event.metaKey) !== hasMeta) return false;
    
    // Match the actual key (case insensitive)
    const eventKey = event.key.toLowerCase();
    
    // For function keys (F1-F12)
    if (key?.startsWith('f') && !isNaN(parseInt(key.substring(1)))) {
      return eventKey === key;
    }
    
    // For single letter keys
    if (key?.length === 1) {
      return eventKey === key;
    }
    
    // For named keys (enter, backspace, etc.)
    return eventKey === key;
  }
}

/**
 * Global keyboard shortcut system that attaches to document
 */
export class KeyboardShortcutSystem {
  private static instance: KeyboardShortcutSystem | null = null;
  private registry: HotkeyRegistry;
  
  private constructor() {
    this.registry = new HotkeyRegistry();
    this.initialize();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): KeyboardShortcutSystem {
    if (!KeyboardShortcutSystem.instance) {
      KeyboardShortcutSystem.instance = new KeyboardShortcutSystem();
    }
    return KeyboardShortcutSystem.instance;
  }
  
  /**
   * Initialize keyboard event listeners
   */
  private initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    console.log('Keyboard shortcut system initialized');
  }
  
  /**
   * Handle keyboard events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Skip if event is in an input element
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      return;
    }
    
    // Check all shortcuts
    for (const shortcut of this.registry.getAllShortcuts()) {
      if (HotkeyRegistry.matchesKeyCombination(event, shortcut.keys)) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.callback();
        break;
      }
    }
  }
  
  /**
   * Get the shortcut registry
   */
  public getRegistry(): HotkeyRegistry {
    return this.registry;
  }
}

// Create and export a global instance
export const globalShortcuts = KeyboardShortcutSystem.getInstance().getRegistry();