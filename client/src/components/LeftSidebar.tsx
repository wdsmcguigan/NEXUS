import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { accountColors, categoryColors } from "@/lib/data";
import { 
  ChevronDown, 
  ChevronRight, 
  Tag, 
  Settings, 
  Plus, 
  Inbox, 
  Star, 
  Send, 
  Pencil, 
  Trash, 
  Archive, 
  CheckSquare, 
  Mail, 
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { TagWithChildren } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const LeftSidebar = () => {
  const { 
    accounts, 
    selectedAccount, 
    setSelectedAccount,
    selectedMailbox,
    setSelectedMailbox,
    selectedCategory,
    setSelectedCategory,
    tags
  } = useEmailContext();

  const [expandedTags, setExpandedTags] = useState<Record<number, boolean>>({});

  const toggleTagExpanded = (tagId: number) => {
    setExpandedTags(prev => ({
      ...prev,
      [tagId]: !prev[tagId]
    }));
  };

  // State for tag color editing
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [editingTagColor, setEditingTagColor] = useState<string>('#e2e8f0');
  const [editingTagText, setEditingTagText] = useState<string>('#000000');
  const [editingTagEmoji, setEditingTagEmoji] = useState<string>('🏷️');

  // Update tag with new colors
  const updateTagColors = async (tagId: number) => {
    try {
      await apiRequest('PATCH', `/api/tags/${tagId}`, {
        bgColor: editingTagColor,
        textColor: editingTagText,
        emoji: editingTagEmoji
      });
      
      // Close the editor after updating
      setEditingTag(null);
      
      // We should refresh tags here, but for now we'll rely on the UI optimistic update
    } catch (err) {
      console.error('Error updating tag colors:', err);
    }
  };

  const renderTag = (tag: TagWithChildren, isChild = false) => {
    const hasChildren = tag.children && tag.children.length > 0;
    const isEditing = editingTag === tag.id;
    
    return (
      <div key={tag.id}>
        <div className="flex items-center">
          <div 
            className={`tag-item ${isChild ? 'ml-4' : ''} flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer flex-1`}
            onClick={() => hasChildren && toggleTagExpanded(tag.id)}
          >
            {hasChildren ? (
              expandedTags[tag.id] ? (
                <ChevronDown className="w-4 h-4 mr-1 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1 text-neutral-500" />
              )
            ) : (
              <span 
                className="w-5 h-5 flex items-center justify-center mr-1 rounded"
                style={{ 
                  backgroundColor: tag.bgColor || '#e2e8f0',
                  color: tag.textColor || '#000000'
                }}
              >
                {tag.emoji || '🏷️'}
              </span>
            )}
            <span>{tag.name}</span>
          </div>
          
          {/* Edit button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTag(tag.id);
              setEditingTagColor(tag.bgColor);
              setEditingTagText(tag.textColor);
              setEditingTagEmoji(tag.emoji || '🏷️');
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Color picker popover */}
        {isEditing && (
          <div className="ml-4 mt-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            <h4 className="font-medium text-sm mb-2">Edit Tag Appearance</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Background Color</label>
                <HexColorPicker 
                  color={editingTagColor} 
                  onChange={setEditingTagColor}
                  className="w-full max-w-[180px] mb-1" 
                />
                <Input 
                  value={editingTagColor} 
                  onChange={(e) => setEditingTagColor(e.target.value)}
                  className="w-full h-6 text-xs"
                />
              </div>
              
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Text Color</label>
                <HexColorPicker 
                  color={editingTagText} 
                  onChange={setEditingTagText}
                  className="w-full max-w-[180px] mb-1" 
                />
                <Input 
                  value={editingTagText} 
                  onChange={(e) => setEditingTagText(e.target.value)}
                  className="w-full h-6 text-xs"
                />
              </div>
              
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Emoji</label>
                <Input 
                  value={editingTagEmoji} 
                  onChange={(e) => setEditingTagEmoji(e.target.value)}
                  className="w-full h-6 text-xs"
                  maxLength={2}
                />
              </div>
              
              <div className="flex space-x-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => updateTagColors(tag.id)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setEditingTag(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {hasChildren && expandedTags[tag.id] && (
          <div>
            {tag.children?.map(childTag => renderTag(childTag, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full overflow-hidden">
      {/* Account Selection */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm uppercase text-neutral-700 dark:text-neutral-300">Accounts</h2>
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-1 rounded">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {accounts.map(account => (
            <div
              key={account.id}
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedAccount?.id === account.id 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedAccount(account)}
            >
              <div className={`w-3 h-3 rounded-full ${accountColors[account.accountType]} mr-2`}></div>
              {account.email}
            </div>
          ))}
        </div>
      </div>
      
      {/* Mailbox Navigation */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold text-sm uppercase text-neutral-700 dark:text-neutral-300 mb-2">Mailboxes</h2>
        <nav>
          <ul className="space-y-1">
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'inbox' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedMailbox('inbox')}
            >
              <Inbox className={`w-5 h-5 mr-2 ${selectedMailbox === 'inbox' ? 'text-primary' : 'text-neutral-500'}`} />
              Inbox <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">24</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'starred' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedMailbox('starred')}
            >
              <Star className={`w-5 h-5 mr-2 ${selectedMailbox === 'starred' ? 'text-primary' : 'text-neutral-500'}`} />
              Starred
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'sent' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedMailbox('sent')}
            >
              <Send className={`w-5 h-5 mr-2 ${selectedMailbox === 'sent' ? 'text-primary' : 'text-neutral-500'}`} />
              Sent
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'drafts' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedMailbox('drafts')}
            >
              <Pencil className={`w-5 h-5 mr-2 ${selectedMailbox === 'drafts' ? 'text-primary' : 'text-neutral-500'}`} />
              Drafts <span className="ml-auto bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs px-1.5 py-0.5 rounded-full">3</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'trash' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedMailbox('trash')}
            >
              <Trash className={`w-5 h-5 mr-2 ${selectedMailbox === 'trash' ? 'text-primary' : 'text-neutral-500'}`} />
              Trash
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Categories */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold text-sm uppercase text-neutral-700 dark:text-neutral-300 mb-2">Categories</h2>
        <nav>
          <ul className="space-y-1">
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'primary' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedCategory('primary')}
            >
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Primary
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'social' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedCategory('social')}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Social <span className="ml-auto bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">8</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'promotions' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedCategory('promotions')}
            >
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Promotions <span className="ml-auto bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">16</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'updates' 
                  ? 'bg-primary/15 text-primary font-medium' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => setSelectedCategory('updates')}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Updates <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">4</span>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Tags */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm uppercase text-neutral-700 dark:text-neutral-300">Tags</h2>
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 p-1 rounded">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Tag hierarchy */}
        <ScrollArea className="text-sm h-[calc(100vh-450px)]">
          <div className="pr-3">
            {tags.map(tag => renderTag(tag))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Settings access */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <Button variant="ghost" className="w-full flex items-center p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded justify-start">
          <Settings className="w-5 h-5 mr-2 text-neutral-500" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default LeftSidebar;
