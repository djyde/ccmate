import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { nanoid } from "nanoid";
import { notifications } from "@mantine/notifications";
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

export interface NotificationSettings {
	enable: boolean;
	enabled_hooks: string[];
}

export interface CommandFile {
	name: string;
	content: string;
	exists: boolean;
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
		mutationFn: ({
			configType,
			content,
		}: {
			configType: ConfigType;
			content: unknown;
		}) => invoke<void>("write_config_file", { configType, content }),
		onSuccess: (_, variables) => {
			notifications.show({
				message: i18n.t("toast.configSaved", { configType: variables.configType }),
				color: "green",
			});
			queryClient.invalidateQueries({
				queryKey: ["config-file", variables.configType],
			});
			queryClient.invalidateQueries({ queryKey: ["config-files"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.configSaveFailed", { error: errorMessage }), color: "red" });
		},
	});
};

export const useBackupClaudeConfigs = () => {
	return useMutation({
		mutationFn: () => invoke<void>("backup_claude_configs"),
		onSuccess: () => {
			notifications.show({ message: i18n.t("toast.backupSuccess"), color: "green" });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.backupFailed", { error: errorMessage }), color: "red" });
		},
	});
};

// Store management hooks

export const useStores = (options?: { storeId?: string }) => {
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
		mutationFn: async ({
			title,
			settings,
		}: {
			title: string;
			settings: unknown;
		}) => {
			const id = nanoid(6);
			return invoke<ConfigStore>("create_config", { id, title, settings });
		},
		onSuccess: async () => {
			notifications.show({ message: i18n.t("toast.storeCreated"), color: "green" });
			queryClient.invalidateQueries({ queryKey: ["stores"] });
			queryClient.invalidateQueries({ queryKey: ["current-store"] });
			await rebuildTrayMenu();
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.storeCreateFailed", { error: errorMessage }), color: "red" });
		},
	});
};

export const useDeleteConfig = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: { storeId: string }) =>
			invoke<void>("delete_config", {
				storeId: body.storeId,
			}),
		onSuccess: async () => {
			notifications.show({ message: i18n.t("toast.storeDeleted"), color: "green" });
			queryClient.invalidateQueries({ queryKey: ["stores"] });
			queryClient.invalidateQueries({ queryKey: ["current-store"] });
			await rebuildTrayMenu();
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.storeDeleteFailed", { error: errorMessage }), color: "red" });
		},
	});
};

export const useSetUsingConfig = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (storeId: string) =>
			invoke<void>("set_using_config", { storeId }),
		onSuccess: () => {
			notifications.show({ message: i18n.t("toast.storeActivated"), color: "green" });
			queryClient.invalidateQueries({ queryKey: ["stores"] });
			queryClient.invalidateQueries({ queryKey: ["current-store"] });
			queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.storeActivateFailed", { error: errorMessage }), color: "red" });
		},
	});
};

export const useSetCurrentConfig = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (storeId: string) =>
			invoke<void>("set_using_config", { storeId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stores"] });
			queryClient.invalidateQueries({ queryKey: ["current-store"] });
			queryClient.invalidateQueries({ queryKey: ["config-file", "user"] });
		},
	});
};

export const useResetToOriginalConfig = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => invoke<void>("reset_to_original_config"),
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
		mutationFn: ({
			storeId,
			title,
			settings,
		}: {
			storeId: string;
			title: string;
			settings: unknown;
		}) => invoke<ConfigStore>("update_config", { storeId, title, settings }),
		onSuccess: async (data) => {
			if (data.using) {
				notifications.show({
					message: i18n.t("toast.storeSavedAndActive", { title: data.title }),
					color: "green",
				});
			} else {
				notifications.show({ message: i18n.t("toast.storeSaved", { title: data.title }), color: "green" });
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
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.storeSaveFailed", { error: errorMessage }), color: "red" });
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
			console.log(
				"✅ Frontend: Update installation completed, preparing to restart",
			);
			notifications.show({ message: i18n.t("toast.updateInstalled"), color: "green" });
		},
		onError: (error) => {
			console.log("❌ Frontend: Update installation failed", error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.updateInstallFailed", { error: errorMessage }), color: "red" });
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
		mutationFn: ({
			serverName,
			serverConfig,
		}: {
			serverName: string;
			serverConfig: Record<string, any>;
		}) =>
			invoke<void>("update_global_mcp_server", { serverName, serverConfig }),
		onSuccess: () => {
			notifications.show({ message: "MCP server configuration updated successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["global-mcp-servers"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to update MCP server: ${errorMessage}`, color: "red" });
		},
	});
};

export const useAddGlobalMcpServer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			serverName,
			serverConfig,
		}: {
			serverName: string;
			serverConfig: Record<string, any>;
		}) =>
			invoke<void>("update_global_mcp_server", { serverName, serverConfig }),
		onSuccess: () => {
			notifications.show({ message: "MCP server added successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["global-mcp-servers"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to add MCP server: ${errorMessage}`, color: "red" });
		},
	});
};

export const useCheckMcpServerExists = (
	serverName: string,
	options?: { enabled?: boolean },
) => {
	return useQuery({
		queryKey: ["check-mcp-server-exists", serverName],
		queryFn: () => invoke<boolean>("check_mcp_server_exists", { serverName }),
		enabled: options?.enabled !== false && !!serverName, // Only run when serverName is provided
	});
};

export const useDeleteGlobalMcpServer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (serverName: string) =>
			invoke<void>("delete_global_mcp_server", { serverName }),
		onSuccess: () => {
			notifications.show({ message: "MCP server deleted successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["global-mcp-servers"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to delete MCP server: ${errorMessage}`, color: "red" });
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

// Memory management hooks

export interface MemoryFile {
	path: string;
	content: string;
	exists: boolean;
}

export const useClaudeMemory = () => {
	return useSuspenseQuery({
		queryKey: ["claude-memory"],
		queryFn: () => invoke<MemoryFile>("read_claude_memory"),
	});
};

export const useWriteClaudeMemory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (content: string) =>
			invoke<void>("write_claude_memory", { content }),
		onSuccess: () => {
			notifications.show({ message: "Memory saved successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["claude-memory"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to save memory: ${errorMessage}`, color: "red" });
		},
	});
};

// Projects management hooks

export interface ProjectConfig {
	path: string;
	config: Record<string, any>;
}

export const useClaudeProjects = () => {
	return useQuery({
		queryKey: ["claude-projects"],
		queryFn: () => invoke<ProjectConfig[]>("read_claude_projects"),
	});
};

export interface ClaudeConfigFile {
	path: string;
	content: unknown;
	exists: boolean;
}

export const useClaudeConfigFile = () => {
	return useQuery({
		queryKey: ["claude-config-file"],
		queryFn: () => invoke<ClaudeConfigFile>("read_claude_config_file"),
	});
};

export const useWriteClaudeConfigFile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (content: unknown) =>
			invoke<void>("write_claude_config_file", { content }),
		onSuccess: () => {
			notifications.show({ message: "Claude configuration saved successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["claude-config-file"] });
			queryClient.invalidateQueries({ queryKey: ["claude-projects"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to save Claude configuration: ${errorMessage}`, color: "red" });
		},
	});
};

// Notification settings hooks

export const useNotificationSettings = () => {
	return useQuery({
		queryKey: ["notification-settings"],
		queryFn: () =>
			invoke<NotificationSettings | null>("get_notification_settings"),
	});
};

export const useUpdateNotificationSettings = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (settings: NotificationSettings) => {
			return invoke<void>("update_notification_settings", { settings });
		},
		onSuccess: () => {
			notifications.show({ message: "Notification settings updated successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to update notification settings: ${errorMessage}`, color: "red" });
		},
	});
};

// Command management hooks
export const useClaudeCommands = () =>
	useQuery({
		queryKey: ["claude-commands"],
		queryFn: () => invoke<CommandFile[]>("read_claude_commands"),
	});

export const useWriteClaudeCommand = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			commandName,
			content,
		}: {
			commandName: string;
			content: string;
		}) => invoke<void>("write_claude_command", { commandName, content }),
		onSuccess: () => {
			notifications.show({ message: i18n.t("toast.commandSaved"), color: "green" });
			queryClient.invalidateQueries({ queryKey: ["claude-commands"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.commandSaveFailed", { error: errorMessage }), color: "red" });
		},
	});
};

export const useDeleteClaudeCommand = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (commandName: string) =>
			invoke<void>("delete_claude_command", { commandName }),
		onSuccess: () => {
			notifications.show({ message: i18n.t("toast.commandDeleted"), color: "green" });
			queryClient.invalidateQueries({ queryKey: ["claude-commands"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: i18n.t("toast.commandDeleteFailed", { error: errorMessage }), color: "red" });
		},
	});
};

// Agent management hooks
export const useClaudeAgents = () =>
	useQuery({
		queryKey: ["claude-agents"],
		queryFn: () => invoke<CommandFile[]>("read_claude_agents"),
	});

export const useWriteClaudeAgent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			agentName,
			content,
		}: {
			agentName: string;
			content: string;
		}) => invoke<void>("write_claude_agent", { agentName, content }),
		onSuccess: () => {
			notifications.show({ message: "Agent saved successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["claude-agents"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to save agent: ${errorMessage}`, color: "red" });
		},
	});
};

export const useDeleteClaudeAgent = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (agentName: string) =>
			invoke<void>("delete_claude_agent", { agentName }),
		onSuccess: () => {
			notifications.show({ message: "Agent deleted successfully", color: "green" });
			queryClient.invalidateQueries({ queryKey: ["claude-agents"] });
		},
		onError: (error) => {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			notifications.show({ message: `Failed to delete agent: ${errorMessage}`, color: "red" });
		},
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
