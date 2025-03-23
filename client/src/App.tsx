import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import EmailClient from "@/pages/EmailClient";
import { EmailProvider } from "@/context/EmailContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={EmailClient} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmailProvider>
        <Router />
        <Toaster />
      </EmailProvider>
    </QueryClientProvider>
  );
}

export default App;
