import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ShortcutDefinition {
  id: string;
  name: string;
  keys: string[];
  action: () => void;
  when: () => boolean;
}

interface ShortcutContextType {
  shortcuts: Record<string, ShortcutDefinition>;
  registerShortcut: (shortcut: ShortcutDefinition) => void;
  unregisterShortcut: (id: string) => void;
  triggerShortcut: (id: string) => boolean;
  pressedKeys: Set<string>;
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Record<string, ShortcutDefinition>>({});
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  
  // Register a new shortcut
  const registerShortcut = useCallback((shortcut: ShortcutDefinition) => {
    setShortcuts(prev => ({
      ...prev,
      [shortcut.id]: shortcut
    }));
  }, []);
  
  // Unregister a shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[id];
      return newShortcuts;
    });
  }, []);
  
  // Trigger a shortcut by ID
  const triggerShortcut = useCallback((id: string) => {
    const shortcut = shortcuts[id];
    if (shortcut && shortcut.when()) {
      shortcut.action();
      return true;
    }
    return false;
  }, [shortcuts]);
  
  // Handle keydown events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Normalize key name
      let key = e.key;
      
      // Handle special keys
      if (e.key === ' ') key = 'Space';
      if (e.key === 'Control') key = 'Ctrl';
      if (e.key === 'Meta') key = 'Meta'; // Command key on Mac
      
      // Add modifiers first
      if (e.metaKey) pressedKeys.add('Meta');
      if (e.ctrlKey) pressedKeys.add('Ctrl');
      if (e.altKey) pressedKeys.add('Alt');
      if (e.shiftKey) pressedKeys.add('Shift');
      
      // Add the actual key
      pressedKeys.add(key);
      setPressedKeys(new Set(pressedKeys));
      
      console.log(`Key pressed: ${key}, Ctrl: ${e.ctrlKey}, Alt: ${e.altKey}, Shift: ${e.shiftKey}`);
      
      // Check if any shortcut matches the current key combination
      for (const shortcut of Object.values(shortcuts)) {
        // Check if the condition for this shortcut is met
        if (!shortcut.when()) continue;
        
        // Check if all required keys are pressed
        const allKeysPressed = shortcut.keys.every(k => pressedKeys.has(k));
        
        // Only if the exact combination matches (no extra modifier keys)
        const correctModifiers = 
          (e.metaKey === shortcut.keys.includes('Meta')) &&
          (e.ctrlKey === shortcut.keys.includes('Ctrl')) &&
          (e.altKey === shortcut.keys.includes('Alt')) &&
          (e.shiftKey === shortcut.keys.includes('Shift'));
        
        if (allKeysPressed && correctModifiers) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Normalize key name
      let key = e.key;
      
      // Handle special keys
      if (e.key === ' ') key = 'Space';
      if (e.key === 'Control') key = 'Ctrl';
      if (e.key === 'Meta') key = 'Meta';
      
      // Create a new set without the released key
      const newPressedKeys = new Set(pressedKeys);
      newPressedKeys.delete(key);
      
      // Also remove modifiers if they're no longer pressed
      if (!e.metaKey) newPressedKeys.delete('Meta');
      if (!e.ctrlKey) newPressedKeys.delete('Ctrl');
      if (!e.altKey) newPressedKeys.delete('Alt');
      if (!e.shiftKey) newPressedKeys.delete('Shift');
      
      setPressedKeys(newPressedKeys);
    };
    
    // Register global event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts, pressedKeys, triggerShortcut]);
  
  // Reset pressed keys when window loses focus
  useEffect(() => {
    const handleBlur = () => {
      setPressedKeys(new Set());
    };
    
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  useEffect(() => {
    console.log('Keyboard shortcut system initialized');
  }, []);
  
  const contextValue: ShortcutContextType = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    triggerShortcut,
    pressedKeys
  };
  
  return (
    <ShortcutContext.Provider value={contextValue}>
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcutContext() {
  const context = useContext(ShortcutContext);
  if (context === undefined) {
    throw new Error('useShortcutContext must be used within a ShortcutProvider');
  }
  return context;
}