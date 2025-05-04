import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import EmailClient from "@/pages/EmailClient";
import { EmailProvider } from "@/context/EmailContext";
import { TagProvider } from "@/context/TagContext";
import { SimplePanelLayout } from "./components/SimplePanelLayout";
import { TabbedPanelLayout } from "./components/TabbedPanelLayout";
import { AdvancedPanelLayout } from "./components/AdvancedPanelLayout";
import { FlexibleEmailClient } from "./components/FlexibleEmailClient";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmailProvider>
        <TagProvider>
          <Router />
          <Toaster />
        </TagProvider>
      </EmailProvider>
    </QueryClientProvider>
  );
}

export default App;
