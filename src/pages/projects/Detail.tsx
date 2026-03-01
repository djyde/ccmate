import { json } from "@codemirror/lang-json";
import { codeFolding } from "@codemirror/language";
import CodeMirror, { EditorView, keymap } from "@uiw/react-codemirror";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import {
	ActionIcon,
	Box,
	Center,
	Loader,
	Text,
	Tooltip,
} from "@mantine/core";
import { SaveIcon } from "lucide-react";
import {
	useClaudeConfigFile,
	useClaudeProjects,
	useWriteClaudeConfigFile,
} from "../../lib/query";
import { useCodeMirrorTheme } from "../../lib/use-codemirror-theme";
import { PageHeader } from "@/components/PageHeader";
import { ProjectSelector } from "./ProjectSelector";

export function Detail() {
	const { t } = useTranslation();
	const { path } = useParams<{ path: string }>();
	const navigate = useNavigate();
	const {
		data: projects,
		isLoading: isLoadingProjects,
		error: projectsError,
	} = useClaudeProjects();
	const {
		data: claudeConfig,
		isLoading: isLoadingConfig,
		error: configError,
	} = useClaudeConfigFile();
	const writeClaudeConfig = useWriteClaudeConfigFile();
	const [jsonContent, setJsonContent] = useState("");
	const [hasChanges, setHasChanges] = useState(false);
	const codeMirrorTheme = useCodeMirrorTheme();

	useEffect(() => {
		if (path && projects && !isLoadingProjects && !isLoadingConfig) {
			const decodedPath = decodeURIComponent(path);
			const project = projects.find((p) => p.path === decodedPath);

			if (project) {
				setJsonContent(JSON.stringify(project.config, null, 2));
				setHasChanges(false);
			}
		}
	}, [path, projects, isLoadingProjects, isLoadingConfig]);

	const handleSave = useCallback(() => {
		try {
			const parsedContent = JSON.parse(jsonContent);

			if (!path || !claudeConfig) {
				notifications.show({ message: t("projects.detail.noProjectSelected"), color: "red" });
				return;
			}

			const decodedPath = decodeURIComponent(path);
			const updatedConfig = JSON.parse(JSON.stringify(claudeConfig.content));

			if (!updatedConfig.projects) {
				updatedConfig.projects = {};
			}
			updatedConfig.projects[decodedPath] = parsedContent;

			writeClaudeConfig.mutate(updatedConfig);
			setHasChanges(false);
		} catch (error) {
			notifications.show({ message: t("projects.detail.invalidJson"), color: "red" });
		}
	}, [jsonContent, path, claudeConfig, writeClaudeConfig, t]);

	const handleContentChange = useCallback((value: string) => {
		setJsonContent(value);
		setHasChanges(true);
	}, []);

	const handleProjectChange = useCallback(
		(newPath: string) => {
			if (hasChanges) {
				const shouldSave = window.confirm(t("projects.detail.unsavedChanges"));
				if (shouldSave) {
					handleSave();
				}
			}
			navigate(`/projects/${encodeURIComponent(newPath)}`);
		},
		[hasChanges, handleSave, navigate, t],
	);

	const saveKeymap = keymap.of([
		{
			key: "Mod-s",
			run: () => {
				handleSave();
				return true;
			},
		},
	]);

	const wordWrapExtension = EditorView.lineWrapping;

	if (isLoadingConfig || isLoadingProjects) {
		return (
			<Center h="100vh">
				<Loader size="sm" color="gray" />
			</Center>
		);
	}

	if (configError || projectsError) {
		return (
			<Center h="100vh">
				<Text size="sm" c="red.6">
					{t("projects.detail.loadError")}{" "}
					{(configError || projectsError) instanceof Error
						? (configError || projectsError)?.message
						: String(configError || projectsError)}
				</Text>
			</Center>
		);
	}

	if (!path || !projects || projects.length === 0) {
		return (
			<Center h="100vh">
				<Text size="sm" c="dimmed">
					{t("projects.detail.noProjectsMessage")}
				</Text>
			</Center>
		);
	}

	const decodedPath = decodeURIComponent(path);
	const project = projects.find((p) => p.path === decodedPath);

	if (!project) {
		return (
			<Center h="100vh">
				<Box ta="center">
					<Text size="sm" c="dimmed" mb="md">
						{t("projects.detail.projectNotFound", { path: decodedPath })}
					</Text>
					<Text
						size="sm"
						c="brand"
						style={{ cursor: "pointer" }}
						onClick={() => navigate("/projects")}
					>
						{t("projects.detail.backToProjects")}
					</Text>
				</Box>
			</Center>
		);
	}

	return (
		<Box
			style={{ display: "flex", flexDirection: "column", height: "100vh" }}
		>
			<PageHeader
				actions={
					<Tooltip
						label={hasChanges ? `${t("projects.detail.save")} (⌘S)` : t("projects.detail.save")}
						position="bottom"
					>
						<ActionIcon
							variant={hasChanges ? "filled" : "subtle"}
							color={hasChanges ? "brand" : "gray"}
							size="md"
							onClick={handleSave}
							disabled={!hasChanges || writeClaudeConfig.isPending}
							loading={writeClaudeConfig.isPending}
						>
							<SaveIcon size={16} />
						</ActionIcon>
					</Tooltip>
				}
			>
				<Text size="xs" c="dimmed" fw={500}>
					{t("projects.detail.projectEditor")}
				</Text>
				<Text size="xs" c="dimmed">
					/
				</Text>
				<ProjectSelector
					projects={projects}
					currentPath={decodedPath}
					onSelect={handleProjectChange}
				/>
			</PageHeader>

			{/* Editor */}
			<Box style={{ flex: 1, overflow: "hidden" }}>
				<CodeMirror
					value={jsonContent}
					height="100%"
					theme={codeMirrorTheme}
					extensions={[
						json(),
						codeFolding(),
						wordWrapExtension,
						saveKeymap,
					]}
					onChange={handleContentChange}
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
					className="h-full text-sm"
					style={{ width: "100%", fontSize: "12px" }}
				/>
			</Box>
		</Box>
	);
}
