import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn, isMacOS } from "../lib/utils";
import { FileJsonIcon, SettingsIcon, CpuIcon, ActivityIcon, BrainIcon, FolderIcon, BellIcon, TerminalIcon } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const isProjectsRoute = location.pathname.startsWith('/projects');

  const navLinks = [
    {
      to: "/",
      icon: FileJsonIcon,
      label: t("navigation.configurations")
    },
    {
      to: "/projects",
      icon: FolderIcon,
      label: t("navigation.projects")
    },
    {
      to: "/mcp",
      icon: CpuIcon,
      label: t("navigation.mcp")
    },
    {
      to: "/memory",
      icon: BrainIcon,
      label: t("navigation.memory")
    },
    {
      to: "/commands",
      icon: TerminalIcon,
      label: t("navigation.commands")
    },
    {
      to: "/notification",
      icon: BellIcon,
      label: t("navigation.notifications")
    },
    {
      to: "/usage",
      icon: ActivityIcon,
      label: t("navigation.usage")
    },
    {
      to: "/settings",
      icon: SettingsIcon,
      label: t("navigation.settings")
    },

  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Title Bar - Draggable Region with traffic lights space (macOS only) */}
      {isMacOS && (
        <div
          data-tauri-drag-region
          className=""
          style={{ WebkitUserSelect: 'none', WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
        </div>
      )}

      <div className="flex flex-1 overflow-hidden ">
        <nav className="w-[200px] bg-background border-r flex flex-col" data-tauri-drag-region >
          {isMacOS && (
            <div
              data-tauri-drag-region
              className="h-10"
              style={{ WebkitUserSelect: 'none', WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
            </div>
          )}
          <div className="flex flex-col flex-1 justify-between" data-tauri-drag-region>
            <ul className="px-3 pt-3 space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl cursor-default select-none ",
                        {
                          "bg-primary text-primary-foreground": isActive,
                          "hover:bg-accent hover:text-accent-foreground": !isActive
                        }
                      )
                    }
                  >
                    <link.icon size={14} />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        {isProjectsRoute ? (
          <main className="flex-1 h-screen overflow-hidden" data-tauri-drag-region>
            <Outlet />
          </main>
        ) : (
          <ScrollArea className="flex-1 h-screen [&>div>div]:!block">
            <main className="" data-tauri-drag-region>
              <Outlet />
            </main>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}