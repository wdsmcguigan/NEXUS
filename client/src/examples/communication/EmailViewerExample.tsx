/**
 * Example implementation of an Email Viewer component that demonstrates
 * the inter-component communication system.
 */

import React, { useState, useEffect } from 'react';
import { 
  useComponentRegistration, 
  useEvent, 
  useRequestHandler, 
  useContextSubscription, 
  useDropTarget 
} from '../../hooks/useCommunication';
import { ComponentType } from '../../lib/communication/ComponentCommunication';
import { DragItemType, DropTargetType } from '../../lib/communication/DragDropManager';
import { ContextType } from '../../lib/communication/ContextProvider';
import { EmailEventType, EmailSelectedEvent } from '../../lib/communication/Events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Trash, 
  Archive, 
  Star, 
  AlertCircle, 
  Paperclip, 
  Tag as TagIcon, 
  Calendar 
} from 'lucide-react';

// Mock email interface for the example
interface Email {
  id: number;
  subject: string;
  from: { email: string; name: string };
  to: Array<{ email: string; name: string }>;
  cc?: Array<{ email: string; name: string }>;
  date: string;
  body: string;
  unread: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  attachments?: Array<{ name: string; size: number; type: string }>;
  tags: string[];
  threadId?: number;
}

// Mock email data (in a real app, this would come from an API)
const mockEmail: Email = {
  id: 1,
  subject: 'Weekly team meeting agenda',
  from: { email: 'manager@example.com', name: 'Team Manager' },
  to: [{ email: 'you@example.com', name: 'You' }],
  cc: [{ email: 'colleague@example.com', name: 'Colleague' }],
  date: '2025-05-04T09:30:00',
  body: `<p>Hello team,</p>
<p>Here is the agenda for our upcoming team meeting:</p>
<ol>
  <li>Project status updates</li>
  <li>Quarterly goals review</li>
  <li>New client onboarding process</li>
  <li>Open discussion</li>
</ol>
<p>Please come prepared with your updates and questions.</p>
<p>Best regards,<br>Team Manager</p>`,
  unread: true,
  flagged: false,
  hasAttachments: true,
  attachments: [
    { name: 'meeting-slides.pdf', size: 2457600, type: 'application/pdf' },
    { name: 'quarterly-goals.xlsx', size: 1843200, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  ],
  tags: ['work', 'important'],
  threadId: 123
};

interface EmailViewerExampleProps {
  tabId?: string;
  panelId?: string;
  emailId?: number;
}

export default function EmailViewerExample({ 
  tabId = 'email-viewer-tab', 
  panelId = 'main-panel',
  emailId
}: EmailViewerExampleProps) {
  // State for the component
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize component communication
  const { 
    componentId, 
    sendRequest, 
    sendNotification, 
    broadcastNotification 
  } = useComponentRegistration(
    ComponentType.EMAIL_VIEWER,
    {
      tabId,
      panelId,
      title: email?.subject || 'Email Viewer',
      supportsRequests: ['getEmailContent', 'markAsRead', 'getEmailId']
    }
  );
  
  // Register request handlers
  useRequestHandler(
    componentId,
    'getEmailContent',
    () => email
  );
  
  useRequestHandler(
    componentId,
    'markAsRead',
    async () => {
      await markAsRead();
      return { success: true };
    }
  );
  
  useRequestHandler(
    componentId,
    'getEmailId',
    () => emailId || email?.id
  );
  
  // Load the email when component mounts or emailId changes
  useEffect(() => {
    if (emailId) {
      loadEmail(emailId);
    }
  }, [emailId]);
  
  // Subscribe to email selected events from other components
  useEvent<EmailSelectedEvent>(
    EmailEventType.EMAIL_SELECTED,
    (event) => {
      if (!event.preview) {
        loadEmail(event.emailId);
      }
    }
  );
  
  // Subscribe to the selected email context
  useContextSubscription(
    ContextType.EMAIL,
    (emailData, contextType, contextId) => {
      if (contextId === 'current-email' && emailData) {
        setEmail(emailData);
        
        if (emailData.unread) {
          markAsRead();
        }
      }
    }
  );
  
  // Set up drop target for attachments from other emails
  const { targetId, isOver } = useDropTarget(
    DropTargetType.EMAIL_COMPOSER,
    [DragItemType.EMAIL_ATTACHMENT],
    componentId,
    async (item) => {
      // Handle dropped attachment
      console.log('Attachment dropped:', item.data);
      return true;
    }
  );
  
  // Load an email
  const loadEmail = async (id: number | string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For this example, we'll just use mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set the email data
      setEmail(mockEmail);
      
      // Set it as the current email in the context system
      window.contextProvider?.setContext(
        ContextType.EMAIL,
        'current-email',
        mockEmail,
        componentId
      );
      
      // Notify that email has been opened
      window.eventBus?.publish(
        EmailEventType.EMAIL_OPENED,
        {
          emailId: mockEmail.id,
          accountId: 1,
          tabId,
          panelId
        }
      );
      
      // Mark as read
      markAsRead();
    } catch (err) {
      setError('Failed to load email');
      console.error('Error loading email:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark email as read
  const markAsRead = async () => {
    if (!email || !email.unread) return;
    
    try {
      // In a real app, this would be an API call
      setEmail({
        ...email,
        unread: false
      });
      
      // Update the context
      window.contextProvider?.setContext(
        ContextType.EMAIL,
        'current-email',
        {
          ...email,
          unread: false
        },
        componentId
      );
      
      // Publish event
      window.eventBus?.publish(
        EmailEventType.EMAIL_MARKED_READ,
        {
          emailIds: [email.id]
        }
      );
      
      // Notify other components
      broadcastNotification(
        'emailMarkedAsRead',
        { emailId: email.id }
      );
    } catch (err) {
      console.error('Error marking email as read:', err);
    }
  };
  
  // Toggle flagged status
  const toggleFlag = async () => {
    if (!email) return;
    
    try {
      // Update local state
      const updatedEmail = {
        ...email,
        flagged: !email.flagged
      };
      
      setEmail(updatedEmail);
      
      // Update the context
      window.contextProvider?.setContext(
        ContextType.EMAIL,
        'current-email',
        updatedEmail,
        componentId
      );
      
      // Publish event
      window.eventBus?.publish(
        email.flagged ? 'email:unflagged' : 'email:flagged',
        {
          emailIds: [email.id]
        }
      );
      
      // Notify other components
      broadcastNotification(
        email.flagged ? 'emailUnflagged' : 'emailFlagged',
        { emailId: email.id }
      );
    } catch (err) {
      console.error('Error toggling flag:', err);
    }
  };
  
  // Reply to the email
  const handleReply = () => {
    if (!email) return;
    
    // Find a component that can handle compose (in a real app)
    sendRequest(
      'email-composer',  // Would be dynamic in a real app
      'composeReply',
      {
        emailId: email.id,
        to: [email.from],
        subject: `Re: ${email.subject}`,
        originalEmailBody: email.body
      }
    ).catch(err => {
      console.error('Error requesting compose:', err);
      
      // Fallback - send an event
      window.eventBus?.publish(
        EmailEventType.EMAIL_REPLIED,
        {
          emailId: email.id,
          to: [email.from],
          subject: `Re: ${email.subject}`
        }
      );
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format attachment size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading email...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive flex flex-col items-center">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!email) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">No email selected</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Email toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <Button size="sm" variant="ghost" onClick={handleReply}>
          <Reply className="w-4 h-4 mr-1" />
          Reply
        </Button>
        
        <Button size="sm" variant="ghost">
          <ReplyAll className="w-4 h-4 mr-1" />
          Reply All
        </Button>
        
        <Button size="sm" variant="ghost">
          <Forward className="w-4 h-4 mr-1" />
          Forward
        </Button>
        
        <div className="flex-1"></div>
        
        <Button size="sm" variant="ghost">
          <Archive className="w-4 h-4 mr-1" />
          Archive
        </Button>
        
        <Button size="sm" variant="ghost">
          <Trash className="w-4 h-4 mr-1" />
          Delete
        </Button>
        
        <Button 
          size="sm" 
          variant={email.flagged ? "secondary" : "ghost"}
          onClick={toggleFlag}
        >
          <Star className={`w-4 h-4 ${email.flagged ? "fill-current" : ""}`} />
        </Button>
      </div>
      
      {/* Email header */}
      <div className="p-4 border-b bg-muted/30">
        <h1 className="text-xl font-medium mb-3">{email.subject}</h1>
        
        <div className="flex items-start mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-2">
            {email.from.name.charAt(0)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-medium">{email.from.name}</span>
                <span className="text-muted-foreground ml-2">&lt;{email.from.email}&gt;</span>
              </div>
              <span className="text-sm text-muted-foreground">{formatDate(email.date)}</span>
            </div>
            
            <div className="text-sm text-muted-foreground mt-1">
              <span>To: {email.to.map(to => to.name).join(', ')}</span>
              {email.cc && email.cc.length > 0 && (
                <span className="ml-2">CC: {email.cc.map(cc => cc.name).join(', ')}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {email.tags.map(tag => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Email body */}
      <div 
        className="flex-1 p-4 overflow-auto"
        dangerouslySetInnerHTML={{ __html: email.body }}
      />
      
      {/* Email attachments */}
      {email.hasAttachments && email.attachments && (
        <div className="p-4 border-t">
          <h3 className="font-medium mb-2 flex items-center">
            <Paperclip className="w-4 h-4 mr-1" />
            Attachments ({email.attachments.length})
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {email.attachments.map(attachment => (
              <div 
                key={attachment.name}
                className="flex items-center p-2 rounded-md border bg-muted/50 text-sm"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify(attachment));
                }}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                <div>
                  <div>{attachment.name}</div>
                  <div className="text-xs text-muted-foreground">{formatSize(attachment.size)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Action suggestions */}
      <div 
        className={`p-3 border-t flex gap-2 ${isOver ? 'bg-muted/50' : ''}`}
        ref={(el) => el && (el.dataset.dropTargetId = targetId)}
      >
        <Button size="sm" variant="outline">
          <Calendar className="w-4 h-4 mr-1" />
          Create Event
        </Button>
        
        <Button size="sm" variant="outline">
          <TagIcon className="w-4 h-4 mr-1" />
          Add Tags
        </Button>
      </div>
    </div>
  );
}