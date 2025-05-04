import React, { useEffect } from 'react';
import { TabProvider } from '../context/TabContext';
import { PanelManager } from './PanelManager';
import TopNavbar from './TopNavbar';
import registerComponents from '../lib/componentRegistry.setup';

export function FlexibleEmailClient() {
  // Initialize component registry on mount
  useEffect(() => {
    registerComponents();
  }, []);

  return (
    <TabProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-950 text-white">
        <Header />
        <main className="flex-1 overflow-hidden">
          <EmailClientContent />
        </main>
      </div>
    </TabProvider>
  );
}

function Header() {
  return (
    <header className="flex flex-col">
      {/* Main header with logo and user info */}
      <div className="bg-neutral-900 border-b border-neutral-800 h-12 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="font-bold text-lg mr-8 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
            NEXUS.email
          </h1>
          <nav className="hidden md:flex space-x-4">
            <button className="text-sm text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors">
              Compose
            </button>
            <button className="text-sm text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors">
              Search
            </button>
            <button className="text-sm text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors">
              Filters
            </button>
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-400">user@example.com</span>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            U
          </div>
        </div>
      </div>
      
      {/* Menu bar with dropdown menus */}
      <TopNavbar />
    </header>
  );
}

function EmailClientContent() {
  return (
    <div className="h-full w-full">
      <PanelManager />
    </div>
  );
}

export default FlexibleEmailClient;