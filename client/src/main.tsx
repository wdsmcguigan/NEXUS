import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { EmailProvider } from "./context/EmailContext";
import { ComponentProvider } from "./context/ComponentContext";
import { KeyboardShortcutManager } from "./components/TabContextMenu";

// Initialize keyboard shortcuts
document.addEventListener("DOMContentLoaded", () => {
  KeyboardShortcutManager.init();
});

createRoot(document.getElementById("root")!).render(
  <EmailProvider>
    <ComponentProvider>
      <App />
    </ComponentProvider>
  </EmailProvider>
);
