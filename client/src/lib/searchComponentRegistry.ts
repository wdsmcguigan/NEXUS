import { EmailWorkspace } from '../components/EmailWorkspace';
import { defineComponent } from './componentRegistry';
import { Search } from 'lucide-react';

// Register search-enabled components
export function registerSearchComponents() {
  // Email workspace with search functionality
  defineComponent({
    id: 'email-workspace-searchable',
    displayName: 'Email Workspace (with Search)',
    category: 'email',
    icon: Search,
    component: EmailWorkspace,
    supportedPanelTypes: ['main', 'any'],
  });
}

// Call this function when setting up the app
export default registerSearchComponents;