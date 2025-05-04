import React from 'react';
import { TabBar, Tab } from './TabBar';

// Helper components for rendering panel content
// These components will be replaced with real implementations
const LeftSidebar = ({ ...props }: any) => (
  <div className="h-full overflow-auto p-2 text-neutral-200">
    <div className="px-2 py-3 text-xs font-medium uppercase tracking-wider text-neutral-400">Accounts & Labels</div>
    <div className="space-y-0.5">
      <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors">All Mail</div>
      <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors">Todo</div>
      <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors">Archived</div>
      
      <div className="mt-4 mb-2 px-2 py-1 text-xs font-medium uppercase tracking-wider text-neutral-400">Tags</div>
      
      <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors group flex items-center">
        <span className="w-2 h-2 rounded-full bg-red-500 mr-2 group-hover:scale-110 transition-transform"></span>
        Important
      </div>
      <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors group flex items-center">
        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 group-hover:scale-110 transition-transform"></span>
        Work
      </div>
      <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors group flex items-center">
        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 group-hover:scale-110 transition-transform"></span>
        Personal
      </div>
    </div>
  </div>
);

const EmailListPane = ({ view, ...props }: { view?: string } & any) => (
  <div className="h-full overflow-auto">
    <div className="sticky top-0 z-10 px-4 py-2 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
      <h3 className="text-sm font-medium text-neutral-200">{view || 'Inbox'}</h3>
      <div className="text-xs text-neutral-400">10 messages</div>
    </div>
    <div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div 
          key={i} 
          className="border-b border-neutral-800 py-3 px-4 cursor-pointer hover:bg-neutral-800/50 transition-colors"
        >
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium text-sm text-neutral-200">Email Subject {i+1}</div>
            <div className="text-xs text-neutral-400">{`${i+1}:${(30 + i * 5).toString().padStart(2, '0')} PM`}</div>
          </div>
          <div className="text-xs text-neutral-400 line-clamp-1">Brief preview of email content that might be longer and will truncate properly...</div>
        </div>
      ))}
    </div>
  </div>
);

const EmailDetailPane = ({ ...props }: any) => (
  <div className="h-full overflow-auto text-neutral-200">
    <div className="sticky top-0 z-10 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
      <h2 className="text-base font-medium mb-1">Email Subject</h2>
      <div className="flex justify-between text-xs text-neutral-400">
        <div>From: sender@example.com</div>
        <div>Today, 10:30 AM</div>
      </div>
    </div>
    <div className="p-4 text-sm">
      <p className="mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p className="mb-3">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      
      <div className="mt-6 pt-4 border-t border-neutral-800">
        <div className="text-xs text-neutral-400 mb-2">Actions</div>
        <div className="flex gap-2">
          <button className="text-xs px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors text-neutral-200">Reply</button>
          <button className="text-xs px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors text-neutral-200">Forward</button>
          <button className="text-xs px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors text-neutral-200">Archive</button>
        </div>
      </div>
    </div>
  </div>
);

const RightSidebar = ({ ...props }: any) => (
  <div className="h-full overflow-auto bg-neutral-900 border-l border-neutral-800 text-neutral-200">
    <div className="px-4 py-3 border-b border-neutral-800">
      <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">Contact Info</div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-medium">JS</div>
        <div>
          <div className="font-medium text-sm">John Smith</div>
          <div className="text-xs text-neutral-400">john@example.com</div>
        </div>
      </div>
    </div>
    
    <div className="px-4 py-3 border-b border-neutral-800">
      <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">Recent Conversations</div>
      <div className="text-xs text-neutral-400">
        Last conversation: 2 days ago
      </div>
    </div>
    
    <div className="px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">Email Tags</div>
      <div className="flex flex-wrap gap-1">
        <div className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">Work</div>
        <div className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Important</div>
        <div className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">Project</div>
      </div>
    </div>
  </div>
);

const BottomPane = ({ activeTab, ...props }: { activeTab: string } & any) => (
  <div className="h-full overflow-auto bg-neutral-900 text-neutral-200">
    {activeTab === 'integrations' && (
      <div>
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">Integrations</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Slack', 'Calendar', 'Tasks', 'Drive', 'Contacts', 'Asana'].map((app) => (
              <div key={app} 
                className="border border-neutral-800 bg-neutral-800/50 rounded p-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-800 transition-colors"
              >
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-medium">{app[0]}</div>
                <div className="text-sm">{app}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {activeTab === 'templates' && (
      <div>
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">Email Templates</div>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {['Meeting Request', 'Follow Up', 'Thank You', 'Project Update', 'Introduction'].map((template) => (
              <div 
                key={template} 
                className="border border-neutral-800 bg-neutral-800/50 rounded p-3 cursor-pointer hover:bg-neutral-800 transition-colors text-sm flex justify-between items-center"
              >
                <span>{template}</span>
                <button className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors text-neutral-200">
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {activeTab === 'settings' && (
      <div>
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">Settings</div>
        </div>
        <div className="p-4">
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-3">
              <div className="font-medium text-sm mb-1">Display Settings</div>
              <div className="text-xs text-neutral-400">Configure theme, layout, and appearance.</div>
              <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                <button className="text-xs px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors text-neutral-200">
                  Configure
                </button>
              </div>
            </div>
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-3">
              <div className="font-medium text-sm mb-1">Account Settings</div>
              <div className="text-xs text-neutral-400">Manage your email accounts and signatures.</div>
              <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                <button className="text-xs px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors text-neutral-200">
                  Configure
                </button>
              </div>
            </div>
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-3">
              <div className="font-medium text-sm mb-1">Notification Preferences</div>
              <div className="text-xs text-neutral-400">Configure email and sound alerts.</div>
              <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                <button className="text-xs px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors text-neutral-200">
                  Configure
                </button>
              </div>
            </div>
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
      className="flex flex-col h-full bg-neutral-950 overflow-hidden border border-neutral-800"
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
      
      <div className="flex-1 overflow-auto bg-neutral-900 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700">
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