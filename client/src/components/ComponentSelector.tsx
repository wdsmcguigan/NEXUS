import React, { useState, useEffect } from 'react';
import componentRegistry from '../lib/componentRegistry';
import { PanelType } from '../context/TabContext';
import { X, Search } from 'lucide-react';

interface ComponentSelectorProps {
  onSelect: (componentId: string) => void;
  onCancel: () => void;
  panelType: PanelType;
}

export function ComponentSelector({ onSelect, onCancel, panelType }: ComponentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get all components from registry
  const allComponents = componentRegistry.getAllComponents();
  
  // Filter components based on panel type compatibility
  const compatibleComponents = allComponents.filter(comp => 
    comp.supportedPanelTypes.includes(panelType) || 
    comp.supportedPanelTypes.includes('any')
  );
  
  // Get unique categories
  const categories = Array.from(
    new Set(compatibleComponents.map(comp => comp.category))
  );
  
  // Filter components based on search and category
  const filteredComponents = compatibleComponents.filter(comp => {
    const matchesSearch = searchTerm === '' || 
      comp.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || 
      comp.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Select Component</h2>
          <button 
            onClick={onCancel}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-800 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === null 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              All
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  category === selectedCategory 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {filteredComponents.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              No components found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-4">
              {filteredComponents.map(component => {
                const Icon = component.icon;
                return (
                  <button
                    key={component.id}
                    onClick={() => onSelect(component.id)}
                    className="flex items-center p-3 rounded-md hover:bg-neutral-800 transition-colors text-left"
                  >
                    <div className="mr-3 text-blue-400">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{component.displayName}</div>
                      <div className="text-xs text-neutral-400">{component.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors mr-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComponentSelector;