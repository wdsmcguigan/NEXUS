import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { accountColors, categoryColors } from "@/lib/data";
import { ChevronDown, ChevronRight, Tag, Settings, Plus, Inbox, Star, Send, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagWithChildren } from "@shared/schema";

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

  const renderTag = (tag: TagWithChildren, isChild = false) => {
    const hasChildren = tag.children && tag.children.length > 0;
    
    return (
      <div key={tag.id}>
        <div 
          className={`tag-item ${isChild ? 'ml-4' : ''} flex items-center p-2 hover:bg-neutral-100 rounded cursor-pointer`}
          onClick={() => hasChildren && toggleTagExpanded(tag.id)}
        >
          {hasChildren ? (
            expandedTags[tag.id] ? (
              <ChevronDown className="w-4 h-4 mr-1 text-neutral-500" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1 text-neutral-500" />
            )
          ) : (
            <Tag className="w-4 h-4 mr-1 text-neutral-500" />
          )}
          <span>{tag.name}</span>
        </div>
        
        {hasChildren && expandedTags[tag.id] && (
          <div>
            {tag.children?.map(childTag => renderTag(childTag, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-neutral-50 border-r border-neutral-200 flex flex-col h-full overflow-hidden">
      {/* Account Selection */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm uppercase text-neutral-700">Accounts</h2>
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary hover:bg-opacity-10 p-1 rounded">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {accounts.map(account => (
            <div
              key={account.id}
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedAccount?.id === account.id 
                  ? 'bg-primary bg-opacity-10 text-primary font-medium' 
                  : 'hover:bg-neutral-100'
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
      <div className="p-3 border-t border-neutral-200">
        <h2 className="font-semibold text-sm uppercase text-neutral-700 mb-2">Mailboxes</h2>
        <nav>
          <ul className="space-y-1">
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'inbox' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedMailbox('inbox')}
            >
              <Inbox className={`w-5 h-5 mr-2 ${selectedMailbox === 'inbox' ? 'text-primary' : 'text-neutral-500'}`} />
              Inbox <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">24</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'starred' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedMailbox('starred')}
            >
              <Star className={`w-5 h-5 mr-2 ${selectedMailbox === 'starred' ? 'text-primary' : 'text-neutral-500'}`} />
              Starred
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'sent' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedMailbox('sent')}
            >
              <Send className={`w-5 h-5 mr-2 ${selectedMailbox === 'sent' ? 'text-primary' : 'text-neutral-500'}`} />
              Sent
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'drafts' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedMailbox('drafts')}
            >
              <Pencil className={`w-5 h-5 mr-2 ${selectedMailbox === 'drafts' ? 'text-primary' : 'text-neutral-500'}`} />
              Drafts <span className="ml-auto bg-neutral-300 text-neutral-700 text-xs px-1.5 py-0.5 rounded-full">3</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedMailbox === 'trash' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
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
      <div className="p-3 border-t border-neutral-200">
        <h2 className="font-semibold text-sm uppercase text-neutral-700 mb-2">Categories</h2>
        <nav>
          <ul className="space-y-1">
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'primary' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedCategory('primary')}
            >
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Primary
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'social' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedCategory('social')}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Social <span className="ml-auto bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">8</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'promotions' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedCategory('promotions')}
            >
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Promotions <span className="ml-auto bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">16</span>
            </li>
            <li 
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedCategory === 'updates' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100'
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
      <div className="p-3 border-t border-neutral-200 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm uppercase text-neutral-700">Tags</h2>
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary hover:bg-opacity-10 p-1 rounded">
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
      <div className="p-3 border-t border-neutral-200">
        <Button variant="ghost" className="w-full flex items-center p-2 hover:bg-neutral-100 rounded justify-start">
          <Settings className="w-5 h-5 mr-2 text-neutral-500" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default LeftSidebar;
