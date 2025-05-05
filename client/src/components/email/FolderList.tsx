import React, { useState, useEffect } from 'react';
import { useDependencyProvider } from '../../hooks/useDependencyHooks';
import { DependencyDataTypes } from '../../lib/dependency/DependencyInterfaces';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Folder, 
  Inbox, 
  Send, 
  Archive, 
  Trash, 
  AlertCircle, 
  Star, 
  File, 
  FileText, 
  Link2, 
  Link2Off, 
  Plus 
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Folder as FolderType } from './EmailList';

interface FolderListProps {
  instanceId: string;
  onFolderSelect?: (folderId: string) => void;
  selectedFolderId?: string;
}

// Mock folder data
const mockFolders: FolderType[] = [
  { id: 'all', name: 'All Mail', icon: 'file-text', count: 42 },
  { id: 'inbox', name: 'Inbox', icon: 'inbox', count: 24 },
  { id: 'sent', name: 'Sent', icon: 'send', count: 18 },
  { id: 'starred', name: 'Starred', icon: 'star', count: 5 },
  { id: 'drafts', name: 'Drafts', icon: 'file', count: 3 },
  { id: 'archive', name: 'Archive', icon: 'archive', count: 15 },
  { id: 'trash', name: 'Trash', icon: 'trash', count: 8 },
  { id: 'spam', name: 'Spam', icon: 'alert-circle', count: 4 }
];

/**
 * Map of folder icon names to Lucide icon components
 */
const folderIcons: Record<string, React.ReactNode> = {
  'folder': <Folder className="w-4 h-4" />,
  'inbox': <Inbox className="w-4 h-4" />,
  'send': <Send className="w-4 h-4" />,
  'archive': <Archive className="w-4 h-4" />,
  'trash': <Trash className="w-4 h-4" />,
  'alert-circle': <AlertCircle className="w-4 h-4" />,
  'star': <Star className="w-4 h-4" />,
  'file': <File className="w-4 h-4" />,
  'file-text': <FileText className="w-4 h-4" />
};

const FolderList: React.FC<FolderListProps> = ({
  instanceId,
  onFolderSelect,
  selectedFolderId = 'all'
}) => {
  const [folders] = useState<FolderType[]>(mockFolders);
  const [selectedFolder, setSelectedFolder] = useState<string>(selectedFolderId);
  const [hasDependentConsumers, setHasDependentConsumers] = useState(false);
  
  // Register as a filter provider
  const {
    updateProviderData,
    getDependentConsumers,
    isRegistered
  } = useDependencyProvider<string>(
    instanceId,
    DependencyDataTypes.FILTERS
  );
  
  // Provide folder list data
  const {
    updateProviderData: updateFolderListData,
    getDependentConsumers: getFolderListConsumers
  } = useDependencyProvider<FolderType[]>(
    instanceId,
    DependencyDataTypes.FOLDER_LIST
  );
  
  // Check for dependent components periodically
  useEffect(() => {
    const checkDependencies = () => {
      const filterConsumers = getDependentConsumers();
      setHasDependentConsumers(filterConsumers.length > 0);
    };
    
    // Initial check
    checkDependencies();
    
    // Setup interval to check periodically
    const intervalId = setInterval(checkDependencies, 2000);
    
    return () => clearInterval(intervalId);
  }, [getDependentConsumers]);
  
  // Update folder list data for consumers
  useEffect(() => {
    updateFolderListData(folders);
  }, [folders, updateFolderListData]);
  
  // When the selected folder changes, update the filter data
  useEffect(() => {
    updateProviderData(selectedFolder);
    
    // If there's an external handler, call it
    if (onFolderSelect) {
      onFolderSelect(selectedFolder);
    }
  }, [selectedFolder, updateProviderData, onFolderSelect]);
  
  // When selectedFolderId prop changes, update selected folder
  useEffect(() => {
    if (selectedFolderId) {
      setSelectedFolder(selectedFolderId);
    }
  }, [selectedFolderId]);
  
  // Handle folder selection
  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
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
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Folder className="mr-2" /> Folders
          </CardTitle>
          
          {isRegistered && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={hasDependentConsumers ? "default" : "outline"}
                    className="ml-2 flex items-center"
                  >
                    {hasDependentConsumers ? (
                      <><Link2 className="w-3 h-3 mr-1" /> Connected</>
                    ) : (
                      <><Link2Off className="w-3 h-3 mr-1" /> Not Connected</>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {hasDependentConsumers 
                    ? "This component has dependent components" 
                    : "No components are dependent on this one"
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-1">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => handleFolderClick(folder.id)}
              >
                <div className="mr-2">
                  {folderIcons[folder.icon] || <Folder className="w-4 h-4" />}
                </div>
                <span className="flex-1 text-left">{folder.name}</span>
                {folder.count !== undefined && (
                  <Badge variant="outline" className="ml-auto">
                    {folder.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-3 border-t">
        <Button variant="outline" size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Folder
        </Button>
        
        {hasDependentConsumers && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDisconnectDependents}
          >
            <Link2Off className="w-3.5 h-3.5 mr-1" /> Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FolderList;