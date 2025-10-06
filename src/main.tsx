import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "./router";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import './i18n';
import './tw.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
