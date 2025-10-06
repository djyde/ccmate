import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { FileJsonIcon, SettingsIcon } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { UpdateButton } from "./UpdateButton";

export function Layout() {
  const { t } = useTranslation();

  const navLinks = [
    {
      to: "/",
      icon: FileJsonIcon,
      label: t("navigation.configurations")
    },
    {
      to: "/settings",
      icon: SettingsIcon,
      label: t("navigation.settings")
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Title Bar - Draggable Region with traffic lights space */}
      <div
        data-tauri-drag-region
        className=""
        style={{ WebkitUserSelect: 'none', WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
      </div>

      <div className="flex flex-1 overflow-hidden ">
        <nav className="w-[200px] bg-zinc-50 border-r flex flex-col" data-tauri-drag-region >
          <div
            data-tauri-drag-region
            className="h-10"
            style={{ WebkitUserSelect: 'none', WebkitAppRegion: 'drag' } as React.CSSProperties}
          >
          </div>
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
                          "hover:bg-zinc-200": !isActive
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
            <div className="">
              <UpdateButton />
            </div>
          </div>
        </nav>
        <ScrollArea className="flex-1 h-screen">
          <main className="" data-tauri-drag-region>
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}