import React, { createContext, useContext, useReducer, useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

// Define the search options interface
export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

// Define the search history item interface
export interface SearchHistoryItem {
  term: string;
  timestamp: number;
  options: SearchOptions;
  frequency: number;
}

// Define saved search interface
export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  options: SearchOptions;
  createdAt: string;
  lastUsed?: string;
  timesUsed?: number;
  isDefault?: boolean;
}

// Define search result type for different content types
export interface TextSearchResult {
  content: string;
  startIndex: number;
  endIndex: number;
  lineNumber?: number;
  context?: string; // Text surrounding the match
}

export interface ListSearchResult<T> {
  item: T;
  matchedFields: { field: string; matches: { startIndex: number; endIndex: number }[] }[];
}

export type SearchResult = TextSearchResult | ListSearchResult<any>;

// Define the search state interface
interface SearchState {
  isSearchActive: boolean;
  searchTerm: string;
  options: SearchOptions;
  currentComponentId: string | null;
  currentTabId: string | null;
  results: SearchResult[];
  currentResultIndex: number;
  history: SearchHistoryItem[];
  suggestions: string[];
  isSearching: boolean;
}

// Define the search actions
type SearchAction =
  | { type: 'ACTIVATE_SEARCH'; payload: { componentId: string; tabId: string } }
  | { type: 'DEACTIVATE_SEARCH' }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SEARCH_OPTIONS'; payload: Partial<SearchOptions> }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_CURRENT_RESULT_INDEX'; payload: number }
  | { type: 'NEXT_RESULT' }
  | { type: 'PREVIOUS_RESULT' }
  | { type: 'ADD_TO_HISTORY'; payload: { term: string; options: SearchOptions } }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'SAVE_SEARCH'; payload: string }
  | { type: 'REMOVE_FROM_HISTORY'; payload: string };

// Define the search context
interface SearchContextType {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
  activateSearch: (componentId: string, tabId: string) => void;
  deactivateSearch: () => void;
  performSearch: (term: string, adapter: SearchAdapter) => void;
  nextResult: () => void;
  previousResult: () => void;
  getSearchRegex: () => RegExp | null;
  updateSearchOptions: (options: Partial<SearchOptions>) => void;
  saveSearch: (name: string) => void;
}

// Define the search adapter interface that components implement
export interface SearchAdapter {
  search: (term: string, options: SearchOptions) => Promise<SearchResult[]>;
  highlightResults?: (results: SearchResult[], currentIndex: number) => void;
  scrollToResult?: (result: SearchResult) => void;
  clearHighlights?: () => void;
}

// Initial state
const initialState: SearchState = {
  isSearchActive: false,
  searchTerm: '',
  options: {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  },
  currentComponentId: null,
  currentTabId: null,
  results: [],
  currentResultIndex: -1,
  history: [],
  suggestions: [],
  isSearching: false,
};

// Create the search reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'ACTIVATE_SEARCH':
      return {
        ...state,
        isSearchActive: true,
        currentComponentId: action.payload.componentId,
        currentTabId: action.payload.tabId,
      };
    case 'DEACTIVATE_SEARCH':
      return {
        ...state,
        isSearchActive: false,
        searchTerm: '',
        results: [],
        currentResultIndex: -1,
      };
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
      };
    case 'SET_SEARCH_OPTIONS':
      return {
        ...state,
        options: {
          ...state.options,
          ...action.payload,
        },
      };
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        currentResultIndex: action.payload.length > 0 ? 0 : -1,
      };
    case 'SET_CURRENT_RESULT_INDEX':
      return {
        ...state,
        currentResultIndex: action.payload,
      };
    case 'NEXT_RESULT':
      return {
        ...state,
        currentResultIndex:
          state.results.length === 0
            ? -1
            : (state.currentResultIndex + 1) % state.results.length,
      };
    case 'PREVIOUS_RESULT':
      return {
        ...state,
        currentResultIndex:
          state.results.length === 0
            ? -1
            : (state.currentResultIndex - 1 + state.results.length) % state.results.length,
      };
    case 'ADD_TO_HISTORY': {
      const newItem = {
        term: action.payload.term,
        timestamp: Date.now(),
        options: action.payload.options,
        frequency: 1,
      };

      // Check if the term already exists in history
      const existingIndex = state.history.findIndex(item => item.term === action.payload.term);
      
      if (existingIndex >= 0) {
        // Update the existing item
        const updatedHistory = [...state.history];
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          timestamp: Date.now(),
          options: action.payload.options,
          frequency: updatedHistory[existingIndex].frequency + 1,
        };
        
        return {
          ...state,
          history: updatedHistory,
        };
      } else {
        // Add the new item to history
        return {
          ...state,
          history: [newItem, ...state.history.slice(0, 19)], // Keep only the 20 most recent
        };
      }
    }
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
      };
    case 'SET_IS_SEARCHING':
      return {
        ...state,
        isSearching: action.payload,
      };
    case 'SAVE_SEARCH': {
      // Create a saved search with a name
      const newHistory = [...state.history];
      const searchToSave = {
        term: state.searchTerm,
        timestamp: Date.now(),
        options: state.options,
        frequency: 1,
        saved: true,
        name: action.payload,
      };
      
      return {
        ...state,
        history: [searchToSave, ...newHistory],
      };
    }
    case 'REMOVE_FROM_HISTORY': {
      return {
        ...state,
        history: state.history.filter(item => item.term !== action.payload),
      };
    }
    default:
      return state;
  }
}

// Create the context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Create the context provider
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const [searchAdapters] = useState<Record<string, SearchAdapter>>({});

  // Register a search adapter for a component
  const registerSearchAdapter = useCallback((componentId: string, adapter: SearchAdapter) => {
    searchAdapters[componentId] = adapter;
  }, [searchAdapters]);

  // Unregister a search adapter
  const unregisterSearchAdapter = useCallback((componentId: string) => {
    delete searchAdapters[componentId];
  }, [searchAdapters]);

  // Function to create a RegExp based on search options
  const getSearchRegex = useCallback((): RegExp | null => {
    try {
      if (!state.searchTerm) return null;

      if (state.options.useRegex) {
        // User provided regex - honor their flags if they provided any
        return new RegExp(state.searchTerm, state.options.caseSensitive ? '' : 'i');
      } else {
        // Build regex from search term
        let pattern = state.options.wholeWord 
          ? `\\b${escapeRegExp(state.searchTerm)}\\b` 
          : escapeRegExp(state.searchTerm);
        
        return new RegExp(pattern, state.options.caseSensitive ? '' : 'i');
      }
    } catch (error) {
      console.error('Invalid search pattern:', error);
      return null;
    }
  }, [state.searchTerm, state.options]);

  // Activate search for a component
  const activateSearch = useCallback((componentId: string, tabId: string) => {
    dispatch({ type: 'ACTIVATE_SEARCH', payload: { componentId, tabId } });
  }, []);

  // Deactivate search
  const deactivateSearch = useCallback(() => {
    const { currentComponentId } = state;
    
    // Clear highlights using the component's adapter
    if (currentComponentId && searchAdapters[currentComponentId]?.clearHighlights) {
      searchAdapters[currentComponentId].clearHighlights();
    }
    
    dispatch({ type: 'DEACTIVATE_SEARCH' });
  }, [state, searchAdapters]);

  // Move to the next result
  const nextResult = useCallback(() => {
    dispatch({ type: 'NEXT_RESULT' });
  }, []);

  // Move to the previous result
  const previousResult = useCallback(() => {
    dispatch({ type: 'PREVIOUS_RESULT' });
  }, []);

  // Update search options
  const updateSearchOptions = useCallback((options: Partial<SearchOptions>) => {
    dispatch({ type: 'SET_SEARCH_OPTIONS', payload: options });
  }, []);

  // Save a search query
  const saveSearch = useCallback((name: string) => {
    dispatch({ type: 'SAVE_SEARCH', payload: name });
  }, []);

  // Perform search with debounce
  const debouncedSearch = useCallback(
    debounce(async (term: string, adapter: SearchAdapter) => {
      if (!term) {
        dispatch({ type: 'SET_RESULTS', payload: [] });
        return;
      }

      try {
        dispatch({ type: 'SET_IS_SEARCHING', payload: true });
        const results = await adapter.search(term, state.options);
        dispatch({ type: 'SET_RESULTS', payload: results });
        
        // Add successful search to history
        if (term.trim() && results.length > 0) {
          dispatch({ 
            type: 'ADD_TO_HISTORY', 
            payload: { term, options: state.options } 
          });
        }
        
        // Generate suggestions based on results
        const suggestions = generateSuggestions(term, results);
        dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
        
      } catch (error) {
        console.error('Search failed:', error);
        dispatch({ type: 'SET_RESULTS', payload: [] });
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING', payload: false });
      }
    }, 250),
    [state.options]
  );

  const performSearch = useCallback((term: string, adapter: SearchAdapter) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
    debouncedSearch(term, adapter);
  }, [debouncedSearch]);

  // Effect to highlight current result when it changes
  useEffect(() => {
    const { currentComponentId, results, currentResultIndex } = state;
    if (
      currentComponentId &&
      searchAdapters[currentComponentId]?.highlightResults &&
      results.length > 0 && 
      currentResultIndex >= 0
    ) {
      searchAdapters[currentComponentId].highlightResults(results, currentResultIndex);
      
      // Scroll to the current result
      if (searchAdapters[currentComponentId]?.scrollToResult) {
        searchAdapters[currentComponentId].scrollToResult(results[currentResultIndex]);
      }
    }
  }, [state.currentResultIndex, state.results, state.currentComponentId, searchAdapters]);

  // Listen for keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F to activate search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        // The active component and tab ID should be set by the app
        // This would typically come from a tab context or other app state
        if (state.currentTabId && state.currentComponentId) {
          activateSearch(state.currentComponentId, state.currentTabId);
        }
      }
      
      // Escape to deactivate search
      if (e.key === 'Escape' && state.isSearchActive) {
        e.preventDefault();
        deactivateSearch();
      }
      
      // F3 or Ctrl+G for next result
      if ((e.key === 'F3' || (e.ctrlKey && e.key === 'g')) && state.isSearchActive) {
        e.preventDefault();
        nextResult();
      }
      
      // Shift+F3 or Ctrl+Shift+G for previous result
      if ((e.shiftKey && e.key === 'F3') || (e.ctrlKey && e.shiftKey && e.key === 'g') && state.isSearchActive) {
        e.preventDefault();
        previousResult();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isSearchActive, state.currentTabId, state.currentComponentId, activateSearch, deactivateSearch, nextResult, previousResult]);

  return (
    <SearchContext.Provider
      value={{
        state,
        dispatch,
        activateSearch,
        deactivateSearch,
        performSearch,
        nextResult,
        previousResult,
        getSearchRegex,
        updateSearchOptions,
        saveSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

// Helper function to escape special characters in string for RegExp
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to generate search suggestions based on results
function generateSuggestions(term: string, results: SearchResult[]): string[] {
  // Simple implementation - could be enhanced with more sophisticated logic
  const suggestions: Set<string> = new Set();
  
  // Add variations of the current term
  if (term.length > 3) {
    suggestions.add(term.toLowerCase());
    suggestions.add(term.charAt(0).toUpperCase() + term.slice(1));
  }
  
  // Extract words from text search results
  results.forEach(result => {
    if ('content' in result) {
      // Text result
      const textResult = result as TextSearchResult;
      const words = textResult.content.split(/\s+/).filter(word => 
        word.length > 3 && word.toLowerCase() !== term.toLowerCase()
      );
      
      // Add a few related words
      words.slice(0, 3).forEach(word => suggestions.add(word));
    }
  });
  
  return Array.from(suggestions).slice(0, 5);
}

// Custom hook to use the search context
export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}