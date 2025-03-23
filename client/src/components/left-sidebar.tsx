import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Users, Tag, Bell, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmailAccount {
  id: number;
  email: string;
  name: string;
  color: string;
  isPrimary: boolean;
}

export interface EmailCategory {
  id: number;
  name: string;
  icon: string;
  count?: number;
}

export interface EmailTag {
  id: number;
  name: string;
  color: string;
  parentId: number | null;
  children?: EmailTag[];
}

export interface LeftSidebarProps {
  accounts: EmailAccount[];
  categories: EmailCategory[];
  tags: EmailTag[];
  selectedAccountId?: number;
  selectedCategoryId?: number;
  selectedTagId?: number;
  onComposeClick: () => void;
  onAccountSelect: (accountId: number) => void;
  onAllInboxesSelect: () => void;
  onCategorySelect: (categoryId: number) => void;
  onTagSelect: (tagId: number) => void;
  onCreateTagClick: () => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'mail':
      return <Mail className="h-5 w-5 mr-2 text-blue-600" />;
    case 'users':
      return <Users className="h-5 w-5 mr-2 text-purple-600" />;
    case 'tag':
      return <Tag className="h-5 w-5 mr-2 text-green-600" />;
    case 'bell':
      return <Bell className="h-5 w-5 mr-2 text-amber-600" />;
    default:
      return <Mail className="h-5 w-5 mr-2 text-blue-600" />;
  }
};

// Helper to render hierarchical tags
const renderTags = (
  tags: EmailTag[],
  parentId: number | null = null,
  level = 0,
  onTagSelect: (tagId: number) => void,
  selectedTagId?: number
) => {
  return tags
    .filter(tag => tag.parentId === parentId)
    .map(tag => (
      <React.Fragment key={tag.id}>
        <li className="mb-1 group">
          <a 
            href="#" 
            className={cn(
              "flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-neutral-100",
              selectedTagId === tag.id && "bg-neutral-100"
            )}
            onClick={(e) => {
              e.preventDefault();
              onTagSelect(tag.id);
            }}
          >
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: tag.color }}
            />
            <span>{tag.name}</span>
            <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </span>
          </a>
          
          {/* Render nested tags if any */}
          {tags.some(childTag => childTag.parentId === tag.id) && (
            <ul className="ml-4">
              {renderTags(tags, tag.id, level + 1, onTagSelect, selectedTagId)}
            </ul>
          )}
        </li>
      </React.Fragment>
    ));
};

export function LeftSidebar({
  accounts,
  categories,
  tags,
  selectedAccountId,
  selectedCategoryId,
  selectedTagId,
  onComposeClick,
  onAccountSelect,
  onAllInboxesSelect,
  onCategorySelect,
  onTagSelect,
  onCreateTagClick,
  onSettingsClick,
  onHelpClick
}: LeftSidebarProps) {
  return (
    <div className="bg-white border-r border-neutral-200 flex flex-col h-full">
      {/* New Email Button */}
      <div className="p-3">
        <Button
          className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-150 flex items-center justify-center"
          onClick={onComposeClick}
        >
          <Plus className="h-5 w-5 mr-2" />
          Compose
        </Button>
      </div>
      
      {/* Email Accounts Section */}
      <div className="px-3 py-2">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Accounts</h2>
        <ul>
          {accounts.map(account => (
            <li key={account.id} className="mb-1">
              <a 
                href="#" 
                className={cn(
                  "flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-neutral-100 font-medium",
                  selectedAccountId === account.id && "bg-neutral-100"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  onAccountSelect(account.id);
                }}
              >
                <span 
                  className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" 
                  style={{ backgroundColor: account.color }}
                />
                <span>{account.email}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      
      {/* All Inboxes Section */}
      <div className="px-3 py-2">
        <a 
          href="#" 
          className={cn(
            "flex items-center px-2 py-1.5 text-sm rounded-md font-medium",
            selectedAccountId === undefined ? "bg-blue-50 text-primary" : "hover:bg-neutral-100"
          )}
          onClick={(e) => {
            e.preventDefault();
            onAllInboxesSelect();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
          </svg>
          All Inboxes
        </a>
      </div>
      
      {/* Categories Section */}
      <div className="px-3 py-2">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Categories</h2>
        <ul>
          {categories.map(category => (
            <li key={category.id} className="mb-1">
              <a 
                href="#" 
                className={cn(
                  "flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-neutral-100",
                  selectedCategoryId === category.id && "bg-neutral-100"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  onCategorySelect(category.id);
                }}
              >
                {getCategoryIcon(category.icon)}
                {category.name}
                {category.count !== undefined && (
                  <span className={cn(
                    "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                    category.name === "Primary" && "bg-blue-100 text-blue-800",
                    category.name === "Social" && "bg-purple-100 text-purple-800",
                    category.name === "Promotions" && "bg-green-100 text-green-800",
                    category.name === "Updates" && "bg-amber-100 text-amber-800"
                  )}>
                    {category.count}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Labels/Tags Section */}
      <div className="px-3 py-2">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex justify-between items-center">
          <span>Labels</span>
          <button 
            className="text-neutral-400 hover:text-neutral-600"
            onClick={onCreateTagClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </h2>
        <ul>
          {renderTags(tags, null, 0, onTagSelect, selectedTagId)}
        </ul>
      </div>
      
      {/* Settings and Help */}
      <div className="mt-auto border-t border-neutral-200">
        <ul className="p-2">
          <li>
            <a 
              href="#" 
              className="flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-neutral-100"
              onClick={(e) => {
                e.preventDefault();
                onSettingsClick();
              }}
            >
              <Settings className="h-5 w-5 mr-2 text-neutral-500" />
              Settings
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className="flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-neutral-100"
              onClick={(e) => {
                e.preventDefault();
                onHelpClick();
              }}
            >
              <HelpCircle className="h-5 w-5 mr-2 text-neutral-500" />
              Help & Feedback
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
