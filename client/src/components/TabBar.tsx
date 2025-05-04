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
    <div className="flex items-center h-9 bg-neutral-950 border-b border-neutral-800">
      <div className="flex items-center overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            draggable={tab.closeable}
            onDragStart={(e) => onDragStart(tab.id, e)}
            onDragEnd={(e) => {
              e.preventDefault();
            }}
            className={cn(
              'flex items-center h-full px-3 text-xs font-medium border-r border-neutral-800 cursor-pointer select-none transition-colors group',
              activeTabId === tab.id
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className="mr-1.5 text-neutral-400">{tab.icon}</span>}
            <span>{tab.title}</span>
            {tab.closeable && (
              <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 ml-2 rounded-full opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-neutral-700"
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
        
        {/* Add tab button right after tabs */}
        <button 
          onClick={onTabAdd}
          className="flex items-center justify-center w-8 h-full text-neutral-400 hover:text-white hover:bg-neutral-900/50 border-r border-neutral-800 transition-colors"
          title="Add tab"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="flex items-center ml-auto">
        {onMaximize && onRestore && (
          <button
            className="flex items-center justify-center w-7 h-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={isMaximized ? onRestore : onMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <MinimizeIcon className="w-3.5 h-3.5" />
            ) : (
              <MaximizeIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}