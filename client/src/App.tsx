import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import { EmailProvider } from "./context/EmailContext";
import { TagProvider } from "./context/TagContext";
import { DragProvider } from "./context/DragContext";
import { TabProvider } from "./context/TabContext";
import { PanelProvider } from "./context/PanelContext";
import { ComponentProvider } from "./context/ComponentContext";
import { SimplePanelLayout } from "./components/SimplePanelLayout";
import { TabbedPanelLayout } from "./components/TabbedPanelLayout";
import { AdvancedPanelLayout } from "./components/AdvancedPanelLayout";
import { FlexibleEmailClient } from "./components/FlexibleEmailClient";
import { TabDragTestComponent } from "./components/TabDragTestComponent";
import { TabDragTest } from "./components/TabDragTest";
import { BasicDragTestWithProvider } from "./components/BasicDragTest";

// 404 component
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <a href="/" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">
        Go Home
      </a>
    </div>
  );
}

// Define all view components
const TabDragTestView = () => <TabDragTestComponent />;
const SimpleTestView = () => <TabDragTest />;
const BasicTestView = () => <BasicDragTestWithProvider />;
const SimpleLayoutView = () => <SimplePanelLayout />;
const TabbedLayoutView = () => <TabbedPanelLayout />;
const NexusEmailClient = () => <AdvancedPanelLayout />;
const FlexibleEmailClientView = () => <FlexibleEmailClient />;

// Router component
function Router() {
  return (
    <Switch>
      <Route path="/simple" component={SimpleLayoutView} />
      <Route path="/tabbed" component={TabbedLayoutView} />
      <Route path="/advanced" component={NexusEmailClient} />
      <Route path="/test-drag" component={TabDragTestView} />
      <Route path="/simple-test" component={SimpleTestView} />
      <Route path="/basic-test" component={BasicTestView} />
      <Route path="/" component={FlexibleEmailClientView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ComponentProvider>
          <EmailProvider>
            <PanelProvider>
              <TabProvider>
                <DragProvider>
                  <TagProvider>
                    <Router />
                    <Toaster />
                  </TagProvider>
                </DragProvider>
              </TabProvider>
            </PanelProvider>
          </EmailProvider>
        </ComponentProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;