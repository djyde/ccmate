import { Box, Center, Loader, Stack, Text } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { useClaudeProjects } from "../../lib/query";

export function ProjectsLayout() {
	const { data: projects, isLoading, error } = useClaudeProjects();

	if (isLoading) {
		return (
			<Center h="100vh">
				<Stack align="center" gap="sm">
					<Loader size="sm" color="gray" />
					<Text size="sm" c="dimmed">
						Loading projects...
					</Text>
				</Stack>
			</Center>
		);
	}

	if (error) {
		return (
			<Center h="100vh">
				<Text size="sm" c="red.6">
					Failed to load projects:{" "}
					{error instanceof Error ? error.message : String(error)}
				</Text>
			</Center>
		);
	}

	if (!projects || projects.length === 0) {
		return (
			<Center h="100vh">
				<Stack align="center" gap="md" maw={360}>
					<Box
						style={{
							width: 48,
							height: 48,
							borderRadius: 12,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						bg="gray.1"
						darkHidden={false}
					>
						<Text size="xl" c="dimmed">
							📁
						</Text>
					</Box>
					<Stack align="center" gap={4}>
						<Text fw={500} size="md">
							No Projects Found
						</Text>
						<Text size="sm" c="dimmed" ta="center" lh={1.6}>
							Projects appear here when you use Claude Code in
							different project folders.
						</Text>
					</Stack>
				</Stack>
			</Center>
		);
	}

	return <Outlet />;
}
