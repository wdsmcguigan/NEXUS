import React from 'react';
import { MailIcon, Settings, FileText, Users, Bell, Calendar, ArchiveIcon, TagIcon, StarIcon, Inbox } from 'lucide-react';

// Import component types
// These are placeholders until we create or extract the actual components
type LeftSidebarType = React.ComponentType<any>;
type EmailListPaneType = React.ComponentType<any>;
type EmailDetailPaneType = React.ComponentType<any>;
type RightSidebarType = React.ComponentType<any>;
type BottomPaneType = React.ComponentType<{activeTab: string} & any>;
type TagManagerType = React.ComponentType<any>;

// We'll import these from their respective locations later
// For now, let's use the existing components from TabPanel.tsx as placeholders
const LeftSidebar: LeftSidebarType = (props) => <div>LeftSidebar Component</div>;
const EmailListPane: EmailListPaneType = (props) => <div>EmailListPane Component</div>;
const EmailDetailPane: EmailDetailPaneType = (props) => <div>EmailDetailPane Component</div>;
const RightSidebar: RightSidebarType = (props) => <div>RightSidebar Component</div>;
const BottomPane: BottomPaneType = (props) => <div>BottomPane Component with tab: {props.activeTab}</div>;
const TagManager: TagManagerType = (props) => <div>TagManager Component</div>;

// Categories for organizing components
export type ComponentCategory = 
  | 'email'
  | 'productivity'
  | 'settings'
  | 'contacts'
  | 'navigation'
  | 'management';

// Base interface for component registry entries
export interface ComponentRegistryEntry {
  id: string;
  displayName: string;
  component: React.ComponentType<any>;
  icon?: React.ReactNode;
  category: ComponentCategory;
  defaultProps?: Record<string, any>;
  defaultSize?: number;
  closeable?: boolean;
  singleton?: boolean; // Only one instance can be open at a time
  pinnable?: boolean; // Can be pinned to stay open
}

// Registry implementation
class Registry {
  private entries: Map<string, ComponentRegistryEntry> = new Map();

  register(entry: ComponentRegistryEntry): void {
    if (this.entries.has(entry.id)) {
      console.warn(`Component with id ${entry.id} already registered. Overwriting.`);
    }
    this.entries.set(entry.id, entry);
  }

  getEntry(id: string): ComponentRegistryEntry | undefined {
    return this.entries.get(id);
  }

  getAllEntries(): ComponentRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  getEntriesByCategory(category: ComponentCategory): ComponentRegistryEntry[] {
    return this.getAllEntries().filter(entry => entry.category === category);
  }
}

// Create and export the registry instance
export const componentRegistry = new Registry();

// Register all available components
// These would typically be registered by their respective modules
// We're doing it here centrally for simplicity
export function initializeRegistry() {
  // Email Components
  componentRegistry.register({
    id: 'leftSidebar',
    displayName: 'Navigation',
    component: LeftSidebar,
    icon: <Inbox size={16} />,
    category: 'navigation',
    defaultProps: {},
    closeable: false,
    singleton: true,
  });

  componentRegistry.register({
    id: 'emailList',
    displayName: 'Emails',
    component: EmailListPane,
    icon: <MailIcon size={16} />,
    category: 'email',
    defaultProps: {},
    singleton: false,
  });

  componentRegistry.register({
    id: 'emailDetail',
    displayName: 'Email View',
    component: EmailDetailPane,
    icon: <FileText size={16} />,
    category: 'email',
    defaultProps: {},
    singleton: false,
  });

  componentRegistry.register({
    id: 'rightSidebar',
    displayName: 'Details',
    component: RightSidebar,
    icon: <Users size={16} />,
    category: 'contacts',
    defaultProps: {},
    closeable: true,
    singleton: true,
  });

  // Management components
  componentRegistry.register({
    id: 'tagManager',
    displayName: 'Tag Manager',
    component: TagManager,
    icon: <TagIcon size={16} />,
    category: 'management',
    defaultProps: {},
    singleton: true,
  });

  // Bottom pane tabs
  componentRegistry.register({
    id: 'integrations',
    displayName: 'Integrations',
    component: BottomPane,
    icon: <Calendar size={16} />,
    category: 'productivity',
    defaultProps: { activeTab: 'integrations' },
    singleton: true,
  });

  componentRegistry.register({
    id: 'templates',
    displayName: 'Templates',
    component: BottomPane,
    icon: <FileText size={16} />,
    category: 'email',
    defaultProps: { activeTab: 'templates' },
    singleton: true,
  });

  componentRegistry.register({
    id: 'settings',
    displayName: 'Settings',
    component: BottomPane,
    icon: <Settings size={16} />,
    category: 'settings',
    defaultProps: { activeTab: 'settings' },
    singleton: true,
  });

  // Additional components that could be added
  componentRegistry.register({
    id: 'archived',
    displayName: 'Archived',
    component: EmailListPane,
    icon: <ArchiveIcon size={16} />,
    category: 'email',
    defaultProps: { view: 'Archived' },
    singleton: false,
  });

  componentRegistry.register({
    id: 'starred',
    displayName: 'Starred',
    component: EmailListPane,
    icon: <StarIcon size={16} />,
    category: 'email',
    defaultProps: { view: 'Starred' },
    singleton: false,
  });

  componentRegistry.register({
    id: 'notifications',
    displayName: 'Notifications',
    component: BottomPane,
    icon: <Bell size={16} />,
    category: 'productivity',
    defaultProps: { activeTab: 'notifications' },
    singleton: true,
  });
}

// Call this function once at app startup
// Typically in your main.tsx or App.tsx
export function ensureRegistryInitialized() {
  if (componentRegistry.getAllEntries().length === 0) {
    initializeRegistry();
  }
}