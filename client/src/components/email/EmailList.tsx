import React, { useState, useEffect } from 'react';
import { useDependencyProvider } from '../../hooks/useDependencyHooks';
import { DependencyDataTypes } from '../../lib/dependency/DependencyInterfaces';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Mail, Star, Tag, Filter, Clock, Link2, Link2Off } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

// Interfaces
export interface Email {
  id: number;
  subject: string;
  from: {
    email: string;
    name: string;
  };
  to: string;
  body: string;
  date: string;
  tags?: string[];
  isStarred?: boolean;
  isRead?: boolean;
  fromContactId?: number;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface EmailListProps {
  instanceId: string;
  emails?: Email[];
  loading?: boolean;
  onEmailSelect?: (email: Email) => void;
  selectedEmailId?: number;
  filterFolder?: string;
  filterTag?: string;
}

const mockEmails: Email[] = [
  {
    id: 1,
    subject: 'Meeting Tomorrow',
    from: {
      email: 'john.doe@example.com',
      name: 'John Doe'
    },
    to: 'me@nexusemail.com',
    body: 'Hi there! Just a reminder about our meeting tomorrow at 10 AM. Please bring your project notes.',
    date: '2025-05-04T10:30:00',
    tags: ['work', 'meeting'],
    isStarred: true,
    isRead: false,
    fromContactId: 1
  },
  {
    id: 2,
    subject: 'Project Update: Q2 Milestones',
    from: {
      email: 'project-manager@company.com',
      name: 'Sarah Project Manager'
    },
    to: 'me@nexusemail.com',
    body: 'Hello team, I wanted to share the latest project timeline and upcoming milestones for Q2. Please review the attached documents.',
    date: '2025-05-03T14:15:00',
    tags: ['work', 'important'],
    isStarred: false,
    isRead: true,
    fromContactId: 2
  },
  {
    id: 3,
    subject: 'Family Vacation Plans',
    from: {
      email: 'family@personal.com',
      name: 'Alice Family'
    },
    to: 'me@nexusemail.com',
    body: 'Let\'s discuss our summer vacation plans. I was thinking we could visit the beach in June.',
    date: '2025-05-02T09:45:00',
    tags: ['personal', 'vacation'],
    isStarred: true,
    isRead: true,
    fromContactId: 3
  },
  {
    id: 4,
    subject: 'Weekly Newsletter',
    from: {
      email: 'newsletter@tech.com',
      name: 'Tech Newsletter'
    },
    to: 'me@nexusemail.com',
    body: 'This week in tech: new AI breakthroughs, latest gadget reviews, and upcoming product launches.',
    date: '2025-05-01T08:30:00',
    tags: ['newsletter', 'tech'],
    isStarred: false,
    isRead: true,
    fromContactId: 4
  },
  {
    id: 5,
    subject: 'Your Subscription Is About To Expire',
    from: {
      email: 'billing@service.com',
      name: 'Billing Department'
    },
    to: 'me@nexusemail.com',
    body: 'Your premium subscription will expire in 7 days. Renew now to continue enjoying all the benefits.',
    date: '2025-04-30T17:20:00',
    tags: ['billing', 'important'],
    isStarred: false,
    isRead: false,
    fromContactId: 5
  }
];

const EmailList: React.FC<EmailListProps> = ({ 
  instanceId,
  emails = mockEmails,
  loading = false,
  onEmailSelect,
  selectedEmailId,
  filterFolder,
  filterTag
}) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>(emails);
  const [hasDependentViewer, setHasDependentViewer] = useState(false);
  
  // Register as dependency provider for selected email data
  const { 
    updateProviderData,
    getDependentConsumers,
    isRegistered
  } = useDependencyProvider<Email>(
    instanceId,
    DependencyDataTypes.EMAIL_DATA,
    {
      onConsumerConnected: (consumerId) => {
        console.log(`EmailList: Consumer ${consumerId} connected`);
        // If we have a selected email, send it to the new consumer immediately
        if (selectedEmail) {
          updateProviderData(selectedEmail);
        }
      }
    }
  );
  
  // Register as dependency provider for email list data
  const { 
    updateProviderData: updateEmailListData,
    getDependentConsumers: getEmailListConsumers
  } = useDependencyProvider<Email[]>(
    instanceId,
    DependencyDataTypes.EMAIL_LIST
  );
  
  // Check for dependent components and update state
  useEffect(() => {
    const checkDependencies = () => {
      const emailConsumers = getDependentConsumers();
      setHasDependentViewer(emailConsumers.length > 0);
    };
    
    // Initial check
    checkDependencies();
    
    // Setup interval to periodically check for dependencies
    const intervalId = setInterval(checkDependencies, 2000);
    
    return () => clearInterval(intervalId);
  }, [getDependentConsumers]);
  
  // Update email list data for consumers
  useEffect(() => {
    updateEmailListData(filteredEmails);
  }, [filteredEmails, updateEmailListData]);
  
  // Apply filters when they change
  useEffect(() => {
    let filtered = [...emails];
    
    // Apply folder filter logic here
    if (filterFolder && filterFolder !== 'all') {
      // Demo implementation - in real app would filter based on folder
      if (filterFolder === 'inbox') {
        filtered = filtered.filter(email => !email.isRead);
      } else if (filterFolder === 'starred') {
        filtered = filtered.filter(email => email.isStarred);
      }
    }
    
    // Apply tag filter
    if (filterTag) {
      filtered = filtered.filter(email => 
        email.tags?.includes(filterTag)
      );
    }
    
    setFilteredEmails(filtered);
  }, [emails, filterFolder, filterTag]);
  
  // When the selected email changes, update the dependency data
  useEffect(() => {
    console.log("EmailList selected email changed:", selectedEmail);
    
    // Always update provider data, even if null (to clear the viewer)
    // @ts-ignore - We intentionally want to pass null to clear dependencies
    updateProviderData(selectedEmail);
    
    if (selectedEmail) {
      // Show toast notification to make dependency connection clear to user
      toast({
        title: "Email Selected",
        description: `Email "${selectedEmail.subject}" sent to connected viewers`,
        variant: "default"
      });
      
      // If there's an external handler, call it
      if (onEmailSelect) {
        onEmailSelect(selectedEmail);
      }
    } else {
      // If email was deselected, show a notification
      if (hasDependentViewer) {
        toast({
          title: "Email Deselected",
          description: "Cleared email from connected viewers",
          variant: "default"
        });
      }
    }
    
    // Log current consumers for debugging
    const consumers = getDependentConsumers();
    if (consumers.length > 0) {
      console.log("EmailList sending to consumers:", consumers);
    }
  }, [selectedEmail, updateProviderData, onEmailSelect, hasDependentViewer, getDependentConsumers]);
  
  // When selectedEmailId prop changes, update selected email
  useEffect(() => {
    if (selectedEmailId !== undefined) {
      const email = emails.find(e => e.id === selectedEmailId) || null;
      setSelectedEmail(email);
    }
  }, [selectedEmailId, emails]);
  
  // Handle email selection
  const handleEmailClick = (email: Email) => {
    // Deselect if already selected
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
      return;
    }
    
    setSelectedEmail(email);
    
    // Show visual feedback for dependencies
    if (hasDependentViewer) {
      toast({
        title: "Data Sent",
        description: `Email "${email.subject.substring(0, 25)}${email.subject.length > 25 ? '...' : ''}" sent to connected viewer(s)`,
        variant: "default",
      });
    }
  };
  
  // Disconnect from all dependents
  const handleDisconnectDependents = () => {
    // In a real implementation, you would use dependency registry 
    // to disconnect all dependencies
    toast({
      title: "Dependencies Disconnected",
      description: "All dependent components have been disconnected.",
      variant: "default"
    });
    // This is just for demo purposes - actual implementation would
    // call dependency registry methods
  };
  
  return (
    <Card className="h-full relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Mail className="mr-2" /> Email List
          </CardTitle>
          
          {isRegistered && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={hasDependentViewer ? "default" : "outline"}
                    className="ml-2 flex items-center"
                  >
                    {hasDependentViewer ? (
                      <><Link2 className="w-3 h-3 mr-1" /> Connected</>
                    ) : (
                      <><Link2Off className="w-3 h-3 mr-1" /> Not Connected</>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {hasDependentViewer 
                    ? "This component has dependent components" 
                    : "No components are dependent on this one"
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Filter information */}
        {(filterFolder || filterTag) && (
          <div className="flex items-center mt-2">
            <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Filtering: {filterFolder && `Folder: ${filterFolder}`}{' '}
              {filterTag && `Tag: ${filterTag}`}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Mail className="w-12 h-12 mb-2 opacity-20" />
                <p>No emails match your filters</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div 
                  key={email.id}
                  className={`mb-3 p-3 rounded cursor-pointer transition-colors ${
                    selectedEmail?.id === email.id 
                      ? 'bg-primary/10 border-l-4 border-primary' 
                      : 'hover:bg-primary/5 border-l-4 border-transparent'
                  }`}
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {!email.isRead && (
                        <span className="inline-block w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>
                      )}
                      {email.subject}
                    </div>
                    <div className="flex items-center">
                      {email.isStarred && (
                        <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{email.from.name} ({email.from.email})</div>
                  <div className="text-xs truncate mt-1 text-muted-foreground">
                    {email.body.substring(0, 80)}...
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {email.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        )}
      </CardContent>
      
      {hasDependentViewer && (
        <CardFooter className="pt-2">
          <div className="w-full flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {getDependentConsumers().length} dependent component(s)
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnectDependents}
            >
              <Link2Off className="w-3 h-3 mr-1" /> Disconnect
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default EmailList;