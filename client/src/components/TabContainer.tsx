import React, { useState } from 'react';
import { X, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { TabConfig } from '../context/LayoutContext';
import { BottomPane } from './ui/bottom-pane';
import { Button } from './ui/button';

// Import components that can be rendered in tabs
import { LeftSidebar } from './LeftSidebar';
import { EmailListPane } from './EmailListPane';
import { EmailDetailPane } from './EmailDetailPane';
import { RightSidebar } from './RightSidebar';

interface TabContainerProps {
  panelId: string;
  tabs: TabConfig[];
  activeTabId?: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onDragStart: (tabId: string, panelId: string, e: React.DragEvent) => void;
  onMaximizePanel?: () => void;
  onRestorePanel?: () => void;
  isMaximized?: boolean;
}

export function TabContainer({
  panelId,
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onDragStart,
  onMaximizePanel,
  onRestorePanel,
  isMaximized = false
}: TabContainerProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const renderTabContent = (tab: TabConfig) => {
    switch (tab.contentType) {
      case 'leftSidebar':
        return <LeftSidebar {...tab.contentProps} />;
      case 'emailList':
        return <EmailListPane {...tab.contentProps} />;
      case 'emailDetail':
        return <EmailDetailPane {...tab.contentProps} />;
      case 'rightSidebar':
        return <RightSidebar {...tab.contentProps} />;
      case 'integrations':
        return <BottomPane visible={true} {...tab.contentProps} />;
      case 'empty':
        return (
          <div className="flex items-center justify-center h-full text-neutral-400">
            <div className="text-center">
              <p>Empty Tab</p>
              <p className="text-sm">Drag content here or create new content</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div>Unknown content type: {tab.contentType}</div>
          </div>
        );
    }
  };
  
  return (
    <div 
      className={`flex flex-col h-full border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden ${
        isDraggingOver ? 'bg-primary/5 border-primary' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-panel-id={panelId}
    >
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
            draggable
            onDragStart={(e) => onDragStart(tab.id, panelId, e)}
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
        
        <div className="flex-1 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1"
            onClick={onTabAdd}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {(onMaximizePanel || onRestorePanel) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-1"
            onClick={isMaximized ? onRestorePanel : onMaximizePanel}
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`h-full ${tab.id === activeTabId ? '' : 'hidden'}`}
          >
            {renderTabContent(tab)}
          </div>
        ))}
      </div>
    </div>
  );
}