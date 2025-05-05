import React, { useState } from 'react';
import { DependencyProvider } from '../context/DependencyContext';
import EmailList from './email/EmailList';
import EmailViewer from './email/EmailViewer';
import ContactDetails from './email/ContactDetails';
import FolderList from './email/FolderList';
import TagManager from './email/TagManager';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from './ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Mail, 
  Info, 
  ArrowDownUp, 
  RefreshCcw, 
  FolderOpen,
  Tag,
  User,
  Mail as MailIcon
} from 'lucide-react';

const EmailDependencyDemo: React.FC = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('inbox');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  
  // In a real app, you wouldn't need to generate IDs manually like this
  // They would be derived from database IDs or other sources
  const instanceIds = {
    folderList: 'folder-list-1',
    tagManager: 'tag-manager-1',
    emailList: 'email-list-1',
    emailViewer: 'email-viewer-1',
    contactDetails: 'contact-details-1'
  };
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
  };
  
  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(tagId);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedFolderId('all');
    setSelectedTagId('');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Mail className="h-8 w-8 mr-3 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">NEXUS.email</h1>
            <p className="text-muted-foreground">Component Dependency Demo</p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="text-sm mr-4 bg-muted/50 py-1 px-3 rounded-md text-muted-foreground flex items-center">
            <Info className="h-3.5 w-3.5 mr-1" />
            Data flows automatically between connected components
          </div>
          
          <Button variant="outline" onClick={handleResetFilters}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Reset Filters
          </Button>
        </div>
      </header>
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[800px] rounded-lg border">
        {/* Left sidebar - email organization */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full p-4 flex flex-col">
            <Tabs defaultValue="folders" className="flex-grow">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="folders" className="flex gap-1 items-center">
                  <FolderOpen className="h-4 w-4" /> Folders
                </TabsTrigger>
                <TabsTrigger value="tags" className="flex gap-1 items-center">
                  <Tag className="h-4 w-4" /> Tags
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="folders" className="h-full mt-0">
                <FolderList
                  instanceId={instanceIds.folderList}
                  onFolderSelect={handleFolderSelect}
                  selectedFolderId={selectedFolderId}
                />
              </TabsContent>
              
              <TabsContent value="tags" className="h-full mt-0">
                <TagManager
                  instanceId={instanceIds.tagManager}
                  onTagSelect={handleTagSelect}
                  selectedTagId={selectedTagId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Middle panel - email list */}
        <ResizablePanel defaultSize={30}>
          <div className="h-full p-4">
            <EmailList
              instanceId={instanceIds.emailList}
              filterFolder={selectedFolderId}
              filterTag={selectedTagId}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Right panel - email viewer and contact details */}
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="vertical">
            {/* Email viewer */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full p-4">
                <EmailViewer
                  instanceId={instanceIds.emailViewer}
                />
              </div>
            </ResizablePanel>
            
            <ResizableHandle />
            
            {/* Contact details */}
            <ResizablePanel defaultSize={30}>
              <div className="h-full p-4">
                <ContactDetails
                  instanceId={instanceIds.contactDetails}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Dependency explanation */}
      <div className="mt-6 p-6 border rounded-lg bg-muted/30">
        <h2 className="text-lg font-bold mb-4 flex items-center">
          <ArrowDownUp className="mr-2 h-5 w-5" /> Data Flow Between Components
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <MailIcon className="h-4 w-4 mr-1 text-purple-500" /> EmailList
              </CardTitle>
              <CardDescription>Data flow & dependencies</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1 list-disc pl-4">
                <li><span className="font-medium">Consumes:</span> folder/tag filters from FolderList and TagManager</li>
                <li><span className="font-medium">Provides:</span> selected email data to EmailViewer</li>
                <li>When you select an email, that data is sent to the EmailViewer automatically</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Mail className="h-4 w-4 mr-1 text-orange-500" /> EmailViewer
              </CardTitle>
              <CardDescription>Data flow & dependencies</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1 list-disc pl-4">
                <li><span className="font-medium">Consumes:</span> email data from EmailList</li>
                <li><span className="font-medium">Provides:</span> contact information to ContactDetails</li>
                <li>Automatically extracts sender contact info from emails and passes it to the ContactDetails component</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <User className="h-4 w-4 mr-1 text-red-500" /> ContactDetails
              </CardTitle>
              <CardDescription>Data flow & dependencies</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1 list-disc pl-4">
                <li><span className="font-medium">Consumes:</span> contact data from EmailViewer</li>
                <li><span className="font-medium">Provides:</span> none</li>
                <li>Displays detailed contact information whenever a new email is selected</li>
                <li>Acts as a terminal consumer in the dependency chain</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-sm text-center text-muted-foreground">
          Try clicking on different emails to see how data automatically flows through the components.<br />
          Each component shows connection status and lets you disconnect dependencies if needed.
        </div>
      </div>
    </div>
  );
};

export default EmailDependencyDemo;