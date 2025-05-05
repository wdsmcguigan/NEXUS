/**
 * Example demonstrating the Component Dependency System
 * 
 * This example shows how the EmailList and EmailViewer components can use
 * the dependency system to synchronize the selected email.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle
} from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Mail, User, CalendarDays, Info } from 'lucide-react';

import { ComponentType } from '../../lib/communication/ComponentCommunication';
import { 
  DependencyDataType, 
  DependencySyncStrategy 
} from '../../lib/dependency/DependencyInterfaces';
import { dependencyRegistry } from '../../lib/dependency/DependencyRegistry';
import { dependencyManager } from '../../lib/dependency/DependencyManager';
import { 
  useDependencyProvider, 
  useDependencyConsumer 
} from '../../hooks/useDependency';

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

// Define the email selection dependency if not already registered
function registerDependencies() {
  // Check if dependency already exists
  const existingDependencies = dependencyRegistry.getAllDependencies();
  const emailSelectionDep = existingDependencies.find(dep => 
    dep.providerType === ComponentType.EMAIL_LIST && 
    dep.consumerType === ComponentType.EMAIL_VIEWER &&
    dep.dataType === DependencyDataType.EMAIL
  );
  
  if (!emailSelectionDep) {
    // Register the email selection dependency
    dependencyRegistry.registerDependency({
      name: 'Email Selection',
      description: 'Email list provides selected email to email viewer',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: DependencyDataType.EMAIL,
      syncStrategy: DependencySyncStrategy.BOTH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    });
  }
}

// EmailList component (Provider)
interface EmailListProps {
  id: string;
}

function EmailList({ id }: EmailListProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [emailList, setEmailList] = useState<Email[]>([]);
  
  // Get dependency definition
  const emailSelectionDependency = dependencyRegistry.getDependenciesForProvider(ComponentType.EMAIL_LIST)
    .find(dep => dep.dataType === DependencyDataType.EMAIL);
  
  // Use provider hook
  const { 
    consumerIds, 
    updateData, 
    hasConsumer
  } = useDependencyProvider(
    id,
    emailSelectionDependency?.id || '',
    // Pass selected email if already selected
    selectedEmailId ? EMAILS.find(e => e.id === selectedEmailId) || null : null
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
  
  // Get the selected email
  const selectedEmail = emailList.find(e => e.id === selectedEmailId);
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Inbox
          </div>
          
          {consumerIds.length > 0 && (
            <Badge variant="outline" className="ml-2">
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

// EmailViewer component (Consumer)
interface EmailViewerProps {
  id: string;
}

function EmailViewer({ id }: EmailViewerProps) {
  // Get dependency definition
  const emailSelectionDependency = dependencyRegistry.getDependenciesForConsumer(ComponentType.EMAIL_VIEWER)
    .find(dep => dep.dataType === DependencyDataType.EMAIL);
  
  // Use consumer hook
  const { 
    data: email,
    error,
    isLoading,
    providerId,
    refresh
  } = useDependencyConsumer<Email>(
    id,
    emailSelectionDependency?.id || '',
    {
      autoUpdate: true
    }
  );
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Email Viewer
          </div>
          
          {providerId && (
            <Badge variant="outline" className="ml-2">
              Connected to {providerId}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {email ? 'Viewing selected email' : 'No email selected'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse">Loading email...</div>
          </div>
        ) : error ? (
          <div className="text-destructive text-center p-4">
            <div className="font-medium">Error</div>
            <div className="text-sm">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => refresh()}
            >
              Retry
            </Button>
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <Mail className="h-10 w-10 mb-2" />
            <h3 className="font-medium">No email selected</h3>
            <p className="text-sm mt-1">
              Select an email from the list to view its contents here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main example component
export default function DependencyExample() {
  // Register dependencies on component mount
  useEffect(() => {
    registerDependencies();
  }, []);
  
  // Set component IDs for provider and consumer
  const emailListId = 'email-list-example';
  const emailViewerId = 'email-viewer-example';
  
  return (
    <div className="container mx-auto p-4 h-full">
      <Card className="bg-muted/40 mb-4">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold mb-1">
                Component Dependency System Example
              </h1>
              <p className="text-sm text-muted-foreground mb-2">
                This example demonstrates the Component Dependency System, which enables tabs to respond to 
                selections and data from other tabs. In this case, the Email Viewer depends on the 
                Email List to show the currently selected email.
              </p>
              <div className="text-xs text-muted-foreground">
                Try selecting emails in the list and see how the viewer component automatically updates
                with the selected email's content.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="h-[75vh]">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40}>
            <EmailList id={emailListId} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={60}>
            <EmailViewer id={emailViewerId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}