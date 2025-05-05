/**
 * Example demonstrating the React integration layer for the Component Dependency System
 * 
 * This example shows how to use the DependencyContext and hooks to create components
 * that can provide data to or consume data from other components.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle
} from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  User, 
  CalendarDays, 
  Info, 
  RefreshCw,
  LinkIcon,
  Unlink,
  AlertCircle
} from 'lucide-react';
import { DependencyProvider } from '../../context/DependencyContext';
import { 
  useDependentComponent, 
  useSourceComponent 
} from '../../hooks/useDependencyHooks';
import { ComponentType } from '../../lib/communication/ComponentCommunication';
import { DependencyDataType } from '../../lib/dependency/DependencyInterfaces';
import { createDependencyDefinition } from '../../lib/dependency/DependencyUtils';

// Mock email interface
interface Email {
  id: number;
  subject: string;
  sender: string;
  preview: string;
  received: string;
  read: boolean;
}

// Mock email data
const EMAILS: Email[] = [
  {
    id: 1,
    subject: 'Weekly team meeting agenda',
    sender: 'Team Manager',
    preview: 'Here is the agenda for our upcoming team meeting...',
    received: '2025-05-04T09:30:00',
    read: true
  },
  {
    id: 2,
    subject: 'Project milestone update',
    sender: 'Project Lead',
    preview: 'I wanted to share the latest progress on our project milestones...',
    received: '2025-05-03T14:15:00',
    read: false
  },
  {
    id: 3,
    subject: 'New feature release',
    sender: 'Product Team',
    preview: 'We're excited to announce the release of our newest feature...',
    received: '2025-05-02T11:45:00',
    read: true
  },
  {
    id: 4,
    subject: 'Quarterly review schedule',
    sender: 'HR Department',
    preview: 'Please find attached the schedule for the upcoming quarterly reviews...',
    received: '2025-05-01T16:20:00',
    read: false
  },
  {
    id: 5,
    subject: 'Office maintenance notice',
    sender: 'Facilities Management',
    preview: 'This is a notice about scheduled maintenance in the office building...',
    received: '2025-04-30T08:10:00',
    read: true
  }
];

// Define dependency IDs for the example
const EMAIL_SELECTION_DEP = 'email-selection-dependency';

// Ensure dependency definitions are registered
function registerExampleDependencies() {
  // Create email selection dependency if it doesn't exist
  createDependencyDefinition(
    ComponentType.EMAIL_LIST,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    {
      name: 'Email Selection',
      description: 'Email list provides selected email to email viewer',
      syncStrategy: 'both',
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    }
  );
}

// EmailList component using useSourceComponent
interface EmailListProps {
  id: string;
}

function EnhancedEmailList({ id }: EmailListProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [emailList, setEmailList] = useState<Email[]>([]);
  
  // Use source component hook
  const { 
    consumerIds, 
    updateData,
    hasConsumer
  } = useSourceComponent<Email>(
    id,
    ComponentType.EMAIL_LIST,
    DependencyDataType.EMAIL,
    {
      // Optional data transformation
      transform: (email) => ({
        ...email,
        // Add a timestamp to show it was processed
        _processedAt: new Date().toISOString()
      }),
      // Optional callbacks
      onConsumerConnected: (consumerId) => {
        console.log(`Consumer connected: ${consumerId}`);
      },
      onConsumerDisconnected: (consumerId) => {
        console.log(`Consumer disconnected: ${consumerId}`);
      },
      debug: true
    }
  );
  
  // Initialize emails
  useEffect(() => {
    setEmailList(EMAILS);
  }, []);
  
  // Handle email selection
  const handleSelectEmail = (emailId: number) => {
    setSelectedEmailId(emailId);
    
    // Find the email
    const email = EMAILS.find(e => e.id === emailId);
    
    if (email) {
      // Mark as read
      email.read = true;
      
      // Update dependency with selected email
      updateData(email);
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Inbox
          </div>
          
          {consumerIds.length > 0 && (
            <Badge variant="outline" className="ml-2 h-6">
              Connected to {consumerIds.length} viewer{consumerIds.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {emailList.length} messages, {emailList.filter(e => !e.read).length} unread
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto px-0">
        <div className="space-y-1">
          {emailList.map(email => (
            <div
              key={email.id}
              className={`px-4 py-2 cursor-pointer ${
                selectedEmailId === email.id
                  ? 'bg-primary/10'
                  : 'hover:bg-muted/50'
              } ${!email.read ? 'font-medium' : ''}`}
              onClick={() => handleSelectEmail(email.id)}
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">{email.sender}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(email.received).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm">{email.subject}</div>
              <div className="text-xs text-muted-foreground truncate">
                {email.preview}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// EmailViewer component using useDependentComponent
interface EmailViewerProps {
  id: string;
}

function EnhancedEmailViewer({ id }: EmailViewerProps) {
  // Use dependent component hook
  const { 
    data: email,
    error,
    isLoading,
    providerId,
    isConnected,
    connectToProvider,
    disconnect,
    refreshData
  } = useDependentComponent<Email>(
    id,
    ComponentType.EMAIL_VIEWER,
    DependencyDataType.EMAIL,
    {
      // Don't auto-connect in this example so we can show manual connection
      autoConnect: false,
      autoUpdate: true,
      // Optional filter
      filter: (email) => email && email.id > 0,
      // Optional callbacks
      onProviderConnected: (providerId) => {
        console.log(`Connected to provider: ${providerId}`);
      },
      onProviderDisconnected: (providerId) => {
        console.log(`Disconnected from provider: ${providerId}`);
      },
      onDataUpdated: (data) => {
        console.log('Data updated:', data);
      },
      debug: true
    }
  );
  
  // Get demo provider ID
  const emailListId = 'react-email-list-example';
  
  // Handle manual connection
  const handleConnect = () => {
    connectToProvider(emailListId);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Email Viewer
          </div>
          
          {isConnected ? (
            <Badge variant="outline" className="ml-2 h-6 bg-green-50 dark:bg-green-950">
              Connected to {providerId}
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-2 h-6 bg-amber-50 dark:bg-amber-950">
              Not connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {email ? 'Viewing selected email' : 'No email selected'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse">Loading email...</div>
          </div>
        ) : error ? (
          <div className="text-destructive text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : email ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-medium">{email.subject}</h2>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium">{email.sender}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="mr-1 h-4 w-4" />
                  {new Date(email.received).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm">{email.preview}</p>
              <p className="text-sm mt-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="text-sm mt-2">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              
              {email._processedAt && (
                <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
                  Processed at: {new Date(email._processedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <Mail className="h-10 w-10 mb-2" />
            <h3 className="font-medium">No email selected</h3>
            <p className="text-sm mt-1">
              {isConnected 
                ? 'Select an email from the list to view its contents here'
                : 'Connect to an email list to view emails'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        {isConnected ? (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={disconnect}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshData()}
              disabled={!email}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </>
        ) : (
          <Button 
            variant="default" 
            size="sm"
            onClick={handleConnect}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect to Email List
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Main example component
export default function ReactDependencyExample() {
  useEffect(() => {
    // Register dependency definitions
    registerExampleDependencies();
  }, []);
  
  // Set component IDs for source and dependent components
  const emailListId = 'react-email-list-example';
  const emailViewerId = 'react-email-viewer-example';
  
  return (
    <DependencyProvider>
      <div className="container mx-auto p-4 h-full">
        <Card className="bg-muted/40 mb-4">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <Info className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-lg font-semibold mb-1">
                  React Integration for Component Dependency System
                </h1>
                <p className="text-sm text-muted-foreground mb-2">
                  This example demonstrates the React integration layer for the Component Dependency System, 
                  using hooks like <code>useSourceComponent</code> and <code>useDependentComponent</code> for
                  simplified dependency management.
                </p>
                <div className="text-xs text-muted-foreground">
                  This example shows manual connection - click the "Connect to Email List" button in the
                  email viewer to establish the dependency.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="h-[75vh]">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40}>
              <EnhancedEmailList id={emailListId} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60}>
              <EnhancedEmailViewer id={emailViewerId} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </DependencyProvider>
  );
}