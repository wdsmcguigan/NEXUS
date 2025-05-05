import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useDependencyProvider, useDependencyConsumer } from '../../hooks/useDependencyHooks';
import { DependencyDataTypes } from '../../lib/dependency/DependencyInterfaces';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Mail, Star, Tag, Clock } from 'lucide-react';

// Example email data type
interface Email {
  id: number;
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
  tags?: string[];
  isStarred?: boolean;
  isRead?: boolean;
}

// Mock email data
const mockEmails: Email[] = [
  {
    id: 1,
    subject: 'Meeting Tomorrow',
    from: 'john.doe@example.com',
    to: 'me@nexusemail.com',
    body: 'Hi there! Just a reminder about our meeting tomorrow at 10 AM. Please bring your project notes.',
    date: '2025-05-04T10:30:00',
    tags: ['work', 'meeting'],
    isStarred: true,
    isRead: false
  },
  {
    id: 2,
    subject: 'Project Update: Q2 Milestones',
    from: 'project-manager@company.com',
    to: 'me@nexusemail.com',
    body: 'Hello team, I wanted to share the latest project timeline and upcoming milestones for Q2. Please review the attached documents.',
    date: '2025-05-03T14:15:00',
    tags: ['work', 'important'],
    isStarred: false,
    isRead: true
  },
  {
    id: 3,
    subject: 'Family Vacation Plans',
    from: 'family@personal.com',
    to: 'me@nexusemail.com',
    body: 'Let\'s discuss our summer vacation plans. I was thinking we could visit the beach in June.',
    date: '2025-05-02T09:45:00',
    tags: ['personal', 'vacation'],
    isStarred: true,
    isRead: true
  }
];

// EmailList component that provides selected email data
const EmailListProvider: React.FC = () => {
  const [emails] = useState<Email[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // Register as a dependency provider for selected email data
  const { updateProviderData } = useDependencyProvider<Email>(
    'email-list-provider',
    DependencyDataTypes.EMAIL
  );
  
  // When the selected email changes, update the dependency data
  useEffect(() => {
    if (selectedEmail) {
      updateProviderData(selectedEmail);
    }
  }, [selectedEmail, updateProviderData]);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2" /> Email List (Provider)
        </CardTitle>
        <CardDescription>
          Click on an email to select it and send data to the viewer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {emails.map((email) => (
            <div 
              key={email.id}
              className={`mb-3 p-3 rounded cursor-pointer ${
                selectedEmail?.id === email.id 
                  ? 'bg-primary/10 border-l-4 border-primary' 
                  : 'hover:bg-primary/5 border-l-4 border-transparent'
              }`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex justify-between items-start">
                <div className="font-medium">
                  {!email.isRead && <span className="inline-block w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>}
                  {email.subject}
                </div>
                <div className="flex items-center">
                  {email.isStarred && <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />}
                  <span className="text-xs text-muted-foreground">
                    {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{email.from}</div>
              <div className="text-xs truncate mt-1 text-muted-foreground">{email.body.substring(0, 80)}...</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {email.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" /> {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// EmailViewer component that consumes the selected email data
const EmailViewerConsumer: React.FC = () => {
  // Register as a dependency consumer for EMAIL data type
  const { consumerData, isReady, lastUpdated } = useDependencyConsumer<Email>(
    'email-viewer-consumer',
    DependencyDataTypes.EMAIL
  );
  
  const email = consumerData;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2" /> Email Viewer (Consumer)
        </CardTitle>
        <CardDescription>
          {isReady 
            ? `Receiving data from Email List component ${lastUpdated ? `(Last updated: ${new Date(lastUpdated).toLocaleTimeString()})` : ''}`
            : 'Waiting for dependency data...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isReady || !email ? (
          <div className="p-6 text-center text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Select an email from the list to view its contents</p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{email.subject}</h3>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <div>From: <span className="font-medium">{email.from}</span></div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(email.date).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                To: <span className="font-medium">{email.to}</span>
              </div>
              
              <div className="flex mb-4">
                {email.tags?.map(tag => (
                  <Badge key={tag} variant="outline" className="mr-1">
                    <Tag className="w-3 h-3 mr-1" /> {tag}
                  </Badge>
                ))}
                {email.isStarred && (
                  <Badge variant="outline" className="text-yellow-500">
                    <Star className="w-3 h-3 mr-1" fill="currentColor" /> Starred
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="whitespace-pre-line">{email.body}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main container component that showcases the dependency relationship
const EmailDependencyExample: React.FC = () => {
  return (
    <div className="container p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Component Dependency System Example</h1>
        <p className="text-lg text-muted-foreground">
          This example demonstrates how components can share data using the dependency system.
          The EmailList component acts as a data provider, while the EmailViewer consumes that data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EmailListProvider />
        <EmailViewerConsumer />
      </div>
      
      <div className="mt-8 p-4 border rounded-lg bg-muted/30">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <ol className="list-decimal pl-5 space-y-3">
          <li>The <code>EmailListProvider</code> component registers as a provider for the <code>EMAIL</code> data type using <code>useDependencyProvider</code> hook.</li>
          <li>When a user selects an email, the provider calls <code>updateProviderData</code> to make the email data available.</li>
          <li>The <code>EmailViewerConsumer</code> component registers as a consumer for the <code>EMAIL</code> data type using <code>useDependencyConsumer</code> hook.</li>
          <li>The dependency system automatically connects these components based on the compatible data types.</li>
          <li>When the provider updates its data, the consumer automatically receives the updated data.</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailDependencyExample;