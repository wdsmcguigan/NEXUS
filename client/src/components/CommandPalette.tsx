import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTabContext } from '../context/TabContext';
import componentRegistry, { ComponentDefinition } from '../lib/componentRegistry';
import tabFactory from '../services/TabFactory';
import { LucideIcon, Search, Layers, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  type: 'component' | 'template' | 'panel';
  name: string;
  description?: string;
  category: string;
  icon?: React.ReactNode;
  action: () => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const tabContext = useTabContext();
  const [items, setItems] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPanel, setSelectedPanel] = useState<string>('current');

  // Prepare command items
  useEffect(() => {
    if (!open) return;

    const componentItems: CommandItem[] = componentRegistry.getAllComponents().map(component => ({
      id: component.id,
      type: 'component',
      name: component.displayName,
      category: getCategoryLabel(component.category),
      icon: component.icon ? React.createElement(component.icon as LucideIcon, { size: 16 }) : undefined,
      action: () => {
        const targetPanelId = getTargetPanelId(selectedPanel);
        tabFactory.createTab(tabContext, { componentId: component.id }, { targetPanelId });
        onOpenChange(false);
      }
    }));

    const templateItems: CommandItem[] = tabFactory.getAllTemplates().map(template => ({
      id: template.id,
      type: 'template',
      name: template.name,
      description: template.description,
      category: 'Templates',
      icon: <Layers size={16} />,
      action: () => {
        tabFactory.createFromTemplate(tabContext, template.id);
        onOpenChange(false);
      }
    }));

    const panelItems: CommandItem[] = Object.entries(tabContext.state.panels).map(([id, panel]) => ({
      id,
      type: 'panel',
      name: `Panel: ${id}`,
      category: 'Navigation',
      icon: <Layout size={16} />,
      action: () => {
        setSelectedPanel(id);
      }
    }));

    setItems([...componentItems, ...templateItems, ...panelItems]);
  }, [open, tabContext, selectedPanel, onOpenChange]);

  // Helper function to get a readable category label
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'email': return 'Email';
      case 'productivity': return 'Productivity';
      case 'settings': return 'Settings';
      case 'utility': return 'Utilities';
      case 'tags': return 'Tags';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  // Helper function to determine target panel
  const getTargetPanelId = (panelSelection: string): string | undefined => {
    if (panelSelection === 'current') {
      return tabContext.state.activePanelId || 'mainPanel';
    } else if (panelSelection === 'new') {
      return undefined; // Let tabFactory choose
    } else {
      return panelSelection;
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Auto-focus the input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Fuzzy search function
  const filterItems = (query: string) => {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      (item.description && item.description.toLowerCase().includes(lowerQuery))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search commands, components, and templates..."
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm">
              No results found.
            </Command.Empty>

            {!search && (
              <Command.Group heading="Destination Panel">
                <Command.Item
                  onSelect={() => setSelectedPanel('current')}
                  className={cn("flex items-center gap-2 px-2", 
                    selectedPanel === 'current' ? 'bg-blue-500 text-white' : '')}
                >
                  <Layout size={16} />
                  <span>Current Panel</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => setSelectedPanel('new')}
                  className={cn("flex items-center gap-2 px-2", 
                    selectedPanel === 'new' ? 'bg-blue-500 text-white' : '')}
                >
                  <Layout size={16} />
                  <span>New Panel</span>
                </Command.Item>
                {Object.entries(tabContext.state.panels).map(([id, panel]) => (
                  <Command.Item
                    key={id}
                    onSelect={() => setSelectedPanel(id)}
                    className={cn("flex items-center gap-2 px-2", 
                      selectedPanel === id ? 'bg-blue-500 text-white' : '')}
                  >
                    <Layout size={16} />
                    <span>{id}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {Object.entries(
              filterItems(search).reduce<Record<string, CommandItem[]>>((acc, item) => {
                if (!acc[item.category]) {
                  acc[item.category] = [];
                }
                acc[item.category].push(item);
                return acc;
              }, {})
            ).map(([category, categoryItems]) => (
              <Command.Group key={category} heading={category}>
                {categoryItems.map((item) => (
                  <Command.Item
                    key={`${item.type}-${item.id}`}
                    onSelect={item.action}
                    className="flex items-center gap-2 px-2"
                  >
                    {item.icon && <span className="flex items-center justify-center">{item.icon}</span>}
                    <span>{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-slate-500 truncate ml-2">
                        {item.description}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;