import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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
// Module imports

function Router() {
  return (
    <Switch>
      <Route path="/old" component={EmailClient} />
      <Route path="/simple" component={SimpleLayoutView} />
      <Route path="/tabbed" component={TabbedLayoutView} />
      <Route path="/advanced" component={NexusEmailClient} />
      <Route path="/dependency-demo" component={DependencyDemoView} />
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

function AppContent() {
  return (
    <>
      <Router />
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
                <AppContent />
              </ComponentProvider>
            </TagProvider>
          </DragProvider>
        </EmailProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
