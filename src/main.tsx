import {
	type MantineColorsTuple,
	MantineProvider,
	createTheme,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { Router } from "./router";
import "./i18n";
import "./tw.css";
import { TrackEvent, track } from "./lib/tracker";

const brand: MantineColorsTuple = [
	"#fff4ee",
	"#fce3d5",
	"#f5c5aa",
	"#f0a67f",
	"#eb8b5d",
	"#e47843",
	"#d97757",
	"#b85f3d",
	"#974a2e",
	"#773921",
];

const mantineTheme = createTheme({
	primaryColor: "brand",
	primaryShade: 6,
	defaultRadius: "md",
	colors: {
		brand,
	},
	components: {
		Paper: {
			defaultProps: {
				radius: "md",
			},
			styles: {
				root: {
					transition: "border-color 0.15s ease, background-color 0.15s ease",
				},
			},
		},
		Button: {
			defaultProps: {
				radius: "md",
			},
		},
		ActionIcon: {
			defaultProps: {
				radius: "md",
			},
		},
	},
});

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
				<MantineProvider
					theme={mantineTheme}
					defaultColorScheme="auto"
				>
					<Router />
					<Notifications position="bottom-right" autoClose={3000} />
				</MantineProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	</React.StrictMode>,
);
