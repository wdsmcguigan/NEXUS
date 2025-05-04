import React from 'react';
import { Inbox as InboxIcon, User as UserIcon, Settings as SettingsIcon, Tag as TagIcon, Mail as MailIcon, MailOpen as MailOpenIcon, FileText as FileTextIcon, Sliders as SlidersIcon, PanelLeft as PanelLeftIcon, Folder as FolderIcon } from 'lucide-react';
import componentRegistry, { defineComponent } from './componentRegistry';

// Helper types to patch missing imports
// In a real implementation, you would import these from their respective files
// These are placeholders until the actual components are created
type ComponentProps = Record<string, any>;

// Create placeholder components for components that don't exist yet
const PlaceholderComponent: React.FC<{ name: string }> = ({ name }) => (
  <div className="h-full flex items-center justify-center text-neutral-400">
    <div className="text-center">
      <p className="mb-2 text-sm">{name} component</p>
      <p className="text-xs">This is a placeholder for the {name} component</p>
    </div>
  </div>
);

// Create placeholder components for any missing components
const IntegrationsPanel: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Integrations" />
);

const TemplatesPanel: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Templates" />
);

// Register all the components
export function registerComponents() {
  // Email components
  defineComponent({
    id: 'email-list',
    displayName: 'Email List',
    category: 'email',
    icon: InboxIcon,
    component: (props: ComponentProps) => <PlaceholderComponent name="Email List" />, 
    supportedPanelTypes: ['main', 'any'],
  });

  defineComponent({
    id: 'email-detail',
    displayName: 'Email Viewer',
    category: 'email',
    icon: MailOpenIcon,
    component: (props: ComponentProps) => <PlaceholderComponent name="Email Viewer" />,
    supportedPanelTypes: ['main', 'any'],
  });

  // Navigation components
  defineComponent({
    id: 'folder-explorer',
    displayName: 'Folder Explorer',
    category: 'email',
    icon: FolderIcon,
    component: (props: ComponentProps) => <PlaceholderComponent name="Folder Explorer" />,
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
    component: (props: ComponentProps) => <PlaceholderComponent name="Tag Manager" />,
    supportedPanelTypes: ['any'],
  });

  // Settings components
  defineComponent({
    id: 'settings',
    displayName: 'Settings',
    category: 'settings',
    icon: SettingsIcon,
    component: (props: ComponentProps) => <PlaceholderComponent name="Settings" />,
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

  return componentRegistry;
}

export default registerComponents;