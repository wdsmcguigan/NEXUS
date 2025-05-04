import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ShortcutProvider } from "./context/ShortcutContext";
import { ComponentProvider } from "./context/ComponentContext";
import { useEffect } from "react";

// Root component with all providers
function ProviderWrapper() {
  return (
    <ShortcutProvider>
      <ComponentProvider>
        <App />
      </ComponentProvider>
    </ShortcutProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<ProviderWrapper />);
