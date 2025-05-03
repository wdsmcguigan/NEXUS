import React from 'react';
import { X, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  closeable?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onDragStart?: (tabId: string, e: React.DragEvent) => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

export function TabBar({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onDragStart,
  onMaximize,
  onRestore,
  isMaximized = false
}: TabBarProps) {
  return (
    <div className="flex bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`px-3 py-2 flex items-center cursor-pointer border-r border-neutral-200 dark:border-neutral-700 ${
            tab.id === activeTabId 
              ? 'bg-white dark:bg-neutral-900 border-b-2 border-primary' 
              : 'bg-neutral-100 dark:bg-neutral-800'
          }`}
          onClick={() => onTabChange(tab.id)}
          draggable={!!onDragStart}
          onDragStart={(e) => onDragStart && onDragStart(tab.id, e)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          <span className="text-sm font-medium truncate max-w-[120px]">{tab.title}</span>
          {tab.closeable && (
            <button 
              className="ml-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      
      <div className="flex-1 flex items-center justify-between px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onTabAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
        
        {(onMaximize || onRestore) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={isMaximized ? onRestore : onMaximize}
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}