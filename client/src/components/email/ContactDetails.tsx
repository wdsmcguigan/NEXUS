import React, { useEffect, useState } from 'react';
import { useDependencyConsumer } from '../../hooks/useDependencyHooks';
import { DependencyDataTypes, DependencyStatus } from '../../lib/dependency/DependencyInterfaces';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Link2, 
  Link2Off, 
  ClipboardCopy, 
  AlertCircle, 
  Info,
  BookOpen,
  Star,
  Tag
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Contact } from './EmailViewer';

interface ContactDetailsProps {
  instanceId: string;
  contact?: Contact | null;
}

// Mock contact data for when there's no dependency data
const mockContact: Contact = {
  id: 0,
  name: 'Test Contact',
  email: 'test@example.com',
  company: 'Example Company',
  phone: '+1 (555) 987-6543',
  notes: 'This is a demo contact when no dependency data is available.'
};

const ContactDetails: React.FC<ContactDetailsProps> = ({
  instanceId,
  contact: propContact
}) => {
  const [contactSource, setContactSource] = useState<string | null>(null);
  
  // Consume contact data from a provider component
  const { 
    consumerData: contact, 
    providerId, 
    status,
    isReady,
    isLoading,
    isError,
    lastUpdated,
    requestData
  } = useDependencyConsumer<Contact>(
    instanceId,
    DependencyDataTypes.CONTACT
  );
  
  // Use prop contact as fallback if dependency system doesn't provide one
  const displayContact = contact || propContact;
  
  // Set current provider info when it changes
  useEffect(() => {
    if (providerId) {
      setContactSource(providerId);
    }
  }, [providerId]);
  
  // Disconnect from provider
  const handleDisconnect = () => {
    setContactSource(null);
    // In a real implementation, you would use dependency registry 
    // to disconnect the dependency
    toast({
      title: "Provider Disconnected",
      description: "Disconnected from contact provider.",
      variant: "default"
    });
  };
  
  // Request latest data from provider
  const handleRefresh = () => {
    requestData();
    toast({
      title: "Data Refresh Requested",
      description: "Requested latest data from provider.",
      variant: "default"
    });
  };
  
  // Copy email to clipboard
  const handleCopyEmail = () => {
    if (displayContact?.email) {
      navigator.clipboard.writeText(displayContact.email);
      toast({
        title: "Email Copied",
        description: "Email address copied to clipboard.",
        variant: "default"
      });
    }
  };
  
  // Copy phone to clipboard
  const handleCopyPhone = () => {
    if (displayContact?.phone) {
      navigator.clipboard.writeText(displayContact.phone);
      toast({
        title: "Phone Copied",
        description: "Phone number copied to clipboard.",
        variant: "default"
      });
    }
  };
  
  // Add to favorites
  const handleAddToFavorites = () => {
    toast({
      title: "Added to Favorites",
      description: `Added ${displayContact?.name} to favorites.`,
      variant: "default"
    });
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <User className="mr-2" /> Contact Details
          </CardTitle>
          
          {/* Connection status */}
          {providerId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="flex items-center">
                    <Link2 className="w-3 h-3 mr-1" /> Connected
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Connected to: {providerId}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {isReady && lastUpdated && (
          <CardDescription>
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-2" />
            <h3 className="font-medium text-destructive">Failed to load contact</h3>
            <p className="text-muted-foreground text-sm mt-1">
              There was an error retrieving contact information
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : !displayContact ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <User className="w-12 h-12 opacity-20 mb-2" />
            <p>No contact information available</p>
            <p className="text-sm mt-2">
              Connect to a contact data provider or select an email
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contact avatar/name section */}
            <div className="flex items-center pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{displayContact.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Contact ID: {displayContact.id}
                </p>
              </div>
            </div>
            
            {/* Contact info section */}
            <div className="space-y-3">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Email</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{displayContact.email}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyEmail}>
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {displayContact.phone && (
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Phone</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{displayContact.phone}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyPhone}>
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {displayContact.company && (
                <div className="flex items-start">
                  <Building className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                  <div>
                    <div className="text-sm font-medium">Company</div>
                    <div className="text-sm">{displayContact.company}</div>
                  </div>
                </div>
              )}
              
              {/* Example tag section - not in data model but good UI element */}
              <div className="border-t pt-3 mt-3">
                <div className="text-sm font-medium mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">
                    <Tag className="w-3 h-3 mr-1" /> Work
                  </Badge>
                  <Badge variant="outline">
                    <Tag className="w-3 h-3 mr-1" /> Important
                  </Badge>
                </div>
              </div>
              
              {/* Notes section */}
              {displayContact.notes && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm font-medium mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" /> Notes
                  </div>
                  <div className="text-sm bg-muted/30 p-2 rounded">
                    {displayContact.notes}
                  </div>
                </div>
              )}
              
              {/* Dependency source info */}
              {contactSource && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Info className="w-3 h-3 mr-1" /> 
                    Data source: {contactSource.split('-')[0]}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-3 flex justify-between">
        <Button variant="outline" size="sm" onClick={handleAddToFavorites}>
          <Star className="w-3.5 h-3.5 mr-1" /> Add to Favorites
        </Button>
        
        {isReady && providerId && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              <Link2Off className="w-3.5 h-3.5 mr-1" /> Disconnect
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContactDetails;