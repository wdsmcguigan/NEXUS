import React, { useState, useEffect } from 'react';
import { Search, Star, Paperclip, Tag, Calendar, Clock, User, Mail, CheckSquare, Save, Inbox, BookmarkIcon, MailX, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { useSearch, SearchAdapter, SearchOptions } from '../context/SearchContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface AdvancedSearchProps {
  componentId: string;
  tabId: string;
  searchAdapter: SearchAdapter;
  onSaveSearch?: (searchConfig: SavedSearch) => void;
  savedSearches?: SavedSearch[];
  onLoadSavedSearch?: (searchId: string) => void;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  searchFields: SearchFieldValues;
  options: SearchOptions;
  createdAt: string;
  lastUsed?: string;
  timesUsed?: number;
  color?: string;
  isDefault?: boolean;
}

export interface SearchFieldValues {
  query: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachments?: boolean;
  isStarred?: boolean;
  tags?: string[];
  folder?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  isRead?: boolean | null; // true = read, false = unread, null = both
  priority?: string;
}

export function AdvancedSearchPanel({
  componentId,
  tabId,
  searchAdapter,
  onSaveSearch,
  savedSearches = [],
  onLoadSavedSearch,
}: AdvancedSearchProps) {
  const { 
    state, 
    performSearch, 
    activateSearch, 
    updateSearchOptions,
    saveSearch
  } = useSearch();

  // Form state
  const [searchFields, setSearchFields] = useState<SearchFieldValues>({
    query: '',
    hasAttachments: false,
    isStarred: false,
    tags: [],
    isRead: null,
  });
  
  // Save search form state
  const [isSaveSearchOpen, setIsSaveSearchOpen] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [searchDescription, setSearchDescription] = useState<string>('');
  
  // Active state tracking
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  
  // Build a complex search query from all the search fields
  const buildSearchQuery = () => {
    const parts: string[] = [];
    
    // Add the main query term (global search)
    if (searchFields.query) {
      parts.push(searchFields.query);
    }
    
    // Add field-specific terms
    if (searchFields.from) {
      parts.push(`from:"${searchFields.from}"`);
    }
    
    if (searchFields.to) {
      parts.push(`to:"${searchFields.to}"`);
    }
    
    if (searchFields.subject) {
      parts.push(`subject:"${searchFields.subject}"`);
    }
    
    // Add Boolean filters
    if (searchFields.hasAttachments) {
      parts.push('has:attachment');
    }
    
    if (searchFields.isStarred) {
      parts.push('is:starred');
    }
    
    if (searchFields.isRead === true) {
      parts.push('is:read');
    } else if (searchFields.isRead === false) {
      parts.push('is:unread');
    }
    
    // Add tags
    if (searchFields.tags && searchFields.tags.length > 0) {
      searchFields.tags.forEach(tag => {
        parts.push(`tag:"${tag}"`);
      });
    }
    
    // Add folder
    if (searchFields.folder) {
      parts.push(`in:"${searchFields.folder}"`);
    }
    
    // Add date range
    if (searchFields.dateRange?.from) {
      parts.push(`after:${searchFields.dateRange.from.toISOString().split('T')[0]}`);
    }
    
    if (searchFields.dateRange?.to) {
      parts.push(`before:${searchFields.dateRange.to.toISOString().split('T')[0]}`);
    }
    
    // Join all parts with spaces
    return parts.join(' ');
  };
  
  // Perform the search with the built query
  const handleSearch = () => {
    const query = buildSearchQuery();
    
    performSearch(query, searchAdapter);
  };
  
  // Update a single search field
  const updateSearchField = (field: keyof SearchFieldValues, value: any) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Reset all search fields
  const resetSearch = () => {
    setSearchFields({
      query: '',
      hasAttachments: false,
      isStarred: false,
      tags: [],
      isRead: null,
    });
  };
  
  // Save the current search
  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    const newSavedSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: searchName,
      description: searchDescription,
      searchFields: { ...searchFields },
      options: { ...state.options },
      createdAt: new Date().toISOString(),
      timesUsed: 0,
    };
    
    // Call the external save handler if provided
    if (onSaveSearch) {
      onSaveSearch(newSavedSearch);
    }
    
    // Save in the search context
    saveSearch(searchName);
    
    // Reset the save form
    setSearchName('');
    setSearchDescription('');
    setIsSaveSearchOpen(false);
  };
  
  // Load a saved search
  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchFields(savedSearch.searchFields);
    updateSearchOptions(savedSearch.options);
    
    // Update usage statistics
    if (onLoadSavedSearch) {
      onLoadSavedSearch(savedSearch.id);
    }
    
    // Perform the search
    setTimeout(() => {
      handleSearch();
    }, 100);
  };
  
  // Group saved searches by their first letter
  const groupedSavedSearches = savedSearches.reduce((acc, search) => {
    const firstLetter = search.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(search);
    return acc;
  }, {} as Record<string, SavedSearch[]>);
  
  // When any search field changes, update the query
  useEffect(() => {
    if (isAdvancedMode) {
      handleSearch();
    }
  }, [searchFields, isAdvancedMode]);
  
  return (
    <div className="p-4 bg-neutral-900 rounded-md border border-neutral-800 max-w-4xl">
      {/* Toggle between simple and advanced search */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">
          {isAdvancedMode ? "Advanced Search" : "Quick Search"}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-400">Advanced</span>
          <Switch 
            checked={isAdvancedMode} 
            onCheckedChange={setIsAdvancedMode}
          />
        </div>
      </div>
      
      {/* Basic search input (always visible) */}
      <div className="flex space-x-2 mb-4">
        <Input
          placeholder="Search emails..."
          value={searchFields.query}
          onChange={(e) => updateSearchField('query', e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
      
      {/* Quick filters row (always visible) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={searchFields.hasAttachments ? "default" : "outline"} 
                size="sm" 
                onClick={() => updateSearchField('hasAttachments', !searchFields.hasAttachments)}
                className={searchFields.hasAttachments ? "bg-blue-600" : ""}
              >
                <Paperclip className="w-4 h-4 mr-1" />
                Attachments
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search for emails with attachments</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={searchFields.isStarred ? "default" : "outline"} 
                size="sm" 
                onClick={() => updateSearchField('isStarred', !searchFields.isStarred)}
                className={searchFields.isStarred ? "bg-yellow-600" : ""}
              >
                <Star className="w-4 h-4 mr-1" />
                Starred
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search starred emails</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={searchFields.isRead === false ? "default" : "outline"} 
                size="sm" 
                onClick={() => updateSearchField('isRead', searchFields.isRead === false ? null : false)}
                className={searchFields.isRead === false ? "bg-green-600" : ""}
              >
                <MailX className="w-4 h-4 mr-1" />
                Unread
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search unread emails</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetSearch}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear all search filters</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Saved searches button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-auto"
            >
              <BookmarkIcon className="w-4 h-4 mr-1" />
              Saved Searches
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h3 className="font-medium">Saved Searches</h3>
              
              {Object.keys(groupedSavedSearches).length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(groupedSavedSearches).map(([letter, searches]) => (
                    <AccordionItem key={letter} value={letter}>
                      <AccordionTrigger className="text-sm py-2">
                        {letter} <span className="text-neutral-500 ml-2">({searches.length})</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pt-1">
                          {searches.map(savedSearch => (
                            <div 
                              key={savedSearch.id}
                              className="flex items-center justify-between hover:bg-neutral-800 rounded px-2 py-1 cursor-pointer"
                              onClick={() => loadSavedSearch(savedSearch)}
                            >
                              <div>
                                <div className="text-sm font-medium">{savedSearch.name}</div>
                                {savedSearch.description && (
                                  <div className="text-xs text-neutral-400">{savedSearch.description}</div>
                                )}
                              </div>
                              {savedSearch.isDefault && (
                                <Badge variant="outline" className="text-xs ml-2">Default</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-sm text-neutral-500 py-2">No saved searches yet</div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full text-sm" 
                onClick={() => setIsSaveSearchOpen(true)}
                disabled={!searchFields.query && Object.keys(searchFields).length <= 1}
              >
                <Save className="w-3 h-3 mr-1" />
                Save Current Search
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Save search dialog */}
      {isSaveSearchOpen && (
        <div className="mt-4 p-4 border border-neutral-700 rounded-md bg-neutral-800 animate-in fade-in">
          <h3 className="text-sm font-medium mb-3">Save this search</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="search-name">Search name</Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="E.g., Important work emails"
                className="bg-neutral-900"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="search-description">Description (optional)</Label>
              <Input
                id="search-description"
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                placeholder="E.g., All work emails with attachments"
                className="bg-neutral-900"
              />
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsSaveSearchOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Search
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Advanced search panel (shown only in advanced mode) */}
      {isAdvancedMode && (
        <div className="mt-4 border-t border-neutral-700 pt-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From / To fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="from" className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  From
                </Label>
                <Input
                  id="from"
                  value={searchFields.from || ''}
                  onChange={(e) => updateSearchField('from', e.target.value)}
                  placeholder="Email address or name"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="to" className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  To
                </Label>
                <Input
                  id="to"
                  value={searchFields.to || ''}
                  onChange={(e) => updateSearchField('to', e.target.value)}
                  placeholder="Email address or name"
                />
              </div>
            </div>
            
            {/* Subject / Folder fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="subject" className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={searchFields.subject || ''}
                  onChange={(e) => updateSearchField('subject', e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="folder" className="flex items-center">
                  <Inbox className="w-4 h-4 mr-1" />
                  Folder
                </Label>
                <Select 
                  value={searchFields.folder || 'any'}
                  onValueChange={(value) => updateSearchField('folder', value === 'any' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700">
                    <SelectItem value="any">Any folder</SelectItem>
                    <SelectItem value="inbox">Inbox</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="drafts">Drafts</SelectItem>
                    <SelectItem value="archives">Archives</SelectItem>
                    <SelectItem value="trash">Trash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Date range */}
          <div className="mt-4 space-y-1">
            <Label className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Date Range
            </Label>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="flex items-center space-x-2">
                <Label className="text-xs whitespace-nowrap">From:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      {searchFields.dateRange?.from ? (
                        searchFields.dateRange.from.toLocaleDateString()
                      ) : (
                        <span className="text-neutral-500">Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700">
                    <DatePicker
                      mode="single"
                      selected={searchFields.dateRange?.from}
                      onSelect={(date) => updateSearchField('dateRange', {
                        ...searchFields.dateRange,
                        from: date
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label className="text-xs whitespace-nowrap">To:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      {searchFields.dateRange?.to ? (
                        searchFields.dateRange.to.toLocaleDateString()
                      ) : (
                        <span className="text-neutral-500">Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700">
                    <DatePicker
                      mode="single"
                      selected={searchFields.dateRange?.to}
                      onSelect={(date) => updateSearchField('dateRange', {
                        ...searchFields.dateRange,
                        to: date
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(searchFields.dateRange?.from || searchFields.dateRange?.to) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8"
                  onClick={() => updateSearchField('dateRange', undefined)}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Clear dates
                </Button>
              )}
            </div>
          </div>
          
          {/* Tags selection */}
          <div className="mt-4 space-y-2">
            <Label className="flex items-center">
              <Tag className="w-4 h-4 mr-1" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {/* Here we would map through available tags, but for now just offer a few examples */}
              {['Work', 'Personal', 'Important', 'Travel', 'Finance'].map(tag => (
                <Badge
                  key={tag}
                  variant={searchFields.tags?.includes(tag) ? "default" : "outline"}
                  onClick={() => {
                    const currentTags = searchFields.tags || [];
                    if (currentTags.includes(tag)) {
                      updateSearchField('tags', currentTags.filter(t => t !== tag));
                    } else {
                      updateSearchField('tags', [...currentTags, tag]);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Search options */}
          <div className="mt-4 border-t border-neutral-700 pt-4">
            <h3 className="text-sm font-medium">Search Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="case-sensitive" 
                  checked={state.options.caseSensitive}
                  onCheckedChange={(checked) => 
                    updateSearchOptions({ caseSensitive: !!checked })
                  }
                />
                <Label 
                  htmlFor="case-sensitive"
                  className="text-sm cursor-pointer"
                >
                  Case sensitive
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="whole-word" 
                  checked={state.options.wholeWord}
                  onCheckedChange={(checked) => 
                    updateSearchOptions({ wholeWord: !!checked })
                  }
                />
                <Label 
                  htmlFor="whole-word"
                  className="text-sm cursor-pointer"
                >
                  Match whole word
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-regex" 
                  checked={state.options.useRegex}
                  onCheckedChange={(checked) => 
                    updateSearchOptions({ useRegex: !!checked })
                  }
                />
                <Label 
                  htmlFor="use-regex"
                  className="text-sm cursor-pointer"
                >
                  Use regular expression
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}