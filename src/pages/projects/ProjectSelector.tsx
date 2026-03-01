import { Combobox, Group, InputBase, Text, useCombobox } from "@mantine/core";
import { useMemo, useState } from "react";
import type { ProjectConfig } from "../../lib/query";

interface ProjectSelectorProps {
	projects: ProjectConfig[];
	currentPath: string;
	onSelect: (path: string) => void;
}

export function ProjectSelector({
	projects,
	currentPath,
	onSelect,
}: ProjectSelectorProps) {
	const [search, setSearch] = useState("");
	const combobox = useCombobox({
		onDropdownClose: () => {
			combobox.resetSelectedOption();
			setSearch("");
		},
	});

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		if (!q) return projects;
		return projects.filter((p) => p.path.toLowerCase().includes(q));
	}, [projects, search]);

	const currentProject = projects.find((p) => p.path === currentPath);
	const displayName = currentProject
		? currentProject.path.split("/").pop() || currentProject.path
		: "Select project";

	return (
		<Combobox
			store={combobox}
			onOptionSubmit={(val) => {
				onSelect(val);
				combobox.closeDropdown();
			}}
			withinPortal={false}
		>
			<Combobox.Target>
				<InputBase
					component="button"
					type="button"
					pointer
					rightSection={<Combobox.Chevron />}
					rightSectionPointerEvents="none"
					onClick={() => combobox.toggleDropdown()}
					size="xs"
					styles={{
						input: {
							fontWeight: 500,
							fontSize: 13,
							border: "none",
							background: "transparent",
							minWidth: 320,
						},
					}}
				>
					{displayName}
				</InputBase>
			</Combobox.Target>

			<Combobox.Dropdown>
				<Combobox.Search
					value={search}
					onChange={(e) => {
						setSearch(e.currentTarget.value);
						combobox.updateSelectedOptionIndex("active");
					}}
					placeholder="Search projects..."
				/>
				<Combobox.Options mah={280} style={{ overflowY: "auto" }}>
					{filtered.length === 0 ? (
						<Combobox.Empty>No projects found</Combobox.Empty>
					) : (
						filtered.map((proj) => (
							<Combobox.Option
								value={proj.path}
								key={proj.path}
								active={proj.path === currentPath}
							>
								<Group gap="xs" wrap="nowrap">
									<div style={{ flex: 1, minWidth: 0 }}>
										<Text size="sm" fw={500} truncate>
											{proj.path.split("/").pop() ||
												proj.path}
										</Text>
										<Text
											size="xs"
											c="dimmed"
											truncate
											lh={1.4}
										>
											{proj.path}
										</Text>
									</div>
								</Group>
							</Combobox.Option>
						))
					)}
				</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	);
}
