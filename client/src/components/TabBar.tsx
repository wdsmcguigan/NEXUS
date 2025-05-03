import React from 'react';
import { PlusIcon, XIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TabControls } from './TabControls';

export interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  closeable?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  panelId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onDragStart: (tabId: string, e: React.DragEvent) => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

export function TabBar({
  tabs,
  activeTabId,
  panelId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onDragStart,
  onMaximize,
  onRestore,
  isMaximized
}: TabBarProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex-1 flex items-center overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            draggable={tab.closeable}
            onDragStart={(e) => onDragStart(tab.id, e)}
            onDragEnd={(e) => {
              // We can add drag end handling here if needed
              e.preventDefault();
            }}
            className={cn(
              'flex items-center gap-1 px-3 py-1 text-sm rounded-md cursor-pointer select-none',
              activeTabId === tab.id
                ? 'bg-white dark:bg-neutral-800 shadow-sm'
                : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            <span>{tab.title}</span>
            {tab.closeable && (
              <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 ml-1 -mr-1 rounded-full opacity-60 hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <XIcon className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-1">
        <TabControls panelId={panelId} onAddTab={onTabAdd} />
        
        {onMaximize && onRestore && (
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800"
            onClick={isMaximized ? onRestore : onMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <MinimizeIcon className="w-4 h-4" />
            ) : (
              <MaximizeIcon className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}