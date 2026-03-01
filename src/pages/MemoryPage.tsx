import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { Button, Skeleton } from "@mantine/core";
import { SaveIcon } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { useClaudeMemory, useWriteClaudeMemory } from "@/lib/query";
import { useCodeMirrorTheme } from "@/lib/use-codemirror-theme";

function MemoryPageSkeleton() {
	return (
		<div className="flex flex-col h-screen">
			<div
				className="sticky top-0"
				style={{ backgroundColor: "var(--mantine-color-body)", zIndex: "var(--mantine-z-index-app)" as unknown as number }}
				data-tauri-drag-region
			>
				<div
					className="flex items-center justify-between px-5 pt-5 pb-3"
					data-tauri-drag-region
				>
					<div data-tauri-drag-region>
						<Skeleton height={24} width={64} mb={8} />
						<Skeleton height={16} width={256} />
					</div>
					<Skeleton height={32} width={64} />
				</div>
			</div>
			<div className="flex-1 px-5 pb-5 overflow-hidden">
				<div className="rounded-lg overflow-hidden h-full" style={{ border: "1px solid var(--mantine-color-default-border)" }}>
					<div className="h-full flex items-center justify-center">
						<div className="space-y-2 w-full max-w-2xl">
							<Skeleton height={16} width="100%" />
							<Skeleton height={16} width="75%" />
							<Skeleton height={16} width="50%" />
							<Skeleton height={16} width="100%" />
							<Skeleton height={16} width="66%" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function MemoryPageContent() {
	const { t } = useTranslation();
	const { data: memoryData } = useClaudeMemory();
	const { mutate: saveMemory, isPending: saving } = useWriteClaudeMemory();
	const [content, setContent] = useState<string>("");
	const codeMirrorTheme = useCodeMirrorTheme();

	// Update local content when memory data loads
	useEffect(() => {
		if (memoryData?.content) {
			setContent(memoryData.content);
		}
	}, [memoryData]);

	const handleSave = () => {
		saveMemory(content);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		// Cmd+S or Ctrl+S to save
		if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			handleSave();
		}
	};

	// Add keyboard event listener
	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [content]);

	return (
		<div className="flex flex-col h-screen">
			<PageHeader
				title={t("memory.title")}
				description={t("memory.description")}
				actions={
					<Button
						onClick={handleSave}
						loading={saving}
						variant="filled"
						size="sm"
						leftSection={<SaveIcon className="w-4 h-4" />}
					>
						{saving ? t("memory.saving") : t("memory.save")}
					</Button>
				}
			/>

			<div className="flex-1 px-5 pb-5 overflow-hidden">
				<div className="rounded-lg overflow-hidden h-full" style={{ border: "1px solid var(--mantine-color-default-border)" }}>
					<CodeMirror
						value={content}
						height="100%"
						extensions={[
							yamlFrontmatter({
								content: markdown({
									base: markdownLanguage,
								}),
							}),
							EditorView.lineWrapping,
						]}
						placeholder="~/.claude/CLAUDE.md"
						onChange={(value) => setContent(value)}
						theme={codeMirrorTheme}
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
						className="h-full"
						style={{ width: "100%" }}
					/>
				</div>
			</div>
		</div>
	);
}

export function MemoryPage() {
	return (
		<Suspense fallback={<MemoryPageSkeleton />}>
			<MemoryPageContent />
		</Suspense>
	);
}
