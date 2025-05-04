import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import keyboard shortcut manager
const KeyboardShortcutManager = {
  init: () => {
    console.log("Keyboard shortcut system initialized");
    // Register global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Log any keyboard events in development
      console.log(`Key pressed: ${e.key}, Ctrl: ${e.ctrlKey}, Alt: ${e.altKey}, Shift: ${e.shiftKey}`);
    });
  }
};

// Initialize keyboard shortcuts
document.addEventListener("DOMContentLoaded", () => {
  KeyboardShortcutManager.init();
});

createRoot(document.getElementById("root")!).render(<App />);
