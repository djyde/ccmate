import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { ContextMenuProvider } from "./components/ui/context-menu";
import { Router } from "./router";
import "./i18n";
import "./tw.css";
import { TrackEvent, track } from "./lib/tracker";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
		},
	},
});

track(TrackEvent.AppLaunched);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<ContextMenuProvider>
						<Router />
						<Toaster />
					</ContextMenuProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	</React.StrictMode>,
);
