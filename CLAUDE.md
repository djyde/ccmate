# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CC Mate is a Tauri v2 desktop application for managing Claude Code configuration files. It provides a GUI for switching between multiple Claude Code configurations, managing MCP servers, agents, global commands, and monitoring usage analytics.

## Tech Stack

- **Frontend**: React 19 with TypeScript, React Compiler enabled
- **Backend**: Rust with Tauri v2
- **Build Tool**: Vite with @vitejs/plugin-react
- **Styling**: Tailwind CSS v4 via @tailwindcss/vite
- **UI Components**: shadcn/ui components (Radix UI primitives)
- **Data Fetching**: @tanstack/react-query
- **Forms**: react-hook-form with @hookform/resolvers and zod
- **Routing**: react-router-dom v7
- **Editor**: CodeMirror 6 with JSON/Markdown/YAML language support
- **Package Manager**: pnpm (required)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start Tauri development server
pnpm tauri dev

# Build for production
pnpm build

# Type check without emitting files
pnpm tsc --noEmit

# Format code with Biome
pnpm exec biome format --write .
pnpm exec biome check --write .
```

## Architecture

### Frontend Structure

**Entry Point & Providers** (`src/main.tsx`)
- React Query client with retry configuration
- ThemeProvider (next-themes for dark/light mode)
- ContextMenuProvider for global context menus
- ErrorBoundary for error handling

**Routing** (`src/router.tsx`)
- `createBrowserRouter` with nested routes
- Main routes: `/` (config switcher), `/edit/:storeId`, `/settings`, `/mcp`, `/agents`, `/usage`, `/memory`, `/notification`, `/commands`, `/projects/*`

**Core Pages** (`src/pages/`)
- `ConfigSwitcherPage` - Manage and switch between stored configs
- `ConfigEditorPage` - Edit individual config with CodeMirror
- `MCPPage` - Manage global MCP servers from `~/.claude.json`
- `AgentsPage` - Manage `.claude/agents/*.md` files
- `CommandsPage` - Manage `.claude/commands/*.md` files
- `MemoryPage` - Edit `~/.claude/CLAUDE.md`
- `UsagePage` - Visualize token usage from `~/.claude/projects/**/*.jsonl`

**Data Layer** (`src/lib/`)
- `query.ts` - All React Query hooks and mutations (useStores, useCreateConfig, useUpdateConfig, useGlobalMcpServers, etc.)
- `hooks.ts` - Custom React hooks (useOnWindowResize)
- `tracker.ts` - PostHog analytics tracking

### Backend Structure (Rust)

**Main Application** (`src-tauri/src/lib.rs`)
- Tauri plugin initialization (fs, store, dialog, notification, os, updater)
- macOS window title bar configuration (Overlay style)
- Application menu setup with keyboard shortcuts
- System tray creation and menu event handling
- Hook server startup for Claude Code integration

**Tauri Commands** (`src-tauri/src/commands.rs`)
All file I/O operations are exposed as Tauri commands with `#[tauri::command]`:
- **Config Store Management**: `get_stores`, `create_config`, `update_config`, `delete_config`, `set_using_config`
- **File Operations**: `read_config_file`, `write_config_file`, `backup_claude_configs`
- **MCP Servers**: `get_global_mcp_servers`, `update_global_mcp_server`, `delete_global_mcp_server`
- **Agents/Commands/Memory**: `read_claude_agents`, `write_claude_agent`, `read_claude_commands`, `write_claude_command`, `read_claude_memory`, `write_claude_memory`
- **Usage Analytics**: `read_project_usage_files`
- **Hooks**: `add_claude_code_hook`, `update_claude_code_hook`, `remove_claude_code_hook`
- **Updates**: `check_for_updates`, `install_and_restart`

**Hook Server** (`src-tauri/src/hook_server.rs`)
- Axum web server listening on `http://localhost:59948`
- POST endpoint `/claude_code/hooks` receives Claude Code hook events
- Sends system notifications based on hook type (Stop, PreToolUse, Notification)

**System Tray** (`src-tauri/src/tray.rs`)
- Tray menu with quick config switching
- Dynamically rebuilt when stores change

### Key Configuration Locations

- **App Data**: `~/.ccconfig/stores.json` - Stores all saved configs and notification settings
- **Claude Settings**: `~/.claude/settings.json` - Active Claude Code configuration
- **Claude Config**: `~/.claude.json` - Global MCP servers and project-specific configs
- **Backup**: `~/.ccconfig/claude_backup/` - Automatic backup of original Claude configs
- **Agents**: `~/.claude/agents/*.md` - Agent definitions
- **Commands**: `~/.claude/commands/*.md` - Global command definitions
- **Memory**: `~/.claude/CLAUDE.md` - Global memory file
- **Usage**: `~/.claude/projects/**/*.jsonl` - Token usage records

### Config Store System

The app stores multiple named configurations in `stores.json`:
- Each store has: `id` (nanoid 6 chars), `title`, `createdAt`, `settings` (JSON object), `using` (bool)
- Only one store can be active (`using: true`) at a time
- Switching configs merges the stored settings into `~/.claude/settings.json` (partial update)
- First config creation creates an "Original Config" store from existing settings

### Claude Code Hooks Integration

The app automatically adds hooks to `~/.claude/settings.json` for:
- `Notification` - Shows notification when Claude sends messages
- `Stop` - Shows notification when task completes
- `PreToolUse` - Shows notification when tools are about to be used

Hook commands send JSON to the local hook server at `http://localhost:59948`.

## Code Principles

- **No export default** - Use named exports: `export function Component() {}`
- **Functional components with hooks** - No class components
- **React Query in lib/query.ts** - Centralize all API calls and mutations
- **Tauri commands in commands.rs** - All backend logic goes here with well-named commands
- **Keep components together** - Don't split into smaller files unless necessary
- **TypeScript strict mode** - All files must pass `pnpm tsc --noEmit`
- **Path alias** - Use `@/` for imports from `src/`

## Important Notes

- macOS: Window hides instead of closing (dock icon reopens it)
- Enterprise configs are read-only
- shadcn components: DO NOT use `--yes` flag when installing
- The app tracks anonymous usage via PostHog
- Auto-update checks every 30 minutes via Tauri updater plugin
- React Compiler is enabled - expect automatic memoization