import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteWrapper } from "./components/RouteWrapper";
import { Layout } from "./components/Layout";
import { ConfigSwitcherPage } from "./pages/ConfigSwitcherPage";
import { ConfigEditorPage } from "./pages/ConfigEditorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { MCPPage } from "./pages/MCPPage";
import { UsagePage } from "./pages/UsagePage";
import { MemoryPage } from "./pages/MemoryPage";
import { CommandsPage } from "./pages/CommandsPage";
import { List } from "./pages/projects/List";
import { Detail } from "./pages/projects/Detail";
import { ProjectsLayout } from "./pages/projects/Layout";
import { NotificationPage } from "./pages/NotificationPage";

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

export function Router() {
  return <RouterProvider router={router} />;
}