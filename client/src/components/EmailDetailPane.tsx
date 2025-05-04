import React from 'react';

interface EmailDetailPaneProps {
  tabId?: string;
  emailId?: number;
  [key: string]: any;
}

export function EmailDetailPane({ tabId, emailId, ...props }: EmailDetailPaneProps) {
  return (
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
}

export default EmailDetailPane;