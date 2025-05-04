import React from 'react';
import { IconProps } from 'lucide-react';

// Define the interfaces for the component registry
export interface ComponentDefinition {
  id: string;
  displayName: string;
  category: 'email' | 'productivity' | 'settings' | 'utility' | 'tags';
  icon?: React.FC<IconProps>;
  component: React.ComponentType<any>;
  defaultConfig?: Record<string, any>;
  singleton?: boolean; // If true, only one instance of this component can be open
  supportedPanelTypes?: ('main' | 'sidebar' | 'bottom' | 'any')[]; // Where this component can be placed
}

// Registry to store all available components
class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  /**
   * Register a component that can be opened in tabs
   */
  register(componentDef: ComponentDefinition): void {
    if (this.components.has(componentDef.id)) {
      console.warn(`Component with ID ${componentDef.id} is already registered. It will be overwritten.`);
    }
    this.components.set(componentDef.id, componentDef);
  }

  /**
   * Get a component by its ID
   */
  getComponent(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  /**
   * Get all registered components
   */
  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentDefinition[] {
    return this.getAllComponents().filter(comp => comp.category === category);
  }

  /**
   * Get components suitable for a specific panel type
   */
  getComponentsForPanelType(panelType: 'main' | 'sidebar' | 'bottom'): ComponentDefinition[] {
    return this.getAllComponents().filter(comp => {
      if (!comp.supportedPanelTypes) return true; // No restrictions
      return comp.supportedPanelTypes.includes(panelType) || comp.supportedPanelTypes.includes('any');
    });
  }

  /**
   * Check if a component exists
   */
  hasComponent(id: string): boolean {
    return this.components.has(id);
  }
}

// Create and export a singleton instance
export const componentRegistry = new ComponentRegistry();

// Helper function to create a component definition
export function defineComponent(componentDef: ComponentDefinition): ComponentDefinition {
  componentRegistry.register(componentDef);
  return componentDef;
}

export default componentRegistry;