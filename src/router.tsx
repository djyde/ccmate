import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteWrapper } from "./components/RouteWrapper";
import { Layout } from "./components/Layout";
import { ConfigSwitcherPage } from "./pages/ConfigSwitcherPage";
import { ConfigEditorPage } from "./pages/ConfigEditorPage";
import { SettingsPage } from "./pages/SettingsPage";

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
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}