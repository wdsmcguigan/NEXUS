import React from 'react';
import { TabBar, Tab } from './TabBar';

// Helper components for rendering panel content
// These components will be replaced with real implementations
const LeftSidebar = ({ ...props }: any) => (
  <div className="h-full overflow-auto p-4">
    <h3 className="text-lg font-semibold mb-4">Accounts & Labels</h3>
    <div className="space-y-2">
      <div className="cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">All Mail</div>
      <div className="cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">Todo</div>
      <div className="cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">Archived</div>
      <div className="cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <span className="mr-2">🔴</span>Important
      </div>
      <div className="cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <span className="mr-2">🟢</span>Work
      </div>
      <div className="cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <span className="mr-2">🔵</span>Personal
      </div>
    </div>
  </div>
);

const EmailListPane = ({ view, ...props }: { view?: string } & any) => (
  <div className="h-full overflow-auto">
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">{view || 'Inbox'}</h3>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="border-b border-neutral-200 dark:border-neutral-800 py-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
          <div className="font-medium">Email Subject {i+1}</div>
          <div className="text-sm text-neutral-500">Brief preview of email content...</div>
        </div>
      ))}
    </div>
  </div>
);

const EmailDetailPane = ({ ...props }: any) => (
  <div className="h-full overflow-auto p-4">
    <h2 className="text-xl font-bold mb-2">Email Subject</h2>
    <div className="flex justify-between text-sm text-neutral-500 mb-4">
      <div>From: sender@example.com</div>
      <div>Today, 10:30 AM</div>
    </div>
    <div className="prose dark:prose-invert max-w-none">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    </div>
  </div>
);

const RightSidebar = ({ ...props }: any) => (
  <div className="h-full overflow-auto p-4">
    <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">JS</div>
        <div>
          <div className="font-medium">John Smith</div>
          <div className="text-sm text-neutral-500">john@example.com</div>
        </div>
      </div>
      <div className="text-sm">
        <div className="font-medium mb-1">Recent Conversations</div>
        <div className="text-neutral-500">
          Last conversation: 2 days ago
        </div>
      </div>
    </div>
  </div>
);

const BottomPane = ({ activeTab, ...props }: { activeTab: string } & any) => (
  <div className="h-full overflow-auto p-4">
    {activeTab === 'integrations' && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Integrations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['Slack', 'Calendar', 'Tasks', 'Drive', 'Contacts', 'Asana'].map((app) => (
            <div key={app} className="border border-neutral-200 dark:border-neutral-800 rounded-md p-3 flex items-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">{app[0]}</div>
              <div>{app}</div>
            </div>
          ))}
        </div>
      </div>
    )}
    {activeTab === 'templates' && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
        <div className="space-y-2">
          {['Meeting Request', 'Follow Up', 'Thank You', 'Project Update', 'Introduction'].map((template) => (
            <div key={template} className="border border-neutral-200 dark:border-neutral-800 rounded-md p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
              {template}
            </div>
          ))}
        </div>
      </div>
    )}
    {activeTab === 'settings' && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="space-y-4">
          <div>
            <div className="font-medium mb-1">Display Settings</div>
            <div className="text-sm text-neutral-500">Configure theme, layout, and appearance.</div>
          </div>
          <div>
            <div className="font-medium mb-1">Account Settings</div>
            <div className="text-sm text-neutral-500">Manage your email accounts and signatures.</div>
          </div>
          <div>
            <div className="font-medium mb-1">Notification Preferences</div>
            <div className="text-sm text-neutral-500">Configure email and sound alerts.</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export interface TabPanelContent {
  id: string;
  type: string;
  props?: Record<string, any>;
}

interface TabPanelProps {
  tabs: Tab[];
  contents: TabPanelContent[];
  activeTabId: string;
  panelId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
  onDragStart: (tabId: string, e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
}

export function TabPanel({
  tabs,
  contents,
  activeTabId,
  panelId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onDragStart,
  onDrop,
  onMaximize,
  onRestore,
  isMaximized
}: TabPanelProps) {
  const activeContent = contents.find(content => content.id === activeTabId);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  return (
    <div 
      className="flex flex-col h-full border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        panelId={panelId}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
        onTabAdd={onTabAdd}
        onDragStart={onDragStart}
        onMaximize={onMaximize}
        onRestore={onRestore}
        isMaximized={isMaximized}
      />
      
      <div className="flex-1 overflow-auto">
        {activeContent && renderContent(activeContent)}
      </div>
    </div>
  );
}

function renderContent(content: TabPanelContent): React.ReactNode {
  const { type, props = {} } = content;
  
  switch (type) {
    case 'leftSidebar':
      return <LeftSidebar {...props} />;
    case 'emailList':
      return <EmailListPane {...props} />;
    case 'emailDetail':
      return <EmailDetailPane {...props} />;
    case 'rightSidebar':
      return <RightSidebar {...props} />;
    case 'integrations':
    case 'templates':
    case 'settings':
      return <BottomPane activeTab={type} {...props} />;
    default:
      return (
        <div className="p-4 h-full flex items-center justify-center text-neutral-500">
          <p>Unknown content type: {type}</p>
        </div>
      );
  }
}