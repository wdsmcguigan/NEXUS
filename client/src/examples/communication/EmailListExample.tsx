/**
 * Example implementation of an Email List component that demonstrates
 * the inter-component communication system.
 */

import React, { useState, useEffect } from 'react';
import { useCommunication } from '../../hooks/useCommunication';
import { ComponentType } from '../../lib/communication/ComponentCommunication';
import { DragItemType, DropTargetType, DragOperation } from '../../lib/communication/DragDropManager';
import { CommandCategory, CommandContext } from '../../lib/communication/CommandRegistry';
import { ContextType } from '../../lib/communication/ContextProvider';
import { EmailEventType } from '../../lib/communication/Events';
import { Button } from '@/components/ui/button';
import { Check, Star, Trash, Archive, AlertTriangle, RefreshCw, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock email interface for the example
interface Email {
  id: number;
  subject: string;
  from: string;
  date: string;
  unread: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  tags: string[];
  preview: string;
}

// Mock email data (in a real app, this would come from an API)
const mockEmails: Email[] = [
  {
    id: 1,
    subject: 'Weekly team meeting agenda',
    from: 'manager@example.com',
    date: '2025-05-04T09:30:00',
    unread: true,
    flagged: false,
    hasAttachments: true,
    tags: ['work', 'important'],
    preview: 'Here is the agenda for our upcoming team meeting...'
  },
  {
    id: 2,
    subject: 'Project deadline reminder',
    from: 'projectmanager@example.com',
    date: '2025-05-04T11:45:00',
    unread: true,
    flagged: true,
    hasAttachments: false,
    tags: ['work', 'urgent'],
    preview: 'This is a reminder that the project deadline is approaching...'
  },
  {
    id: 3,
    subject: 'Lunch tomorrow?',
    from: 'friend@example.com',
    date: '2025-05-03T16:20:00',
    unread: false,
    flagged: false,
    hasAttachments: false,
    tags: ['personal'],
    preview: 'Would you like to grab lunch tomorrow at noon?'
  }
];

export default function EmailListExample({ tabId = 'email-list-tab', panelId = 'main-panel' }) {
  // State for the component
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [selectedEmailIds, setSelectedEmailIds] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Initialize communication systems
  const {
    componentId,
    commands,
    dragSources,
    dropTargets,
    sendRequest,
    sendNotification,
    broadcastNotification
  } = useCommunication(
    ComponentType.EMAIL_LIST,
    {
      tabId,
      panelId,
      title: 'Inbox',
      
      // Define commands
      commands: [
        {
          title: 'Mark as Read',
          category: CommandCategory.EMAIL,
          contexts: [CommandContext.EMAIL_LIST],
          handler: async () => {
            await markSelectedEmailsAsRead();
            return { success: true, emailIds: selectedEmailIds };
          },
          options: {
            description: 'Mark selected emails as read',
            shortcut: 'r'
          }
        },
        {
          title: 'Archive Emails',
          category: CommandCategory.EMAIL,
          contexts: [CommandContext.EMAIL_LIST],
          handler: async () => {
            await archiveSelectedEmails();
            return { success: true, emailIds: selectedEmailIds };
          },
          options: {
            description: 'Archive selected emails',
            shortcut: 'e'
          }
        },
        {
          title: 'Refresh Email List',
          category: CommandCategory.EMAIL,
          contexts: [CommandContext.EMAIL_LIST, CommandContext.GLOBAL],
          handler: async () => {
            await refreshEmails();
            return { success: true };
          },
          options: {
            description: 'Refresh email list',
            shortcut: 'f5'
          }
        }
      ],
      
      // Define request handlers
      supportedRequests: ['getSelectedEmails', 'selectEmail', 'refreshEmails'],
      requestHandlers: {
        getSelectedEmails: () => {
          return emails.filter(email => selectedEmailIds.includes(email.id));
        },
        selectEmail: (request) => {
          const { emailId } = request.data;
          selectEmail(emailId);
          return { success: true };
        },
        refreshEmails: async () => {
          await refreshEmails();
          return { success: true };
        }
      },
      
      // Define drag sources
      dragSources: [
        {
          itemType: DragItemType.EMAIL,
          itemId: 'selected-emails',
          data: { getEmails: () => emails.filter(email => selectedEmailIds.includes(email.id)) },
          allowedOperations: [DragOperation.MOVE, DragOperation.COPY]
        }
      ],
      
      // Define drop targets
      dropTargets: [
        {
          targetType: DropTargetType.EMAIL_LIST,
          acceptedTypes: [DragItemType.TAG],
          onDrop: async (item) => {
            if (item.itemType === DragItemType.TAG) {
              await applyTagToSelectedEmails(item.data);
              return true;
            }
            return false;
          }
        }
      ]
    }
  );
  
  // Effect to update Context when selected emails change
  useEffect(() => {
    if (componentId) {
      // Set the selected emails context
      if (selectedEmailIds.length > 0) {
        const selectedEmailsData = emails.filter(email => selectedEmailIds.includes(email.id));
        
        // Update context
        window.contextProvider?.setContext(
          ContextType.EMAILS, 
          'selected-emails',
          selectedEmailsData,
          componentId
        );
        
        // Also broadcast a notification
        broadcastNotification(
          'emailSelectionChanged',
          { emails: selectedEmailsData }
        );
      }
    }
  }, [selectedEmailIds, emails, componentId, broadcastNotification]);
  
  // Select an email
  const selectEmail = (emailId: number) => {
    // Toggle selection if already selected
    if (selectedEmailIds.includes(emailId)) {
      setSelectedEmailIds(selectedEmailIds.filter(id => id !== emailId));
    } else {
      setSelectedEmailIds([...selectedEmailIds, emailId]);
    }
  };
  
  // Handle click on an email
  const handleEmailClick = (email: Email) => {
    selectEmail(email.id);
    
    // Publish an event for the email selection
    window.eventBus?.publish(
      EmailEventType.EMAIL_SELECTED,
      {
        emailId: email.id,
        accountId: 1, // In a real app, use the actual account ID
        preview: true,
        fromSearch: false
      }
    );
  };
  
  // Handle double click on an email (open in new tab/panel)
  const handleEmailDoubleClick = (email: Email) => {
    openEmailInNewTab(email);
  };
  
  // Open email in a new tab
  const openEmailInNewTab = async (email: Email) => {
    try {
      // Find panel manager component that can open new tabs
      const emailViewers = await sendRequest(
        'panel-manager',  // In a real app, you'd get this ID dynamically
        'openComponentInNewTab',
        {
          componentType: ComponentType.EMAIL_VIEWER,
          title: email.subject,
          config: { emailId: email.id, accountId: 1 }
        }
      );
      
      // Publish an event
      window.eventBus?.publish(
        EmailEventType.EMAIL_OPENED,
        {
          emailId: email.id,
          accountId: 1
        }
      );
    } catch (error) {
      console.error('Failed to open email in new tab:', error);
    }
  };
  
  // Mark selected emails as read
  const markSelectedEmailsAsRead = async () => {
    if (selectedEmailIds.length === 0) return;
    
    // In a real app, this would call an API
    setEmails(emails.map(email => 
      selectedEmailIds.includes(email.id) 
        ? { ...email, unread: false }
        : email
    ));
    
    // Notify other components
    broadcastNotification(
      'emailsMarkedAsRead',
      { emailIds: selectedEmailIds }
    );
    
    // Also publish an event
    window.eventBus?.publish(
      EmailEventType.EMAIL_MARKED_READ,
      { emailIds: selectedEmailIds }
    );
  };
  
  // Archive selected emails
  const archiveSelectedEmails = async () => {
    if (selectedEmailIds.length === 0) return;
    
    // In a real app, this would call an API
    setEmails(emails.filter(email => !selectedEmailIds.includes(email.id)));
    setSelectedEmailIds([]);
    
    // Notify other components
    broadcastNotification(
      'emailsArchived',
      { emailIds: selectedEmailIds }
    );
    
    // Also publish an event
    window.eventBus?.publish(
      EmailEventType.EMAIL_ARCHIVED,
      { emailIds: selectedEmailIds }
    );
  };
  
  // Refresh emails
  const refreshEmails = async () => {
    setIsRefreshing(true);
    
    // In a real app, this would fetch from an API
    // Simulate a delay for demonstration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Just reset to mock data for this example
    setEmails(mockEmails);
    setIsRefreshing(false);
    
    // Notify other components
    broadcastNotification(
      'emailsRefreshed',
      { timestamp: new Date().toISOString() }
    );
    
    window.eventBus?.publish(
      EmailEventType.EMAILS_LOADED,
      { count: mockEmails.length }
    );
  };
  
  // Apply a tag to selected emails
  const applyTagToSelectedEmails = async (tag: string) => {
    if (selectedEmailIds.length === 0) return;
    
    // In a real app, this would call an API
    setEmails(emails.map(email => 
      selectedEmailIds.includes(email.id) 
        ? { 
            ...email, 
            tags: email.tags.includes(tag) 
              ? email.tags 
              : [...email.tags, tag] 
          }
        : email
    ));
    
    // Notify other components
    broadcastNotification(
      'emailsTagged',
      { emailIds: selectedEmailIds, tag }
    );
    
    // Also publish an event
    window.eventBus?.publish(
      EmailEventType.EMAIL_TAGGED,
      { emailIds: selectedEmailIds, tagId: tag }
    );
  };
  
  // Start dragging selected emails
  const startDragSelectedEmails = (e: React.DragEvent, email: Email) => {
    // If the email isn't in the selection, select only this email
    if (!selectedEmailIds.includes(email.id)) {
      setSelectedEmailIds([email.id]);
    }
    
    // Set drag data
    e.dataTransfer.setData('text/plain', JSON.stringify(selectedEmailIds));
    
    // Start the drag operation
    dragSources.email_0.startDrag(
      DragOperation.MOVE,
      {
        html: `<div class="bg-background border rounded p-2">
                <div class="font-medium">${selectedEmailIds.length} email(s) selected</div>
               </div>`,
        offsetX: 10,
        offsetY: 10
      }
    );
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => markSelectedEmailsAsRead()}
          disabled={selectedEmailIds.length === 0}
        >
          <Check className="w-4 h-4 mr-1" />
          Read
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => archiveSelectedEmails()}
          disabled={selectedEmailIds.length === 0}
        >
          <Archive className="w-4 h-4 mr-1" />
          Archive
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => {}}
          disabled={selectedEmailIds.length === 0}
        >
          <Trash className="w-4 h-4 mr-1" />
          Delete
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => applyTagToSelectedEmails('important')}
          disabled={selectedEmailIds.length === 0}
        >
          <TagIcon className="w-4 h-4 mr-1" />
          Tag
        </Button>
        
        <div className="flex-1"></div>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => refreshEmails()}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p>No emails found</p>
          </div>
        ) : (
          <div className="divide-y">
            {emails.map(email => (
              <div 
                key={email.id}
                className={`
                  flex items-start p-3 hover:bg-muted cursor-pointer
                  ${selectedEmailIds.includes(email.id) ? 'bg-muted' : ''}
                  ${email.unread ? 'font-medium' : ''}
                `}
                onClick={() => handleEmailClick(email)}
                onDoubleClick={() => handleEmailDoubleClick(email)}
                draggable
                onDragStart={(e) => startDragSelectedEmails(e, email)}
              >
                <div className="flex-shrink-0 mr-3">
                  {email.flagged ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <div className="w-5 h-5"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <p className="font-medium truncate mr-2">{email.from}</p>
                    <p className="text-sm text-muted-foreground ml-auto">{formatDate(email.date)}</p>
                  </div>
                  
                  <p className="truncate mb-1">{email.subject}</p>
                  
                  <div className="flex items-center">
                    <p className="text-sm text-muted-foreground truncate flex-1">{email.preview}</p>
                    
                    <div className="flex gap-1 ml-2">
                      {email.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="text-xs text-muted-foreground p-2 border-t">
        {emails.length} emails, {emails.filter(e => e.unread).length} unread
      </div>
    </div>
  );
}

// Add window type augmentation for the communication systems (for example purposes)
declare global {
  interface Window {
    eventBus?: any;
    contextProvider?: any;
  }
}