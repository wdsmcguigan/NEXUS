import { AdvancedSearchComponent } from '../components/AdvancedSearchComponent';
import { defineComponent } from './componentRegistry';
import { Search } from 'lucide-react';

// Register advanced search components
export function registerAdvancedSearchComponents() {
  // Advanced search component
  defineComponent({
    id: 'advanced-search',
    displayName: 'Advanced Search',
    category: 'utility',
    icon: Search,
    component: AdvancedSearchComponent,
    supportedPanelTypes: ['main', 'any'],
  });
}

// Call this function when setting up the app
export default registerAdvancedSearchComponents;