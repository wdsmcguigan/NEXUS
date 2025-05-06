import React, { useEffect } from 'react';
import { TabProvider } from '../context/TabContext';
import { DragProvider } from '../context/DragContext';
import { DependencyProvider, useDependencyContext } from '../context/DependencyContext';
import { PanelManager } from './PanelManager';
import TopNavbar from './TopNavbar';
import registerComponents from '../lib/componentRegistry.setup';
import { Star, Cog, Link } from 'lucide-react';
import { DragManager } from './DragManager';
import { connectEmailComponents } from '../lib/dependency/testEmailDependency';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
          <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-950 text-white">
            <Header />
            <main className="flex-1 overflow-hidden">
              <EmailClientContent />
            </main>
          </div>
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

  // Function to trigger the testing
  const handleTestDependencies = () => {
    // Find all active panes with email list and email detail components
    const panelIds = document.querySelectorAll('[data-tab-id]');
    const emailListPaneIds: string[] = [];
    const emailDetailPaneIds: string[] = [];

    // Collect panel IDs
    panelIds.forEach((panel) => {
      const id = panel.getAttribute('data-tab-id');
      if (id) {
        if (id.includes('_EMAIL_LIST_')) {
          emailListPaneIds.push(id);
        } else if (id.includes('_EMAIL_DETAIL_')) {
          emailDetailPaneIds.push(id);
        }
      }
    });

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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleTestDependencies}
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
      >
        <Link size={16} />
        Test Email Dependencies
      </Button>
    </div>
  );
}

function EmailClientContent() {
  return (
    <div className="h-full w-full">
      <PanelManager />
      <DragManager />
      <DependencyTester />
    </div>
  );
}

export default FlexibleEmailClient;