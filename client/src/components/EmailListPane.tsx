import React from 'react';

interface EmailListPaneProps {
  tabId?: string;
  view?: string;
  [key: string]: any;
}

export function EmailListPane({ tabId, view, ...props }: EmailListPaneProps) {
  return (
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
}

export default EmailListPane;