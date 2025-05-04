import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, RotateCcw, Keyboard } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Shortcut category definitions
const SHORTCUT_CATEGORIES = [
  'General',
  'Tabs',
  'Panels',
  'Navigation',
  'Email',
  'Custom'
];

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS = [
  {
    id: 'cmd_palette',
    name: 'Open Command Palette',
    category: 'General',
    keys: ['Ctrl', 'P'],
    description: 'Open command palette to search and execute commands',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'new_tab',
    name: 'New Tab',
    category: 'Tabs',
    keys: ['Ctrl', 'T'],
    description: 'Open a new tab in the current panel',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'close_tab',
    name: 'Close Tab',
    category: 'Tabs',
    keys: ['Ctrl', 'W'],
    description: 'Close the current tab',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'next_tab',
    name: 'Next Tab',
    category: 'Tabs',
    keys: ['Ctrl', 'Tab'],
    description: 'Switch to the next tab in the current panel',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'prev_tab',
    name: 'Previous Tab',
    category: 'Tabs',
    keys: ['Ctrl', 'Shift', 'Tab'],
    description: 'Switch to the previous tab in the current panel',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'tab_1',
    name: 'Go to Tab 1',
    category: 'Tabs',
    keys: ['Alt', '1'],
    description: 'Switch to the first tab in the current panel',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'save_layout',
    name: 'Save Current Layout',
    category: 'Panels',
    keys: ['Ctrl', 'Shift', 'S'],
    description: 'Save the current panel layout as a template',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'toggle_sidebar',
    name: 'Toggle Sidebar',
    category: 'Panels',
    keys: ['Ctrl', 'B'],
    description: 'Toggle the visibility of the sidebar',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'maximize_panel',
    name: 'Maximize Panel',
    category: 'Panels',
    keys: ['F11'],
    description: 'Maximize the current panel',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'split_horizontal',
    name: 'Split Panel Horizontally',
    category: 'Panels',
    keys: ['Ctrl', 'Shift', 'H'],
    description: 'Split the current panel horizontally',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'split_vertical',
    name: 'Split Panel Vertically',
    category: 'Panels',
    keys: ['Ctrl', 'Shift', 'V'],
    description: 'Split the current panel vertically',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'focus_next_panel',
    name: 'Focus Next Panel',
    category: 'Panels',
    keys: ['Ctrl', 'F6'],
    description: 'Move focus to the next panel',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'archive_email',
    name: 'Archive Selected Email',
    category: 'Email',
    keys: ['E'],
    description: 'Archive the currently selected email',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'delete_email',
    name: 'Delete Selected Email',
    category: 'Email',
    keys: ['#'],
    description: 'Delete the currently selected email',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'mark_read',
    name: 'Mark as Read/Unread',
    category: 'Email',
    keys: ['R'],
    description: 'Toggle read/unread status of selected email',
    isCustom: false,
    isEnabled: true
  },
  {
    id: 'cycle_star',
    name: 'Cycle Star Color',
    category: 'Email',
    keys: ['S'],
    description: 'Cycle through star colors for selected email',
    isCustom: false,
    isEnabled: true
  }
];

interface Shortcut {
  id: string;
  name: string;
  category: string;
  keys: string[];
  description: string;
  isCustom: boolean;
  isEnabled: boolean;
}

interface ShortcutManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutManager({ open, onOpenChange }: ShortcutManagerProps) {
  // State to track shortcuts
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const [newShortcutName, setNewShortcutName] = useState('');
  const [newShortcutCategory, setNewShortcutCategory] = useState(SHORTCUT_CATEGORIES[0]);
  const [newShortcutDescription, setNewShortcutDescription] = useState('');

  // Initialize shortcuts
  useEffect(() => {
    // In a real app, we would load from localStorage or a database
    const savedShortcuts = localStorage.getItem('nexus_shortcuts');
    if (savedShortcuts) {
      setShortcuts(JSON.parse(savedShortcuts));
    } else {
      setShortcuts(DEFAULT_SHORTCUTS);
    }
  }, []);

  // Save shortcuts whenever they change
  useEffect(() => {
    if (shortcuts.length > 0) {
      localStorage.setItem('nexus_shortcuts', JSON.stringify(shortcuts));
    }
  }, [shortcuts]);

  // Filter shortcuts based on selected category
  const filteredShortcuts = selectedCategory === 'All'
    ? shortcuts
    : shortcuts.filter(shortcut => shortcut.category === selectedCategory);

  // Start listening for key combinations
  const startRecording = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setCurrentKeys([]);
    setRecordingKeys(true);
  };

  // Handle key press events
  useEffect(() => {
    if (!recordingKeys) return;

    const keyListener = (e: KeyboardEvent) => {
      e.preventDefault();
      
      const key = e.key === ' ' ? 'Space' : e.key;
      
      if (key === 'Escape') {
        // Cancel recording
        setRecordingKeys(false);
        return;
      }
      
      // Convert key names to more readable format
      let formattedKey = key;
      if (key === 'Control') formattedKey = 'Ctrl';
      if (key === 'Meta') formattedKey = 'Cmd';
      if (key === 'ArrowUp') formattedKey = '↑';
      if (key === 'ArrowDown') formattedKey = '↓';
      if (key === 'ArrowLeft') formattedKey = '←';
      if (key === 'ArrowRight') formattedKey = '→';
      
      // Avoid duplicate keys
      if (!currentKeys.includes(formattedKey)) {
        const newKeys = [...currentKeys, formattedKey];
        
        // Special keys that should be at the start
        const modifiers = ['Ctrl', 'Alt', 'Shift', 'Cmd'];
        newKeys.sort((a, b) => {
          const aIsModifier = modifiers.includes(a);
          const bIsModifier = modifiers.includes(b);
          if (aIsModifier && !bIsModifier) return -1;
          if (!aIsModifier && bIsModifier) return 1;
          return modifiers.indexOf(a) - modifiers.indexOf(b);
        });
        
        setCurrentKeys(newKeys);
      }

      // If we've recorded at least one key and it's not just a modifier,
      // consider it complete after a delay
      if (currentKeys.length > 0 && !['Ctrl', 'Alt', 'Shift', 'Cmd'].includes(key)) {
        setTimeout(() => {
          if (recordingKeys) {
            saveCurrentShortcut();
          }
        }, 500);
      }
    };

    window.addEventListener('keydown', keyListener);
    return () => window.removeEventListener('keydown', keyListener);
  }, [recordingKeys, currentKeys]);

  // Save the current shortcut
  const saveCurrentShortcut = () => {
    if (editingShortcut && currentKeys.length > 0) {
      const updatedShortcuts = shortcuts.map(shortcut => 
        shortcut.id === editingShortcut.id 
          ? { ...shortcut, keys: currentKeys } 
          : shortcut
      );
      setShortcuts(updatedShortcuts);
    }
    setRecordingKeys(false);
    setEditingShortcut(null);
  };

  // Toggle shortcut enabled state
  const toggleShortcutEnabled = (id: string) => {
    const updatedShortcuts = shortcuts.map(shortcut => 
      shortcut.id === id 
        ? { ...shortcut, isEnabled: !shortcut.isEnabled } 
        : shortcut
    );
    setShortcuts(updatedShortcuts);
  };

  // Reset shortcut to default
  const resetShortcut = (id: string) => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
    if (defaultShortcut) {
      const updatedShortcuts = shortcuts.map(shortcut => 
        shortcut.id === id 
          ? { ...shortcut, keys: defaultShortcut.keys } 
          : shortcut
      );
      setShortcuts(updatedShortcuts);
    }
  };

  // Delete a custom shortcut
  const deleteShortcut = (id: string) => {
    const updatedShortcuts = shortcuts.filter(shortcut => shortcut.id !== id);
    setShortcuts(updatedShortcuts);
  };

  // Add a new custom shortcut
  const addNewShortcut = () => {
    if (!newShortcutName.trim()) return;
    
    const newShortcut: Shortcut = {
      id: `custom_${Date.now()}`,
      name: newShortcutName,
      category: newShortcutCategory,
      keys: [],
      description: newShortcutDescription,
      isCustom: true,
      isEnabled: true
    };
    
    setShortcuts([...shortcuts, newShortcut]);
    setNewShortcutName('');
    setNewShortcutDescription('');
    
    // Start recording keys for the new shortcut
    setTimeout(() => {
      startRecording(newShortcut);
    }, 100);
  };

  // Reset all shortcuts to default
  const resetAllShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" /> 
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Customize keyboard shortcuts to improve your workflow. Click on any shortcut to change it.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Shortcuts</TabsTrigger>
            <TabsTrigger value="add">Add Custom Shortcut</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manage" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="category-filter">Filter by category:</Label>
                <select
                  id="category-filter"
                  className="p-2 rounded-md border border-neutral-700 bg-neutral-900 text-white"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {SHORTCUT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={resetAllShortcuts}
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset All to Default
              </Button>
            </div>
            
            <ScrollArea className="h-[50vh]">
              <Table>
                <TableCaption>
                  Click on a shortcut to change it. Press Escape to cancel while recording.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Shortcut</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShortcuts.map((shortcut) => (
                    <TableRow key={shortcut.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{shortcut.name}</span>
                          <span className="text-xs text-neutral-400">{shortcut.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shortcut.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {recordingKeys && editingShortcut?.id === shortcut.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-amber-400 animate-pulse">Recording...</span>
                            <div className="flex gap-1">
                              {currentKeys.map((key, i) => (
                                <Badge key={i} variant="secondary">{key}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex gap-1 cursor-pointer"
                            onClick={() => startRecording(shortcut)}
                          >
                            {shortcut.keys.map((key, i) => (
                              <Badge key={i} variant="secondary">{key}</Badge>
                            ))}
                            {shortcut.keys.length === 0 && (
                              <span className="text-sm text-neutral-400 italic">Not set</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={shortcut.isEnabled}
                          onChange={() => toggleShortcutEnabled(shortcut.id)}
                          className="rounded border-neutral-700 bg-neutral-900 text-blue-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset to default"
                            onClick={() => resetShortcut(shortcut.id)}
                            disabled={shortcut.isCustom}
                          >
                            <RotateCcw size={14} className="text-neutral-400" />
                          </Button>
                          {shortcut.isCustom && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete shortcut"
                              onClick={() => deleteShortcut(shortcut.id)}
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="add" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="shortcut-name">Shortcut Name</Label>
                  <Input
                    id="shortcut-name"
                    placeholder="e.g., Compose New Email"
                    value={newShortcutName}
                    onChange={(e) => setNewShortcutName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortcut-category">Category</Label>
                  <select
                    id="shortcut-category"
                    className="p-2 h-10 rounded-md border border-neutral-700 bg-neutral-900 text-white"
                    value={newShortcutCategory}
                    onChange={(e) => setNewShortcutCategory(e.target.value)}
                  >
                    {SHORTCUT_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="shortcut-description">Description</Label>
                <Input
                  id="shortcut-description"
                  placeholder="What does this shortcut do?"
                  value={newShortcutDescription}
                  onChange={(e) => setNewShortcutDescription(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={addNewShortcut}
                disabled={!newShortcutName.trim()}
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Shortcut and Set Keys
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShortcutManager;