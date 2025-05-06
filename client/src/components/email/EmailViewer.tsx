import React, { useEffect, useState } from 'react';
import { 
  useDependencyConsumer, 
  useDependencyProvider 
} from '../../hooks/useDependencyHooks';
import { DependencyDataTypes } from '../../lib/dependency/DependencyInterfaces';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Mail, 
  Star, 
  Tag, 
  Clock, 
  User, 
  Link2, 
  Link2Off, 
  Unlink,
  Globe,
  ArrowUpRight,
  Forward,
  Reply,
  ReplyAll,
  Trash,
  Archive
} from 'lucide-react';
import { Email } from './EmailList';
import { toast } from '../../hooks/use-toast';

// Contact interface for sender information
export interface Contact {
  id: number;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  phone?: string;
  notes?: string;
}

interface EmailViewerProps {
  instanceId: string;
  email?: Email | null;
  onReply?: (email: Email) => void;
  onForward?: (email: Email) => void;
  onDelete?: (emailId: number) => void;
  onArchive?: (emailId: number) => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({
  instanceId,
  email: propEmail,
  onReply,
  onForward,
  onDelete,
  onArchive
}) => {
  const [emailSource, setEmailSource] = useState<string | null>(null);
  const [hasDependentConsumers, setHasDependentConsumers] = useState(false);
  
  // For tracking updates to the current email
  const [currentEmailId, setCurrentEmailId] = useState<number>(0);
  
  // Consumer for email data
  const { 
    consumerData: email, 
    providerId: emailProviderId,
    isReady: emailIsReady,
    lastUpdated: emailLastUpdated,
    status: emailStatus,
    disconnect: emailDisconnect
  } = useDependencyConsumer<Email>(
    instanceId,
    DependencyDataTypes.EMAIL_DATA
  );
  
  // Log when email data changes
  useEffect(() => {
    console.log("EmailViewer received email data:", email);
    
    if (email) {
      // Only show toast if we received a new email (not just initial render)
      if (currentEmailId !== 0 && currentEmailId !== email.id) {
        toast({
          title: "New Email Received",
          description: `Email "${email.subject.substring(0, 25)}${email.subject.length > 25 ? '...' : ''}" received from provider`,
          variant: "default",
        });
      }
      
      setCurrentEmailId(email.id);
    } else {
      // If email is null, it's been cleared
      if (currentEmailId !== 0) {
        console.log("EmailViewer: Email was cleared");
        setCurrentEmailId(0);
        
        toast({
          title: "Email Cleared",
          description: "The email selection was cleared",
          variant: "default",
        });
      }
    }
  }, [email, currentEmailId]);
  
  // Provider for contact information
  const {
    updateProviderData: updateContactData,
    getDependentConsumers: getContactConsumers,
    disconnectAllConsumers,
    isRegistered: contactIsRegistered
  } = useDependencyProvider<Contact>(
    instanceId,
    DependencyDataTypes.CONTACT
  );
  
  // Use prop email as fallback if dependency system doesn't provide one
  const displayEmail = email || propEmail;
  
  // Track if we just received new data (for animation)
  const [showNewDataIndicator, setShowNewDataIndicator] = useState(false);
  
  // Show animation when new data arrives
  useEffect(() => {
    if (email && currentEmailId !== 0 && currentEmailId !== email.id) {
      setShowNewDataIndicator(true);
      
      // Hide the indicator after 3 seconds
      const timer = setTimeout(() => {
        setShowNewDataIndicator(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [email, currentEmailId]);
  
  // Update contact data when email changes
  useEffect(() => {
    if (displayEmail) {
      const contact: Contact = {
        id: displayEmail.fromContactId || 0,
        name: displayEmail.from.name,
        email: displayEmail.from.email,
        company: 'Acme Corporation', // Example data
        phone: '+1 (555) 123-4567'    // Example data
      };
      
      updateContactData(contact);
    }
  }, [displayEmail, updateContactData]);
  
  // Check for dependent components
  useEffect(() => {
    const checkDependencies = () => {
      const consumers = getContactConsumers();
      setHasDependentConsumers(consumers.length > 0);
    };
    
    // Initial check
    checkDependencies();
    
    // Set up interval to periodically check
    const intervalId = setInterval(checkDependencies, 2000);
    
    return () => clearInterval(intervalId);
  }, [getContactConsumers]);
  
  // Disconnect from email provider
  const handleDisconnectFromProvider = () => {
    if (emailProviderId) {
      // Actually disconnect using the hook's disconnect function
      emailDisconnect();
      setEmailSource(null);
      
      toast({
        title: "Provider Disconnected",
        description: "Disconnected from email provider.",
        variant: "default"
      });
    }
  };
  
  // Disconnect from contact consumers
  const handleDisconnectConsumers = () => {
    // Actually disconnect all consumers
    if (contactIsRegistered && hasDependentConsumers) {
      disconnectAllConsumers();
      setHasDependentConsumers(false);
      
      toast({
        title: "Dependencies Disconnected",
        description: "All dependent components have been disconnected.",
        variant: "default"
      });
    }
  };
  
  // Handle reply button
  const handleReply = () => {
    if (displayEmail && onReply) {
      onReply(displayEmail);
    }
  };
  
  // Handle forward button
  const handleForward = () => {
    if (displayEmail && onForward) {
      onForward(displayEmail);
    }
  };
  
  // Handle delete button
  const handleDelete = () => {
    if (displayEmail && onDelete) {
      onDelete(displayEmail.id);
    }
  };
  
  // Handle archive button
  const handleArchive = () => {
    if (displayEmail && onArchive) {
      onArchive(displayEmail.id);
    }
  };
  
  // Update email source when provider changes
  useEffect(() => {
    if (emailProviderId) {
      setEmailSource(emailProviderId);
    }
  }, [emailProviderId]);
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Mail className="mr-2" /> Email Viewer
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Provider connection status */}
            {emailIsReady && emailProviderId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="default"
                      className={`flex items-center ${showNewDataIndicator ? 'animate-pulse bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}`}
                    >
                      <Link2 className={`w-3 h-3 mr-1 ${showNewDataIndicator ? 'animate-spin' : ''}`} /> 
                      Provider: {emailProviderId.split('-')[0]}
                      {showNewDataIndicator && (
                        <span className="ml-1 text-xs">•</span>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Connected to: {emailProviderId}
                    <br />
                    Last updated: {emailLastUpdated ? new Date(emailLastUpdated).toLocaleTimeString() : 'Never'}
                    {showNewDataIndicator && (
                      <div className="mt-1 pt-1 border-t text-green-500 font-medium">
                        New data received!
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Consumer connection status */}
            {contactIsRegistered && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={hasDependentConsumers ? "secondary" : "outline"}
                      className="flex items-center"
                    >
                      {hasDependentConsumers ? (
                        <><User className="w-3 h-3 mr-1" /> Providing Contact</>
                      ) : (
                        <><Link2Off className="w-3 h-3 mr-1" /> No Consumers</>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasDependentConsumers 
                      ? `Providing contact data to ${getContactConsumers().length} components` 
                      : "No components are consuming contact data"
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {emailIsReady && emailLastUpdated && (
          <CardDescription>
            Last updated: {new Date(emailLastUpdated).toLocaleTimeString()}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow overflow-auto">
        {!displayEmail ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Mail className="w-16 h-16 mb-4 opacity-20" />
            <p>Select an email to view its contents</p>
            {!emailIsReady && (
              <p className="text-sm mt-2">
                Or connect to an email provider
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Email header */}
              <div>
                <h2 className="text-xl font-bold mb-3">{displayEmail.subject}</h2>
                
                <div className="flex justify-between items-center mb-3">
                  {/* Sender info with contact data provider badge */}
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center">
                        {displayEmail.from.name}
                        {contactIsRegistered && hasDependentConsumers && (
                          <Badge variant="outline" className="ml-2 text-xs px-1 py-0">
                            <Link2 className="w-3 h-3 mr-1" /> Shared
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{displayEmail.from.email}</div>
                    </div>
                  </div>
                  
                  {/* Date and time */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(displayEmail.date).toLocaleString()}
                  </div>
                </div>
                
                {/* Recipients */}
                <div className="text-sm text-muted-foreground mb-4">
                  To: <span className="font-medium">{displayEmail.to}</span>
                </div>
                
                {/* Tags */}
                <div className="flex mb-4 flex-wrap gap-1">
                  {displayEmail.tags?.map(tag => (
                    <Badge key={tag} variant="outline">
                      <Tag className="w-3 h-3 mr-1" /> {tag}
                    </Badge>
                  ))}
                  {displayEmail.isStarred && (
                    <Badge variant="outline" className="text-yellow-500">
                      <Star className="w-3 h-3 mr-1" fill="currentColor" /> Starred
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Email body */}
              <div className="border-t pt-4">
                <div className="whitespace-pre-line">{displayEmail.body}</div>
                
                {/* Example attachment - for demonstration */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Attachments</h3>
                  <div className="border rounded-md p-3 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mr-3">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Meeting_Notes.pdf</div>
                        <div className="text-xs text-muted-foreground">250 KB</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-3 flex-none">
        <div className="w-full">
          {/* Email actions */}
          {displayEmail && (
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleReply}>
                  <Reply className="w-3.5 h-3.5 mr-1" /> Reply
                </Button>
                <Button variant="outline" size="sm" onClick={handleForward}>
                  <Forward className="w-3.5 h-3.5 mr-1" /> Forward
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleArchive}>
                  <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
          
          {/* Dependency controls */}
          <div className="flex justify-between mt-3">
            {emailIsReady && emailProviderId && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDisconnectFromProvider}
              >
                <Unlink className="w-3.5 h-3.5 mr-1" /> Disconnect from provider
              </Button>
            )}
            
            {hasDependentConsumers && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={handleDisconnectConsumers}
              >
                <Link2Off className="w-3.5 h-3.5 mr-1" /> Disconnect consumers
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmailViewer;