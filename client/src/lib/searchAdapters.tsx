import React from 'react';
import { SearchOptions, SearchResult, TextSearchResult, ListSearchResult, SearchAdapter } from '../context/SearchContext';

/**
 * A search adapter for searching text content within a DOM node
 */
export class TextContentSearchAdapter implements SearchAdapter {
  contentRef: React.RefObject<HTMLElement>;
  highlightedElements: HTMLElement[] = [];
  
  constructor(contentRef: React.RefObject<HTMLElement>) {
    this.contentRef = contentRef;
  }
  
  /**
   * Search within the text content of the DOM node
   */
  async search(term: string, options: SearchOptions): Promise<SearchResult[]> {
    const content = this.contentRef.current;
    if (!content || !term) return [];
    
    const text = content.textContent || '';
    const results: TextSearchResult[] = [];
    
    // Create regex pattern based on options
    try {
      let pattern: string | RegExp = term;
      
      if (!options.useRegex) {
        pattern = options.wholeWord ? `\\b${this.escapeRegExp(term)}\\b` : this.escapeRegExp(term);
      }
      
      const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
      
      // Find all matches
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Prevent infinite loops with zero-width matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
          continue;
        }
        
        // Get some context around the match
        const startContext = Math.max(0, match.index - 40);
        const endContext = Math.min(text.length, match.index + match[0].length + 40);
        const context = text.substring(startContext, endContext);
        
        results.push({
          content: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: context
        });
      }
      
      return results;
    } catch (error) {
      console.error('Search regex error:', error);
      return [];
    }
  }
  
  /**
   * Highlights results in the DOM by wrapping them in span elements
   */
  highlightResults(results: SearchResult[], currentIndex: number): void {
    // Clear previous highlights
    this.clearHighlights();
    
    if (!this.contentRef.current) return;
    
    // We're only dealing with TextSearchResults in this adapter
    const textResults = results as TextSearchResult[];
    
    // Create a document fragment to minimize reflows
    const content = this.contentRef.current;
    const text = content.textContent || '';
    let currentPos = 0;
    const fragment = document.createDocumentFragment();
    
    textResults.forEach((result, index) => {
      // Add text before the match
      if (result.startIndex > currentPos) {
        const textBefore = document.createTextNode(text.substring(currentPos, result.startIndex));
        fragment.appendChild(textBefore);
      }
      
      // Add the match with highlight
      const matchText = text.substring(result.startIndex, result.endIndex);
      const highlightSpan = document.createElement('span');
      highlightSpan.textContent = matchText;
      highlightSpan.classList.add('search-highlight');
      
      // Add special styling for the current result
      if (index === currentIndex) {
        highlightSpan.classList.add('search-highlight-current');
      }
      
      fragment.appendChild(highlightSpan);
      this.highlightedElements.push(highlightSpan);
      
      currentPos = result.endIndex;
    });
    
    // Add any remaining text
    if (currentPos < text.length) {
      const textAfter = document.createTextNode(text.substring(currentPos));
      fragment.appendChild(textAfter);
    }
    
    // Replace content
    content.innerHTML = '';
    content.appendChild(fragment);
  }
  
  /**
   * Scroll to a specific search result
   */
  scrollToResult(result: SearchResult): void {
    if (!this.contentRef.current) return;
    
    // Get the highlighted element for this result
    const highlightElements = this.contentRef.current.querySelectorAll('.search-highlight-current');
    if (highlightElements.length > 0) {
      const element = highlightElements[0] as HTMLElement;
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  
  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    // Remove all highlight spans and restore original text
    this.highlightedElements.forEach(element => {
      if (element.parentNode) {
        const text = element.textContent;
        const textNode = document.createTextNode(text || '');
        element.parentNode.replaceChild(textNode, element);
      }
    });
    
    this.highlightedElements = [];
  }
  
  /**
   * Escape special regex characters in a string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Search adapter for list-based data like emails, contacts, etc.
 */
export class ListSearchAdapter<T> implements SearchAdapter {
  private items: T[];
  private searchableFields: (keyof T)[];
  private onHighlight?: (item: T, results: ListSearchResult<T>[], currentIndex: number) => void;
  private onScroll?: (item: T) => void;
  
  constructor(
    items: T[],
    searchableFields: (keyof T)[],
    onHighlight?: (item: T, results: ListSearchResult<T>[], currentIndex: number) => void,
    onScroll?: (item: T) => void
  ) {
    this.items = items;
    this.searchableFields = searchableFields;
    this.onHighlight = onHighlight;
    this.onScroll = onScroll;
  }
  
  /**
   * Update the items to search
   */
  updateItems(items: T[]): void {
    this.items = items;
  }
  
  /**
   * Search through the list items
   */
  async search(term: string, options: SearchOptions): Promise<ListSearchResult<T>[]> {
    if (!term) return [];
    
    const results: ListSearchResult<T>[] = [];
    
    // Create regex pattern based on options
    try {
      let pattern: string | RegExp = term;
      
      if (!options.useRegex) {
        pattern = options.wholeWord ? `\\b${this.escapeRegExp(term)}\\b` : this.escapeRegExp(term);
      }
      
      const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
      
      // Search in each item
      for (const item of this.items) {
        // Search in each searchable field
        const matchedFields: { field: string; matches: { startIndex: number; endIndex: number }[] }[] = [];
        
        for (const field of this.searchableFields) {
          const fieldValue = String(item[field] || '');
          let match;
          const matches: { startIndex: number; endIndex: number }[] = [];
          
          // Reset regex state
          regex.lastIndex = 0;
          
          // Find all matches in this field
          while ((match = regex.exec(fieldValue)) !== null) {
            // Prevent infinite loops with zero-width matches
            if (match.index === regex.lastIndex) {
              regex.lastIndex++;
              continue;
            }
            
            matches.push({
              startIndex: match.index,
              endIndex: match.index + match[0].length
            });
          }
          
          if (matches.length > 0) {
            matchedFields.push({
              field: String(field),
              matches
            });
          }
        }
        
        if (matchedFields.length > 0) {
          results.push({
            item,
            matchedFields
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Search regex error:', error);
      return [];
    }
  }
  
  /**
   * Highlight the current result
   */
  highlightResults(results: SearchResult[], currentIndex: number): void {
    if (currentIndex < 0 || currentIndex >= results.length || !this.onHighlight) return;
    
    const listResults = results as ListSearchResult<T>[];
    const currentResult = listResults[currentIndex];
    
    this.onHighlight(currentResult.item, listResults, currentIndex);
  }
  
  /**
   * Scroll to the current result
   */
  scrollToResult(result: SearchResult): void {
    if (!this.onScroll) return;
    
    const listResult = result as ListSearchResult<T>;
    this.onScroll(listResult.item);
  }
  
  /**
   * Clear highlights - this is application specific and should be handled by the onHighlight callback
   */
  clearHighlights(): void {
    // If needed, call onHighlight with empty results
    if (this.onHighlight) {
      this.onHighlight({} as T, [], -1);
    }
  }
  
  /**
   * Escape special regex characters in a string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * A component to highlight search matches in text
 */
export function HighlightText({
  text,
  searchTerm,
  options,
  highlightClassName = 'search-highlight',
  activeClassName = 'search-highlight-current',
  isActive = false
}: {
  text: string;
  searchTerm: string;
  options: SearchOptions;
  highlightClassName?: string;
  activeClassName?: string;
  isActive?: boolean;
}) {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }
  
  try {
    // Create regex pattern based on options
    let pattern: string | RegExp = searchTerm;
    
    if (!options.useRegex) {
      pattern = options.wholeWord 
        ? `\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b` 
        : searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    
    // Find all matches
    const matches: { start: number; end: number }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Prevent infinite loops with zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
        continue;
      }
      
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    if (matches.length === 0) {
      return <>{text}</>;
    }
    
    // Create an array of text segments with highlights
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    
    matches.forEach((match, i) => {
      // Add text before the match
      if (match.start > lastIndex) {
        segments.push(
          <React.Fragment key={`t-${i}`}>
            {text.substring(lastIndex, match.start)}
          </React.Fragment>
        );
      }
      
      // Add the match with highlight
      segments.push(
        <span 
          key={`h-${i}`}
          className={`${highlightClassName} ${isActive ? activeClassName : ''}`}
        >
          {text.substring(match.start, match.end)}
        </span>
      );
      
      lastIndex = match.end;
    });
    
    // Add any remaining text
    if (lastIndex < text.length) {
      segments.push(
        <React.Fragment key="t-last">
          {text.substring(lastIndex)}
        </React.Fragment>
      );
    }
    
    return <>{segments}</>;
  } catch (error) {
    console.error('Error highlighting text:', error);
    return <>{text}</>;
  }
}