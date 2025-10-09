import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteWrapper } from "./components/RouteWrapper";
import { Layout } from "./components/Layout";
import { ConfigSwitcherPage } from "./pages/ConfigSwitcherPage";
import { ConfigEditorPage } from "./pages/ConfigEditorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { MCPPage } from "./pages/MCPPage";
import { MonitorPage } from "./pages/MonitorPage";

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
        path: "monitor",
        element: (
          <RouteWrapper>
            <MonitorPage />
          </RouteWrapper>
        ),
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}