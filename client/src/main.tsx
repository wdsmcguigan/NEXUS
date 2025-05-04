import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ShortcutProvider } from "./context/ShortcutContext";
import { ComponentProvider, useComponentRegistry, initializeComponentRegistry } from "./context/ComponentContext";
import { useEffect } from "react";

// Component for initializing the registry
function InitializeComponents() {
  const { registerComponent, components } = useComponentRegistry();
  
  useEffect(() => {
    // Only initialize if no components are registered yet
    if (Object.keys(components).length === 0) {
      console.log("Initializing component registry with default components");
      initializeComponentRegistry(registerComponent);
    }
  }, [registerComponent, components]);
  
  return null;
}

// Root component with all providers
function ProviderWrapper() {
  return (
    <ShortcutProvider>
      <ComponentProvider>
        <InitializeComponents />
        <App />
      </ComponentProvider>
    </ShortcutProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<ProviderWrapper />);
