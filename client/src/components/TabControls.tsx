import React, { useState, useCallback } from 'react';
import { PanelConfig, PanelDirection, usePanelContext } from '../context/PanelContext';
import { Tab } from './TabBar';
import { Button } from '@/components/ui/button';
import { PlusIcon, CopyIcon, Rows3Icon, Columns3Icon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TabControlsProps {
  panelId: string;
  onAddTab?: () => void;
}

export function TabControls({ panelId, onAddTab }: TabControlsProps) {
  const { splitPanel } = usePanelContext();
  
  // Handlers for splitting a panel
  const handleSplitHorizontal = useCallback(() => {
    // Create a new panel
    const newPanelId = `panel-${nanoid(6)}`;
    const newTabId = `tab-${nanoid(8)}`;
    
    const newPanel: PanelConfig = {
      id: newPanelId,
      type: 'panel',
      tabs: [
        { id: newTabId, title: 'New Tab', closeable: true }
      ],
      activeTabId: newTabId,
      contents: [
        { id: newTabId, type: 'emailList', props: { view: 'new' } }
      ]
    };
    
    splitPanel(panelId, 'horizontal', newPanel);
  }, [panelId, splitPanel]);
  
  const handleSplitVertical = useCallback(() => {
    // Create a new panel
    const newPanelId = `panel-${nanoid(6)}`;
    const newTabId = `tab-${nanoid(8)}`;
    
    const newPanel: PanelConfig = {
      id: newPanelId,
      type: 'panel',
      tabs: [
        { id: newTabId, title: 'New Tab', closeable: true }
      ],
      activeTabId: newTabId,
      contents: [
        { id: newTabId, type: 'emailList', props: { view: 'new' } }
      ]
    };
    
    splitPanel(panelId, 'vertical', newPanel);
  }, [panelId, splitPanel]);
  
  const handleDuplicatePanel = useCallback(() => {
    // This would require finding the panel, duplicating its contents
    // Not implemented yet
  }, []);
  
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
        onClick={onAddTab}
      >
        <PlusIcon className="w-3.5 h-3.5" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <span className="sr-only">Open panel menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSplitHorizontal}>
            <Columns3Icon className="mr-2 h-4 w-4" />
            <span>Split Horizontally</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSplitVertical}>
            <Rows3Icon className="mr-2 h-4 w-4" />
            <span>Split Vertically</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicatePanel}>
            <CopyIcon className="mr-2 h-4 w-4" />
            <span>Duplicate Panel</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}