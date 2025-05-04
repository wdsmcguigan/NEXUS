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
import { SimplePanelLayout } from "./components/SimplePanelLayout";
import { TabbedPanelLayout } from "./components/TabbedPanelLayout";
import { AdvancedPanelLayout } from "./components/AdvancedPanelLayout";
import { FlexibleEmailClient } from "./components/FlexibleEmailClient";
import { useComponentRegistry, initializeComponentRegistry } from "./context/ComponentContext";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/old" component={EmailClient} />
      <Route path="/simple" component={SimpleLayoutView} />
      <Route path="/tabbed" component={TabbedLayoutView} />
      <Route path="/advanced" component={NexusEmailClient} />
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

function AppContent() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

// Component to initialize the registry
function ComponentInitializer() {
  const { registerComponent } = useComponentRegistry();
  
  useEffect(() => {
    // Initialize component registry with available components
    initializeComponentRegistry(registerComponent);
  }, [registerComponent]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <EmailProvider>
          <DragProvider>
            <TagProvider>
              <AppContent />
            </TagProvider>
          </DragProvider>
        </EmailProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
