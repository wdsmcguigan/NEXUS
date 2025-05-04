import React from 'react';

interface LeftSidebarProps {
  tabId?: string;
  [key: string]: any;
}

export function LeftSidebar({ tabId, ...props }: LeftSidebarProps) {
  return (
    <div className="h-full overflow-auto p-2 text-neutral-200">
      <div className="px-2 py-3 text-xs font-medium uppercase tracking-wider text-neutral-400">Accounts & Labels</div>
      <div className="space-y-0.5">
        <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors">All Mail</div>
        <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors">Todo</div>
        <div className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-neutral-800 transition-colors">Archived</div>
        
        <div className="flex items-center justify-between px-2 mt-6 mb-2">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">Tags</div>
          <button 
            className="text-neutral-400 hover:text-white p-1 rounded-sm hover:bg-neutral-800 transition-colors" 
            title="Manage Tags"
            onClick={() => {
              // In a real implementation, this would open the Tag Manager
              console.log('Open Tag Manager');
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.9 2.1L9.5 5.1H5C3.9 5.1 3 6 3 7.1V19.1C3 20.2 3.9 21.1 5 21.1H19C20.1 21.1 21 20.2 21 19.1V7.1C21 6 20.1 5.1 19 5.1H14.5L13.1 2.1H10.9ZM12 8.1C14.8 8.1 17 10.3 17 13.1C17 15.9 14.8 18.1 12 18.1C9.2 18.1 7 15.9 7 13.1C7 10.3 9.2 8.1 12 8.1ZM12 10.1C10.3 10.1 9 11.4 9 13.1C9 14.8 10.3 16.1 12 16.1C13.7 16.1 15 14.8 15 13.1C15 11.4 13.7 10.1 12 10.1Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <div className="px-2 space-y-2">
          {/* Important Tag */}
          <div className="group relative flex items-center">
            <div className="h-7 px-3 py-1 text-xs font-medium rounded-md bg-green-900/30 text-green-400 cursor-pointer flex items-center justify-between w-full">
              Important
            </div>
            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-0.5 rounded hover:bg-neutral-700/50" 
                title="Edit Tag"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Edit Important tag');
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Work Tag */}
          <div className="group relative flex items-center">
            <div className="h-7 px-3 py-1 text-xs font-medium rounded-md bg-blue-900/30 text-blue-400 cursor-pointer flex items-center justify-between w-full">
              Work
            </div>
            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-0.5 rounded hover:bg-neutral-700/50" 
                title="Edit Tag" 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Edit Work tag');
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Project Tag */}
          <div className="group relative flex items-center">
            <div className="h-7 px-3 py-1 text-xs font-medium rounded-md bg-purple-900/30 text-purple-400 cursor-pointer flex items-center justify-between w-full">
              Project
            </div>
            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-0.5 rounded hover:bg-neutral-700/50" 
                title="Edit Tag"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Edit Project tag');
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;