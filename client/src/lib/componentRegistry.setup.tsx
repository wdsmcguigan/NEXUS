import React from 'react';
import { Inbox as InboxIcon, User as UserIcon, Settings as SettingsIcon, Tag as TagIcon, Mail as MailIcon, MailOpen as MailOpenIcon, FileText as FileTextIcon, Sliders as SlidersIcon, PanelLeft as PanelLeftIcon, Folder as FolderIcon, Search as SearchIcon } from 'lucide-react';
import componentRegistry, { defineComponent } from './componentRegistry';
import { PlaceholderComponent } from '../components/PlaceholderComponent';
import { TagManager } from '../components/TagManager';
import { SettingsPanel } from '../components/SettingsPanel';
import { EmailListPane } from '../components/EmailListPane';
import { EmailDetailPane } from '../components/EmailDetailPane';
import { FolderExplorer } from '../components/FolderExplorer';
import { EmailWorkspaceWithSearch } from '../components/EmailWorkspaceWithSearch';

// Helper types to patch missing imports
// In a real implementation, you would import these from their respective files
type ComponentProps = Record<string, any>;

// Create placeholder components for any missing components
const IntegrationsPanel: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Integrations" {...props} />
);

const TemplatesPanel: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Email Templates" {...props} />
);

// Register all the components
export function registerComponents() {
  // Email components
  defineComponent({
    id: 'email-list',
    displayName: 'Email List',
    category: 'email',
    icon: InboxIcon,
    component: EmailListPane,
    supportedPanelTypes: ['main', 'any'],
  });

  defineComponent({
    id: 'email-detail',
    displayName: 'Email Viewer',
    category: 'email',
    icon: MailOpenIcon,
    component: EmailDetailPane,
    supportedPanelTypes: ['main', 'any'],
  });

  // Navigation components
  defineComponent({
    id: 'folder-explorer',
    displayName: 'Folder Explorer',
    category: 'email',
    icon: FolderIcon,
    component: FolderExplorer,
    supportedPanelTypes: ['sidebar', 'any'],
  });

  defineComponent({
    id: 'contact-details',
    displayName: 'Contact Details',
    category: 'email',
    icon: UserIcon,
    component: (props: ComponentProps) => <PlaceholderComponent name="Contact Details" />,
    supportedPanelTypes: ['sidebar', 'any'],
  });

  // Utility components
  defineComponent({
    id: 'tag-manager',
    displayName: 'Tag Manager',
    category: 'tags',
    icon: TagIcon,
    component: TagManager,
    supportedPanelTypes: ['any'],
  });

  // Settings components
  defineComponent({
    id: 'settings',
    displayName: 'Settings',
    category: 'settings',
    icon: SettingsIcon,
    component: SettingsPanel,
    supportedPanelTypes: ['main', 'bottom', 'any'],
  });

  // Productivity components
  defineComponent({
    id: 'integrations',
    displayName: 'Integrations',
    category: 'productivity',
    icon: PanelLeftIcon,
    component: IntegrationsPanel,
    supportedPanelTypes: ['bottom', 'any'],
  });

  defineComponent({
    id: 'templates',
    displayName: 'Email Templates',
    category: 'productivity',
    icon: FileTextIcon,
    component: TemplatesPanel,
    supportedPanelTypes: ['bottom', 'any'],
  });
  
  // Search-enabled components
  defineComponent({
    id: 'email-workspace-searchable',
    displayName: 'Email Workspace (with Search)',
    category: 'email',
    icon: SearchIcon,
    component: EmailWorkspaceWithSearch,
    supportedPanelTypes: ['main', 'any'],
  });

  return componentRegistry;
}

export default registerComponents;