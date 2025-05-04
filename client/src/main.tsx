import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { EmailProvider } from "./context/EmailContext";
import { ShortcutProvider } from "./context/ShortcutContext";
import { ComponentProvider } from "./context/ComponentContext";
import { initializeComponentRegistry } from "./context/ComponentContext";

const root = createRoot(document.getElementById("root")!);

root.render(
  <ShortcutProvider>
    <ComponentProvider>
      <App />
    </ComponentProvider>
  </ShortcutProvider>
);
