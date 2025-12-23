import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RouteWrapper } from "./components/RouteWrapper";
import { useGlobalContextMenu } from "@/hooks/useGlobalContextMenu";
import { AgentsPage } from "./pages/AgentsPage";
import { CommandsPage } from "./pages/CommandsPage";
import { ConfigEditorPage } from "./pages/ConfigEditorPage";
import { ConfigSwitcherPage } from "./pages/ConfigSwitcherPage";
import { MCPPage } from "./pages/MCPPage";
import { MemoryPage } from "./pages/MemoryPage";
import { NotificationPage } from "./pages/NotificationPage";
import { Detail } from "./pages/projects/Detail";
import { ProjectsLayout } from "./pages/projects/Layout";
import { List } from "./pages/projects/List";
import { SettingsPage } from "./pages/SettingsPage";
import { UsagePage } from "./pages/UsagePage";

const router = createBrowserRouter([
	{
		path: "/",
		element: (
			<RouteWrapper>
				<Layout />
			</RouteWrapper>
		),
		children: [
			{
				index: true,
				element: (
					<RouteWrapper>
						<ConfigSwitcherPage />
					</RouteWrapper>
				),
			},
			{
				path: "edit/:storeId",
				element: (
					<RouteWrapper>
						<ConfigEditorPage />
					</RouteWrapper>
				),
			},
			{
				path: "settings",
				element: (
					<RouteWrapper>
						<SettingsPage />
					</RouteWrapper>
				),
			},
			{
				path: "mcp",
				element: (
					<RouteWrapper>
						<MCPPage />
					</RouteWrapper>
				),
			},
			{
				path: "agents",
				element: (
					<RouteWrapper>
						<AgentsPage />
					</RouteWrapper>
				),
			},
			{
				path: "usage",
				element: (
					<RouteWrapper>
						<UsagePage />
					</RouteWrapper>
				),
			},
			{
				path: "memory",
				element: (
					<RouteWrapper>
						<MemoryPage />
					</RouteWrapper>
				),
			},
			{
				path: "notification",
				element: (
					<RouteWrapper>
						<NotificationPage />
					</RouteWrapper>
				),
			},
			{
				path: "commands",
				element: (
					<RouteWrapper>
						<CommandsPage />
					</RouteWrapper>
				),
			},
			{
				path: "projects",
				element: (
					<RouteWrapper>
						<ProjectsLayout />
					</RouteWrapper>
				),
				children: [
					{
						index: true,
						element: (
							<RouteWrapper>
								<List />
							</RouteWrapper>
						),
					},
					{
						path: ":path",
						element: (
							<RouteWrapper>
								<Detail />
							</RouteWrapper>
						),
					},
				],
			},
		],
	},
]);

const RouterWithContextMenu = () => {
	useGlobalContextMenu();
	return <RouterProvider router={router} />;
};

export function Router() {
	return <RouterWithContextMenu />;
}
