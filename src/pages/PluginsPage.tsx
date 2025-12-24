import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { ask } from "@tauri-apps/plugin-dialog";
import {
	ChevronRightIcon,
	FileIcon,
	FolderIcon,
	SaveIcon,
	TrashIcon,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Collapsible,
	CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCodeMirrorTheme } from "@/lib/use-codemirror-theme";
import {
	useClaudePlugins,
	useDeleteClaudePlugin,
	useWriteClaudePlugin,
} from "@/lib/query";
import type { PluginFile } from "@/lib/query";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { Button } from "@/components/ui/button";

// Recursive component to render plugin tree
function PluginTreeItem({
	plugin,
	level = 0,
	onSelectFile,
	selectedPath,
	onToggleFolder,
	openFolders,
}: {
	plugin: PluginFile;
	level?: number;
	onSelectFile: (plugin: PluginFile) => void;
	selectedPath: string | null;
	onToggleFolder: (path: string) => void;
	openFolders: Set<string>;
}) {
	const isFolder = plugin.file_type === "folder";
	const isSelected = selectedPath === plugin.path;
	const isOpen = openFolders.has(plugin.path);

	const handleClick = () => {
		if (isFolder) {
			onToggleFolder(plugin.path);
		} else {
			onSelectFile(plugin);
		}
	};

	return (
		<div>
			<div
				className={`flex items-center gap-1 py-1.5 px-2 hover:bg-accent cursor-pointer rounded-sm transition-colors ${
					isSelected ? "bg-accent" : ""
				}`}
				style={{ paddingLeft: `${level * 16 + 8}px` }}
				onClick={handleClick}
			>
				{isFolder && (
					<ChevronRightIcon
						size={14}
						className={`transition-transform duration-200 ${
							isOpen ? "rotate-90" : ""
						}`}
					/>
				)}
				{isFolder ? (
					<FolderIcon size={14} className="text-blue-500" />
				) : (
					<FileIcon size={14} className="text-gray-500" />
				)}
				<span className="text-sm">{plugin.name}</span>
			</div>
			{isFolder && plugin.children && plugin.children.length > 0 && (
				<Collapsible open={isOpen} onOpenChange={(open) => open && onToggleFolder(plugin.path)}>
					<CollapsibleContent className="space-y-0.5">
						{plugin.children.map((child) => (
							<PluginTreeItem
								key={child.path}
								plugin={child}
								level={level + 1}
								onSelectFile={onSelectFile}
								selectedPath={selectedPath}
								onToggleFolder={onToggleFolder}
								openFolders={openFolders}
							/>
						))}
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}

function PluginsPageContent() {
	const { t } = useTranslation();
	const { data: plugins, isLoading, error } = useClaudePlugins();
	const writePlugin = useWriteClaudePlugin();
	const deletePlugin = useDeleteClaudePlugin();
	const [selectedPlugin, setSelectedPlugin] = useState<PluginFile | null>(null);
	const [pluginEdits, setPluginEdits] = useState<Record<string, string>>({});
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
	const codeMirrorTheme = useCodeMirrorTheme();

	const handleSelectFile = (plugin: PluginFile) => {
		setSelectedPlugin(plugin);
		setSelectedPath(plugin.path);
	};

	const handleToggleFolder = (path: string) => {
		setOpenFolders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(path)) {
				newSet.delete(path);
			} else {
				newSet.add(path);
			}
			return newSet;
		});
	};

	const handleContentChange = (pluginPath: string, content: string) => {
		setPluginEdits((prev) => ({
			...prev,
			[pluginPath]: content,
		}));
	};

	const handleSavePlugin = async () => {
		if (!selectedPlugin) return;

		const content = pluginEdits[selectedPlugin.path];
		if (content === undefined) return;

		writePlugin.mutate({
			pluginName: selectedPlugin.path,
			content,
		});
	};

	const handleDeletePlugin = async () => {
		if (!selectedPlugin) return;

		const confirmed = await ask(
			`Are you sure you want to delete "${selectedPlugin.name}"?`,
			{
				title: "Delete Plugin",
				kind: "warning",
			},
		);

		if (confirmed) {
			deletePlugin.mutate(selectedPlugin.path, {
				onSuccess: () => {
					setSelectedPlugin(null);
					setSelectedPath(null);
					setPluginEdits((prev) => {
						const newEdits = { ...prev };
						delete newEdits[selectedPlugin.path];
						return newEdits;
					});
				},
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">{t("loading")}</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center text-red-500">
					{error instanceof Error ? error.message : String(error)}
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<div
				className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10"
				data-tauri-drag-region
			>
				<div data-tauri-drag-region>
					<h3 className="font-bold" data-tauri-drag-region>
						Plugins
					</h3>
					<p className="text-sm text-muted-foreground" data-tauri-drag-region>
						管理 Claude Code 的 Plugins 配置文件
					</p>
				</div>
			</div>

			<div className="flex-1 flex flex-col overflow-hidden">
				{/* File tree */}
				<div className="border-b">
					<ScrollArea className="h-64">
						<div className="p-2">
							{!plugins || plugins.length === 0 ? (
								<div className="text-center text-muted-foreground py-8 text-sm">
									未找到 Plugins 文件
								</div>
							) : (
								<div className="space-y-0.5">
									{plugins.map((plugin) => (
										<PluginTreeItem
											key={plugin.path}
											plugin={plugin}
											onSelectFile={handleSelectFile}
											selectedPath={selectedPath}
											onToggleFolder={handleToggleFolder}
											openFolders={openFolders}
										/>
									))}
								</div>
							)}
						</div>
					</ScrollArea>
				</div>

				{/* Editor */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{selectedPlugin ? (
						<div className="flex-1 flex flex-col overflow-hidden">
							<div className="flex-1 overflow-auto p-4">
								<div className="mb-3 pb-3 border-b">
									<h4 className="font-medium text-sm">{selectedPlugin.name}</h4>
									<p className="text-xs text-muted-foreground">
										~/.claude/plugins/{selectedPlugin.path}
									</p>
								</div>
								<div className="rounded-lg overflow-hidden border">
									<CodeMirror
										value={
											pluginEdits[selectedPlugin.path] !== undefined
												? pluginEdits[selectedPlugin.path]
												: selectedPlugin.content
										}
										height="calc(100vh - 300px)"
										theme={codeMirrorTheme}
										onChange={(value) =>
											handleContentChange(selectedPlugin.path, value)
										}
										extensions={[
											yamlFrontmatter({
												content: markdown({
													base: markdownLanguage,
												}),
											}),
											EditorView.lineWrapping,
										]}
										basicSetup={{
											lineNumbers: true,
											highlightActiveLineGutter: true,
											foldGutter: true,
											dropCursor: false,
											allowMultipleSelections: false,
											indentOnInput: true,
											bracketMatching: true,
											closeBrackets: true,
											autocompletion: true,
											highlightActiveLine: true,
											highlightSelectionMatches: true,
											searchKeymap: true,
										}}
									/>
								</div>
							</div>
							<div className="flex justify-between border-t p-3 bg-card">
								<Button
									variant="outline"
									onClick={handleSavePlugin}
									disabled={
										writePlugin.isPending ||
										pluginEdits[selectedPlugin.path] === undefined
									}
									size="sm"
								>
									<SaveIcon size={14} className="mr-1" />
									{writePlugin.isPending ? "保存中..." : "保存"}
								</Button>

								<Button
									variant="ghost"
									size="sm"
									onClick={handleDeletePlugin}
									disabled={deletePlugin.isPending}
								>
									<TrashIcon size={14} className="" />
								</Button>
							</div>
						</div>
					) : (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center text-muted-foreground">
								<FileIcon size={48} className="mx-auto mb-4 opacity-20" />
								<p className="text-sm">选择一个文件进行编辑</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function PluginsPage() {
	const { t } = useTranslation();

	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">{t("loading")}</div>
				</div>
			}
		>
			<PluginsPageContent />
		</Suspense>
	);
}
