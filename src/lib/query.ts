import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { nanoid } from "nanoid";

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
  name: string;
  created_at: number;
  settings: ClaudeSettings;
  using: boolean;
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
      toast.success(`Configuration "${variables.configType}" saved successfully`);
      queryClient.invalidateQueries({ queryKey: ["config-file", variables.configType] });
      queryClient.invalidateQueries({ queryKey: ["config-files"] });
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });
};


export const useBackupClaudeConfigs = () => {
  return useMutation({
    mutationFn: () => invoke<void>("backup_claude_configs"),
    onSuccess: () => {
      toast.success("Claude configurations backed up successfully");
    },
    onError: (error) => {
      toast.error(`Failed to backup configurations: ${error.message}`);
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

export const useCreateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, settings }: { name: string; settings: unknown }) => {
      const id = nanoid(6);
      return invoke<ConfigStore>("create_store", { id, name, settings });
    },
    onSuccess: (_, variables) => {
      // toast.success(`Store "${variables.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
    },
    onError: (error) => {
      toast.error(`Failed to create store: ${error.message}`);
    },
  });
};

export const useDeleteStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => invoke<void>("delete_store", { storeId }),
    onSuccess: (_, storeId) => {
      toast.success(`Store deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
    },
    onError: (error) => {
      toast.error(`Failed to delete store: ${error.message}`);
    },
  });
};

export const useSetUsingStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => invoke<void>("set_using_store", { storeId }),
    onSuccess: (_, storeId) => {
      toast.success(`Store activated successfully`);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
    },
    onError: (error) => {
      toast.error(`Failed to switch store: ${error.message}`);
    },
  });
};

export const useSetCurrentStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => invoke<void>("set_using_store", { storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
    },
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, name, settings }: { storeId: string; name: string; settings: unknown }) =>
      invoke<ConfigStore>("update_store", { storeId, name, settings }),
    onSuccess: (data) => {
      toast.success(`Store "${data.name}" saved successfully`);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["store", data.id] });
      queryClient.invalidateQueries({ queryKey: ["current-store"] });
      if (data.using) {
        queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
      }
    },
    onError: (error) => {
      toast.error(`Failed to save store: ${error.message}`);
    },
  });
};