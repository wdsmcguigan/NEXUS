import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ShortcutProvider } from "./context/ShortcutContext";
import { ComponentProvider } from "./context/ComponentContext";
import { SearchProvider } from "./context/SearchContext";
import { DependencyProvider } from "./context/DependencyContext";
import { useEffect } from "react";
import registerAdvancedSearchComponents from "./lib/advancedSearchComponentRegistry";

// Root component with all providers
function ProviderWrapper() {
  return (
    <ShortcutProvider>
      <ComponentProvider>
        <SearchProvider>
          <DependencyProvider>
            <App />
          </DependencyProvider>
        </SearchProvider>
      </ComponentProvider>
    </ShortcutProvider>
  );
}

// Register components
registerAdvancedSearchComponents();

const root = createRoot(document.getElementById("root")!);
root.render(<ProviderWrapper />);
