import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { FileJsonIcon } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

export function Layout() {

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
        <nav className="w-[200px] bg-zinc-50 border-r " data-tauri-drag-region >
          <div
            data-tauri-drag-region
            className="h-10"
            style={{ WebkitUserSelect: 'none', WebkitAppRegion: 'drag' } as React.CSSProperties}
          >
          </div>
          <ul className="px-3 pt-3">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl cursor-default select-none ",
                    {
                      "bg-primary text-primary-foreground": isActive,
                      "hover:bg-zinc-100": !isActive
                    }
                  )
                }
              >
                <FileJsonIcon size={14} />
                配置
              </NavLink>
            </li>
          </ul>
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