import React, { useState, useEffect, useRef } from 'react';
import { AdvancedSearchPanel, SavedSearch } from './AdvancedSearchPanel';
import { TextContentSearchAdapter } from '../lib/searchAdapters';
import { useSearch, SearchProvider } from '../context/SearchContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, BookmarkIcon, Save, FileDown, FileUp, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EXAMPLE_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'search-1',
    name: 'Important Work Emails',
    description: 'All emails with "important" in the subject from work domain',
    searchFields: {
      query: 'important',
      from: '@work.com',
      hasAttachments: false,
      isStarred: true,
      tags: ['Work', 'Important'],
      isRead: null,
    },
    options: {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    timesUsed: 12,
  },
  {
    id: 'search-2',
    name: 'Attachments from Sarah',
    description: 'Emails from Sarah with attachments',
    searchFields: {
      query: '',
      from: 'sarah',
      hasAttachments: true,
      isStarred: false,
      tags: [],
      isRead: null,
    },
    options: {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    timesUsed: 5,
  },
  {
    id: 'search-3',
    name: 'Project Updates',
    description: 'All emails related to project updates',
    searchFields: {
      query: 'project update status',
      subject: 'update',
      hasAttachments: false,
      isStarred: false,
      tags: ['Work', 'Project'],
      isRead: null,
    },
    options: {
      caseSensitive: false,
      wholeWord: true,
      useRegex: false,
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    timesUsed: 8,
  },
  {
    id: 'search-4',
    name: 'Unread Finance Emails',
    description: 'Unread emails with finance tag',
    searchFields: {
      query: '',
      hasAttachments: false,
      isStarred: false,
      tags: ['Finance'],
      isRead: false,
    },
    options: {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    isDefault: true,
    timesUsed: 25,
  },
];

interface AdvancedSearchComponentProps {
  id: string;
}

// A component that safely uses the SearchContext
function AdvancedSearchComponentInner({ id }: AdvancedSearchComponentProps) {
  const { performSearch, updateSearchOptions } = useSearch();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(EXAMPLE_SAVED_SEARCHES);
  const [activeTab, setActiveTab] = useState<string>('search');
  
  // Create a dummy content ref for the search adapter
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Create search adapter
  const [searchAdapter] = useState(() => new TextContentSearchAdapter(contentRef));
  
  // Handle saving a new search
  const handleSaveSearch = (newSearch: SavedSearch) => {
    setSavedSearches(prev => [newSearch, ...prev]);
  };
  
  // Handle loading a saved search
  const handleLoadSavedSearch = (searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      // Update usage statistics
      setSavedSearches(prev => 
        prev.map(s => 
          s.id === searchId 
            ? { 
                ...s, 
                lastUsed: new Date().toISOString(),
                timesUsed: (s.timesUsed || 0) + 1
              } 
            : s
        )
      );
    }
  };
  
  // Handle exporting saved searches
  const handleExportSearches = () => {
    try {
      const searchesJson = JSON.stringify(savedSearches, null, 2);
      const blob = new Blob([searchesJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus-saved-searches.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting searches:', error);
    }
  };
  
  // Handle importing saved searches
  const handleImportSearches = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedSearches = JSON.parse(event.target?.result as string) as SavedSearch[];
        setSavedSearches(prev => [...importedSearches, ...prev]);
      } catch (error) {
        console.error('Error importing searches:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    e.target.value = '';
  };
  
  return (
    <div className="h-full flex flex-col bg-neutral-950 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h1 className="text-lg font-medium flex items-center">
          <Search className="mr-2 h-5 w-5 text-blue-500" />
          Advanced Search
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="manage">Manage Searches</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <TabsContent value="search" className="h-full">
          <div className="max-w-4xl mx-auto">
            <AdvancedSearchPanel 
              componentId={`advanced-search-${id}`}
              tabId={`tab-${id}`}
              searchAdapter={searchAdapter}
              onSaveSearch={handleSaveSearch}
              savedSearches={savedSearches}
              onLoadSavedSearch={handleLoadSavedSearch}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="manage" className="h-full">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Manage Saved Searches</h2>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportSearches}
                  className="flex items-center"
                >
                  <FileDown className="mr-1 h-4 w-4" />
                  Export
                </Button>
                
                <div className="relative">
                  <Input
                    type="file"
                    id="search-import"
                    accept=".json"
                    onChange={handleImportSearches}
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    tabIndex={-1}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center"
                  >
                    <FileUp className="mr-1 h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              {savedSearches.length > 0 ? (
                savedSearches.map((search) => (
                  <div 
                    key={search.id}
                    className="p-4 border border-neutral-800 rounded-md hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-base font-medium">{search.name}</h3>
                          {search.isDefault && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-900/30 text-blue-400 border border-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                        {search.description && (
                          <p className="text-sm text-neutral-400 mt-1">{search.description}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const search = savedSearches.find(s => s.id === search.id);
                            if (search) {
                              // Make this the default search
                              setSavedSearches(prev => 
                                prev.map(s => ({
                                  ...s, 
                                  isDefault: s.id === search.id
                                }))
                              );
                            }
                          }}
                          className={`${search.isDefault ? 'text-blue-500' : 'text-neutral-400'}`}
                        >
                          <BookmarkIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Delete the search
                            setSavedSearches(prev => 
                              prev.filter(s => s.id !== search.id)
                            );
                          }}
                          className="text-red-500"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-neutral-500 flex flex-wrap gap-4">
                      <div>Created: {new Date(search.createdAt).toLocaleDateString()}</div>
                      {search.lastUsed && (
                        <div>Last used: {new Date(search.lastUsed).toLocaleDateString()}</div>
                      )}
                      {search.timesUsed !== undefined && (
                        <div>Used {search.timesUsed} times</div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <div className="text-xs text-neutral-500">Search query:</div>
                      <div className="font-mono text-xs mt-1 p-2 bg-neutral-900 rounded overflow-x-auto">
                        {search.searchFields.query || '(No query terms)'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <BookmarkIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No saved searches yet</p>
                  <p className="text-sm mt-1">Create searches to save them for later</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </div>
      
      {/* Hidden div for search adapter to use */}
      <div ref={contentRef} className="hidden"></div>
    </div>
  );
}

// Safe search context consumer that works regardless of context existence
function SearchContextConsumer({ children }: { children: (hasContext: boolean) => React.ReactNode }) {
  try {
    useSearch(); // This will throw if context is missing
    return <>{children(true)}</>;
  } catch (error) {
    return <>{children(false)}</>;
  }
}

// Wrapper component that provides SearchProvider if needed
export function AdvancedSearchComponent({ id }: AdvancedSearchComponentProps) {
  return (
    <SearchContextConsumer>
      {(hasContext) => {
        if (hasContext) {
          // We're already in a SearchProvider context
          return <AdvancedSearchComponentInner id={id} />;
        } else {
          // We need to provide our own SearchProvider
          return (
            <SearchProvider>
              <AdvancedSearchComponentInner id={id} />
            </SearchProvider>
          );
        }
      }}
    </SearchContextConsumer>
  );
}