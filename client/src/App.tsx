import React from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import EmailClient from "@/pages/EmailClient";
import { EmailProvider } from "@/context/EmailContext";
import { TagProvider } from "@/context/TagContext";
import { AppProvider } from "@/context/AppContext";
import { DragProvider } from "./context/DragContext";
import { ComponentProvider } from "./context/ComponentContext";
import { SimplePanelLayout } from "./components/SimplePanelLayout";
import { TabbedPanelLayout } from "./components/TabbedPanelLayout";
import { AdvancedPanelLayout } from "./components/AdvancedPanelLayout";
import { FlexibleEmailClient } from "./components/FlexibleEmailClient";
import EmailDependencyDemo from "./components/EmailDependencyDemo";
import { DependencyProvider } from "./context/DependencyContext";
import { ShortcutProvider } from "./context/ShortcutContext";
import EmailPage from "./pages/EmailPage";
import NavBar from "./components/NavBar";
// Module imports

function Router() {
  return (
    <Switch>
      <Route path="/old" component={EmailClient} />
      <Route path="/simple" component={SimpleLayoutView} />
      <Route path="/tabbed" component={TabbedLayoutView} />
      <Route path="/advanced" component={NexusEmailClient} />
      <Route path="/dependency-demo" component={DependencyDemoView} />
      <Route path="/dependency-system" component={EmailPageView} />
      <Route path="/" component={FlexibleEmailClientView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SimpleLayoutView() {
  return <SimplePanelLayout />;
}

function TabbedLayoutView() {
  return <TabbedPanelLayout />;
}

function NexusEmailClient() {
  return <AdvancedPanelLayout />;
}

function FlexibleEmailClientView() {
  return <FlexibleEmailClient />;
}

function DependencyDemoView() {
  return <EmailDependencyDemo />;
}

function EmailPageView() {
  return <EmailPage />;
}

function SimpleNavBar() {
  const location = window.location.pathname;
  
  return (
    <div className="bg-background border-b flex justify-center py-2 px-4 sticky top-0 z-10">
      <div className="flex space-x-1">
        <a href="/" className={`px-3 py-1.5 text-sm rounded-md ${location === '/' ? 'bg-secondary' : 'hover:bg-secondary/20'}`}>
          <span className="mr-1.5">📧</span>
          Flexible Email
        </a>
        <a href="/simple" className={`px-3 py-1.5 text-sm rounded-md ${location === '/simple' ? 'bg-secondary' : 'hover:bg-secondary/20'}`}>
          <span className="mr-1.5">📑</span>
          Simple Layout
        </a>
        <a href="/tabbed" className={`px-3 py-1.5 text-sm rounded-md ${location === '/tabbed' ? 'bg-secondary' : 'hover:bg-secondary/20'}`}>
          <span className="mr-1.5">📂</span>
          Tabbed Layout
        </a>
        <a href="/advanced" className={`px-3 py-1.5 text-sm rounded-md ${location === '/advanced' ? 'bg-secondary' : 'hover:bg-secondary/20'}`}>
          <span className="mr-1.5">📊</span>
          Advanced Layout
        </a>
        <a href="/dependency-demo" className={`px-3 py-1.5 text-sm rounded-md ${location === '/dependency-demo' ? 'bg-secondary' : 'hover:bg-secondary/20'}`}>
          <span className="mr-1.5">🔗</span>
          Dependency Demo
        </a>
        <a href="/dependency-system" className={`px-3 py-1.5 text-sm rounded-md ${location === '/dependency-system' ? 'bg-secondary' : 'hover:bg-secondary/20'}`}>
          <span className="mr-1.5">🔄</span>
          Email Dependencies
        </a>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <>
      <SimpleNavBar />
      <div className="mt-2">
        <Router />
      </div>
      <Toaster />
    </>
  );
}



// Make sure to initialize the componentRegistry before the app starts
import registerComponents from "./lib/componentRegistry.setup";

// Initialize components
registerComponents();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <EmailProvider>
          <DragProvider>
            <TagProvider>
              <ComponentProvider>
                <ShortcutProvider>
                  <DependencyProvider>
                    <AppContent />
                  </DependencyProvider>
                </ShortcutProvider>
              </ComponentProvider>
            </TagProvider>
          </DragProvider>
        </EmailProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
