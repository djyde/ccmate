import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { ask, message } from "@tauri-apps/plugin-dialog";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { BotIcon, PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
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
	TextInput,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { PageHeader } from "@/components/PageHeader";
import {
	useClaudeAgents,
	useDeleteClaudeAgent,
	useWriteClaudeAgent,
} from "@/lib/query";
import { useCodeMirrorTheme } from "@/lib/use-codemirror-theme";

interface EditingAgent {
	name: string;
	content: string;
}

function AgentsPageContent() {
	const { t } = useTranslation();
	const { data: agents, isLoading, error } = useClaudeAgents();
	const writeAgent = useWriteClaudeAgent();
	const deleteAgent = useDeleteClaudeAgent();
	const [createOpened, { open: openCreate, close: closeCreate }] =
		useDisclosure(false);
	const [editing, setEditing] = useState<EditingAgent | null>(null);
	const [editContent, setEditContent] = useState("");
	const codeMirrorTheme = useCodeMirrorTheme();

	if (isLoading) {
		return (
			<Center h="100vh">
				<Loader size="sm" color="gray" />
			</Center>
		);
	}

	if (error) {
		return (
			<Center h="100vh">
				<Text size="sm" c="red.6">
					{t("agents.error", { error: error.message })}
				</Text>
			</Center>
		);
	}

	const openEditor = (agent: { name: string; content: string }) => {
		setEditing({ name: agent.name, content: agent.content });
		setEditContent(agent.content);
	};

	const closeEditor = () => {
		setEditing(null);
		setEditContent("");
	};

	const hasChanges = editing !== null && editContent !== editing.content;

	const handleSaveAgent = () => {
		if (!editing || !hasChanges) return;
		writeAgent.mutate(
			{ agentName: editing.name, content: editContent },
			{
				onSuccess: () => {
					closeEditor();
				},
			},
		);
	};

	const handleDeleteAgent = async (agentName: string) => {
		const confirmed = await ask(t("agents.deleteConfirm", { agentName }), {
			title: t("agents.deleteTitle"),
			kind: "warning",
		});

		if (confirmed) {
			deleteAgent.mutate(agentName);
			if (editing?.name === agentName) {
				closeEditor();
			}
		}
	};

	return (
		<Box style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			{/* Create modal */}
			<Modal
				opened={createOpened}
				onClose={closeCreate}
				title={t("agents.addAgentTitle")}
				size="lg"
				centered
				overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
			>
				<Text size="sm" c="dimmed" mb="md">
					{t("agents.addAgentDescription")}
				</Text>
				<CreateAgentPanel onClose={closeCreate} />
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
								onChange={setEditContent}
								placeholder={t("agents.contentPlaceholder")}
								extensions={[
									yamlFrontmatter({
										content: markdown({
											base: markdownLanguage,
										}),
									}),
									EditorView.lineWrapping,
								]}
								basicSetup={{
									lineNumbers: false,
									highlightActiveLineGutter: true,
									foldGutter: false,
									dropCursor: false,
									allowMultipleSelections: false,
									indentOnInput: true,
									bracketMatching: true,
									closeBrackets: true,
									autocompletion: true,
									highlightActiveLine: true,
									highlightSelectionMatches: true,
									searchKeymap: false,
								}}
							/>
						</Box>
						<Group justify="space-between">
							<Tooltip label={t("agents.deleteTitle")} position="bottom">
								<ActionIcon
									variant="subtle"
									color="red"
									size="md"
									onClick={() => handleDeleteAgent(editing.name)}
									disabled={deleteAgent.isPending}
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

							<Tooltip
								label={`${t("agents.save")} (⌘S)`}
								position="bottom"
							>
								<ActionIcon
									variant={hasChanges ? "filled" : "subtle"}
									color={hasChanges ? "brand" : "gray"}
									size="md"
									onClick={handleSaveAgent}
									disabled={!hasChanges || writeAgent.isPending}
									loading={writeAgent.isPending}
								>
									<SaveIcon size={16} />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Stack>
				)}
			</Modal>

			<PageHeader
				title={t("agents.title")}
				description={t("agents.description")}
				actions={
					<Tooltip label={t("agents.addAgent")} position="bottom">
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

			{/* Agent list */}
			<Box px="lg" pb="lg" style={{ flex: 1, overflow: "auto" }}>
				{!agents || agents.length === 0 ? (
					<Center py="xl">
						<Text size="sm" c="dimmed">
							{t("agents.noAgents")}
						</Text>
					</Center>
				) : (
					<Stack gap={0}>
						{agents.map((agent) => (
							<UnstyledButton
								key={agent.name}
								onClick={() => openEditor(agent)}
								py="sm"
								px="xs"
								style={{
									borderBottom:
										"1px solid var(--mantine-color-default-border)",
									borderRadius: 0,
								}}
							>
								<Group justify="space-between" align="center">
									<Group gap="xs">
										<BotIcon size={14} />
										<Box>
											<Text size="sm" fw={500}>
												{agent.name}
											</Text>
											<Text size="xs" c="dimmed">
												{`~/.claude/agents/${agent.name}.md`}
											</Text>
										</Box>
									</Group>
									<Text size="xs" c="dimmed">
										{agent.content.split("\n").length} lines
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

export function AgentsPage() {
	return (
		<Suspense
			fallback={
				<Center h="100vh">
					<Loader size="sm" color="gray" />
				</Center>
			}
		>
			<AgentsPageContent />
		</Suspense>
	);
}

function CreateAgentPanel({ onClose }: { onClose?: () => void }) {
	const { t } = useTranslation();
	const [agentName, setAgentName] = useState("");
	const [agentContent, setAgentContent] = useState(`---
name: your-sub-agent-name
description: Description of when this subagent should be invoked
tools: tool1, tool2, tool3  # Optional - inherits all tools if omitted
model: sonnet  # Optional - specify model alias or 'inherit'
---

Your subagent's system prompt goes here. This can be multiple paragraphs
and should clearly define the subagent's role, capabilities, and approach
to solving problems.

Include specific instructions, best practices, and any constraints
the subagent should follow.`);
	const writeAgent = useWriteClaudeAgent();
	const { data: agents } = useClaudeAgents();
	const codeMirrorTheme = useCodeMirrorTheme();

	const handleCreateAgent = async () => {
		if (!agentName.trim()) {
			await message(t("agents.emptyNameError"), {
				title: t("agents.validationError"),
				kind: "error",
			});
			return;
		}

		const exists = agents?.some((agent) => agent.name === agentName);
		if (exists) {
			await message(t("agents.agentExistsError", { agentName }), {
				title: t("agents.agentExistsTitle"),
				kind: "info",
			});
			return;
		}

		if (!agentContent.trim()) {
			await message(t("agents.emptyContentError"), {
				title: t("agents.validationError"),
				kind: "error",
			});
			return;
		}

		writeAgent.mutate(
			{
				agentName,
				content: agentContent,
			},
			{
				onSuccess: () => {
					setAgentName("");
					setAgentContent("");
					onClose?.();
				},
			},
		);
	};

	return (
		<Stack gap="md">
			<TextInput
				label={t("agents.agentName")}
				value={agentName}
				onChange={(e) => setAgentName(e.currentTarget.value)}
				placeholder={t("agents.agentNamePlaceholder")}
			/>

			<Box>
				<Text size="sm" fw={500} mb={4}>
					{t("agents.agentContent")}
				</Text>
				<Box
					style={{
						borderRadius: "var(--mantine-radius-md)",
						overflow: "hidden",
						border: "1px solid var(--mantine-color-default-border)",
					}}
				>
					<CodeMirror
						value={agentContent}
						onChange={(value) => setAgentContent(value)}
						height="200px"
						theme={codeMirrorTheme}
						placeholder={t("agents.contentPlaceholder")}
						extensions={[
							yamlFrontmatter({
								content: markdown({
									base: markdownLanguage,
								}),
							}),
							EditorView.lineWrapping,
						]}
						basicSetup={{
							lineNumbers: false,
							highlightActiveLineGutter: true,
							foldGutter: false,
							dropCursor: false,
							allowMultipleSelections: false,
							indentOnInput: true,
							bracketMatching: true,
							closeBrackets: true,
							autocompletion: true,
							highlightActiveLine: true,
							highlightSelectionMatches: true,
							searchKeymap: false,
						}}
					/>
				</Box>
			</Box>

			<Group justify="flex-end">
				<Button
					onClick={handleCreateAgent}
					disabled={
						!agentName.trim() ||
						!agentContent.trim() ||
						writeAgent.isPending
					}
					loading={writeAgent.isPending}
				>
					{t("agents.create")}
				</Button>
			</Group>
		</Stack>
	);
}
