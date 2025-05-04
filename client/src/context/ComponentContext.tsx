import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import componentRegistry, { ComponentDefinition as RegistryComponentDefinition } from '../lib/componentRegistry';

// Define the structure of a component in the context
export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
  getComponent: () => React.ComponentType<any>;
  defaultProps?: Record<string, any>;
}

// Interface for tab content
export interface TabContent {
  id: string;
  componentId: string;
  props: Record<string, any>;
}

// Context type
interface ComponentContextType {
  components: Record<string, ComponentDefinition>;
  registerComponent: (component: ComponentDefinition) => void;
  unregisterComponent: (id: string) => void;
  createComponent: (componentId: string, panelId: string, props?: Record<string, any>) => string;
}

// Create the context
export const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

// Provider component
export function ComponentProvider({ children }: { children: React.ReactNode }) {
  const [components, setComponents] = useState<Record<string, ComponentDefinition>>({});
  
  // Sync with the componentRegistry when mounted
  useEffect(() => {
    // Load components from the registry
    const registryComponents = componentRegistry.getAllComponents();
    
    // Convert registry components to our ComponentDefinition format
    const convertedComponents = registryComponents.reduce((acc, regComp) => {
      const component: ComponentDefinition = {
        id: regComp.id,
        name: regComp.displayName,
        description: regComp.id, // Using ID as description for now
        category: regComp.category.charAt(0).toUpperCase() + regComp.category.slice(1), // Capitalize first letter
        icon: regComp.icon ? React.createElement(regComp.icon) : undefined,
        getComponent: () => regComp.component,
        defaultProps: regComp.defaultConfig
      };
      
      acc[regComp.id] = component;
      return acc;
    }, {} as Record<string, ComponentDefinition>);
    
    // Update state with the converted components
    setComponents(convertedComponents);
  }, []);
  
  // Register a component
  const registerComponent = useCallback((component: ComponentDefinition) => {
    if (components[component.id]) {
      console.warn(`Component with ID ${component.id} is already registered. It will be overwritten.`);
    }
    
    setComponents(prev => ({
      ...prev,
      [component.id]: component
    }));
    
    console.log(`Registered component: ${component.id}`);
  }, [components]);
  
  // Unregister a component
  const unregisterComponent = useCallback((id: string) => {
    setComponents(prev => {
      const newComponents = { ...prev };
      delete newComponents[id];
      return newComponents;
    });
  }, []);
  
  // Create a component instance and add it to a panel
  const createComponent = useCallback((componentId: string, panelId: string, props?: Record<string, any>): string => {
    const componentDef = components[componentId];
    if (!componentDef) {
      console.error(`Component with ID ${componentId} not found in registry`);
      return '';
    }
    
    const tabId = `tab-${nanoid(8)}`;
    
    // Store this tab content information somewhere accessible by rendering logic
    // This could be in a shared state, context, or passed to a panel context
    // For now we're just returning the ID and will handle linking the component separately
    
    console.log(`Created new tab ${tabId} with component ${componentId} for panel ${panelId}`);
    
    return tabId;
  }, [components]);
  
  const contextValue: ComponentContextType = {
    components,
    registerComponent,
    unregisterComponent,
    createComponent
  };
  
  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
}

// Custom hook to use the context
export function useComponentRegistry() {
  const context = useContext(ComponentContext);
  if (context === undefined) {
    throw new Error('useComponentRegistry must be used within a ComponentProvider');
  }
  return context;
}

// Initialize with components from the registry
export function initializeComponentRegistry(registerComponent: (component: ComponentDefinition) => void) {
  // We're now using the componentRegistry directly in the ComponentProvider
  // This function is kept for backward compatibility but doesn't need to do anything
  console.log("Component initialization is now handled by the ComponentProvider");
}