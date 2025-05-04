import React, { useEffect } from 'react';
import { useTabContext } from '../context/TabContext';
import { usePanelContext } from '../context/PanelContext';
import { PanelContainer } from './PanelContainer';
import { Panel, ResizablePanel, ResizablePanelGroup } from './ui/resizable';

/**
 * DefaultLayout implements a sensible default layout for the NEXUS.email client
 * with four main areas:
 * - Left sidebar for navigation
 * - Main content area (split into email list and detail views)
 * - Right sidebar for contact info and data
 * - Bottom panel with tabs for integrations, settings and templates
 */
export function DefaultLayout() {
  const { addTab } = useTabContext();
  const { state: panelState, loadLayout } = usePanelContext();
  
  // Initialize the default layout when the component mounts
  useEffect(() => {
    // Only initialize if no layout is loaded yet (empty state)
    const isEmpty = Object.keys(panelState.panels).length === 0;
    
    if (isEmpty) {
      setupDefaultLayout();
    }
  }, []);
  
  const setupDefaultLayout = () => {
    // Create default layout with:
    // - Left sidebar for navigation
    // - Main content area with email list and viewing panes
    // - Bottom panel with settings and integration tabs
    // - Right sidebar with contact info
    
    const defaultLayout = {
      direction: 'horizontal' as const,
      children: [
        {
          id: 'leftSidebar',
          type: 'sidebar',
          size: 20,
        },
        {
          size: 55,
          children: [
            {
              id: 'mainContent',
              type: 'main',
              size: 70,
              direction: 'horizontal',
              children: [
                {
                  id: 'emailList',
                  type: 'main',
                  size: 40,
                },
                {
                  id: 'emailDetail',
                  type: 'main',
                  size: 60,
                }
              ]
            },
            {
              id: 'bottomPanel',
              type: 'bottom',
              size: 30,
            }
          ],
          direction: 'vertical',
        },
        {
          id: 'rightSidebar',
          type: 'sidebar',
          size: 25,
        }
      ]
    };
    
    // Load the layout
    loadLayout(defaultLayout);
    
    // Add default tabs to each panel
    setTimeout(() => {
      // Left sidebar - Folder Explorer
      addTab('folder-explorer', 'leftSidebar', { title: 'Inbox' });
      
      // Email list
      addTab('email-list', 'emailList', { view: 'primary' });
      
      // Email detail
      addTab('email-detail', 'emailDetail', { emailId: 1 });
      
      // Bottom panel
      addTab('settings', 'bottomPanel');
      addTab('integrations', 'bottomPanel');
      addTab('templates', 'bottomPanel');
      
      // Right sidebar
      addTab('contact-details', 'rightSidebar');
      addTab('tag-manager', 'rightSidebar');
    }, 100); // Small delay to ensure layout is loaded
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <PanelContainer />
      </div>
    </div>
  );
}

export default DefaultLayout;