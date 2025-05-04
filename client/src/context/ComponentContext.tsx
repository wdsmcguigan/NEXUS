import React, { createContext, useContext, useEffect, useState } from 'react';
import { Mail, Inbox, FolderOpen, Settings, User, FileText, Palette, Hash, Zap } from 'lucide-react';

// Define types for component registry
export interface RegisteredComponent {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
}

export interface ComponentContextType {
  registerComponent: (component: RegisteredComponent) => void;
  unregisterComponent: (id: string) => void;
  getComponent: (id: string) => RegisteredComponent | undefined;
  getComponents: () => RegisteredComponent[];
  getComponentsByCategory: (category: string) => RegisteredComponent[];
}

// Create the context
const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

export function ComponentProvider({ children }: { children: React.ReactNode }) {
  const [components, setComponents] = useState<Map<string, RegisteredComponent>>(new Map());
  
  // Register a component
  const registerComponent = (component: RegisteredComponent) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.set(component.id, component);
      
      console.log(`Registered component: ${component.id}`);
      return newMap;
    });
  };
  
  // Unregister a component
  const unregisterComponent = (id: string) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };
  
  // Get a component by ID
  const getComponent = (id: string) => {
    return components.get(id);
  };
  
  // Get all components
  const getComponents = () => {
    return Array.from(components.values());
  };
  
  // Get components by category
  const getComponentsByCategory = (category: string) => {
    return Array.from(components.values()).filter(
      component => component.category === category
    );
  };
  
  // Register built-in components on mount
  useEffect(() => {
    // These are example registrations - the actual components would be imported
    // and used here instead of placeholders
    
    const registerDefaultComponents = () => {
      // Email-related components
      registerComponent({
        id: 'email-list',
        name: 'Email List',
        description: 'Display a list of emails',
        category: 'email',
        icon: <Mail size={16} className="text-blue-400" />,
        component: () => <div>Email List</div>,
      });
      
      registerComponent({
        id: 'email-detail',
        name: 'Email Viewer',
        description: 'View email content',
        category: 'email',
        icon: <FileText size={16} className="text-blue-400" />,
        component: () => <div>Email Detail</div>,
      });
      
      // Folder components
      registerComponent({
        id: 'folder-explorer',
        name: 'Folder Explorer',
        description: 'Navigate email folders',
        category: 'navigation',
        icon: <FolderOpen size={16} className="text-blue-400" />,
        component: () => <div>Folder Explorer</div>,
      });
      
      // Contact components
      registerComponent({
        id: 'contact-details',
        name: 'Contact Details',
        description: 'View contact information',
        category: 'contacts',
        icon: <User size={16} className="text-blue-400" />,
        component: () => <div>Contact Details</div>,
      });
      
      // Tag components
      registerComponent({
        id: 'tag-manager',
        name: 'Tag Manager',
        description: 'Manage email tags',
        category: 'organization',
        icon: <Hash size={16} className="text-blue-400" />,
        component: () => <div>Tag Manager</div>,
      });
      
      // Settings components
      registerComponent({
        id: 'settings',
        name: 'Settings',
        description: 'Configure application settings',
        category: 'settings',
        icon: <Settings size={16} className="text-blue-400" />,
        component: () => <div>Settings</div>,
      });
      
      // Integration components
      registerComponent({
        id: 'integrations',
        name: 'Integrations',
        description: 'Manage application integrations',
        category: 'settings',
        icon: <Zap size={16} className="text-blue-400" />,
        component: () => <div>Integrations</div>,
      });
      
      // Template components
      registerComponent({
        id: 'templates',
        name: 'Templates',
        description: 'Manage email templates',
        category: 'tools',
        icon: <Palette size={16} className="text-blue-400" />,
        component: () => <div>Templates</div>,
      });
    };
    
    registerDefaultComponents();
    
    // Cleanup function not needed as components persist for application lifetime
  }, []);
  
  const contextValue: ComponentContextType = {
    registerComponent,
    unregisterComponent,
    getComponent,
    getComponents,
    getComponentsByCategory,
  };
  
  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
}

// Custom hook to use the component context
export function useComponentRegistry() {
  const context = useContext(ComponentContext);
  
  if (context === undefined) {
    console.warn('useComponentRegistry must be used within a ComponentProvider');
    return null;
  }
  
  return context;
}