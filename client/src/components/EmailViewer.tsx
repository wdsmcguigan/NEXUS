import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useComponentSearch } from '../hooks/useComponentSearch';
import { TextContentSearchAdapter } from '../lib/searchAdapters';
import { UniversalSearch } from './UniversalSearch';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Star, Reply, Forward, Trash } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmailViewerProps {
  id: string;
  email?: {
    id: number;
    subject: string;
    from: string;
    fromEmail: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    date: string;
    body: string;
    attachments?: {
      id: string;
      name: string;
      size: number;
      type: string;
    }[];
    starred?: boolean;
    tags?: string[];
  };
}

export function EmailViewer({ id, email }: EmailViewerProps) {
  const emailContentRef = useRef<HTMLDivElement>(null);
  const [searchAdapter] = useState(() => new TextContentSearchAdapter(emailContentRef));
  const componentId = `email-viewer-${id}`;
  
  // Find the tab ID from our tab context
  const tabId = `tab-${id}`;
  
  // Set up search functionality
  const {
    isSearchActive,
    activateSearch
  } = useComponentSearch(componentId, searchAdapter);
  
  // Update search adapter when email changes
  useEffect(() => {
    if (email && emailContentRef.current) {
      // For a real implementation, you'd update adapter metadata here
    }
  }, [email]);
  
  // If no email, show loading state
  if (!email) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-neutral-400">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-neutral-800 rounded-md mb-4"></div>
          <div className="h-4 w-64 bg-neutral-800 rounded-md mb-2"></div>
          <div className="h-4 w-56 bg-neutral-800 rounded-md mb-6"></div>
          <div className="h-32 w-3/4 bg-neutral-800 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-neutral-900 relative">
      {/* Email header */}
      <div className="border-b border-neutral-800 px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-medium text-white">{email.subject}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={activateSearch}>
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <div className="text-neutral-400">From:</div>
          <div>{email.from} <span className="text-neutral-500">&lt;{email.fromEmail}&gt;</span></div>
          
          <div className="text-neutral-400">To:</div>
          <div>{email.to.join(', ')}</div>
          
          {email.cc && email.cc.length > 0 && (
            <>
              <div className="text-neutral-400">CC:</div>
              <div>{email.cc.join(', ')}</div>
            </>
          )}
          
          <div className="text-neutral-400">Date:</div>
          <div>{new Date(email.date).toLocaleString()}</div>
        </div>
      </div>
      
      {/* Action toolbar */}
      <div className="flex items-center border-b border-neutral-800 px-6 py-2 bg-neutral-950">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button variant="ghost" size="sm">
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
          <Button variant="ghost" size="sm">
            <Star className="h-4 w-4 mr-2" />
            {email.starred ? 'Unstar' : 'Star'}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Email content */}
      <div className="flex-1 overflow-auto p-6 relative">
        <div 
          ref={emailContentRef}
          className={cn(
            "prose prose-invert max-w-none",
            "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
            "prose-headings:text-neutral-200", 
            "prose-p:text-neutral-300"
          )}
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
        
        {/* Show attachments if any */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-medium text-neutral-400 mb-3">Attachments</h3>
            <div className="flex flex-wrap gap-3">
              {email.attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center p-2 bg-neutral-800 rounded-md text-sm">
                  <span className="truncate max-w-[200px]">{attachment.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">
                    ({Math.round(attachment.size / 1024)} KB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <Button variant="outline" size="sm" className="bg-neutral-800 border-neutral-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" className="bg-neutral-800 border-neutral-700">
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
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