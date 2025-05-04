import React, { useState, useRef, useEffect } from 'react';
import { ListSearchAdapter, HighlightText } from '../lib/searchAdapters';
import { useComponentSearch } from '../hooks/useComponentSearch';
import { UniversalSearch } from './UniversalSearch';
import { Search, Star, Paperclip, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '../lib/utils';

interface Email {
  id: number;
  subject: string;
  from: string;
  preview: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  tags?: string[];
}

interface SearchableEmailListProps {
  id: string;
  emails: Email[];
  onSelectEmail?: (email: Email) => void;
}

export function SearchableEmailList({ id, emails, onSelectEmail }: SearchableEmailListProps) {
  const [filteredEmails, setFilteredEmails] = useState<Email[]>(emails);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const componentId = `email-list-${id}`;
  const tabId = `tab-${id}`;
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Create a search adapter for the email list
  const [searchAdapter] = useState(() => 
    new ListSearchAdapter<Email>({
      items: emails,
      getSearchableFields: (email) => ({
        subject: email.subject,
        from: email.from,
        preview: email.preview,
      }),
      filterCallback: (email, results) => {
        // If no search is active or this email is in results, show it
        if (results.length === 0) {
          // Reset to original list
          setFilteredEmails(emails);
        } else {
          // Filter to only show matching emails
          const matchingEmails = results.map(result => (result.item as Email).id);
          setFilteredEmails(emails.filter(email => matchingEmails.includes(email.id)));
        }
      },
      scrollToItemCallback: (email) => {
        // Scroll the matching email into view
        const element = itemRefs.current.get(email.id);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          
          // Briefly highlight the item
          element.classList.add('bg-blue-500/20');
          setTimeout(() => {
            element.classList.remove('bg-blue-500/20');
          }, 1000);
        }
      },
    })
  );
  
  // Set up search functionality
  const {
    isSearchActive,
    searchTerm,
    activateSearch
  } = useComponentSearch(componentId, searchAdapter);
  
  // Update adapter when emails change
  useEffect(() => {
    searchAdapter.updateItems(emails);
    setFilteredEmails(emails);
  }, [emails, searchAdapter]);
  
  // Handle email selection
  const handleSelectEmail = (email: Email) => {
    setSelectedEmailId(email.id);
    onSelectEmail?.(email);
  };
  
  return (
    <div className="flex flex-col h-full bg-neutral-900 relative">
      {/* Header with search button */}
      <div className="border-b border-neutral-800 p-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Emails</h2>
        <Button variant="ghost" size="icon" onClick={activateSearch}>
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Email list */}
      <div ref={listRef} className="flex-1 overflow-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-4">
            <p>No emails match your search</p>
            {searchTerm && (
              <p className="text-sm mt-1">
                No results for "{searchTerm}"
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(email.id, el);
                  else itemRefs.current.delete(email.id);
                }}
                className={cn(
                  "p-3 cursor-pointer transition-colors",
                  selectedEmailId === email.id
                    ? "bg-blue-500/10 hover:bg-blue-500/20"
                    : "hover:bg-neutral-800/70",
                  !email.isRead && "bg-neutral-800/40"
                )}
                onClick={() => handleSelectEmail(email)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon column */}
                  <div className="flex flex-col items-center mt-1 text-neutral-400">
                    <button className="hover:text-yellow-400">
                      <Star 
                        className={cn(
                          "h-5 w-5",
                          email.isStarred && "text-yellow-400 fill-yellow-400"
                        )} 
                      />
                    </button>
                  </div>
                  
                  {/* Content column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <div className={cn(
                        "font-medium truncate",
                        !email.isRead && "text-white"
                      )}>
                        {searchTerm ? (
                          <HighlightText 
                            text={email.from} 
                            searchTerm={searchTerm}
                            options={{
                              caseSensitive: false,
                              wholeWord: false,
                              useRegex: false
                            }}
                          />
                        ) : (
                          email.from
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                        {new Date(email.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className={cn(
                      "mt-1 truncate",
                      !email.isRead && "font-medium"
                    )}>
                      {searchTerm ? (
                        <HighlightText 
                          text={email.subject} 
                          searchTerm={searchTerm}
                          options={{
                            caseSensitive: false,
                            wholeWord: false,
                            useRegex: false
                          }}
                        />
                      ) : (
                        email.subject
                      )}
                    </div>
                    
                    <div className="mt-1 text-sm text-neutral-400 truncate">
                      {searchTerm ? (
                        <HighlightText 
                          text={email.preview} 
                          searchTerm={searchTerm}
                          options={{
                            caseSensitive: false,
                            wholeWord: false,
                            useRegex: false
                          }}
                        />
                      ) : (
                        email.preview
                      )}
                    </div>
                    
                    {/* Tags and attachments */}
                    {(email.tags?.length || email.hasAttachments) && (
                      <div className="mt-2 flex items-center gap-2">
                        {email.hasAttachments && (
                          <div className="flex items-center text-xs text-neutral-400">
                            <Paperclip className="h-3.5 w-3.5 mr-1" />
                          </div>
                        )}
                        
                        {email.tags?.map((tag, i) => (
                          <div 
                            key={i}
                            className="flex items-center text-xs px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Search component (shows only when active) */}
      {isSearchActive && (
        <UniversalSearch
          componentId={componentId}
          tabId={tabId}
          searchAdapter={searchAdapter}
        />
      )}
    </div>
  );
}