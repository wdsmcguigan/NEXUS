import React from 'react';

interface RightSidebarProps {
  tabId?: string;
  contactId?: number;
  [key: string]: any;
}

export function RightSidebar({ tabId, contactId, ...props }: RightSidebarProps) {
  return (
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
}

export default RightSidebar;