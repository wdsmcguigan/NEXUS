import React, { useState, useEffect } from 'react';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from './ui/resizable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Mail, 
  Search, 
  Inbox, 
  Send, 
  Archive, 
  Trash, 
  Tag,
  User,
  List,
  Settings,
  Folder,
  AlertCircle
} from 'lucide-react';
import DependencyManager from './dependency/DependencyManager';
import DependencyIndicator from './dependency/DependencyIndicator';
import { useDependencyContext } from '../context/DependencyContext';
import { DependencyDataTypes } from '../lib/dependency/DependencyInterfaces';
import { nanoid } from 'nanoid';

// Mock email data
interface Email {
  id: string;
  subject: string;
  from: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  tags?: string[];
}

// Mock component IDs
const COMPONENT_IDS = {
  EMAIL_LIST: 'email-list',
  EMAIL_VIEWER: 'email-viewer',
  CONTACT_DETAILS: 'contact-details',
  FOLDER_LIST: 'folder-list',
  TAG_MANAGER: 'tag-manager'
};

const EmailDependencyDemo: React.FC = () => {
  const { registry, manager } = useDependencyContext();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Initialize dependencies and register components
  useEffect(() => {
    // Register the EmailList component as a both provider and consumer
    registry.registerProvider(COMPONENT_IDS.EMAIL_LIST, DependencyDataTypes.EMAIL, 'List of emails');
    registry.registerConsumer(COMPONENT_IDS.EMAIL_LIST, DependencyDataTypes.FOLDER, 'Filters emails by folder');
    registry.registerConsumer(COMPONENT_IDS.EMAIL_LIST, DependencyDataTypes.TAG, 'Filters emails by tag');
    
    // Register the EmailViewer component
    registry.registerProvider(COMPONENT_IDS.EMAIL_VIEWER, DependencyDataTypes.CONTACT, 'Provides contact information from email');
    registry.registerConsumer(COMPONENT_IDS.EMAIL_VIEWER, DependencyDataTypes.EMAIL, 'Displays email content');
    
    // Register the ContactDetails component
    registry.registerConsumer(COMPONENT_IDS.CONTACT_DETAILS, DependencyDataTypes.CONTACT, 'Displays contact information');
    
    // Register the FolderList component
    registry.registerProvider(COMPONENT_IDS.FOLDER_LIST, DependencyDataTypes.FOLDER, 'Provides folder selection');
    
    // Register the TagManager component
    registry.registerProvider(COMPONENT_IDS.TAG_MANAGER, DependencyDataTypes.TAG, 'Provides tag selection');
    
    // Create dependencies
    registry.createDependency(COMPONENT_IDS.EMAIL_LIST, COMPONENT_IDS.EMAIL_VIEWER, DependencyDataTypes.EMAIL);
    registry.createDependency(COMPONENT_IDS.EMAIL_VIEWER, COMPONENT_IDS.CONTACT_DETAILS, DependencyDataTypes.CONTACT);
    registry.createDependency(COMPONENT_IDS.FOLDER_LIST, COMPONENT_IDS.EMAIL_LIST, DependencyDataTypes.FOLDER);
    registry.createDependency(COMPONENT_IDS.TAG_MANAGER, COMPONENT_IDS.EMAIL_LIST, DependencyDataTypes.TAG);
    
    // Set initial values
    manager.setData(COMPONENT_IDS.FOLDER_LIST, DependencyDataTypes.FOLDER, 'inbox');
    manager.setData(COMPONENT_IDS.TAG_MANAGER, DependencyDataTypes.TAG, null);
    
    // Clean up on unmount
    return () => {
      // Clean up dependencies for this demo
      registry.getDependenciesByProvider(COMPONENT_IDS.EMAIL_LIST).forEach(dep => registry.removeDependency(dep.id));
      registry.getDependenciesByProvider(COMPONENT_IDS.EMAIL_VIEWER).forEach(dep => registry.removeDependency(dep.id));
      registry.getDependenciesByProvider(COMPONENT_IDS.FOLDER_LIST).forEach(dep => registry.removeDependency(dep.id));
      registry.getDependenciesByProvider(COMPONENT_IDS.TAG_MANAGER).forEach(dep => registry.removeDependency(dep.id));
      
      // Unregister components
      registry.unregisterComponent(COMPONENT_IDS.EMAIL_LIST);
      registry.unregisterComponent(COMPONENT_IDS.EMAIL_VIEWER);
      registry.unregisterComponent(COMPONENT_IDS.CONTACT_DETAILS);
      registry.unregisterComponent(COMPONENT_IDS.FOLDER_LIST);
      registry.unregisterComponent(COMPONENT_IDS.TAG_MANAGER);
    };
  }, [registry, manager]);
  
  // Handle email selection
  const handleEmailSelected = (email: Email) => {
    setSelectedEmail(email);
    manager.setData(COMPONENT_IDS.EMAIL_LIST, DependencyDataTypes.EMAIL, email);
  };
  
  // Listen for data changes (EmailViewer -> ContactDetails)
  useEffect(() => {
    const handleContactData = (data: any) => {
      setSelectedContact(data);
    };
    
    const handleFolderData = (data: any) => {
      setSelectedFolder(data || 'inbox');
    };
    
    const handleTagData = (data: any) => {
      setSelectedTag(data);
    };
    
    // Subscribe to contact data changes
    const contactUnsubscribe = manager.subscribeToData(
      COMPONENT_IDS.CONTACT_DETAILS,
      DependencyDataTypes.CONTACT,
      handleContactData
    );
    
    // Subscribe to folder data changes
    const folderUnsubscribe = manager.subscribeToData(
      COMPONENT_IDS.EMAIL_LIST,
      DependencyDataTypes.FOLDER,
      handleFolderData
    );
    
    // Subscribe to tag data changes
    const tagUnsubscribe = manager.subscribeToData(
      COMPONENT_IDS.EMAIL_LIST,
      DependencyDataTypes.TAG,
      handleTagData
    );
    
    return () => {
      contactUnsubscribe();
      folderUnsubscribe();
      tagUnsubscribe();
    };
  }, [manager]);
  
  // Listen for email data changes
  useEffect(() => {
    const handleEmailData = (data: any) => {
      setSelectedEmail(data);
      if (data && data.from) {
        manager.setData(COMPONENT_IDS.EMAIL_VIEWER, DependencyDataTypes.CONTACT, data.from);
      }
    };
    
    // Subscribe to email data changes
    const unsubscribe = manager.subscribeToData(
      COMPONENT_IDS.EMAIL_VIEWER,
      DependencyDataTypes.EMAIL,
      handleEmailData
    );
    
    return () => {
      unsubscribe();
    };
  }, [manager]);
  
  // Handle folder selection
  const handleFolderSelected = (folder: string) => {
    setSelectedFolder(folder);
    manager.setData(COMPONENT_IDS.FOLDER_LIST, DependencyDataTypes.FOLDER, folder);
  };
  
  // Handle tag selection
  const handleTagSelected = (tag: string | null) => {
    setSelectedTag(tag);
    manager.setData(COMPONENT_IDS.TAG_MANAGER, DependencyDataTypes.TAG, tag);
  };
  
  // Mock email data
  const emails: Email[] = [
    {
      id: nanoid(),
      subject: 'Weekly Team Meeting',
      from: 'john.smith@company.com',
      preview: 'Hi team, reminder that we have our weekly sync tomorrow at 10AM.',
      date: '10:23 AM',
      read: false,
      starred: true,
      tags: ['important', 'work']
    },
    {
      id: nanoid(),
      subject: 'Project Deadline Update',
      from: 'project-manager@company.com',
      preview: 'The deadline for the current phase has been extended by one week.',
      date: 'Yesterday',
      read: true,
      starred: false,
      tags: ['work']
    },
    {
      id: nanoid(),
      subject: 'Vacation Plans',
      from: 'travel@agency.com',
      preview: 'Your upcoming vacation package is confirmed. Here are the details...',
      date: 'Jul 21',
      read: true,
      starred: true,
      tags: ['personal']
    },
    {
      id: nanoid(),
      subject: 'New Feature Request',
      from: 'customer-support@company.com',
      preview: 'A customer has requested a new feature for our product. Please review...',
      date: 'Jul 20',
      read: true,
      starred: false,
      tags: ['work', 'important']
    },
    {
      id: nanoid(),
      subject: 'Company Newsletter',
      from: 'newsletter@company.com',
      preview: "This month's newsletter includes updates on company events, new hires...",
      date: 'Jul 19',
      read: true,
      starred: false
    }
  ];
  
  // Filter emails by folder and tag
  const filteredEmails = emails.filter(email => {
    let matchesFolder = true;
    let matchesTag = true;
    
    // Filter by folder
    if (selectedFolder === 'starred') {
      matchesFolder = email.starred;
    } else if (selectedFolder === 'unread') {
      matchesFolder = !email.read;
    }
    
    // Filter by tag
    if (selectedTag) {
      matchesTag = email.tags?.includes(selectedTag) || false;
    }
    
    return matchesFolder && matchesTag;
  });
  
  // Mock folders
  const folders = [
    { id: 'inbox', name: 'Inbox', icon: <Inbox className="h-4 w-4" />, count: emails.filter(e => !e.read).length },
    { id: 'sent', name: 'Sent', icon: <Send className="h-4 w-4" />, count: 0 },
    { id: 'starred', name: 'Starred', icon: <Mail className="h-4 w-4" />, count: emails.filter(e => e.starred).length },
    { id: 'unread', name: 'Unread', icon: <AlertCircle className="h-4 w-4" />, count: emails.filter(e => !e.read).length },
    { id: 'archive', name: 'Archive', icon: <Archive className="h-4 w-4" />, count: 0 },
    { id: 'trash', name: 'Trash', icon: <Trash className="h-4 w-4" />, count: 0 }
  ];
  
  // Mock tags
  const tags = [
    { id: 'work', name: 'Work', color: 'bg-blue-500' },
    { id: 'personal', name: 'Personal', color: 'bg-green-500' },
    { id: 'important', name: 'Important', color: 'bg-red-500' },
    { id: 'travel', name: 'Travel', color: 'bg-purple-500' },
    { id: 'finance', name: 'Finance', color: 'bg-yellow-500' }
  ];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">NEXUS.email</h1>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search emails..." 
            className="w-full pl-9 bg-muted/40"
          />
        </div>
        <div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <Tabs defaultValue="folders" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-2 grid w-auto grid-cols-3">
                <TabsTrigger value="folders">
                  <List className="h-4 w-4 mr-1" />
                  Folders
                </TabsTrigger>
                <TabsTrigger value="tags">
                  <Tag className="h-4 w-4 mr-1" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="contacts">
                  <User className="h-4 w-4 mr-1" />
                  Contacts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="folders" className="flex-1 p-4 pt-2 relative">
                <Card className="h-full">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">
                      <Folder className="h-4 w-4 inline mr-1.5" />
                      Folders
                    </CardTitle>
                    <DependencyIndicator 
                      componentId={COMPONENT_IDS.FOLDER_LIST} 
                      variant="minimal" 
                      position="inline" 
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-180px)]">
                      <div className="p-2">
                        {folders.map(folder => (
                          <Button
                            key={folder.id}
                            variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
                            className="w-full justify-start mb-1"
                            onClick={() => handleFolderSelected(folder.id)}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                {folder.icon}
                                <span className="ml-2">{folder.name}</span>
                              </div>
                              {folder.count > 0 && (
                                <Badge variant="secondary">{folder.count}</Badge>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tags" className="flex-1 p-4 pt-2 relative">
                <Card className="h-full">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">
                      <Tag className="h-4 w-4 inline mr-1.5" />
                      Tags
                    </CardTitle>
                    <DependencyIndicator 
                      componentId={COMPONENT_IDS.TAG_MANAGER} 
                      variant="minimal" 
                      position="inline" 
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-180px)]">
                      <div className="p-2">
                        <Button
                          variant={selectedTag === null ? 'secondary' : 'ghost'}
                          className="w-full justify-start mb-1"
                          onClick={() => handleTagSelected(null)}
                        >
                          <div className="flex items-center">
                            <Tag className="h-4 w-4" />
                            <span className="ml-2">All Tags</span>
                          </div>
                        </Button>
                        {tags.map(tag => (
                          <Button
                            key={tag.id}
                            variant={selectedTag === tag.id ? 'secondary' : 'ghost'}
                            className="w-full justify-start mb-1"
                            onClick={() => handleTagSelected(tag.id)}
                          >
                            <div className="flex items-center">
                              <div className={`h-3 w-3 rounded-full ${tag.color} mr-2`} />
                              <span>{tag.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contacts" className="flex-1 p-4 pt-2">
                <Card className="h-full">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Contacts</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 text-center text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p>Contact list view will be implemented soon.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={30}>
            <Card className="h-full border-0 rounded-none relative">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  <Inbox className="h-4 w-4 inline mr-1.5" />
                  {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)}
                  {selectedTag && (
                    <Badge className="ml-2" variant="outline">
                      <div className={`h-2 w-2 rounded-full ${tags.find(t => t.id === selectedTag)?.color} mr-1.5`} />
                      {tags.find(t => t.id === selectedTag)?.name}
                    </Badge>
                  )}
                </CardTitle>
                <DependencyIndicator 
                  componentId={COMPONENT_IDS.EMAIL_LIST} 
                  variant="badge" 
                  position="inline" 
                />
              </CardHeader>
              <CardContent className="p-0 h-[calc(100vh-130px)] overflow-hidden">
                <ScrollArea className="h-full">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p>No emails in this folder</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredEmails.map(email => (
                        <div 
                          key={email.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedEmail?.id === email.id 
                              ? 'bg-muted/80' 
                              : 'hover:bg-muted/50'
                          } ${
                            !email.read ? 'font-medium' : ''
                          }`}
                          onClick={() => handleEmailSelected(email)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium">{email.from}</div>
                            <div className="text-xs text-muted-foreground">{email.date}</div>
                          </div>
                          <div className="mb-1">{email.subject}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{email.preview}</div>
                          
                          {email.tags && email.tags.length > 0 && (
                            <div className="mt-2 flex gap-1">
                              {email.tags.map(tagId => {
                                const tag = tags.find(t => t.id === tagId);
                                return tag ? (
                                  <Badge 
                                    key={tagId} 
                                    variant="outline" 
                                    className="text-[10px] py-0 h-4"
                                  >
                                    <div className={`h-1.5 w-1.5 rounded-full ${tag.color} mr-1`} />
                                    {tag.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={50}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <Card className="h-full border-0 rounded-none relative">
                  <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-md">
                        {selectedEmail ? selectedEmail.subject : 'Select an Email'}
                      </CardTitle>
                      {selectedEmail && (
                        <div className="text-sm text-muted-foreground mt-1">
                          From: {selectedEmail.from}
                        </div>
                      )}
                    </div>
                    <DependencyIndicator 
                      componentId={COMPONENT_IDS.EMAIL_VIEWER} 
                      variant="badge" 
                      position="inline" 
                    />
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-6">
                    {selectedEmail ? (
                      <div>
                        <p className="mb-4 text-muted-foreground">{selectedEmail.date}</p>
                        <p className="mb-4">{selectedEmail.preview}</p>
                        <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vehicula tincidunt 
                          semper. Aenean aliquet mi id vulputate facilisis. Vestibulum dignissim fringilla
                          lectus, in facilisis eros congue eget. Suspendisse potenti.
                        </p>
                        <p className="mt-4">
                          Sed porttitor felis sed purus porttitor, vel consectetur urna vestibulum. Sed 
                          auctor, enim non molestie ornare, enim enim mollis nunc, id varius nisi nisl 
                          non urna. 
                        </p>
                        <p className="mt-4">
                          Best regards,<br />
                          {selectedEmail.from.split('@')[0]}
                        </p>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Mail className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
                          <p>Select an email to view its contents</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ResizablePanel>
              
              <ResizableHandle />
              
              <ResizablePanel defaultSize={30}>
                <Card className="h-full border-0 rounded-none relative">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">
                      <User className="h-4 w-4 inline mr-1.5" />
                      Contact Details
                    </CardTitle>
                    <DependencyIndicator 
                      componentId={COMPONENT_IDS.CONTACT_DETAILS} 
                      variant="minimal" 
                      position="inline" 
                    />
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-4">
                    {selectedContact ? (
                      <div>
                        <div className="flex items-center mb-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                            <User className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {selectedContact.split('@')[0].split('.').map(
                                part => part.charAt(0).toUpperCase() + part.slice(1)
                              ).join(' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">{selectedContact}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Company</div>
                            <div className="text-sm">{selectedContact.split('@')[1].split('.')[0]}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Role</div>
                            <div className="text-sm">Team Member</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Last Communication</div>
                            <div className="text-sm">Today</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                          <p>Select an email to view contact details</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EmailDependencyDemo;