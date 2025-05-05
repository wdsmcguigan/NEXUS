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
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Tag as TagIcon, 
  Plus, 
  Link2, 
  Link2Off,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Tag as TagType } from './EmailList';

interface TagManagerProps {
  instanceId: string;
  onTagSelect?: (tagId: string) => void;
  selectedTagId?: string;
}

// Mock tag data
const mockTags: TagType[] = [
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'important', name: 'Important', color: '#ef4444' },
  { id: 'vacation', name: 'Vacation', color: '#f59e0b' },
  { id: 'newsletter', name: 'Newsletter', color: '#8b5cf6' },
  { id: 'tech', name: 'Tech', color: '#0ea5e9' },
  { id: 'billing', name: 'Billing', color: '#ec4899' },
  { id: 'meeting', name: 'Meeting', color: '#64748b' }
];

const TagManager: React.FC<TagManagerProps> = ({
  instanceId,
  onTagSelect,
  selectedTagId
}) => {
  const [tags, setTags] = useState<TagType[]>(mockTags);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(selectedTagId);
  const [hasDependentConsumers, setHasDependentConsumers] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  
  // Register as a tag filter provider
  const {
    updateProviderData,
    getDependentConsumers,
    isRegistered
  } = useDependencyProvider<string>(
    instanceId,
    DependencyDataTypes.TAG_FILTER
  );
  
  // Register as a tag list provider
  const {
    updateProviderData: updateTagListData,
    getDependentConsumers: getTagListConsumers
  } = useDependencyProvider<TagType[]>(
    instanceId,
    DependencyDataTypes.TAG_LIST
  );
  
  // Check for dependent components periodically
  useEffect(() => {
    const checkDependencies = () => {
      const filterConsumers = getDependentConsumers();
      const tagListConsumers = getTagListConsumers();
      setHasDependentConsumers(filterConsumers.length > 0 || tagListConsumers.length > 0);
    };
    
    // Initial check
    checkDependencies();
    
    // Setup interval
    const intervalId = setInterval(checkDependencies, 2000);
    
    return () => clearInterval(intervalId);
  }, [getDependentConsumers, getTagListConsumers]);
  
  // Update tag list data for consumers
  useEffect(() => {
    updateTagListData(tags);
  }, [tags, updateTagListData]);
  
  // When the selected tag changes, update the filter data
  useEffect(() => {
    if (selectedTag) {
      updateProviderData(selectedTag);
      
      // If there's an external handler, call it
      if (onTagSelect) {
        onTagSelect(selectedTag);
      }
    }
  }, [selectedTag, updateProviderData, onTagSelect]);
  
  // When selectedTagId prop changes, update selected tag
  useEffect(() => {
    setSelectedTag(selectedTagId);
  }, [selectedTagId]);
  
  // Handle tag selection
  const handleTagClick = (tagId: string) => {
    // If tag is already selected, unselect it
    if (selectedTag === tagId) {
      setSelectedTag(undefined);
      updateProviderData("");
      
      if (onTagSelect) {
        onTagSelect("");
      }
      
      return;
    }
    
    setSelectedTag(tagId);
  };
  
  // Start editing a tag
  const handleEditTag = (tag: TagType) => {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };
  
  // Save tag edits
  const handleSaveTagEdit = () => {
    if (!editingTagId) return;
    
    const updatedTags = tags.map(tag => 
      tag.id === editingTagId 
        ? { ...tag, name: editTagName, color: editTagColor } 
        : tag
    );
    
    setTags(updatedTags);
    setEditingTagId(null);
    
    toast({
      title: "Tag Updated",
      description: `Tag "${editTagName}" has been updated.`,
      variant: "default"
    });
  };
  
  // Cancel tag editing
  const handleCancelTagEdit = () => {
    setEditingTagId(null);
  };
  
  // Delete a tag
  const handleDeleteTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    
    // If the deleted tag was selected, clear selection
    if (selectedTag === tagId) {
      setSelectedTag(undefined);
      updateProviderData("");
      
      if (onTagSelect) {
        onTagSelect("");
      }
    }
    
    toast({
      title: "Tag Deleted",
      description: "The tag has been removed.",
      variant: "default"
    });
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
            <TagIcon className="mr-2" /> Tags
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
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between">
                {editingTagId === tag.id ? (
                  <div className="flex items-center w-full space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full cursor-pointer" 
                      style={{ backgroundColor: editTagColor }}
                      onClick={() => {
                        // A real color picker would be implemented here
                        const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#0ea5e9', '#64748b', '#ec4899'];
                        const nextColor = colors[Math.floor(Math.random() * colors.length)];
                        setEditTagColor(nextColor);
                      }}
                    />
                    <Input 
                      value={editTagName} 
                      onChange={(e) => setEditTagName(e.target.value)}
                      className="h-8 text-sm flex-grow"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveTagEdit}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelTagEdit}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant={selectedTag === tag.id ? "secondary" : "ghost"}
                      className="flex-grow justify-start h-8 px-3"
                      onClick={() => handleTagClick(tag.id)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </Button>
                    <div className="flex">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTag(tag)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTag(tag.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-3 border-t">
        <Button variant="outline" size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Tag
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

export default TagManager;