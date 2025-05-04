import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  ListFilter, 
  Mail, 
  FolderOpen, 
  User, 
  Tag, 
  Settings, 
  Plug, 
  FileText,
  Save
} from 'lucide-react';

// Define Component interface
export interface Component {
  id: string;
  name: string;
  icon?: React.ReactNode;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
}

// Define Component registry context type
interface ComponentContextType {
  registerComponent: (component: Component) => void;
  unregisterComponent: (id: string) => void;
  getComponent: (id: string) => Component | undefined;
  getComponents: () => Component[];
}

// Create component context
const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

// Provider component
export function ComponentProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<Map<string, Component>>(new Map());

  // Register a component
  const registerComponent = useCallback((component: Component) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.set(component.id, component);
      console.log(`Registered component: ${component.id}`);
      return newMap;
    });
  }, []);

  // Unregister a component
  const unregisterComponent = useCallback((id: string) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      if (newMap.has(id)) {
        newMap.delete(id);
        console.log(`Unregistered component: ${id}`);
      }
      return newMap;
    });
  }, []);

  // Get a component by ID
  const getComponent = useCallback((id: string) => {
    return components.get(id);
  }, [components]);

  // Get all components
  const getComponents = useCallback(() => {
    return Array.from(components.values());
  }, [components]);

  // Register default components on mount
  useEffect(() => {
    // Define our default components
    // In a real app, you'd import actual components here
    const defaultComponents: Component[] = [
      {
        id: 'email-list',
        name: 'Email List',
        icon: <Mail size={16} className="text-blue-400 mr-2" />,
        component: () => <div>Email List Component</div>,
        defaultProps: { view: 'inbox' }
      },
      {
        id: 'email-detail',
        name: 'Email Detail',
        icon: <Mail size={16} className="text-green-400 mr-2" />,
        component: () => <div>Email Detail Component</div>
      },
      {
        id: 'folder-explorer',
        name: 'Folder Explorer',
        icon: <FolderOpen size={16} className="text-yellow-400 mr-2" />,
        component: () => <div>Folder Explorer Component</div>
      },
      {
        id: 'contact-details',
        name: 'Contact Details',
        icon: <User size={16} className="text-purple-400 mr-2" />,
        component: () => <div>Contact Details Component</div>
      },
      {
        id: 'tag-manager',
        name: 'Tag Manager',
        icon: <Tag size={16} className="text-pink-400 mr-2" />,
        component: () => <div>Tag Manager Component</div>
      },
      {
        id: 'settings',
        name: 'Settings',
        icon: <Settings size={16} className="text-gray-400 mr-2" />,
        component: () => <div>Settings Component</div>
      },
      {
        id: 'integrations',
        name: 'Integrations',
        icon: <Plug size={16} className="text-indigo-400 mr-2" />,
        component: () => <div>Integrations Component</div>
      },
      {
        id: 'templates',
        name: 'Templates',
        icon: <FileText size={16} className="text-orange-400 mr-2" />,
        component: () => <div>Templates Component</div>
      }
    ];

    // Register all default components
    defaultComponents.forEach(component => {
      registerComponent(component);
    });

    // Cleanup on unmount
    return () => {
      defaultComponents.forEach(component => {
        unregisterComponent(component.id);
      });
    };
  }, [registerComponent, unregisterComponent]);

  // Create context value object
  const contextValue = {
    registerComponent,
    unregisterComponent,
    getComponent,
    getComponents
  };

  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
}

// Custom hook to use the component registry context
export function useComponentRegistry() {
  const context = useContext(ComponentContext);
  if (context === undefined) {
    throw new Error('useComponentRegistry must be used within a ComponentProvider');
  }
  return context;
}