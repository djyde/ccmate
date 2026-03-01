import { json } from "@codemirror/lang-json";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import CodeMirror from "@uiw/react-codemirror";
import {
	ExternalLinkIcon,
	PlusIcon,
	SaveIcon,
	TrashIcon,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { useDisclosure } from "@mantine/hooks";
import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { PageHeader } from "@/components/PageHeader";
import { builtInMcpServers } from "@/lib/builtInMCP";
import {
	type McpServer,
	useAddGlobalMcpServer,
	useDeleteGlobalMcpServer,
	useGlobalMcpServers,
	useUpdateGlobalMcpServer,
} from "@/lib/query";
import { useCodeMirrorTheme } from "@/lib/use-codemirror-theme";

interface EditingServer {
	name: string;
	config: string;
}

function MCPPageContent() {
	const { t } = useTranslation();
	const { data: mcpServers } = useGlobalMcpServers();
	const updateMcpServer = useUpdateGlobalMcpServer();
	const deleteMcpServer = useDeleteGlobalMcpServer();
	const [createOpened, { open: openCreate, close: closeCreate }] =
		useDisclosure(false);
	const [editing, setEditing] = useState<EditingServer | null>(null);
	const [editContent, setEditContent] = useState("");
	const codeMirrorTheme = useCodeMirrorTheme();

	const formatConfigForDisplay = (server: McpServer): string => {
		return JSON.stringify(server, null, 2);
	};

	const openEditor = (serverName: string, serverConfig: McpServer) => {
		const configStr = formatConfigForDisplay(serverConfig);
		setEditing({ name: serverName, config: configStr });
		setEditContent(configStr);
	};

	const closeEditor = () => {
		setEditing(null);
		setEditContent("");
	};

	const hasChanges = editing !== null && editContent !== editing.config;

	const handleSaveConfig = async () => {
		if (!editing || !hasChanges) return;

		try {
			const configObject = JSON.parse(editContent);
			updateMcpServer.mutate(
				{
					serverName: editing.name,
					serverConfig: configObject,
				},
				{
					onSuccess: () => {
						closeEditor();
					},
				},
			);
		} catch (error) {
			await message(t("mcp.invalidJsonError", { serverName: editing.name }), {
				title: t("mcp.invalidJsonTitle"),
				kind: "error",
			});
		}
	};

	const handleDeleteServer = async (serverName: string) => {
		const confirmed = await ask(t("mcp.deleteServerConfirm", { serverName }), {
			title: t("mcp.deleteServerTitle"),
			kind: "warning",
		});

		if (confirmed) {
			deleteMcpServer.mutate(serverName);
			if (editing?.name === serverName) {
				closeEditor();
			}
		}
	};

	const serverEntries = Object.entries(mcpServers || {}).sort(([a], [b]) =>
		a.localeCompare(b),
	);

	return (
		<Box style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			{/* Create modal */}
			<Modal
				opened={createOpened}
				onClose={closeCreate}
				title={t("mcp.addServerTitle")}
				size="lg"
				centered
				overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
			>
				<Text size="sm" c="dimmed" mb="md">
					{t("mcp.addServerDescription")}
				</Text>
				<MCPCreatePanel onClose={closeCreate} />
			</Modal>

			{/* Edit modal */}
			<Modal
				opened={editing !== null}
				onClose={closeEditor}
				title={editing?.name}
				size="lg"
				centered
				overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
			>
				{editing && (
					<Stack gap="md">
						<Box
							style={{
								borderRadius: "var(--mantine-radius-md)",
								overflow: "hidden",
								border: "1px solid var(--mantine-color-default-border)",
							}}
						>
							<CodeMirror
								value={editContent}
								height="280px"
								theme={codeMirrorTheme}
								extensions={[json()]}
								onChange={setEditContent}
								placeholder="Enter MCP server configuration as JSON"
							/>
						</Box>
						<Group justify="space-between">
							<Tooltip label={t("mcp.deleteServerTitle")} position="bottom">
								<ActionIcon
									variant="subtle"
									color="red"
									size="md"
									onClick={() => handleDeleteServer(editing.name)}
									disabled={deleteMcpServer.isPending}
									style={{ opacity: 0.5 }}
									onMouseEnter={(e) => {
										e.currentTarget.style.opacity = "1";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.opacity = "0.5";
									}}
								>
									<TrashIcon size={16} />
								</ActionIcon>
							</Tooltip>

							<Tooltip label={t("mcp.save")} position="bottom">
								<ActionIcon
									variant={hasChanges ? "filled" : "subtle"}
									color={hasChanges ? "brand" : "gray"}
									size="md"
									onClick={handleSaveConfig}
									disabled={!hasChanges || updateMcpServer.isPending}
									loading={updateMcpServer.isPending}
								>
									<SaveIcon size={16} />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Stack>
				)}
			</Modal>

			<PageHeader
				title={t("mcp.title")}
				description={t("mcp.description")}
				actions={
					<Tooltip label={t("mcp.addServer")} position="bottom">
						<ActionIcon
							variant="subtle"
							color="gray"
							size="md"
							onClick={openCreate}
						>
							<PlusIcon size={16} />
						</ActionIcon>
					</Tooltip>
				}
			/>

			{/* Server list */}
			<Box px="lg" pb="lg" style={{ flex: 1, overflow: "auto" }}>
				{serverEntries.length === 0 ? (
					<Center py="xl">
						<Text size="sm" c="dimmed">
							{t("mcp.noServersConfigured")}
						</Text>
					</Center>
				) : (
					<Stack gap={0}>
						{serverEntries.map(([serverName, serverConfig]) => (
							<UnstyledButton
								key={serverName}
								onClick={() => openEditor(serverName, serverConfig)}
								py="sm"
								px="xs"
								style={{
									borderBottom:
										"1px solid var(--mantine-color-default-border)",
									borderRadius: 0,
								}}
							>
								<Group justify="space-between" align="center">
									<Text size="sm" fw={500}>
										{serverName}
									</Text>
									<Text size="xs" c="dimmed">
										{(serverConfig as any).type || "stdio"}
									</Text>
								</Group>
							</UnstyledButton>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
}

export function MCPPage() {
	return (
		<Suspense
			fallback={
				<Center h="100vh">
					<Loader size="sm" color="gray" />
				</Center>
			}
		>
			<MCPPageContent />
		</Suspense>
	);
}

function MCPCreatePanel({ onClose }: { onClose?: () => void }) {
	const { t } = useTranslation();
	const [currentTab, setCurrentTab] = useState<"recommend" | "manual">(
		"recommend",
	);

	return (
		<Stack gap="md">
			<Group gap={4}>
				<Button
					size="xs"
					variant={currentTab === "recommend" ? "filled" : "subtle"}
					color={currentTab === "recommend" ? "brand" : "gray"}
					onClick={() => setCurrentTab("recommend")}
				>
					{t("mcp.recommend")}
				</Button>
				<Button
					size="xs"
					variant={currentTab === "manual" ? "filled" : "subtle"}
					color={currentTab === "manual" ? "brand" : "gray"}
					onClick={() => setCurrentTab("manual")}
				>
					{t("mcp.custom")}
				</Button>
			</Group>

			{match(currentTab)
				.with("recommend", () => {
					return <RecommendMCPPanel onClose={onClose} />;
				})
				.with("manual", () => {
					return <CustomMCPPanel onClose={onClose} />;
				})
				.exhaustive()}
		</Stack>
	);
}

function RecommendMCPPanel({ onClose }: { onClose?: () => void }) {
	const { t } = useTranslation();
	const addMcpServer = useAddGlobalMcpServer();
	const { data: mcpServers } = useGlobalMcpServers();

	const handleAddMcpServer = async (
		mcpServer: (typeof builtInMcpServers)[0],
	) => {
		try {
			const exists =
				mcpServers && Object.keys(mcpServers).includes(mcpServer.name);

			if (exists) {
				await message(
					t("mcp.serverExistsError", { serverName: mcpServer.name }),
					{
						title: t("mcp.serverExistsTitle"),
						kind: "info",
					},
				);
				return;
			}

			const confirmed = await ask(
				t("mcp.addServerConfirm", { serverName: mcpServer.name }),
				{ title: t("mcp.addServerTitle"), kind: "info" },
			);

			if (confirmed) {
				const configObject = JSON.parse(`{${mcpServer.prefill}}`);

				addMcpServer.mutate(
					{
						serverName: mcpServer.name,
						serverConfig: configObject[mcpServer.name],
					},
					{
						onSuccess: () => {
							onClose?.();
						},
					},
				);
			}
		} catch (error) {
			console.error("Failed to add MCP server:", error);
			await message(t("mcp.addServerError"), {
				title: "Error",
				kind: "error",
			});
		}
	};

	return (
		<Stack gap="xs">
			{builtInMcpServers.map((mcpServer) => (
				<UnstyledButton
					key={mcpServer.name}
					onClick={() => handleAddMcpServer(mcpServer)}
					p="md"
					style={{
						border: "1px solid var(--mantine-color-default-border)",
						borderRadius: "var(--mantine-radius-md)",
					}}
				>
					<Group justify="space-between" align="flex-start" mb={4}>
						<Text size="sm" fw={600}>
							{mcpServer.name}
						</Text>
						<ActionIcon
							variant="subtle"
							color="gray"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								openUrl(mcpServer.source);
							}}
						>
							<ExternalLinkIcon size={14} />
						</ActionIcon>
					</Group>
					<Text size="xs" c="dimmed">
						{mcpServer.description}
					</Text>
				</UnstyledButton>
			))}
		</Stack>
	);
}

function CustomMCPPanel({ onClose }: { onClose?: () => void }) {
	const { t } = useTranslation();
	const [customConfig, setCustomConfig] = useState("");
	const addMcpServer = useAddGlobalMcpServer();
	const { data: mcpServers } = useGlobalMcpServers();
	const codeMirrorTheme = useCodeMirrorTheme();

	const handleAddCustomMcpServer = async () => {
		try {
			let configObject;
			try {
				configObject = JSON.parse(customConfig);
			} catch (error) {
				await message(t("mcp.addCustomServerError"), {
					title: t("mcp.invalidJsonTitle"),
					kind: "error",
				});
				return;
			}

			if (typeof configObject !== "object" || configObject === null) {
				await message(t("mcp.invalidConfigError"), {
					title: "Invalid Configuration",
					kind: "error",
				});
				return;
			}

			const serverNames = Object.keys(configObject);
			if (serverNames.length === 0) {
				await message(t("mcp.noServersError"), {
					title: "Invalid Configuration",
					kind: "error",
				});
				return;
			}

			const existingNames = mcpServers ? Object.keys(mcpServers) : [];
			const duplicateNames = serverNames.filter((name) =>
				existingNames.includes(name),
			);

			if (duplicateNames.length > 0) {
				await message(
					t("mcp.duplicateServersError", {
						servers: duplicateNames.join(", "),
					}),
					{
						title: t("mcp.duplicateServersTitle"),
						kind: "warning",
					},
				);
				return;
			}

			const confirmed = await ask(
				t("mcp.addCustomServersConfirm", { count: serverNames.length }),
				{ title: t("mcp.addCustomServersTitle"), kind: "info" },
			);

			if (confirmed) {
				for (const [serverName, serverConfig] of Object.entries(configObject)) {
					addMcpServer.mutate({
						serverName,
						serverConfig: serverConfig as Record<string, any>,
					});
				}

				setCustomConfig("");
				onClose?.();
			}
		} catch (error) {
			console.error("Failed to add custom MCP servers:", error);
			await message(t("mcp.addServerError"), {
				title: "Error",
				kind: "error",
			});
		}
	};

	return (
		<Stack gap="md">
			<Box
				style={{
					borderRadius: "var(--mantine-radius-md)",
					overflow: "hidden",
					border: "1px solid var(--mantine-color-default-border)",
				}}
			>
				<CodeMirror
					value={customConfig}
					onChange={(value) => setCustomConfig(value)}
					height="240px"
					theme={codeMirrorTheme}
					extensions={[json()]}
					placeholder={t("mcp.customPlaceholder")}
				/>
			</Box>

			<Group justify="flex-end">
				<Button
					onClick={handleAddCustomMcpServer}
					disabled={!customConfig.trim()}
				>
					{t("mcp.add")}
				</Button>
			</Group>
		</Stack>
	);
}
