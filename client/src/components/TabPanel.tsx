import React, { useState } from 'react';
import { Mail, Inbox, Sidebar, Users, Grid3X3 } from 'lucide-react';
import { TabBar, Tab } from './TabBar';

export interface TabPanelContent {
  id: string;
  type: string;
  props?: any;
}

interface TabPanelProps {
  tabs: Tab[];
  contents: TabPanelContent[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onDragStart?: (tabId: string, e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

// Placeholder component for content
const PlaceholderContent = ({ type, props }: { type: string, props?: any }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-4 text-center">
    <div className="text-primary mb-4">
      {type === 'leftSidebar' && <Sidebar className="h-12 w-12" />}
      {type === 'emailList' && <Inbox className="h-12 w-12" />}
      {type === 'emailDetail' && <Mail className="h-12 w-12" />}
      {type === 'rightSidebar' && <Users className="h-12 w-12" />}
      {type === 'integrations' && <Grid3X3 className="h-12 w-12" />}
    </div>
    <h3 className="text-lg font-medium mb-2">{type} Content</h3>
    <p className="text-sm text-gray-500">
      {props ? JSON.stringify(props) : 'No props provided'}
    </p>
  </div>
);

export function TabPanel({
  tabs,
  contents,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onDragStart,
  onDragOver,
  onDrop,
  onMaximize,
  onRestore,
  isMaximized
}: TabPanelProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
    onDragOver && onDragOver(e);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    setIsDraggingOver(false);
    onDrop && onDrop(e);
  };
  
  const renderContent = (tabId: string) => {
    const content = contents.find(c => c.id === tabId);
    if (!content) return <div>No content found for tab {tabId}</div>;
    
    return <PlaceholderContent type={content.type} props={content.props} />;
  };
  
  return (
    <div 
      className={`flex flex-col h-full border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden ${
        isDraggingOver ? 'bg-primary/5 border-primary' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TabBar 
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
        onTabAdd={onTabAdd}
        onDragStart={onDragStart}
        onMaximize={onMaximize}
        onRestore={onRestore}
        isMaximized={isMaximized}
      />
      
      <div className="flex-1 overflow-auto">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`h-full ${tab.id === activeTabId ? '' : 'hidden'}`}
          >
            {renderContent(tab.id)}
          </div>
        ))}
      </div>
    </div>
  );
}