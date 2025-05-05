# NEXUS.email Search System

## Overview

The Search System in NEXUS.email provides powerful and flexible search capabilities across all components of the application. It enables users to find content quickly, save search queries, and receive relevant results with optimal performance. The system features both simple search and advanced search with complex filtering options.

## Key Concepts

### Universal Search

Universal Search allows searching across all components in the application:
- Email content and metadata
- Contacts
- Calendar events
- Tasks
- Attachments
- Custom component content

### Component-Specific Search

Component-specific search provides targeted searching within a specific component:
- Email list search with field-specific queries
- Email content search
- Contact search
- Calendar search
- Attachment search

### Search Adapters

Search adapters are implemented by components to integrate with the search system:
- Define what content is searchable
- Control how content is indexed
- Determine how to display and highlight search results
- Handle component-specific search options

### Saved Searches

Saved searches allow users to store and reuse complex search queries:
- Named searches with descriptions
- Color coding for visual organization
- Usage tracking (times used, last used)
- Default search designation

## Core Components

### Search Architecture

```
+----------------------------------+
| Search UI Components             |
|  - Universal Search Bar          |
|  - Advanced Search Panel         |
|  - Saved Search Manager          |
+----------------------------------+
                |
+----------------------------------+
| Search Service                   |
|  - Query Processing              |
|  - Result Aggregation            |
|  - Search History                |
+----------------------------------+
                |
+----------------------------------+
| Component Search Adapters        |
|  - Email Search Adapter          |
|  - Contact Search Adapter        |
|  - Calendar Search Adapter       |
|  - Custom Component Adapters     |
+----------------------------------+
                |
+----------------------------------+
| Search Storage & Persistence     |
|  - Saved Search Repository       |
|  - Search Index (Optional)       |
|  - Search History Storage        |
+----------------------------------+
```

### Search Service

The `SearchService` provides the core search functionality:

```typescript
// Core interfaces
interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  maxResults?: number;
  includeArchived?: boolean;
  searchFields?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  title: string;
  preview: string;
  source: string;
  sourceId: string;
  type: string;
  url?: string;
  relevance: number;
  timestamp?: number;
  matches: SearchMatch[];
  metadata?: Record<string, any>;
}

interface SearchMatch {
  field: string;
  text: string;
  positions: Array<[number, number]>; // [start, end] pairs
}

// Search Service class
class SearchService {
  // Core search methods
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  searchComponent(componentId: string, query: string, options?: SearchOptions): Promise<SearchResult[]>;
  
  // Component registration
  registerSearchAdapter(componentId: string, adapter: SearchAdapter): void;
  unregisterSearchAdapter(componentId: string): void;
  
  // Saved searches
  getSavedSearches(): SavedSearch[];
  saveSearch(search: SavedSearch): string;
  updateSavedSearch(searchId: string, updates: Partial<SavedSearch>): boolean;
  deleteSavedSearch(searchId: string): boolean;
  executeSavedSearch(searchId: string): Promise<SearchResult[]>;
  
  // Search history
  getSearchHistory(limit?: number): SearchHistoryItem[];
  clearSearchHistory(): void;
  addToSearchHistory(query: string, resultCount: number): void;
}
```

### Search Adapter Interface

Search adapters are implemented by components to integrate with the search system:

```typescript
interface SearchAdapter {
  // Core search functionality
  search(query: string, options?: SearchOptions): Promise<SearchResult[]> | SearchResult[];
  
  // Optional methods
  getSearchableContent?(): string | Record<string, string>;
  getSupportedSearchFields?(): string[];
  getDefaultSearchOptions?(): SearchOptions;
  getSearchPlaceholder?(): string;
  highlightMatch?(content: string, match: SearchMatch): React.ReactNode;
}
```

### Saved Search Interface

Saved searches store complex search configurations:

```typescript
interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  searchFields?: SearchFieldValues;
  options: SearchOptions;
  createdAt: string;
  lastUsed?: string;
  timesUsed?: number;
  color?: string;
  isDefault?: boolean;
  category?: string;
  tags?: string[];
}

interface SearchFieldValues {
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
```

## UI Components

### Universal Search Bar

The Universal Search Bar provides a global search interface:

```tsx
interface UniversalSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  showSearchHistory?: boolean;
  maxHistoryItems?: number;
  onAdvancedSearch?: () => void;
}

function UniversalSearchBar({
  onSearch,
  placeholder = 'Search everything...',
  initialQuery = '',
  showSearchHistory = true,
  maxHistoryItems = 5,
  onAdvancedSearch
}: UniversalSearchBarProps) {
  // Implementation
}
```

### Advanced Search Panel

The Advanced Search Panel allows complex searches with multiple fields:

```tsx
interface AdvancedSearchProps {
  onSearch: (fields: SearchFieldValues, options: SearchOptions) => void;
  onSaveSearch?: (search: SavedSearch) => void;
  savedSearches?: SavedSearch[];
  onLoadSavedSearch?: (searchId: string) => void;
  initialValues?: SearchFieldValues;
  initialOptions?: SearchOptions;
}

function AdvancedSearchPanel({
  onSearch,
  onSaveSearch,
  savedSearches = [],
  onLoadSavedSearch,
  initialValues,
  initialOptions
}: AdvancedSearchProps) {
  // Implementation
}
```

### Search Results Panel

The Search Results Panel displays search results across components:

```tsx
interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  onResultClick: (result: SearchResult) => void;
  groupByType?: boolean;
  highlightMatches?: boolean;
}

function SearchResultsPanel({
  results,
  isLoading,
  query,
  onResultClick,
  groupByType = true,
  highlightMatches = true
}: SearchResultsProps) {
  // Implementation
}
```

### Saved Search Manager

The Saved Search Manager allows managing saved searches:

```tsx
interface SavedSearchManagerProps {
  savedSearches: SavedSearch[];
  onExecuteSearch: (searchId: string) => void;
  onUpdateSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  onDeleteSearch: (searchId: string) => void;
  onCreateSearch: () => void;
}

function SavedSearchManager({
  savedSearches,
  onExecuteSearch,
  onUpdateSearch,
  onDeleteSearch,
  onCreateSearch
}: SavedSearchManagerProps) {
  // Implementation
}
```

## Implementation Examples

### Basic Text Search Adapter

A simple adapter that searches text content:

```typescript
class TextSearchAdapter implements SearchAdapter {
  private content: string;
  private componentId: string;
  
  constructor(content: string, componentId: string) {
    this.content = content;
    this.componentId = componentId;
  }
  
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const { caseSensitive = false, wholeWord = false } = options;
    
    // Create flags for regex
    let flags = 'g';
    if (!caseSensitive) flags += 'i';
    
    // Create regex pattern
    let pattern = query;
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    
    const regex = new RegExp(pattern, flags);
    const matches: Array<[number, number]> = [];
    
    // Find all matches
    let match;
    while ((match = regex.exec(this.content)) !== null) {
      matches.push([match.index, match.index + match[0].length]);
    }
    
    if (matches.length > 0) {
      return [{
        id: `${this.componentId}-result`,
        title: 'Text Match',
        preview: this.getPreview(matches[0][0]),
        source: this.componentId,
        sourceId: this.componentId,
        type: 'text',
        relevance: 1.0,
        matches: [{
          field: 'content',
          text: this.content,
          positions: matches
        }]
      }];
    }
    
    return [];
  }
  
  private getPreview(matchIndex: number, contextLength: number = 50): string {
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(this.content.length, matchIndex + contextLength);
    
    let preview = this.content.substring(start, end);
    if (start > 0) preview = '...' + preview;
    if (end < this.content.length) preview = preview + '...';
    
    return preview;
  }
  
  getSearchableContent(): string {
    return this.content;
  }
  
  getSearchPlaceholder(): string {
    return 'Search text...';
  }
}
```

### Email Search Adapter

A more complex adapter for searching emails:

```typescript
class EmailSearchAdapter implements SearchAdapter {
  private emails: Email[];
  private componentId: string;
  
  constructor(emails: Email[], componentId: string) {
    this.emails = emails;
    this.componentId = componentId;
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { 
      caseSensitive = false, 
      maxResults = 50,
      includeArchived = false,
      searchFields = ['subject', 'body', 'from', 'to']
    } = options;
    
    // Handle custom search fields from AdvancedSearch
    const advancedFields = options.searchFields as any;
    if (advancedFields && typeof advancedFields === 'object') {
      return this.advancedSearch(advancedFields, options);
    }
    
    // Regular search
    const results: SearchResult[] = [];
    const queryLower = caseSensitive ? query : query.toLowerCase();
    
    // Filter emails
    for (const email of this.emails) {
      // Skip archived emails if not included
      if (email.isArchived && !includeArchived) continue;
      
      const matches: SearchMatch[] = [];
      
      // Check each field
      if (searchFields.includes('subject') && this.matchField(email.subject, queryLower, caseSensitive)) {
        matches.push(this.createMatch('subject', email.subject, queryLower, caseSensitive));
      }
      
      if (searchFields.includes('body') && this.matchField(email.body, queryLower, caseSensitive)) {
        matches.push(this.createMatch('body', email.body, queryLower, caseSensitive));
      }
      
      if (searchFields.includes('from') && this.matchField(email.from, queryLower, caseSensitive)) {
        matches.push(this.createMatch('from', email.from, queryLower, caseSensitive));
      }
      
      if (searchFields.includes('to') && this.matchField(email.to.join(', '), queryLower, caseSensitive)) {
        matches.push(this.createMatch('to', email.to.join(', '), queryLower, caseSensitive));
      }
      
      // Add result if matches found
      if (matches.length > 0) {
        results.push({
          id: email.id.toString(),
          title: email.subject,
          preview: this.getPreview(email.body, matches),
          source: 'email',
          sourceId: this.componentId,
          type: 'email',
          url: `/email/${email.id}`,
          relevance: this.calculateRelevance(matches),
          timestamp: new Date(email.date).getTime(),
          matches,
          metadata: {
            from: email.from,
            date: email.date,
            hasAttachments: email.hasAttachments,
            isRead: email.isRead,
            isStarred: email.isStarred
          }
        });
        
        // Limit results
        if (results.length >= maxResults) break;
      }
    }
    
    return results;
  }
  
  private advancedSearch(fields: SearchFieldValues, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Filter emails based on the advanced search fields
    for (const email of this.emails) {
      let matches = true;
      
      // Match general query
      if (fields.query && !this.matchAnyField(email, fields.query, options.caseSensitive)) {
        matches = false;
      }
      
      // Match specific fields
      if (fields.from && !this.matchField(email.from, fields.from, options.caseSensitive)) {
        matches = false;
      }
      
      if (fields.to && !this.matchField(email.to.join(', '), fields.to, options.caseSensitive)) {
        matches = false;
      }
      
      if (fields.subject && !this.matchField(email.subject, fields.subject, options.caseSensitive)) {
        matches = false;
      }
      
      // Match attachments
      if (fields.hasAttachments !== undefined && email.hasAttachments !== fields.hasAttachments) {
        matches = false;
      }
      
      // Match star status
      if (fields.isStarred !== undefined && email.isStarred !== fields.isStarred) {
        matches = false;
      }
      
      // Match read status
      if (fields.isRead !== null && fields.isRead !== undefined && email.isRead !== fields.isRead) {
        matches = false;
      }
      
      // Match date range
      if (fields.dateRange) {
        const emailDate = new Date(email.date);
        
        if (fields.dateRange.from && emailDate < fields.dateRange.from) {
          matches = false;
        }
        
        if (fields.dateRange.to) {
          const endDate = new Date(fields.dateRange.to);
          endDate.setHours(23, 59, 59, 999); // End of day
          
          if (emailDate > endDate) {
            matches = false;
          }
        }
      }
      
      // Match folder
      if (fields.folder && email.folder !== fields.folder) {
        matches = false;
      }
      
      // Match tags
      if (fields.tags && fields.tags.length > 0) {
        const emailTags = email.tags || [];
        const hasAllTags = fields.tags.every(tag => emailTags.includes(tag));
        
        if (!hasAllTags) {
          matches = false;
        }
      }
      
      // Add matching email to results
      if (matches) {
        results.push({
          id: email.id.toString(),
          title: email.subject,
          preview: this.getShortPreview(email.body),
          source: 'email',
          sourceId: this.componentId,
          type: 'email',
          url: `/email/${email.id}`,
          relevance: 1.0,
          timestamp: new Date(email.date).getTime(),
          matches: [],
          metadata: {
            from: email.from,
            date: email.date,
            hasAttachments: email.hasAttachments,
            isRead: email.isRead,
            isStarred: email.isStarred
          }
        });
      }
    }
    
    return results;
  }
  
  private matchField(text: string, query: string, caseSensitive: boolean): boolean {
    if (!caseSensitive) {
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return text.includes(query);
  }
  
  private matchAnyField(email: Email, query: string, caseSensitive: boolean): boolean {
    return (
      this.matchField(email.subject, query, caseSensitive) ||
      this.matchField(email.body, query, caseSensitive) ||
      this.matchField(email.from, query, caseSensitive) ||
      this.matchField(email.to.join(', '), query, caseSensitive)
    );
  }
  
  private createMatch(field: string, text: string, query: string, caseSensitive: boolean): SearchMatch {
    const positions: Array<[number, number]> = [];
    let searchText = text;
    let searchQuery = query;
    
    if (!caseSensitive) {
      searchText = text.toLowerCase();
      searchQuery = query.toLowerCase();
    }
    
    let index = searchText.indexOf(searchQuery);
    while (index !== -1) {
      positions.push([index, index + searchQuery.length]);
      index = searchText.indexOf(searchQuery, index + 1);
    }
    
    return {
      field,
      text,
      positions
    };
  }
  
  private getPreview(text: string, matches: SearchMatch[]): string {
    // Find the first content match (body)
    const bodyMatch = matches.find(m => m.field === 'body');
    
    if (bodyMatch && bodyMatch.positions.length > 0) {
      const [start] = bodyMatch.positions[0];
      return this.getShortPreview(text, start);
    }
    
    return this.getShortPreview(text);
  }
  
  private getShortPreview(text: string, matchIndex: number = 0): string {
    // Strip HTML tags
    const plainText = text.replace(/<[^>]*>/g, '');
    
    const previewLength = 120;
    const startPos = Math.max(0, matchIndex - 40);
    const endPos = Math.min(plainText.length, startPos + previewLength);
    
    let preview = plainText.substring(startPos, endPos).trim();
    
    // Add ellipsis if truncated
    if (startPos > 0) preview = '...' + preview;
    if (endPos < plainText.length) preview = preview + '...';
    
    return preview;
  }
  
  private calculateRelevance(matches: SearchMatch[]): number {
    // Simple relevance calculation
    let relevance = 1.0;
    
    // Subject matches are more relevant
    const subjectMatches = matches.find(m => m.field === 'subject');
    if (subjectMatches) {
      relevance += 0.5;
    }
    
    // More matches = more relevant
    const totalMatches = matches.reduce((sum, match) => sum + match.positions.length, 0);
    relevance += Math.min(0.5, totalMatches * 0.1);
    
    return relevance;
  }
  
  getSupportedSearchFields(): string[] {
    return ['subject', 'body', 'from', 'to', 'date', 'hasAttachments', 'isRead', 'isStarred', 'folder', 'tags'];
  }
  
  getDefaultSearchOptions(): SearchOptions {
    return {
      caseSensitive: false,
      includeArchived: false,
      maxResults: 50,
      searchFields: ['subject', 'body', 'from', 'to']
    };
  }
  
  getSearchPlaceholder(): string {
    return 'Search emails...';
  }
}
```

### Component Integration

Adding search capability to a component:

```tsx
import { useSearchAdapter } from '../hooks/useSearch';

function EmailListWithSearch({ emails }) {
  // Create a search adapter for this component
  const { 
    searchQuery, 
    searchResults, 
    isSearching,
    search,
    clearSearch
  } = useSearchAdapter(
    new EmailSearchAdapter(emails, 'email-list')
  );
  
  // Determine which emails to display
  const displayEmails = searchQuery ? searchResults : emails;
  
  return (
    <div className="email-list-container">
      <div className="email-list-header">
        <input
          type="text"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
        />
        {searchQuery && (
          <button onClick={clearSearch}>Clear</button>
        )}
      </div>
      
      {isSearching ? (
        <div className="loading">Searching...</div>
      ) : (
        <div className="email-list">
          {displayEmails.map(email => (
            <EmailListItem 
              key={email.id} 
              email={email}
              isSearchResult={!!searchQuery}
            />
          ))}
          
          {searchQuery && displayEmails.length === 0 && (
            <div className="no-results">No emails found matching "{searchQuery}"</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Advanced Search Implementation

Creating an advanced search panel:

```tsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schema for advanced search
const searchSchema = z.object({
  query: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isRead: z.enum(['read', 'unread', 'any']).default('any'),
  priority: z.enum(['high', 'medium', 'low', 'any']).default('any'),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional()
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function AdvancedSearchPanel({ onSearch, onSaveSearch, savedSearches = [] }) {
  const [activeTab, setActiveTab] = useState('search');
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      from: '',
      to: '',
      subject: '',
      hasAttachments: false,
      isStarred: false,
      isRead: 'any',
      priority: 'any',
    }
  });
  
  const handleSubmit = (values: SearchFormValues) => {
    // Convert form values to search fields
    const searchFields: SearchFieldValues = {
      query: values.query || '',
      from: values.from,
      to: values.to,
      subject: values.subject,
      hasAttachments: values.hasAttachments,
      isStarred: values.isStarred,
      dateRange: values.dateFrom || values.dateTo ? {
        from: values.dateFrom,
        to: values.dateTo
      } : undefined,
      isRead: values.isRead === 'read' 
        ? true 
        : values.isRead === 'unread' 
          ? false 
          : null,
      folder: values.folder,
      tags: values.tags
    };
    
    // Create search options
    const searchOptions: SearchOptions = {
      caseSensitive: false,
      includeArchived: false,
      maxResults: 100
    };
    
    onSearch(searchFields, searchOptions);
  };
  
  const handleSaveSearch = () => {
    const values = form.getValues();
    
    // Create a saved search
    const savedSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: window.prompt('Enter a name for this search:') || 'Untitled Search',
      searchFields: {
        query: values.query || '',
        from: values.from,
        to: values.to,
        subject: values.subject,
        hasAttachments: values.hasAttachments,
        isStarred: values.isStarred,
        dateRange: values.dateFrom || values.dateTo ? {
          from: values.dateFrom,
          to: values.dateTo
        } : undefined,
        isRead: values.isRead === 'read' 
          ? true 
          : values.isRead === 'unread' 
            ? false 
            : null,
        folder: values.folder,
        tags: values.tags
      },
      options: {
        caseSensitive: false,
        includeArchived: false,
        maxResults: 100
      },
      createdAt: new Date().toISOString(),
      timesUsed: 0
    };
    
    onSaveSearch(savedSearch);
  };
  
  const handleLoadSearch = (searchId: string) => {
    const savedSearch = savedSearches.find(s => s.id === searchId);
    if (!savedSearch) return;
    
    // Load values into form
    const formValues: SearchFormValues = {
      query: savedSearch.searchFields.query || '',
      from: savedSearch.searchFields.from || '',
      to: savedSearch.searchFields.to || '',
      subject: savedSearch.searchFields.subject || '',
      hasAttachments: savedSearch.searchFields.hasAttachments || false,
      isStarred: savedSearch.searchFields.isStarred || false,
      dateFrom: savedSearch.searchFields.dateRange?.from,
      dateTo: savedSearch.searchFields.dateRange?.to,
      isRead: savedSearch.searchFields.isRead === true 
        ? 'read' 
        : savedSearch.searchFields.isRead === false 
          ? 'unread' 
          : 'any',
      priority: 'any',
      folder: savedSearch.searchFields.folder,
      tags: savedSearch.searchFields.tags || []
    };
    
    form.reset(formValues);
    
    // Go to search tab
    setActiveTab('search');
  };
  
  return (
    <div className="advanced-search-panel">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="saved">Saved Searches ({savedSearches.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* General search */}
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search</FormLabel>
                    <FormControl>
                      <Input placeholder="Search in all fields..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Email fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input placeholder="Sender..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input placeholder="Recipient..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          placeholder="Select date..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          placeholder="Select date..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hasAttachments"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Has Attachments</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isStarred"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Starred</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isRead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Read Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="unread">Unread</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Folder selection */}
              <FormField
                control={form.control}
                name="folder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inbox">Inbox</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="drafts">Drafts</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                        <SelectItem value="trash">Trash</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Action buttons */}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleSaveSearch}>
                  Save Search
                </Button>
                <Button type="submit">Search</Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="saved-searches">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved searches yet. Create and save a search to see it here.
              </div>
            ) : (
              <div className="space-y-4">
                {savedSearches.map(search => (
                  <div 
                    key={search.id} 
                    className="p-4 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleLoadSearch(search.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{search.name}</h3>
                        {search.description && (
                          <p className="text-sm text-muted-foreground">{search.description}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {search.timesUsed} uses
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs">
                      {search.searchFields.query && (
                        <span className="mr-2">"{search.searchFields.query}"</span>
                      )}
                      {search.searchFields.from && (
                        <span className="mr-2">From: {search.searchFields.from}</span>
                      )}
                      {search.searchFields.hasAttachments && (
                        <span className="mr-2">Has Attachments</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Integration with Component Registry

The search system integrates with the Component Registry:

```typescript
// In enhancedComponentRegistry.ts
interface EnhancedComponentDefinition {
  // ... other properties
  supportsSearch?: boolean;
  searchAdapter?: SearchAdapter;
}

// When registering a component
defineEnhancedComponent({
  id: 'email-list',
  displayName: 'Email List',
  component: EmailListComponent,
  supportsSearch: true,
  searchAdapter: new EmailSearchAdapter(emails, 'email-list')
});
```

## Integration with Universal Search

Connecting component searches to the universal search:

```typescript
// In SearchService.ts
class SearchService {
  // ... other methods
  
  // Search across all components
  async searchAll(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    
    // Get all components with search adapters
    const components = componentRegistry.getAllComponents()
      .filter(comp => comp.supportsSearch && comp.searchAdapter);
    
    // Execute searches in parallel
    const searchPromises = components.map(async (component) => {
      try {
        const componentResults = await component.searchAdapter!.search(query, options);
        return componentResults;
      } catch (error) {
        console.error(`Error searching component ${component.id}:`, error);
        return [];
      }
    });
    
    // Wait for all searches to complete
    const resultsArray = await Promise.all(searchPromises);
    
    // Flatten and add to all results
    resultsArray.forEach(results => {
      allResults.push(...results);
    });
    
    // Sort by relevance
    allResults.sort((a, b) => b.relevance - a.relevance);
    
    return allResults;
  }
}
```

## Best Practices

### 1. Performance Optimization

Optimize search performance for large datasets:

```typescript
// Techniques for more efficient searches

// 1. Use throttling/debouncing for live search
const debouncedSearch = useMemo(
  () => debounce((query) => performSearch(query), 300),
  [performSearch]
);

// 2. Implement progressive loading for large result sets
function SearchResultsList({ results, isLoading }) {
  const [visibleResults, setVisibleResults] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  
  useEffect(() => {
    setVisibleResults(results.slice(0, page * PAGE_SIZE));
  }, [results, page]);
  
  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  return (
    <div>
      {visibleResults.map(result => (
        <SearchResultItem key={result.id} result={result} />
      ))}
      
      {visibleResults.length < results.length && (
        <Button onClick={loadMore}>
          Load More ({visibleResults.length} of {results.length})
        </Button>
      )}
    </div>
  );
}

// 3. Implement indexing for text search
class IndexedTextSearchAdapter implements SearchAdapter {
  private index: Record<string, Set<number>> = {};
  private content: string;
  
  constructor(content: string) {
    this.content = content;
    this.buildIndex();
  }
  
  private buildIndex() {
    // Split content into words
    const words = this.content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Build inverted index (word -> positions)
    words.forEach((word, position) => {
      if (!this.index[word]) {
        this.index[word] = new Set();
      }
      this.index[word].add(position);
    });
  }
  
  search(query: string): SearchResult[] {
    const searchWords = query.toLowerCase().split(/\s+/);
    
    // Find positions for each word
    const wordPositions = searchWords
      .map(word => this.index[word] || new Set())
      .filter(positions => positions.size > 0);
    
    if (wordPositions.length === 0) {
      return [];
    }
    
    // Find positions that match all words
    const positions = Array.from(wordPositions[0]);
    
    // Get context for each match
    const matches = positions.map(position => {
      const start = Math.max(0, position - 5);
      const end = Math.min(this.content.split(/\s+/).length, position + 5);
      const preview = this.content.split(/\s+/).slice(start, end).join(' ');
      
      return {
        position,
        preview
      };
    });
    
    // Return search results
    return [{
      id: 'text-result',
      title: 'Text Match',
      preview: matches[0].preview,
      source: 'text',
      sourceId: 'text',
      type: 'text',
      relevance: 1.0,
      matches: [{
        field: 'content',
        text: this.content,
        positions: [[matches[0].position, matches[0].position + query.length]]
      }]
    }];
  }
}
```

### 2. Highlighting Search Results

Implement result highlighting for better user experience:

```tsx
function HighlightedText({ text, matches }: { text: string, matches: Array<[number, number]> }) {
  // No matches, just return the text
  if (!matches || matches.length === 0) {
    return <>{text}</>;
  }
  
  // Sort matches by start position
  const sortedMatches = [...matches].sort((a, b) => a[0] - b[0]);
  
  // Create segments (highlighted and non-highlighted)
  const segments: Array<{ text: string, highlighted: boolean }> = [];
  let lastIndex = 0;
  
  sortedMatches.forEach(([start, end]) => {
    // Add non-highlighted segment before match
    if (start > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, start),
        highlighted: false
      });
    }
    
    // Add highlighted segment
    segments.push({
      text: text.substring(start, end),
      highlighted: true
    });
    
    lastIndex = end;
  });
  
  // Add remaining non-highlighted text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      highlighted: false
    });
  }
  
  // Render segments
  return (
    <>
      {segments.map((segment, index) => (
        segment.highlighted ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </>
  );
}
```

### 3. Search History Management

Implement search history for better user experience:

```typescript
// In SearchService.ts
class SearchService {
  private searchHistory: SearchHistoryItem[] = [];
  
  // Add search to history
  addToSearchHistory(query: string, resultCount: number): void {
    // Don't add empty searches
    if (!query.trim()) return;
    
    // Check if query already exists in history
    const existingIndex = this.searchHistory.findIndex(
      item => item.query === query
    );
    
    const historyItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
      lastUsed: Date.now()
    };
    
    if (existingIndex >= 0) {
      // Update existing item
      this.searchHistory[existingIndex].count++;
      this.searchHistory[existingIndex].lastUsed = Date.now();
      this.searchHistory[existingIndex].resultCount = resultCount;
    } else {
      // Add new item (limit history size)
      this.searchHistory.unshift(historyItem);
      
      // Limit history size
      if (this.searchHistory.length > 100) {
        this.searchHistory = this.searchHistory.slice(0, 100);
      }
    }
    
    // Persist history
    this.saveSearchHistory();
  }
  
  // Get recent searches
  getRecentSearches(limit: number = 10): SearchHistoryItem[] {
    return this.searchHistory
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit);
  }
  
  // Get popular searches
  getPopularSearches(limit: number = 10): SearchHistoryItem[] {
    return this.searchHistory
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  // Save search history to storage
  private saveSearchHistory(): void {
    try {
      localStorage.setItem(
        'nexus-search-history',
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }
  
  // Load search history from storage
  private loadSearchHistory(): void {
    try {
      const storedHistory = localStorage.getItem('nexus-search-history');
      if (storedHistory) {
        this.searchHistory = JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }
}
```

### 4. Search Field Validation

Implement validation for search fields:

```typescript
// Advanced search form schema with validation
const advancedSearchSchema = z.object({
  query: z.string().optional(),
  from: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  to: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  subject: z.string().max(100, "Subject cannot exceed 100 characters").optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  hasAttachments: z.boolean().optional(),
  isStarred: z.boolean().optional()
}).refine(data => {
  // If dateFrom and dateTo are both provided, make sure dateTo is not before dateFrom
  if (data.dateFrom && data.dateTo) {
    return data.dateTo >= data.dateFrom;
  }
  return true;
}, {
  message: "End date cannot be before start date",
  path: ["dateTo"]
});
```

### 5. Saved Search Management

Implement intelligent saved search suggestions:

```typescript
// In SavedSearchManager.js
function getRecommendedSearches(user, recentActivity) {
  const recommendations = [];
  
  // Recommend searches for frequent contacts
  if (recentActivity.frequentContacts.length > 0) {
    const contact = recentActivity.frequentContacts[0];
    recommendations.push({
      id: `recommended-${contact.email}`,
      name: `Emails from ${contact.name}`,
      description: `Recent conversations with ${contact.name}`,
      searchFields: {
        query: '',
        from: contact.email
      },
      options: {
        caseSensitive: false,
        includeArchived: false
      },
      isRecommended: true
    });
  }
  
  // Recommend searches for recent attachments
  if (recentActivity.hasRecentAttachments) {
    recommendations.push({
      id: 'recommended-attachments',
      name: 'Recent attachments',
      description: 'Emails with attachments from the last 7 days',
      searchFields: {
        query: '',
        hasAttachments: true,
        dateRange: {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      options: {
        includeArchived: true
      },
      isRecommended: true
    });
  }
  
  return recommendations;
}
```

## Troubleshooting

### Search Not Finding Expected Results

**Issue**: Search isn't finding content that should match.
**Solution**:
1. Check if the search is case-sensitive
2. Verify the search adapter is handling special characters properly
3. Confirm the content being searched includes the expected text
4. Check if the search is limited to specific fields that don't contain the text

### Slow Search Performance

**Issue**: Searches are taking too long to complete.
**Solution**:
1. Implement proper indexing for large datasets
2. Limit the scope of searches to relevant fields
3. Implement pagination for results
4. Consider preprocessing searchable content
5. Use debouncing for live search to reduce number of searches

### Advanced Search Not Working

**Issue**: Advanced search filters aren't correctly applied.
**Solution**:
1. Check that field names match between UI and search adapter
2. Verify date comparisons are handling timezone issues
3. Ensure filter logic is using proper AND/OR combinations
4. Test filters individually to isolate the problematic one

### Search Results Not Displayed Properly

**Issue**: Search results are not rendering correctly.
**Solution**:
1. Check that the result format matches the expected format in UI
2. Verify highlighting logic is handling edge cases properly
3. Ensure the result object has all required fields
4. Test with simpler results to isolate UI vs. data issues

## Advanced Topics

### Custom Query Language

Implement a custom query language for power users:

```typescript
// Simple query language parser
function parseAdvancedQuery(query: string): SearchFieldValues {
  const fields: SearchFieldValues = {
    query: ''
  };
  
  // Extract field-specific queries (field:value)
  const fieldQueries = query.match(/(\w+):"([^"]+)"/g) || [];
  let remainingQuery = query;
  
  // Process each field query
  fieldQueries.forEach(fieldQuery => {
    const match = fieldQuery.match(/(\w+):"([^"]+)"/);
    if (match) {
      const [fullMatch, field, value] = match;
      
      // Remove this part from the remaining query
      remainingQuery = remainingQuery.replace(fullMatch, '');
      
      // Handle specific fields
      switch (field.toLowerCase()) {
        case 'from':
          fields.from = value;
          break;
        case 'to':
          fields.to = value;
          break;
        case 'subject':
          fields.subject = value;
          break;
        case 'has':
          if (value.toLowerCase() === 'attachment' || value.toLowerCase() === 'attachments') {
            fields.hasAttachments = true;
          }
          break;
        case 'is':
          if (value.toLowerCase() === 'starred') {
            fields.isStarred = true;
          } else if (value.toLowerCase() === 'read') {
            fields.isRead = true;
          } else if (value.toLowerCase() === 'unread') {
            fields.isRead = false;
          }
          break;
        case 'in':
          fields.folder = value;
          break;
        case 'tag':
        case 'tags':
          fields.tags = fields.tags || [];
          fields.tags.push(value);
          break;
      }
    }
  });
  
  // Set the remaining query as the general query
  fields.query = remainingQuery.trim();
  
  return fields;
}

// Usage:
// parseAdvancedQuery('from:"john@example.com" has:"attachment" important meeting')
// Result: { query: 'important meeting', from: 'john@example.com', hasAttachments: true }
```

### Search Analytics

Implement analytics to improve search over time:

```typescript
// In SearchService.ts
class SearchService {
  // Track search analytics
  private trackSearchAnalytics(query: string, results: SearchResult[], duration: number): void {
    const analytics = {
      query,
      timestamp: Date.now(),
      resultCount: results.length,
      duration,
      hasResults: results.length > 0,
      topResults: results.slice(0, 3).map(r => ({
        id: r.id,
        source: r.source,
        type: r.type,
        relevance: r.relevance
      }))
    };
    
    // Save analytics locally
    this.searchAnalytics.push(analytics);
    
    // Limit stored analytics
    if (this.searchAnalytics.length > 1000) {
      this.searchAnalytics = this.searchAnalytics.slice(-1000);
    }
    
    // Send to server if enabled
    if (this.analyticsEnabled) {
      this.sendAnalyticsToServer(analytics);
    }
  }
  
  // Use analytics to improve search
  private getSearchSuggestions(partialQuery: string): string[] {
    if (!partialQuery || partialQuery.length < 2) return [];
    
    // Find relevant past searches
    const relevantSearches = this.searchAnalytics
      .filter(a => 
        a.query.toLowerCase().includes(partialQuery.toLowerCase()) &&
        a.hasResults
      )
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Extract unique queries
    const suggestions = new Set<string>();
    relevantSearches.forEach(search => {
      suggestions.add(search.query);
    });
    
    return Array.from(suggestions).slice(0, 5);
  }
}
```

## See Also

- [Component Registry Documentation](./component-registry-documentation.md)
- [Inter-Component Communication Documentation](./inter-component-communication.md)
- [Panel Management Documentation](./panel-management.md)