import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar, Inbox, Mail, Users, Grid3X3 } from 'lucide-react';

// Simple placeholder components for the panel content
const PlaceholderContent = ({ type }: { type: string }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-4 text-center">
    <div className="text-primary mb-4">
      {type === 'left-sidebar' && <Sidebar className="h-12 w-12" />}
      {type === 'email-list' && <Inbox className="h-12 w-12" />}
      {type === 'email-detail' && <Mail className="h-12 w-12" />}
      {type === 'right-sidebar' && <Users className="h-12 w-12" />}
      {type === 'bottom-pane' && <Grid3X3 className="h-12 w-12" />}
    </div>
    <h3 className="text-lg font-medium mb-2">{type} Content</h3>
    <p className="text-sm text-gray-500">
      This is a placeholder for the {type} content.
    </p>
  </div>
);

export function SimplePanelLayout() {
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <Panel defaultSize={20} minSize={15}>
            <PlaceholderContent type="left-sidebar" />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
          
          <Panel defaultSize={60}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70}>
                <PanelGroup direction="horizontal">
                  {/* Email List */}
                  <Panel defaultSize={40}>
                    <PlaceholderContent type="email-list" />
                  </Panel>
                  
                  <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
                  
                  {/* Email Detail */}
                  <Panel defaultSize={60}>
                    <PlaceholderContent type="email-detail" />
                  </Panel>
                </PanelGroup>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
              
              {/* Bottom Pane */}
              <Panel defaultSize={30}>
                <PlaceholderContent type="bottom-pane" />
              </Panel>
            </PanelGroup>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
          
          {/* Right Sidebar */}
          <Panel defaultSize={20} minSize={15}>
            <PlaceholderContent type="right-sidebar" />
          </Panel>
        </PanelGroup>
      </div>
      
      <div className="flex items-center justify-center gap-2 p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <button className="px-3 py-1 text-sm bg-primary text-white rounded-md">Save Layout</button>
        <button className="px-3 py-1 text-sm border border-primary text-primary rounded-md">Load Layout</button>
      </div>
    </div>
  );
}