import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import i18n from "../i18n";

export type ConfigType =
  | "user"
  | "enterprise_macos"
  | "enterprise_linux"
  | "enterprise_windows"
  | "mcp_macos"
  | "mcp_linux"
  | "mcp_windows";

export interface ConfigFile {
  path: string;
  content: unknown;
  exists: boolean;
}

export interface ClaudeSettings {
  model?: string;
  permissions?: Record<string, any>;
  env?: Record<string, string>;
  [key: string]: any;
}

export interface ConfigStore {
  id: string; // nanoid(6)
  title: string;
  createdAt: number;
  settings: ClaudeSettings;
  using: boolean;
}

export interface McpServer {
  config: Record<string, any>;
}

export const useConfigFiles = () => {
  return useQuery({
    queryKey: ["config-files"],
    queryFn: () => invoke<ConfigType[]>("list_config_files"),
  });
};

export const useConfigFile = (configType: ConfigType) => {
  return useQuery({
    queryKey: ["config-file", configType],
    queryFn: () => invoke<ConfigFile>("read_config_file", { configType }),
    enabled: !!configType,
  });
};

export const useWriteConfigFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ configType, content }: { configType: ConfigType; content: unknown }) =>
      invoke<void>("write_config_file", { configType, content }),
    onSuccess: (_, variables) => {
      toast.success(i18n.t("toast.configSaved", { configType: variables.configType }));
      queryClient.invalidateQueries({ queryKey: ["config-file", variables.configType] });
      queryClient.invalidateQueries({ queryKey: ["config-files"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.configSaveFailed", { error: errorMessage }));
    },
  });
};


export const useBackupClaudeConfigs = () => {
  return useMutation({
    mutationFn: () => invoke<void>("backup_claude_configs"),
    onSuccess: () => {
      toast.success(i18n.t("toast.backupSuccess"));
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.backupFailed", { error: errorMessage }));
    },
  });
};

// Store management hooks

export const useStores = (options?: {
  storeId?: string;
}) => {
  return useSuspenseQuery({
    queryKey: ["stores", options?.storeId],
    queryFn: () => invoke<ConfigStore[]>("get_stores"),
  });
};

export const useStore = (storeId: string) => {
  return useSuspenseQuery({
    queryKey: ["store", storeId],
    queryFn: () => invoke<ConfigStore>("get_store", { storeId }),
  });
};


export const useCurrentStore = () => {
  return useSuspenseQuery({
    queryKey: ["current-store"],
    queryFn: () => invoke<ConfigStore | null>("get_current_store"),
  });
};

export const useCreateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, settings }: { title: string; settings: unknown }) => {
      const id = nanoid(6);
      return invoke<ConfigStore>("create_config", { id, title, settings });
    },
    onSuccess: async () => {
      toast.success(i18n.t("toast.storeCreated"));
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      await rebuildTrayMenu();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.storeCreateFailed", { error: errorMessage }));
    },
  });
};

export const useDeleteConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      storeId: string;
    }) => invoke<void>("delete_config", {
      storeId: body.storeId,
    }),
    onSuccess: async () => {
      toast.success(i18n.t("toast.storeDeleted"));
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      await rebuildTrayMenu();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.storeDeleteFailed", { error: errorMessage }));
    },
  });
};

export const useSetUsingConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => invoke<void>("set_using_config", { storeId }),
    onSuccess: () => {
      toast.success(i18n.t("toast.storeActivated"));
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.storeActivateFailed", { error: errorMessage }));
    },
  });
};

export const useSetCurrentConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => invoke<void>("set_using_config", { storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
    },
  });
};

export const useUpdateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, title, settings }: { storeId: string; title: string; settings: unknown }) =>
      invoke<ConfigStore>("update_config", { storeId, title, settings }),
    onSuccess: async (data) => {
      if (data.using) {
        toast.success(i18n.t("toast.storeSavedAndActive", { title: data.title }));
      } else {
        toast.success(i18n.t("toast.storeSaved", { title: data.title }));
      }
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["store", data.id] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      if (data.using) {
        queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
      }
      await rebuildTrayMenu();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.storeSaveFailed", { error: errorMessage }));
    },
  });
};

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
  date?: string;
}

export const useCheckForUpdates = () => {
  return useQuery({
    queryKey: ["check-updates"],
    queryFn: () => invoke<UpdateInfo>("check_for_updates"),
    refetchInterval: 1000 * 60 * 30, // Check every 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useInstallAndRestart = () => {
  return useMutation({
    mutationFn: () => {
      console.log("🚀 Frontend: Starting update installation");
      return invoke<void>("install_and_restart");
    },
    onSuccess: () => {
      console.log("✅ Frontend: Update installation completed, preparing to restart");
      toast.success(i18n.t("toast.updateInstalled"));
    },
    onError: (error) => {
      console.log("❌ Frontend: Update installation failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(i18n.t("toast.updateInstallFailed", { error: errorMessage }));
    },
  });
};

// MCP Server management hooks

export const useGlobalMcpServers = () => {
  return useSuspenseQuery({
    queryKey: ["global-mcp-servers"],
    queryFn: () => invoke<Record<string, McpServer>>("get_global_mcp_servers"),
  });
};

export const useUpdateGlobalMcpServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverName, serverConfig }: { serverName: string; serverConfig: Record<string, any> }) =>
      invoke<void>("update_global_mcp_server", { serverName, serverConfig }),
    onSuccess: () => {
      toast.success("MCP server configuration updated successfully");
      queryClient.invalidateQueries({ queryKey: ["global-mcp-servers"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to update MCP server: ${errorMessage}`);
    },
  });
};

export const useAddGlobalMcpServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serverName, serverConfig }: { serverName: string; serverConfig: Record<string, any> }) =>
      invoke<void>("update_global_mcp_server", { serverName, serverConfig }),
    onSuccess: () => {
      toast.success("MCP server added successfully");
      queryClient.invalidateQueries({ queryKey: ["global-mcp-servers"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to add MCP server: ${errorMessage}`);
    },
  });
};

export const useCheckMcpServerExists = (serverName: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["check-mcp-server-exists", serverName],
    queryFn: () => invoke<boolean>("check_mcp_server_exists", { serverName }),
    enabled: options?.enabled !== false && !!serverName, // Only run when serverName is provided
  });
};

export const useDeleteGlobalMcpServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverName: string) => invoke<void>("delete_global_mcp_server", { serverName }),
    onSuccess: () => {
      toast.success("MCP server deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["global-mcp-servers"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to delete MCP server: ${errorMessage}`);
    },
  });
};

export interface UsageData {
  input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

export interface ProjectUsageRecord {
  uuid: string;
  timestamp: string;
  model?: string;
  usage?: UsageData;
}

export const useProjectUsageFiles = () => {
  return useQuery({
    queryKey: ["project-usage-files"],
    queryFn: () => invoke<ProjectUsageRecord[]>("read_project_usage_files"),
  });
};

// Helper function to rebuild tray menu
const rebuildTrayMenu = async () => {
  try {
    await invoke<void>("rebuild_tray_menu_command");
  } catch (error) {
    console.error("Failed to rebuild tray menu:", error);
  }
};