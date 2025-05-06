import React, { useEffect, useState } from 'react';
import { TabProvider } from '../context/TabContext';
import { DragProvider } from '../context/DragContext';
import { DependencyProvider, useDependencyContext } from '../context/DependencyContext';
import { PanelDependencyProvider } from '../context/PanelDependencyContext';
import { FlexibleEmailDependencyProvider } from '../hooks/useFlexibleEmailDependency.tsx';
import { PanelManager } from './PanelManager';
import TopNavbar from './TopNavbar';
import registerComponents from '../lib/componentRegistry.setup';
import { Star, Cog, Link, Check, AlertCircle, Info } from 'lucide-react';
import { DragManager } from './DragManager';
import { connectEmailComponents, createTestEmail } from '../lib/dependency/testEmailDependency';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { DependencyDataTypes, DependencyDefinition, DependencyStatus } from '../lib/dependency/DependencyInterfaces';
import { FlexibleEmailDebugPanel } from './FlexibleEmailDebugPanel';
import { useFlexibleEmailDependency } from '../hooks/useFlexibleEmailDependency.tsx';

export function FlexibleEmailClient() {
  // Initialize component registry only once on app start
  useEffect(() => {
    // We don't need to call registerComponents() here anymore
    // The ComponentContext will now use the registry directly
  }, []);

  return (
    <TabProvider>
      <DragProvider>
        <DependencyProvider>
          <PanelDependencyProvider>
            <FlexibleEmailDependencyProvider>
              <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-950 text-white">
                <Header />
                <main className="flex-1 overflow-hidden">
                  <EmailClientContent />
                </main>
              </div>
            </FlexibleEmailDependencyProvider>
          </PanelDependencyProvider>
        </DependencyProvider>
      </DragProvider>
    </TabProvider>
  );
}

function Header() {
  return (
    <header>
      {/* Unified header with logo, menu bar, search and user info */}
      <div className="bg-neutral-900 border-b border-neutral-800 h-12 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="font-bold text-lg mr-2 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
            NEXUS.email
          </h1>
          
          <TopNavbar />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Global Search */}
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Search NEXUS..." 
              className="w-full h-8 rounded bg-neutral-800 border border-neutral-700 text-sm px-3 text-white"
            />
          </div>
          
          {/* User Info and Icon Buttons */}
          <div className="flex items-center space-x-3">
            <button className="w-8 h-8 flex items-center justify-center text-yellow-500 hover:bg-neutral-800 rounded-full">
              <Star size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:bg-neutral-800 rounded-full">
              <Cog size={18} />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-400">user@example.com</span>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Create a component that will test the email dependencies
function DependencyTester() {
  const dependencyContext = useDependencyContext();
  const { registry, manager } = dependencyContext;
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<{
    source: string | null;
    target: string | null;
    status: DependencyStatus | null;
    message: string | null;
  }>({
    source: null,
    target: null,
    status: null,
    message: null
  });

  // Function to perform direct connection test with known component IDs
  const handleDirectTest = () => {
    setTestStatus('testing');
    
    // These are hardcoded IDs that match the pattern used in the tab components
    // They represent the first list and detail panes in the default layout
    const listPaneId = '_EMAIL_LIST_-7Ad5Y';  // Adjust this if your tab IDs are different
    const detailPaneId = '_EMAIL_DETAIL_WaKgnX'; // Adjust this if your tab IDs are different
    
    console.log('=== DIRECT CONNECTION TEST ===');
    console.log(`Testing direct connection between ${listPaneId} and ${detailPaneId}`);
    
    // Use known IDs for direct test
    const result = connectEmailComponents(
      listPaneId,
      detailPaneId,
      registry,
      manager
    );
    
    if (result.success) {
      setTestStatus('success');
      setConnectionStatus({
        source: listPaneId,
        target: detailPaneId,
        status: DependencyStatus.CONNECTED,
        message: result.message
      });
      
      // Also send test data through the connection to verify data flow
      // Create a test email object
      const testEmail = createTestEmail();
      console.log('Sending test email through connection:', testEmail);
      
      // Send the test data through the dependency manager
      manager.updateData(listPaneId, DependencyDataTypes.EMAIL_DATA, testEmail);
      
      toast({
        title: "Direct Connection Successful",
        description: result.message,
        variant: "default"
      });
    } else {
      setTestStatus('error');
      setConnectionStatus({
        source: listPaneId,
        target: detailPaneId,
        status: DependencyStatus.ERROR,
        message: result.message
      });
      
      toast({
        title: "Direct Connection Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  // Function to trigger the testing
  const handleTestDependencies = () => {
    setTestStatus('testing');
    // Method 1: Use DOM query to find components
    console.log('=== COMPONENT DETECTION DEBUGGING ===');
    console.log('Attempting to find email components in DOM...');
    
    // Log all tab elements for debugging
    const allPanels = document.querySelectorAll('[data-tab-id]');
    console.log('All panels found in DOM:', Array.from(allPanels).map(el => el.getAttribute('data-tab-id')));
    
    // Look for elements with specific attributes or classes that might indicate our components
    const emailPanes = document.querySelectorAll('[class*="email-list"], [class*="email-detail"], [data-component-type*="email"]');
    console.log('Email-related elements:', Array.from(emailPanes).map(el => el.className));
    
    // Method 2: Use registry to find component definitions
    console.log('Checking dependency registry for email components...');
    
    // Get all component IDs from registry
    const allDefinitions = registry.getAllDefinitions();
    console.log('All dependency definitions:', allDefinitions);
    
    // Filter for email-related components
    const emailListDefinitions = allDefinitions.filter(def => 
      def.componentId.includes('EMAIL_LIST') || 
      def.componentId.toLowerCase().includes('emaillist') ||
      def.dataType === DependencyDataTypes.EMAIL_DATA && def.role === 'provider'
    );
    
    const emailDetailDefinitions = allDefinitions.filter(def => 
      def.componentId.includes('EMAIL_DETAIL') || 
      def.componentId.toLowerCase().includes('emaildetail') ||
      def.dataType === DependencyDataTypes.EMAIL_DATA && def.role === 'consumer'
    );
    
    console.log('Email list definitions found:', emailListDefinitions);
    console.log('Email detail definitions found:', emailDetailDefinitions);
    
    // Extract component IDs from definitions
    const emailListPaneIds = Array.from(new Set(emailListDefinitions.map(def => def.componentId)));
    const emailDetailPaneIds = Array.from(new Set(emailDetailDefinitions.map(def => def.componentId)));
    
    console.log('Final extracted email list panes:', emailListPaneIds);
    console.log('Final extracted email detail panes:', emailDetailPaneIds);
    
    // If we still don't have components, try a direct DOM approach with different selectors
    if (emailListPaneIds.length === 0 || emailDetailPaneIds.length === 0) {
      console.log('Trying alternative component detection method...');
      
      // Try to find panel elements with specific content that suggests they contain email components
      document.querySelectorAll('.tab-panel').forEach(panel => {
        // Check if panel contains email list content (like subject lines, sender info)
        if (panel.textContent && (
          panel.textContent.includes('Inbox') || 
          panel.textContent.includes('Subject') ||
          panel.textContent.includes('From')
        )) {
          // Find the closest element with tab ID
          let parent = panel;
          while (parent && !parent.getAttribute('data-tab-id')) {
            parent = parent.parentElement;
          }
          
          const panelId = parent?.getAttribute('data-tab-id');
          if (panelId) {
            if (panel.textContent.includes('Subject') && panel.textContent.includes('From')) {
              // Likely email list view
              if (!emailListPaneIds.includes(panelId)) {
                emailListPaneIds.push(panelId);
              }
            } else if (panel.textContent.includes('Reply') || panel.textContent.includes('Forward')) {
              // Likely email detail view
              if (!emailDetailPaneIds.includes(panelId)) {
                emailDetailPaneIds.push(panelId);
              }
            }
          }
        }
      });
    }
    
    // If still empty, try using fallback direct component IDs from active registry
    if (emailListPaneIds.length === 0 || emailDetailPaneIds.length === 0) {
      const listPattern = /_EMAIL_LIST_/;
      const detailPattern = /_EMAIL_DETAIL_/;
      
      // Get all registered components from registry
      const allComponents = registry.getAllComponents();
      console.log('All registered components:', allComponents);
      
      // Match components by ID pattern
      allComponents.forEach(id => {
        if (listPattern.test(id) && !emailListPaneIds.includes(id)) {
          emailListPaneIds.push(id);
        } else if (detailPattern.test(id) && !emailDetailPaneIds.includes(id)) {
          emailDetailPaneIds.push(id);
        }
      });
    }
    
    console.log('Final component detection results:');
    console.log('Found email list panes:', emailListPaneIds);
    console.log('Found email detail panes:', emailDetailPaneIds);

    // Make connection tests for each combination
    if (emailListPaneIds.length === 0 || emailDetailPaneIds.length === 0) {
      toast({
        title: "No email panes found",
        description: "Please add both Email List and Email Detail panes to continue testing",
        variant: "destructive"
      });
      return;
    }

    // Connect the first list and detail pane found
    const result = connectEmailComponents(
      emailListPaneIds[0], 
      emailDetailPaneIds[0],
      registry, 
      manager
    );

    if (result.success) {
      toast({
        title: "Dependency Connection Successful",
        description: result.message,
        variant: "default"
      });
    } else {
      toast({
        title: "Dependency Connection Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch(testStatus) {
      case 'testing':
        return <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>;
      case 'success':
        return <Check size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Link size={16} />;
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Connection status indicator */}
      {connectionStatus.source && (
        <div className="bg-neutral-800 p-3 rounded-lg shadow-lg text-sm mb-2">
          <h4 className="font-medium mb-1">Connection Status</h4>
          <div className={`flex items-center gap-1 ${
            connectionStatus.status === DependencyStatus.CONNECTED ? 'text-green-500' : 
            connectionStatus.status === DependencyStatus.ERROR ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {connectionStatus.status === DependencyStatus.CONNECTED ? 
              <Check size={14} /> : 
              connectionStatus.status === DependencyStatus.ERROR ? 
              <AlertCircle size={14} /> : 
              <Info size={14} />
            }
            <span>
              {connectionStatus.status || 'Unknown'}
            </span>
          </div>
          <div className="text-neutral-400 text-xs mt-1">
            <div>Source: {connectionStatus.source}</div>
            <div>Target: {connectionStatus.target}</div>
            {connectionStatus.message && (
              <div className="mt-1 pt-1 border-t border-neutral-700">{connectionStatus.message}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Direct test button */}
      <Button
        onClick={handleDirectTest}
        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 w-full"
      >
        {testStatus === 'testing' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
        ) : (
          <Link size={16} />
        )}
        Direct Connection Test
      </Button>
      
      {/* Auto-detect components button */}
      <Button
        onClick={handleTestDependencies}
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full"
      >
        {getStatusIcon()}
        Test Email Dependencies
      </Button>
      
      {/* Send Test Data button (enabled after successful connection) */}
      {testStatus === 'success' && (
        <Button
          onClick={() => {
            if (connectionStatus.source) {
              const testEmail = createTestEmail();
              console.log('Sending fresh test email through connection:', testEmail);
              manager.updateData(connectionStatus.source, DependencyDataTypes.EMAIL_DATA, testEmail);
              
              toast({
                title: "Test Data Sent",
                description: "A test email was sent through the dependency connection",
                variant: "default"
              });
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 w-full"
        >
          <Check size={16} />
          Send Test Data
        </Button>
      )}
    </div>
  );
}

function EmailClientContent() {
  const emailBridge = useFlexibleEmailDependency();
  
  return (
    <div className="h-full w-full flex">
      <div className="flex-1">
        <PanelManager />
        <DragManager />
        <DependencyTester />
      </div>
      
      {/* Debug Panel */}
      <div className="w-80 border-l border-neutral-800 overflow-hidden">
        <FlexibleEmailDebugPanel emailBridge={emailBridge} />
      </div>
    </div>
  );
}

export default FlexibleEmailClient;