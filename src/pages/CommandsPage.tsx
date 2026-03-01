import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { ask, message } from "@tauri-apps/plugin-dialog";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
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
	useClaudeCommands,
	useDeleteClaudeCommand,
	useWriteClaudeCommand,
} from "@/lib/query";
import { useCodeMirrorTheme } from "@/lib/use-codemirror-theme";

interface EditingCommand {
	name: string;
	content: string;
}

function CommandsPageContent() {
	const { t } = useTranslation();
	const { data: commands, isLoading, error } = useClaudeCommands();
	const writeCommand = useWriteClaudeCommand();
	const deleteCommand = useDeleteClaudeCommand();
	const [createOpened, { open: openCreate, close: closeCreate }] =
		useDisclosure(false);
	const [editing, setEditing] = useState<EditingCommand | null>(null);
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
					{t("commands.error", { error: error.message })}
				</Text>
			</Center>
		);
	}

	const openEditor = (command: { name: string; content: string }) => {
		setEditing({ name: command.name, content: command.content });
		setEditContent(command.content);
	};

	const closeEditor = () => {
		setEditing(null);
		setEditContent("");
	};

	const hasChanges = editing !== null && editContent !== editing.content;

	const handleSaveCommand = () => {
		if (!editing || !hasChanges) return;
		writeCommand.mutate(
			{ commandName: editing.name, content: editContent },
			{
				onSuccess: () => {
					closeEditor();
				},
			},
		);
	};

	const handleDeleteCommand = async (commandName: string) => {
		const confirmed = await ask(t("commands.deleteConfirm", { commandName }), {
			title: t("commands.deleteTitle"),
			kind: "warning",
		});

		if (confirmed) {
			deleteCommand.mutate(commandName);
			if (editing?.name === commandName) {
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
				title={t("commands.addCommandTitle")}
				size="lg"
				centered
				overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
			>
				<Text size="sm" c="dimmed" mb="md">
					{t("commands.addCommandDescription")}
				</Text>
				<CreateCommandPanel onClose={closeCreate} />
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
								placeholder={t("commands.contentPlaceholder")}
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
							<Tooltip label={t("commands.deleteTitle")} position="bottom">
								<ActionIcon
									variant="subtle"
									color="red"
									size="md"
									onClick={() => handleDeleteCommand(editing.name)}
									disabled={deleteCommand.isPending}
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
								label={`${t("commands.save")} (⌘S)`}
								position="bottom"
							>
								<ActionIcon
									variant={hasChanges ? "filled" : "subtle"}
									color={hasChanges ? "brand" : "gray"}
									size="md"
									onClick={handleSaveCommand}
									disabled={!hasChanges || writeCommand.isPending}
									loading={writeCommand.isPending}
								>
									<SaveIcon size={16} />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Stack>
				)}
			</Modal>

			<PageHeader
				title={t("commands.title")}
				description={t("commands.description")}
				actions={
					<Tooltip label={t("commands.addCommand")} position="bottom">
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

			{/* Command list */}
			<Box px="lg" pb="lg" style={{ flex: 1, overflow: "auto" }}>
				{!commands || commands.length === 0 ? (
					<Center py="xl">
						<Text size="sm" c="dimmed">
							{t("commands.noCommands")}
						</Text>
					</Center>
				) : (
					<Stack gap={4}>
						{commands.map((command) => (
							<UnstyledButton
								key={command.name}
								onClick={() => openEditor(command)}
								py="sm"
								px="xs"
							>
								<Group justify="space-between" align="center">
									<Box>
										<Text size="sm" fw={500}>
											{command.name}
										</Text>
										<Text size="xs" c="dimmed">
											{`~/.claude/commands/${command.name}.md`}
										</Text>
									</Box>
									<Text size="xs" c="dimmed">
										{command.content.split("\n").length} lines
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

export function CommandsPage() {
	return (
		<Suspense
			fallback={
				<Center h="100vh">
					<Loader size="sm" color="gray" />
				</Center>
			}
		>
			<CommandsPageContent />
		</Suspense>
	);
}

function CreateCommandPanel({ onClose }: { onClose?: () => void }) {
	const { t } = useTranslation();
	const [commandName, setCommandName] = useState("");
	const [commandContent, setCommandContent] = useState("");
	const writeCommand = useWriteClaudeCommand();
	const { data: commands } = useClaudeCommands();
	const codeMirrorTheme = useCodeMirrorTheme();

	const handleCreateCommand = async () => {
		if (!commandName.trim()) {
			await message(t("commands.emptyNameError"), {
				title: t("commands.validationError"),
				kind: "error",
			});
			return;
		}

		const exists = commands && commands.some((cmd) => cmd.name === commandName);
		if (exists) {
			await message(t("commands.commandExistsError", { commandName }), {
				title: t("commands.commandExistsTitle"),
				kind: "info",
			});
			return;
		}

		if (!commandContent.trim()) {
			await message(t("commands.emptyContentError"), {
				title: t("commands.validationError"),
				kind: "error",
			});
			return;
		}

		writeCommand.mutate(
			{
				commandName,
				content: commandContent,
			},
			{
				onSuccess: () => {
					setCommandName("");
					setCommandContent("");
					onClose?.();
				},
			},
		);
	};

	return (
		<Stack gap="md">
			<TextInput
				label={t("commands.commandName")}
				value={commandName}
				onChange={(e) => setCommandName(e.currentTarget.value)}
				placeholder={t("commands.commandNamePlaceholder")}
			/>

			<Box>
				<Text size="sm" fw={500} mb={4}>
					{t("commands.commandContent")}
				</Text>
				<Box
					style={{
						borderRadius: "var(--mantine-radius-md)",
						overflow: "hidden",
						border: "1px solid var(--mantine-color-default-border)",
					}}
				>
					<CodeMirror
						value={commandContent}
						onChange={(value) => setCommandContent(value)}
						height="200px"
						theme={codeMirrorTheme}
						placeholder={t("commands.contentPlaceholder")}
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
					onClick={handleCreateCommand}
					disabled={
						!commandName.trim() ||
						!commandContent.trim() ||
						writeCommand.isPending
					}
					loading={writeCommand.isPending}
				>
					{t("commands.create")}
				</Button>
			</Group>
		</Stack>
	);
}
