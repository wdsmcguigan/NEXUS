import React, { createContext, useContext, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';

// Define the structure of a component in the registry
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
const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

// Provider component
export function ComponentProvider({ children }: { children: React.ReactNode }) {
  const [components, setComponents] = useState<Record<string, ComponentDefinition>>({});
  
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

// Initialize with some default components
export function initializeComponentRegistry(registerComponent: (component: ComponentDefinition) => void) {
  const defaultComponents: ComponentDefinition[] = [
    {
      id: 'email-list',
      name: 'Email List',
      description: 'Displays a list of emails',
      category: 'Email',
      getComponent: () => {
        const EmailList = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Email List</h2>
          </div>
        );
        return EmailList;
      }
    },
    {
      id: 'email-detail',
      name: 'Email Detail',
      description: 'Displays the content of an email',
      category: 'Email',
      getComponent: () => {
        const EmailDetail = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Email Detail</h2>
          </div>
        );
        return EmailDetail;
      }
    },
    {
      id: 'folder-explorer',
      name: 'Folder Explorer',
      description: 'Displays folders and labels',
      category: 'Navigation',
      getComponent: () => {
        const FolderExplorer = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Folder Explorer</h2>
          </div>
        );
        return FolderExplorer;
      }
    },
    {
      id: 'contact-details',
      name: 'Contact Details',
      description: 'Displays contact information',
      category: 'Contacts',
      getComponent: () => {
        const ContactDetails = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Contact Details</h2>
          </div>
        );
        return ContactDetails;
      }
    },
    {
      id: 'tag-manager',
      name: 'Tag Manager',
      description: 'Manages email tags and categories',
      category: 'Organization',
      getComponent: () => {
        const TagManager = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Tag Manager</h2>
          </div>
        );
        return TagManager;
      }
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Application settings',
      category: 'System',
      getComponent: () => {
        const Settings = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Settings</h2>
          </div>
        );
        return Settings;
      }
    },
    {
      id: 'integrations',
      name: 'Integrations',
      description: 'Manage third-party integrations',
      category: 'System',
      getComponent: () => {
        const Integrations = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Integrations</h2>
          </div>
        );
        return Integrations;
      }
    },
    {
      id: 'templates',
      name: 'Templates',
      description: 'Email templates',
      category: 'Email',
      getComponent: () => {
        const Templates = () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Templates</h2>
          </div>
        );
        return Templates;
      }
    }
  ];
  
  defaultComponents.forEach(component => registerComponent(component));
}