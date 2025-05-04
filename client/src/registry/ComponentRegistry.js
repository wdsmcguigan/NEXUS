// This file must be JavaScript, not TypeScript/JSX
import React from 'react';
import { MailIcon, Settings, FileText, Users, Bell, Calendar, ArchiveIcon, TagIcon, StarIcon, Inbox } from 'lucide-react';

/**
 * @typedef {Object} ComponentRegistryEntry
 * @property {string} id - Unique identifier for the component
 * @property {string} displayName - Human-readable name for the component
 * @property {Function} component - The React component
 * @property {Object} icon - Icon data to display with the component
 * @property {string} category - Category for organization
 * @property {Object} defaultProps - Default props for the component
 * @property {boolean} [closeable=true] - Whether the tab can be closed
 * @property {boolean} [singleton=false] - Whether only one instance can exist
 * @property {boolean} [pinnable=true] - Whether the tab can be pinned
 */

// Using function declarations for component placeholders instead of JSX
// In a real implementation, we would import the actual components
function LeftSidebar(props) { return React.createElement('div', {}, 'LeftSidebar Component'); }
function EmailListPane(props) { return React.createElement('div', {}, 'EmailListPane Component'); }
function EmailDetailPane(props) { return React.createElement('div', {}, 'EmailDetailPane Component'); }
function RightSidebar(props) { return React.createElement('div', {}, 'RightSidebar Component'); }
function BottomPane(props) { return React.createElement('div', {}, 'BottomPane Component with tab: ' + props.activeTab); }
function TagManager(props) { return React.createElement('div', {}, 'TagManager Component'); }

// Helper function to create icons
const createIcon = (IconComponent, size = 16) => {
  return { 
    component: IconComponent,
    size: size
  };
};

// Registry implementation
class Registry {
  constructor() {
    this.entries = new Map();
  }

  register(entry) {
    if (this.entries.has(entry.id)) {
      console.warn(`Component with id ${entry.id} already registered. Overwriting.`);
    }
    this.entries.set(entry.id, entry);
  }

  getEntry(id) {
    return this.entries.get(id);
  }

  getAllEntries() {
    return Array.from(this.entries.values());
  }

  getEntriesByCategory(category) {
    return this.getAllEntries().filter(entry => entry.category === category);
  }
}

// Create and export the registry instance
export const componentRegistry = new Registry();

// Register all available components
export function initializeRegistry() {
  // Email Components
  componentRegistry.register({
    id: 'leftSidebar',
    displayName: 'Navigation',
    component: LeftSidebar,
    icon: createIcon(Inbox),
    category: 'navigation',
    defaultProps: {},
    closeable: false,
    singleton: true,
  });

  componentRegistry.register({
    id: 'emailList',
    displayName: 'Emails',
    component: EmailListPane,
    icon: createIcon(MailIcon),
    category: 'email',
    defaultProps: {},
    singleton: false,
  });

  componentRegistry.register({
    id: 'emailDetail',
    displayName: 'Email View',
    component: EmailDetailPane,
    icon: createIcon(FileText),
    category: 'email',
    defaultProps: {},
    singleton: false,
  });

  componentRegistry.register({
    id: 'rightSidebar',
    displayName: 'Details',
    component: RightSidebar,
    icon: createIcon(Users),
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
    icon: createIcon(TagIcon),
    category: 'management',
    defaultProps: {},
    singleton: true,
  });

  // Bottom pane tabs
  componentRegistry.register({
    id: 'integrations',
    displayName: 'Integrations',
    component: BottomPane,
    icon: createIcon(Calendar),
    category: 'productivity',
    defaultProps: { activeTab: 'integrations' },
    singleton: true,
  });

  componentRegistry.register({
    id: 'templates',
    displayName: 'Templates',
    component: BottomPane,
    icon: createIcon(FileText),
    category: 'email',
    defaultProps: { activeTab: 'templates' },
    singleton: true,
  });

  componentRegistry.register({
    id: 'settings',
    displayName: 'Settings',
    component: BottomPane,
    icon: createIcon(Settings),
    category: 'settings',
    defaultProps: { activeTab: 'settings' },
    singleton: true,
  });

  // Additional components that could be added
  componentRegistry.register({
    id: 'archived',
    displayName: 'Archived',
    component: EmailListPane,
    icon: createIcon(ArchiveIcon),
    category: 'email',
    defaultProps: { view: 'Archived' },
    singleton: false,
  });

  componentRegistry.register({
    id: 'starred',
    displayName: 'Starred',
    component: EmailListPane,
    icon: createIcon(StarIcon),
    category: 'email',
    defaultProps: { view: 'Starred' },
    singleton: false,
  });

  componentRegistry.register({
    id: 'notifications',
    displayName: 'Notifications',
    component: BottomPane,
    icon: createIcon(Bell),
    category: 'productivity',
    defaultProps: { activeTab: 'notifications' },
    singleton: true,
  });
}

// Call this function once at app startup
export function ensureRegistryInitialized() {
  if (componentRegistry.getAllEntries().length === 0) {
    initializeRegistry();
  }
}

// Helper function to render icon
export function renderIcon(iconData) {
  if (!iconData) return null;
  
  const { component: IconComponent, size } = iconData;
  return React.createElement(IconComponent, { size });
}