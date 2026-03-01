import { Box, Group, Stack, Text, Title } from "@mantine/core";

interface PageHeaderProps {
	title?: string;
	description?: string;
	actions?: React.ReactNode;
	children?: React.ReactNode;
}

export function PageHeader({
	title,
	description,
	actions,
	children,
}: PageHeaderProps) {
	return (
		<Box
			pos="sticky"
			top={0}
			style={{
				zIndex: "var(--mantine-z-index-app)" as unknown as number,
				backgroundColor: "var(--mantine-color-body)",
			}}
			data-tauri-drag-region
		>
			<Group
				justify="space-between"
				px="lg"
				pt="lg"
				pb="sm"
				data-tauri-drag-region
			>
				{children ? (
					<Group gap="xs" miw={0} data-tauri-drag-region>
						{children}
					</Group>
				) : (
					<Stack gap={2} data-tauri-drag-region>
						{title && (
							<Title
								order={4}
								fw={600}
								data-tauri-drag-region
							>
								{title}
							</Title>
						)}
						{description && (
							<Text size="sm" c="dimmed" data-tauri-drag-region>
								{description}
							</Text>
						)}
					</Stack>
				)}
				{actions && <Group gap="xs">{actions}</Group>}
			</Group>
		</Box>
	);
}
