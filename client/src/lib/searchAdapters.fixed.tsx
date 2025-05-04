import { SearchAdapter, SearchOptions, TextSearchResult, ListSearchResult, SearchResult } from '../context/SearchContext';

/**
 * TextContentSearchAdapter - For searching within plain text content
 * Use this for email bodies, text editors, documentation, etc.
 */
export class TextContentSearchAdapter implements SearchAdapter {
  private contentRef: React.RefObject<HTMLElement>;
  private highlightClassName: string;
  private activeHighlightClassName: string;
  private originalContent: string | null = null;
  private highlightedElements: HTMLElement[] = [];
  
  constructor(
    contentRef: React.RefObject<HTMLElement>,
    options?: {
      highlightClassName?: string;
      activeHighlightClassName?: string;
    }
  ) {
    this.contentRef = contentRef;
    this.highlightClassName = options?.highlightClassName || 'text-search-highlight';
    this.activeHighlightClassName = options?.activeHighlightClassName || 'text-search-highlight-active';
  }
  
  /**
   * Searches text content for matches
   */
  async search(term: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!term || !this.contentRef.current) {
      return [];
    }

    // Get text content
    const content = this.contentRef.current.innerText || this.contentRef.current.textContent || '';
    this.originalContent = content;
    
    // Create regex from search term based on options
    let regex: RegExp;
    try {
      if (options.useRegex) {
        regex = new RegExp(term, options.caseSensitive ? 'g' : 'gi');
      } else {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = options.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
        regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
      }
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return [];
    }
    
    // Find all matches
    const results: TextSearchResult[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      // Get context around match (up to 30 chars before and after)
      const contextStart = Math.max(0, match.index - 30);
      const contextEnd = Math.min(content.length, match.index + match[0].length + 30);
      
      const beforeContext = content.substring(contextStart, match.index);
      const afterContext = content.substring(match.index + match[0].length, contextEnd);
      
      // Calculate line number
      const contentUpToMatch = content.substring(0, match.index);
      const lineNumber = (contentUpToMatch.match(/\n/g) || []).length + 1;
      
      results.push({
        content: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        lineNumber,
        context: `...${beforeContext}${match[0]}${afterContext}...`
      });
    }
    
    return results;
  }
  
  /**
   * Highlights search results in the DOM
   */
  highlightResults(results: SearchResult[], currentIndex: number): void {
    if (!this.contentRef.current || results.length === 0) {
      return;
    }
    
    // Cast the results to TextSearchResult since we know this adapter only works with text results
    const textResults = results.filter(r => 'content' in r) as TextSearchResult[];
    if (textResults.length === 0) return;
    
    // Clear previous highlights first
    this.clearHighlights();
    
    // Store original content if needed
    if (this.originalContent === null) {
      this.originalContent = this.contentRef.current.innerText || this.contentRef.current.textContent || '';
    }
    
    // Create a wrapper for the content
    const wrapper = document.createElement('div');
    let content = this.originalContent || '';
    
    // Start from the end to avoid messing up indices
    textResults
      .slice()
      .sort((a, b) => b.startIndex - a.startIndex)
      .forEach((result, index) => {
        const isActive = index === textResults.length - 1 - currentIndex;
        const highlightClasses = `${this.highlightClassName} ${isActive ? this.activeHighlightClassName : ''}`;
        
        const beforeText = content.substring(0, result.startIndex);
        const matchText = content.substring(result.startIndex, result.endIndex);
        const afterText = content.substring(result.endIndex);
        
        content = `${beforeText}<span class="${highlightClasses}" data-search-index="${index}">${matchText}</span>${afterText}`;
      });
    
    wrapper.innerHTML = content;
    this.contentRef.current.innerHTML = wrapper.innerHTML;
    
    // Store references to highlighted elements for later cleanup
    this.highlightedElements = Array.from(
      this.contentRef.current.querySelectorAll(`.${this.highlightClassName}`)
    );
  }
  
  /**
   * Scrolls to a specific result
   */
  scrollToResult(result: SearchResult): void {
    if (!this.contentRef.current || !('content' in result)) {
      return;
    }
    
    const highlightElement = this.contentRef.current.querySelector(
      `.${this.activeHighlightClassName}`
    );
    
    if (highlightElement) {
      highlightElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  
  /**
   * Cleans up highlighting
   */
  clearHighlights(): void {
    if (!this.contentRef.current || !this.originalContent) {
      return;
    }
    
    // Check if we can simply restore original content
    if (this.originalContent) {
      // Only use textContent to avoid executing scripts
      this.contentRef.current.textContent = this.originalContent;
      this.highlightedElements = [];
    } else {
      // Otherwise remove highlight spans
      this.highlightedElements.forEach(el => {
        const parent = el.parentNode;
        if (parent) {
          const textNode = document.createTextNode(el.textContent || '');
          parent.replaceChild(textNode, el);
        }
      });
      this.highlightedElements = [];
    }
  }
}

/**
 * ListSearchAdapter - For searching within lists of items
 * Use this for email lists, contact lists, etc.
 */
export class ListSearchAdapter<T> implements SearchAdapter {
  private items: T[];
  private getSearchableFields: (item: T) => Record<string, string>;
  private filterCallback: (item: T, results: ListSearchResult<T>[]) => void;
  private scrollToItemCallback: (item: T) => void;
  
  constructor(
    options: {
      items: T[];
      getSearchableFields: (item: T) => Record<string, string>;
      filterCallback: (item: T, results: ListSearchResult<T>[]) => void;
      scrollToItemCallback: (item: T) => void;
    }
  ) {
    this.items = options.items;
    this.getSearchableFields = options.getSearchableFields;
    this.filterCallback = options.filterCallback;
    this.scrollToItemCallback = options.scrollToItemCallback;
  }
  
  /**
   * Updates the list of items to search
   */
  updateItems(items: T[]): void {
    this.items = items;
  }
  
  /**
   * Searches within list items
   */
  async search(term: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!term || this.items.length === 0) {
      return [];
    }
    
    // Create regex from search term based on options
    let regex: RegExp;
    try {
      if (options.useRegex) {
        regex = new RegExp(term, options.caseSensitive ? 'g' : 'gi');
      } else {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = options.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
        regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
      }
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return [];
    }
    
    // Find all matches in each item
    const results: ListSearchResult<T>[] = [];
    
    for (const item of this.items) {
      const searchableFields = this.getSearchableFields(item);
      const matchedFields: { field: string; matches: { startIndex: number; endIndex: number }[] }[] = [];
      
      // Search each field
      for (const [field, value] of Object.entries(searchableFields)) {
        const matches: { startIndex: number; endIndex: number }[] = [];
        
        let match;
        while ((match = regex.exec(value)) !== null) {
          matches.push({
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
          
          // Reset regex position if using global flag
          if (regex.global) {
            regex.lastIndex = match.index + 1;
          } else {
            break;
          }
        }
        
        if (matches.length > 0) {
          matchedFields.push({ field, matches });
        }
      }
      
      // If any fields matched, add this item to results
      if (matchedFields.length > 0) {
        results.push({
          item,
          matchedFields
        });
      }
    }
    
    return results;
  }
  
  /**
   * Highlights results in the list
   */
  highlightResults(results: SearchResult[], currentIndex: number): void {
    // Cast to the correct type
    const listResults = results.filter(r => 'item' in r) as ListSearchResult<T>[];
    if (listResults.length === 0) return;
    
    // Filter items to show only matches
    listResults.forEach((result) => {
      this.filterCallback(result.item, listResults);
    });
  }
  
  /**
   * Scrolls to the current result
   */
  scrollToResult(result: SearchResult): void {
    if (!('item' in result)) return;
    const listResult = result as ListSearchResult<T>;
    this.scrollToItemCallback(listResult.item);
  }
  
  /**
   * Clears highlights and resets list
   */
  clearHighlights(): void {
    // Show all items again
    this.items.forEach((item) => {
      this.filterCallback(item, []);
    });
  }
}

/**
 * HighlightText component - Highlights matching text in a string
 * This is a utility component for list items to highlight the matching parts
 */
export function HighlightText({
  text,
  searchTerm,
  options = { caseSensitive: false, wholeWord: false, useRegex: false },
  highlightClassName = 'text-blue-500 font-medium bg-blue-500/10'
}: {
  text: string;
  searchTerm: string;
  options?: SearchOptions;
  highlightClassName?: string;
}) {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }

  try {
    // Create regex based on options
    let regex: RegExp;
    if (options.useRegex) {
      regex = new RegExp(searchTerm, options.caseSensitive ? 'g' : 'gi');
    } else {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
      regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }

    // Find all matches
    const matches: { start: number; end: number }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });
      
      // Reset regex position
      if (regex.global) {
        regex.lastIndex = match.index + 1;
      } else {
        break;
      }
    }

    // If no matches, return the plain text
    if (matches.length === 0) {
      return <>{text}</>;
    }

    // Build up array of text segments and highlighted matches
    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    matches.forEach((match, i) => {
      // Add text before the match
      if (match.start > lastEnd) {
        parts.push(<span key={`text-${i}`}>{text.substring(lastEnd, match.start)}</span>);
      }
      
      // Add highlighted match
      parts.push(
        <span key={`highlight-${i}`} className={highlightClassName}>
          {text.substring(match.start, match.end)}
        </span>
      );
      
      lastEnd = match.end;
    });

    // Add remaining text after the last match
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.substring(lastEnd)}</span>);
    }

    return <>{parts}</>;
  } catch (error) {
    // If there's an error (e.g., invalid regex), just return the original text
    console.error('Error highlighting text:', error);
    return <>{text}</>;
  }
}

/**
 * EmailSearchAdapter - Specialized adapter for email content
 * This combines text content search with metadata search
 */
export class EmailSearchAdapter implements SearchAdapter {
  private emailContentRef: React.RefObject<HTMLElement>;
  private textAdapter: TextContentSearchAdapter;
  private email: any; // Email data object
  private metadataFields: { [key: string]: string }; // Fields to search in metadata
  
  constructor(
    emailContentRef: React.RefObject<HTMLElement>,
    email: any,
    metadataFields: { [key: string]: string } = {}
  ) {
    this.emailContentRef = emailContentRef;
    this.textAdapter = new TextContentSearchAdapter(emailContentRef);
    this.email = email;
    this.metadataFields = metadataFields;
  }
  
  /**
   * Update the email data
   */
  updateEmail(email: any, metadataFields: { [key: string]: string } = {}): void {
    this.email = email;
    this.metadataFields = metadataFields;
  }
  
  /**
   * Searches email content and metadata
   */
  async search(term: string, options: SearchOptions): Promise<SearchResult[]> {
    const contentResults = await this.textAdapter.search(term, options);
    const metadataResults = this.searchMetadata(term, options);
    
    return [...contentResults, ...metadataResults];
  }
  
  /**
   * Searches within email metadata (subject, from, to, etc.)
   */
  private searchMetadata(term: string, options: SearchOptions): TextSearchResult[] {
    const results: TextSearchResult[] = [];
    
    if (!term || !this.email) {
      return results;
    }
    
    // Create regex from search term based on options
    let regex: RegExp;
    try {
      if (options.useRegex) {
        regex = new RegExp(term, options.caseSensitive ? 'g' : 'gi');
      } else {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = options.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
        regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
      }
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return results;
    }
    
    // Search each metadata field
    for (const [fieldName, fieldValue] of Object.entries(this.metadataFields)) {
      if (!fieldValue) continue;
      
      let match;
      while ((match = regex.exec(fieldValue)) !== null) {
        results.push({
          content: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: `${fieldName}: ${fieldValue}`,
        });
        
        // Reset regex position
        if (regex.global) {
          regex.lastIndex = match.index + 1;
        } else {
          break;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Highlights results in the email
   */
  highlightResults(results: SearchResult[], currentIndex: number): void {
    // Highlight text content using the text adapter
    const contentResults = results.filter(r => 
      // Filter out metadata results based on context
      'content' in r && (!r.context || !r.context.startsWith('subject:'))
    );
    
    if (contentResults.length > 0) {
      this.textAdapter.highlightResults(contentResults, currentIndex);
    }
    
    // For metadata results, you might implement special highlighting in the UI
    // This would typically be done in the component rendering the email header
  }
  
  /**
   * Scrolls to a specific result
   */
  scrollToResult(result: SearchResult): void {
    // For content results, use the text adapter
    if ('content' in result && (!result.context || !result.context.startsWith('subject:'))) {
      this.textAdapter.scrollToResult(result);
    }
    
    // For metadata results, you might scroll to the email header section
    // This would be implemented based on your app's specific layout
  }
  
  /**
   * Clears highlights
   */
  clearHighlights(): void {
    this.textAdapter.clearHighlights();
  }
}