import React, { useEffect } from 'react';
import { TabProvider } from '../context/TabContext';
import { DragProvider } from '../context/DragContext';
import { PanelManager } from './PanelManager';
import TopNavbar from './TopNavbar';
import registerComponents from '../lib/componentRegistry.setup';
import { Star, Cog } from 'lucide-react';
import { DragManager } from './DragManager';

export function FlexibleEmailClient() {
  // Initialize component registry only once on app start
  useEffect(() => {
    // We don't need to call registerComponents() here anymore
    // The ComponentContext will now use the registry directly
  }, []);

  return (
    <TabProvider>
      <DragProvider>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-950 text-white">
          <Header />
          <main className="flex-1 overflow-hidden">
            <EmailClientContent />
          </main>
        </div>
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

// Import DebugStateView and new SimplePanelEdgeDrop component
import { DebugStateView } from './DebugStateView';
import { SimplePanelEdgeDrop } from './SimplePanelEdgeDrop';

function EmailClientContent() {
  return (
    <div className="h-full w-full">
      <PanelManager />
      <DragManager />
      {/* New direct approach to panel edge drops */}
      <SimplePanelEdgeDrop />
      {/* Add debug state view for development */}
      {process.env.NODE_ENV === 'development' && <DebugStateView />}
    </div>
  );
}

export default FlexibleEmailClient;