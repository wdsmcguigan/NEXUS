import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Star, 
  Clock, 
  Mail, 
  RefreshCw,
  PlusCircle,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Settings,
  Tag,
  MailPlus
} from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmailAccount, Tag as TagType } from '../../shared/schema';

interface FolderExplorerProps {
  tabId?: string;
  [key: string]: any;
}

interface FolderItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  count?: number;
  type: 'folder' | 'category' | 'account';
  color?: string;
  children?: FolderItem[];
  expanded?: boolean;
  accountId?: number;
  emoji?: string;
}

export function FolderExplorer({ tabId, ...props }: FolderExplorerProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch accounts and tags data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accounts
        const accountsResponse = await apiRequest('/api/accounts');
        let accountsData: EmailAccount[] = [];
        
        if (accountsResponse.ok) {
          accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }
        
        // Fetch tags
        const tagsResponse = await apiRequest('/api/tags');
        let tagsData: TagType[] = [];
        
        if (tagsResponse.ok) {
          tagsData = await tagsResponse.json();
          setTags(tagsData);
        }
        
        // If API fails, use sample data
        if (!accountsResponse.ok) {
          accountsData = [
            {
              id: 1,
              userId: 1,
              type: 'work',
              email: 'work@example.com',
              name: 'Work',
              server: 'mail.example.com',
              port: 993,
              authToken: null,
              refreshToken: null
            },
            {
              id: 2,
              userId: 1,
              type: 'personal',
              email: 'personal@example.com',
              name: 'Personal',
              server: 'mail.example.com',
              port: 993,
              authToken: null,
              refreshToken: null
            },
            {
              id: 3,
              userId: 1,
              type: 'school',
              email: 'school@example.com',
              name: 'School',
              server: 'mail.example.com',
              port: 993,
              authToken: null,
              refreshToken: null
            }
          ];
          setAccounts(accountsData);
        }
        
        if (!tagsResponse.ok) {
          tagsData = [
            { id: 1, name: "Work", parentId: null, bgColor: "#e2e8f0", textColor: "#1e293b", emoji: "💼" },
            { id: 2, name: "Projects", parentId: 1, bgColor: "#eef2ff", textColor: "#3730a3", emoji: "📊" },
            { id: 3, name: "Personal", parentId: null, bgColor: "#f3e8ff", textColor: "#6b21a8", emoji: "🏠" },
            { id: 4, name: "Travel", parentId: 3, bgColor: "#ecfdf5", textColor: "#065f46", emoji: "✈️" },
            { id: 5, name: "Important", parentId: null, bgColor: "#fee2e2", textColor: "#991b1b", emoji: "🔥" },
            { id: 6, name: "Finance", parentId: null, bgColor: "#e0f2fe", textColor: "#075985", emoji: "💰" }
          ];
          setTags(tagsData);
        }
        
        // Process tags into a tree structure
        // First, find all root tags (no parentId)
        const rootTags = tagsData.filter(tag => tag.parentId === null);
        
        // Then find children for each root tag
        const tagTree = rootTags.map(rootTag => {
          const children = tagsData.filter(tag => tag.parentId === rootTag.id);
          return {
            id: `tag-${rootTag.id}`,
            name: rootTag.name,
            icon: <span className="mr-2">{rootTag.emoji}</span>,
            type: 'folder' as const,
            color: rootTag.bgColor,
            textColor: rootTag.textColor,
            expanded: false,
            emoji: rootTag.emoji,
            children: children.map(child => ({
              id: `tag-${child.id}`,
              name: child.name,
              icon: <span className="mr-2">{child.emoji}</span>,
              type: 'folder' as const,
              color: child.bgColor,
              textColor: child.textColor,
              emoji: child.emoji
            }))
          };
        });
        
        // Build folder structure
        const folderStructure: FolderItem[] = [
          // All accounts section
          {
            id: 'accounts',
            name: 'Accounts',
            icon: <Mail size={16} />,
            type: 'category',
            expanded: true,
            children: accountsData.map(account => ({
              id: `account-${account.id}`,
              name: account.name,
              type: 'account',
              accountId: account.id,
              expanded: account.id === 1, // Expand first account by default
              children: [
                {
                  id: `inbox-${account.id}`,
                  name: 'Inbox',
                  icon: <Inbox size={16} />,
                  type: 'folder',
                  count: account.id === 1 ? 15 : account.id === 2 ? 3 : 0
                },
                {
                  id: `sent-${account.id}`,
                  name: 'Sent',
                  icon: <Send size={16} />,
                  type: 'folder'
                },
                {
                  id: `archive-${account.id}`,
                  name: 'Archive',
                  icon: <Archive size={16} />,
                  type: 'folder'
                },
                {
                  id: `trash-${account.id}`,
                  name: 'Trash',
                  icon: <Trash2 size={16} />,
                  type: 'folder'
                }
              ]
            }))
          },
          
          // Smart folders section
          {
            id: 'smart-folders',
            name: 'Smart Folders',
            type: 'category',
            expanded: true,
            children: [
              {
                id: 'starred',
                name: 'Starred',
                icon: <Star size={16} className="text-yellow-500" />,
                type: 'folder',
                count: 4
              },
              {
                id: 'todo',
                name: 'Todo',
                icon: <Clock size={16} className="text-amber-500" />,
                type: 'folder',
                count: 2
              },
              {
                id: 'all-mail',
                name: 'All Mail',
                icon: <Mail size={16} />,
                type: 'folder'
              }
            ]
          },
          
          // Tags section
          {
            id: 'tags',
            name: 'Tags',
            icon: <Tag size={16} />,
            type: 'category',
            expanded: true,
            children: tagTree
          }
        ];
        
        setFolders(folderStructure);
        setSelectedFolder('inbox-1'); // Select first inbox by default
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setFolders(prevFolders => {
      // Deep clone the folders structure
      const updatedFolders = JSON.parse(JSON.stringify(prevFolders));
      
      // Helper function to recursively find and toggle the folder
      const findAndToggle = (items: FolderItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === folderId) {
            items[i].expanded = !items[i].expanded;
            return true;
          }
          
          if (items[i].children) {
            if (findAndToggle(items[i].children)) {
              return true;
            }
          }
        }
        
        return false;
      };
      
      findAndToggle(updatedFolders);
      return updatedFolders;
    });
  };
  
  // Select a folder
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    // Here you would typically trigger navigation or content loading
  };
  
  // Render folder items recursively
  const renderFolderItems = (items: FolderItem[], level = 0) => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <div 
          className={`
            flex items-center justify-between py-1 px-2 rounded-md
            ${selectedFolder === item.id ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800/50'}
            ${level > 0 ? 'ml-' + level * 3 : ''}
          `}
          style={{
            backgroundColor: selectedFolder === item.id 
              ? (item.color ? `${item.color}50` : '') 
              : 'transparent',
            color: item.textColor && selectedFolder === item.id ? item.textColor : undefined
          }}
        >
          <div 
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => {
              if (item.type === 'folder') {
                handleFolderSelect(item.id);
              } else if (item.children) {
                toggleFolder(item.id);
              }
            }}
          >
            {item.children && item.children.length > 0 ? (
              <button className="mr-1 text-neutral-400 hover:text-white p-0.5">
                {item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-5"></div>
            )}
            
            <div className="flex items-center">
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span className={item.type === 'category' ? 'text-xs uppercase font-bold text-neutral-500' : ''}>
                {item.name}
              </span>
            </div>
            
            {item.count !== undefined && item.count > 0 && (
              <Badge 
                variant="outline" 
                className="ml-2 py-0 px-2 text-xs h-5 min-w-[20px] flex items-center justify-center bg-blue-500/20 text-blue-400 border-blue-700"
              >
                {item.count}
              </Badge>
            )}
          </div>
          
          {/* Action buttons for accounts and tags */}
          {(item.type === 'account' || item.id === 'tags') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-neutral-500 hover:text-white">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-white">
                {item.type === 'account' && (
                  <>
                    <DropdownMenuItem>
                      <Settings size={14} className="mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-neutral-800" />
                    <DropdownMenuItem>
                      <RefreshCw size={14} className="mr-2" /> Refresh
                    </DropdownMenuItem>
                  </>
                )}
                
                {item.id === 'tags' && (
                  <DropdownMenuItem>
                    <PlusCircle size={14} className="mr-2" /> Add Tag
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Render children if expanded */}
        {item.children && item.expanded && renderFolderItems(item.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      {/* Header with compose button */}
      <div className="p-3 border-b border-neutral-800">
        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400">
          <MailPlus size={16} className="mr-2" /> Compose
        </Button>
      </div>
      
      {/* Folder list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          renderFolderItems(folders)
        )}
      </div>
      
      {/* Storage info and sync status */}
      <div className="p-2 border-t border-neutral-800 text-xs text-neutral-500">
        <div className="flex items-center justify-between mb-1">
          <span>Storage</span>
          <span>2.1 GB / 15 GB</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-1">
          <div className="bg-blue-500 h-1 rounded-full" style={{ width: '14%' }}></div>
        </div>
        <div className="mt-2 flex items-center">
          <RefreshCw size={12} className="mr-1" />
          <span>Last synced: 2 mins ago</span>
        </div>
      </div>
    </div>
  );
}

export default FolderExplorer;