import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Mail, Inbox, Sidebar, Users, Grid3X3 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { TabPanel, TabPanelContent } from './TabPanel';
import { Tab } from './TabBar';
import { LayoutSelector, Layout } from './LayoutSelector';

export function TabbedPanelLayout() {
  // State for each panel's tabs and active tab
  const [leftSidebarTabs, setLeftSidebarTabs] = useState<Tab[]>([
    { id: 'accounts', title: 'Accounts', icon: <Sidebar className="h-4 w-4" />, closeable: false }
  ]);
  const [leftSidebarActiveTab, setLeftSidebarActiveTab] = useState('accounts');
  const [leftSidebarContents, setLeftSidebarContents] = useState<TabPanelContent[]>([
    { id: 'accounts', type: 'leftSidebar' }
  ]);
  
  const [emailListTabs, setEmailListTabs] = useState<Tab[]>([
    { id: 'inbox', title: 'Inbox', icon: <Inbox className="h-4 w-4" />, closeable: false },
    { id: 'starred', title: 'Starred', closeable: true }
  ]);
  const [emailListActiveTab, setEmailListActiveTab] = useState('inbox');
  const [emailListContents, setEmailListContents] = useState<TabPanelContent[]>([
    { id: 'inbox', type: 'emailList', props: { view: 'inbox' } },
    { id: 'starred', type: 'emailList', props: { view: 'starred' } }
  ]);
  
  const [emailDetailTabs, setEmailDetailTabs] = useState<Tab[]>([
    { id: 'detail', title: 'Email', icon: <Mail className="h-4 w-4" />, closeable: false }
  ]);
  const [emailDetailActiveTab, setEmailDetailActiveTab] = useState('detail');
  const [emailDetailContents, setEmailDetailContents] = useState<TabPanelContent[]>([
    { id: 'detail', type: 'emailDetail' }
  ]);
  
  const [rightSidebarTabs, setRightSidebarTabs] = useState<Tab[]>([
    { id: 'contact', title: 'Contact', icon: <Users className="h-4 w-4" />, closeable: false }
  ]);
  const [rightSidebarActiveTab, setRightSidebarActiveTab] = useState('contact');
  const [rightSidebarContents, setRightSidebarContents] = useState<TabPanelContent[]>([
    { id: 'contact', type: 'rightSidebar' }
  ]);
  
  const [bottomPaneTabs, setBottomPaneTabs] = useState<Tab[]>([
    { id: 'integrations', title: 'Integrations', icon: <Grid3X3 className="h-4 w-4" />, closeable: false }
  ]);
  const [bottomPaneActiveTab, setBottomPaneActiveTab] = useState('integrations');
  const [bottomPaneContents, setBottomPaneContents] = useState<TabPanelContent[]>([
    { id: 'integrations', type: 'integrations' }
  ]);
  
  // Maximized panel state
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | null>(null);
  
  // Drag and drop functionality
  const handleTabDragStart = (source: string, tabId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      source, 
      tabId 
    }));
  };
  
  const handleTabDrop = (target: string, e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      const { source, tabId } = JSON.parse(data);
      if (source === target) return;
      
      // Find the tab and its content
      let sourceTabList = getTabList(source);
      let sourceContentList = getContentList(source);
      
      if (!sourceTabList || !sourceContentList) return;
      
      const tabIndex = sourceTabList.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1) return;
      
      const tab = sourceTabList[tabIndex];
      const content = sourceContentList.find(c => c.id === tabId);
      
      if (!tab || !content) return;
      
      // Don't move non-closeable tabs
      if (!tab.closeable) return;
      
      // Remove from source
      const newSourceTabs = sourceTabList.filter(t => t.id !== tabId);
      const newSourceContents = sourceContentList.filter(c => c.id !== tabId);
      
      updateTabList(source, newSourceTabs);
      updateContentList(source, newSourceContents);
      
      // Update source active tab if needed
      if (getActiveTab(source) === tabId) {
        const newActiveTab = newSourceTabs.length > 0 ? newSourceTabs[0].id : '';
        updateActiveTab(source, newActiveTab);
      }
      
      // Add to target
      let targetTabList = getTabList(target);
      let targetContentList = getContentList(target);
      
      if (!targetTabList || !targetContentList) return;
      
      const newTargetTabs = [...targetTabList, tab];
      const newTargetContents = [...targetContentList, content];
      
      updateTabList(target, newTargetTabs);
      updateContentList(target, newTargetContents);
      updateActiveTab(target, tabId);
    } catch (err) {
      console.error('Error handling tab drop:', err);
    }
  };

  // Helper functions to manage tab state
  const getTabList = (source: string): Tab[] | null => {
    switch (source) {
      case 'leftSidebar': return leftSidebarTabs;
      case 'emailList': return emailListTabs;
      case 'emailDetail': return emailDetailTabs;
      case 'rightSidebar': return rightSidebarTabs;
      case 'bottomPane': return bottomPaneTabs;
      default: return null;
    }
  };
  
  const getContentList = (source: string): TabPanelContent[] | null => {
    switch (source) {
      case 'leftSidebar': return leftSidebarContents;
      case 'emailList': return emailListContents;
      case 'emailDetail': return emailDetailContents;
      case 'rightSidebar': return rightSidebarContents;
      case 'bottomPane': return bottomPaneContents;
      default: return null;
    }
  };
  
  const getActiveTab = (source: string): string => {
    switch (source) {
      case 'leftSidebar': return leftSidebarActiveTab;
      case 'emailList': return emailListActiveTab;
      case 'emailDetail': return emailDetailActiveTab;
      case 'rightSidebar': return rightSidebarActiveTab;
      case 'bottomPane': return bottomPaneActiveTab;
      default: return '';
    }
  };
  
  const updateTabList = (source: string, tabs: Tab[]) => {
    switch (source) {
      case 'leftSidebar': setLeftSidebarTabs(tabs); break;
      case 'emailList': setEmailListTabs(tabs); break;
      case 'emailDetail': setEmailDetailTabs(tabs); break;
      case 'rightSidebar': setRightSidebarTabs(tabs); break;
      case 'bottomPane': setBottomPaneTabs(tabs); break;
    }
  };
  
  const updateContentList = (source: string, contents: TabPanelContent[]) => {
    switch (source) {
      case 'leftSidebar': setLeftSidebarContents(contents); break;
      case 'emailList': setEmailListContents(contents); break;
      case 'emailDetail': setEmailDetailContents(contents); break;
      case 'rightSidebar': setRightSidebarContents(contents); break;
      case 'bottomPane': setBottomPaneContents(contents); break;
    }
  };
  
  const updateActiveTab = (source: string, tabId: string) => {
    switch (source) {
      case 'leftSidebar': setLeftSidebarActiveTab(tabId); break;
      case 'emailList': setEmailListActiveTab(tabId); break;
      case 'emailDetail': setEmailDetailActiveTab(tabId); break;
      case 'rightSidebar': setRightSidebarActiveTab(tabId); break;
      case 'bottomPane': setBottomPaneActiveTab(tabId); break;
    }
  };
  
  // Tab operations
  const handleTabAdd = (source: string, contentType: string) => {
    const newTabId = `tab-${nanoid(8)}`;
    const newTab: Tab = {
      id: newTabId,
      title: `New ${contentType}`,
      closeable: true
    };
    
    const newContent: TabPanelContent = {
      id: newTabId,
      type: contentType
    };
    
    const currentTabs = getTabList(source) || [];
    const currentContents = getContentList(source) || [];
    
    updateTabList(source, [...currentTabs, newTab]);
    updateContentList(source, [...currentContents, newContent]);
    updateActiveTab(source, newTabId);
  };
  
  const handleTabClose = (source: string, tabId: string) => {
    const tabs = getTabList(source);
    if (!tabs) return;
    
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    const newContents = (getContentList(source) || []).filter(content => content.id !== tabId);
    
    updateTabList(source, newTabs);
    updateContentList(source, newContents);
    
    // Update active tab if needed
    if (getActiveTab(source) === tabId && newTabs.length > 0) {
      const newActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)].id;
      updateActiveTab(source, newActiveTab);
    }
  };
  
  // Panel operations
  const handleMaximizePanel = (panelId: string) => {
    setMaximizedPanelId(panelId);
  };
  
  const handleRestorePanel = () => {
    setMaximizedPanelId(null);
  };
  
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <Panel 
            defaultSize={20} 
            minSize={15}
            style={{ display: maximizedPanelId && maximizedPanelId !== 'leftSidebar' ? 'none' : 'block' }}
          >
            <TabPanel 
              tabs={leftSidebarTabs}
              contents={leftSidebarContents}
              activeTabId={leftSidebarActiveTab}
              onTabChange={(tabId) => setLeftSidebarActiveTab(tabId)}
              onTabClose={(tabId) => handleTabClose('leftSidebar', tabId)}
              onTabAdd={() => handleTabAdd('leftSidebar', 'leftSidebar')}
              onDragStart={(tabId, e) => handleTabDragStart('leftSidebar', tabId, e)}
              onDrop={(e) => handleTabDrop('leftSidebar', e)}
              onMaximize={() => handleMaximizePanel('leftSidebar')}
              onRestore={handleRestorePanel}
              isMaximized={maximizedPanelId === 'leftSidebar'}
            />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
          
          <Panel 
            defaultSize={60}
            style={{ display: maximizedPanelId && !['emailList', 'emailDetail', 'bottomPane'].includes(maximizedPanelId) ? 'none' : 'block' }}
          >
            <PanelGroup direction="vertical">
              <Panel 
                defaultSize={70}
                style={{ display: maximizedPanelId && maximizedPanelId !== 'emailList' && maximizedPanelId !== 'emailDetail' ? 'none' : 'block' }}
              >
                <PanelGroup direction="horizontal">
                  {/* Email List */}
                  <Panel 
                    defaultSize={40}
                    style={{ display: maximizedPanelId && maximizedPanelId !== 'emailList' ? 'none' : 'block' }}
                  >
                    <TabPanel 
                      tabs={emailListTabs}
                      contents={emailListContents}
                      activeTabId={emailListActiveTab}
                      onTabChange={(tabId) => setEmailListActiveTab(tabId)}
                      onTabClose={(tabId) => handleTabClose('emailList', tabId)}
                      onTabAdd={() => handleTabAdd('emailList', 'emailList')}
                      onDragStart={(tabId, e) => handleTabDragStart('emailList', tabId, e)}
                      onDrop={(e) => handleTabDrop('emailList', e)}
                      onMaximize={() => handleMaximizePanel('emailList')}
                      onRestore={handleRestorePanel}
                      isMaximized={maximizedPanelId === 'emailList'}
                    />
                  </Panel>
                  
                  <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
                  
                  {/* Email Detail */}
                  <Panel 
                    defaultSize={60}
                    style={{ display: maximizedPanelId && maximizedPanelId !== 'emailDetail' ? 'none' : 'block' }}
                  >
                    <TabPanel 
                      tabs={emailDetailTabs}
                      contents={emailDetailContents}
                      activeTabId={emailDetailActiveTab}
                      onTabChange={(tabId) => setEmailDetailActiveTab(tabId)}
                      onTabClose={(tabId) => handleTabClose('emailDetail', tabId)}
                      onTabAdd={() => handleTabAdd('emailDetail', 'emailDetail')}
                      onDragStart={(tabId, e) => handleTabDragStart('emailDetail', tabId, e)}
                      onDrop={(e) => handleTabDrop('emailDetail', e)}
                      onMaximize={() => handleMaximizePanel('emailDetail')}
                      onRestore={handleRestorePanel}
                      isMaximized={maximizedPanelId === 'emailDetail'}
                    />
                  </Panel>
                </PanelGroup>
              </Panel>
              
              <PanelResizeHandle className="h-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
              
              {/* Bottom Pane */}
              <Panel 
                defaultSize={30}
                style={{ display: maximizedPanelId && maximizedPanelId !== 'bottomPane' ? 'none' : 'block' }}
              >
                <TabPanel 
                  tabs={bottomPaneTabs}
                  contents={bottomPaneContents}
                  activeTabId={bottomPaneActiveTab}
                  onTabChange={(tabId) => setBottomPaneActiveTab(tabId)}
                  onTabClose={(tabId) => handleTabClose('bottomPane', tabId)}
                  onTabAdd={() => handleTabAdd('bottomPane', 'integrations')}
                  onDragStart={(tabId, e) => handleTabDragStart('bottomPane', tabId, e)}
                  onDrop={(e) => handleTabDrop('bottomPane', e)}
                  onMaximize={() => handleMaximizePanel('bottomPane')}
                  onRestore={handleRestorePanel}
                  isMaximized={maximizedPanelId === 'bottomPane'}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-neutral-800 hover:bg-primary" />
          
          {/* Right Sidebar */}
          <Panel 
            defaultSize={20} 
            minSize={15}
            style={{ display: maximizedPanelId && maximizedPanelId !== 'rightSidebar' ? 'none' : 'block' }}
          >
            <TabPanel 
              tabs={rightSidebarTabs}
              contents={rightSidebarContents}
              activeTabId={rightSidebarActiveTab}
              onTabChange={(tabId) => setRightSidebarActiveTab(tabId)}
              onTabClose={(tabId) => handleTabClose('rightSidebar', tabId)}
              onTabAdd={() => handleTabAdd('rightSidebar', 'rightSidebar')}
              onDragStart={(tabId, e) => handleTabDragStart('rightSidebar', tabId, e)}
              onDrop={(e) => handleTabDrop('rightSidebar', e)}
              onMaximize={() => handleMaximizePanel('rightSidebar')}
              onRestore={handleRestorePanel}
              isMaximized={maximizedPanelId === 'rightSidebar'}
            />
          </Panel>
        </PanelGroup>
      </div>
      
      <div className="flex items-center justify-center gap-2 p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <LayoutSelector 
          onSave={(name) => {
            const layoutData = {
              leftSidebarTabs,
              leftSidebarActiveTab,
              leftSidebarContents,
              emailListTabs,
              emailListActiveTab,
              emailListContents,
              emailDetailTabs,
              emailDetailActiveTab,
              emailDetailContents,
              rightSidebarTabs,
              rightSidebarActiveTab,
              rightSidebarContents,
              bottomPaneTabs,
              bottomPaneActiveTab,
              bottomPaneContents
            };
            
            const layouts = JSON.parse(localStorage.getItem('nexus-email-layouts') || '[]');
            const newLayouts = layouts.filter((l: any) => l.name !== name);
            newLayouts.push({ name, data: layoutData });
            localStorage.setItem('nexus-email-layouts', JSON.stringify(newLayouts));
          }}
          onLoad={(layout) => {
            const { data } = layout;
            
            setLeftSidebarTabs(data.leftSidebarTabs || []);
            setLeftSidebarActiveTab(data.leftSidebarActiveTab || '');
            setLeftSidebarContents(data.leftSidebarContents || []);
            
            setEmailListTabs(data.emailListTabs || []);
            setEmailListActiveTab(data.emailListActiveTab || '');
            setEmailListContents(data.emailListContents || []);
            
            setEmailDetailTabs(data.emailDetailTabs || []);
            setEmailDetailActiveTab(data.emailDetailActiveTab || '');
            setEmailDetailContents(data.emailDetailContents || []);
            
            setRightSidebarTabs(data.rightSidebarTabs || []);
            setRightSidebarActiveTab(data.rightSidebarActiveTab || '');
            setRightSidebarContents(data.rightSidebarContents || []);
            
            setBottomPaneTabs(data.bottomPaneTabs || []);
            setBottomPaneActiveTab(data.bottomPaneActiveTab || '');
            setBottomPaneContents(data.bottomPaneContents || []);
          }}
        />
      </div>
    </div>
  );
}