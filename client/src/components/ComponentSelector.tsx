import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X as CloseIcon } from 'lucide-react';
import componentRegistry, { ComponentDefinition } from '../lib/componentRegistry';
import { PanelType } from '../context/TabContext';
import { cn } from '../lib/utils';

interface ComponentSelectorProps {
  onSelect: (componentId: string) => void;
  onCancel: () => void;
  panelType: PanelType;
}

export function ComponentSelector({ onSelect, onCancel, panelType }: ComponentSelectorProps) {
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<ComponentDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Load components from registry on mount
  useEffect(() => {
    const availableComponents = componentRegistry.getComponentsForPanelType(panelType);
    setComponents(availableComponents);
    setFilteredComponents(availableComponents);
    
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(availableComponents.map(comp => comp.category))
    );
    setCategories(uniqueCategories);
  }, [panelType]);

  // Filter components based on search and category
  useEffect(() => {
    let filtered = components;
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(comp =>
        comp.displayName.toLowerCase().includes(lowerQuery) ||
        comp.category.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(comp => comp.category === selectedCategory);
    }
    
    setFilteredComponents(filtered);
  }, [searchQuery, selectedCategory, components]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-md shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-sm font-medium text-white">Select Component</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-sm hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Search input */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors",
                selectedCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              )}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Component list */}
          <div className="max-h-72 overflow-y-auto">
            {filteredComponents.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
                No components found
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredComponents.map((component) => (
                  <div
                    key={component.id}
                    className="border border-neutral-800 bg-neutral-800/50 rounded p-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-800 transition-colors"
                    onClick={() => onSelect(component.id)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                      {component.icon ? (
                        React.createElement(component.icon, { size: 16 })
                      ) : (
                        <span className="text-sm">{component.displayName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{component.displayName}</div>
                      <div className="text-xs text-neutral-400">{component.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComponentSelector;