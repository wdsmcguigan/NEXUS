import { useEffect, useRef } from 'react';
import { useSearch, SearchAdapter } from '../context/SearchContext';
import { useTabContext } from '../context/TabContext';

/**
 * Hook that registers a component's search adapter with the search system
 * and handles cleanup on unmount.
 * 
 * @param componentId The unique ID of the component
 * @param searchAdapter The search adapter implementation for this component
 * @returns Object with search state and handlers
 */
export function useComponentSearch(
  componentId: string,
  searchAdapter: SearchAdapter
) {
  const { state, activateSearch, performSearch } = useSearch();
  const { state: tabState } = useTabContext();
  const isRegisteredRef = useRef(false);
  
  // Find the tab ID that contains this component
  const findTabIdForComponent = (): string | null => {
    for (const [tabId, tab] of Object.entries(tabState.tabs)) {
      if (tab.componentId === componentId) {
        return tabId;
      }
    }
    return null;
  };
  
  // Register the search adapter for this component
  useEffect(() => {
    const registerAdapter = () => {
      // You would register with a global registry here
      isRegisteredRef.current = true;
      console.log(`Search adapter registered for component: ${componentId}`);
      
      // This is a mock implementation since we don't have a global registry yet
      // In a real implementation, you'd store this in context or another state management
      return () => {
        isRegisteredRef.current = false;
        console.log(`Search adapter unregistered for component: ${componentId}`);
      };
    };
    
    return registerAdapter();
  }, [componentId]);
  
  // Determine if the search is active for this component
  const isSearchActiveForThisComponent = 
    state.isSearchActive && state.currentComponentId === componentId;
  
  // Handle keyboard shortcut to activate search for this component
  const handleSearchActivation = () => {
    const tabId = findTabIdForComponent();
    if (tabId) {
      activateSearch(componentId, tabId);
    } else {
      console.warn(`Cannot activate search - no tab found for component: ${componentId}`);
    }
  };
  
  // Handle search operation for this component
  const handleSearch = (term: string) => {
    if (isRegisteredRef.current) {
      performSearch(term, searchAdapter);
    }
  };
  
  return {
    isSearchActive: isSearchActiveForThisComponent,
    searchTerm: state.searchTerm,
    searchResults: state.results,
    currentResultIndex: state.currentResultIndex,
    activateSearch: handleSearchActivation,
    performSearch: handleSearch,
  };
}