import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { EmailProvider } from "./context/EmailContext";

createRoot(document.getElementById("root")!).render(
  <EmailProvider>
    <App />
  </EmailProvider>
);
