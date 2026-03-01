import {
	ActivityIcon,
	BellIcon,
	BotIcon,
	BrainIcon,
	CpuIcon,
	FileJsonIcon,
	FolderIcon,
	MonitorIcon,
	MoonIcon,
	SettingsIcon,
	SunIcon,
	TerminalIcon,
} from "lucide-react";
import type React from "react";
import {
	AppShell,
	Center,
	NavLink as MantineNavLink,
	SegmentedControl,
	Stack,
	VisuallyHidden,
	useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { isMacOS } from "../lib/utils";
import { UpdateButton } from "./UpdateButton";

export function Layout() {
	const { t } = useTranslation();
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const location = useLocation();

	const navGroups = [
		[
			{ to: "/", icon: FileJsonIcon, label: t("navigation.configurations") },
			{ to: "/projects", icon: FolderIcon, label: t("navigation.projects") },
		],
		[
			{ to: "/mcp", icon: CpuIcon, label: t("navigation.mcp") },
			{ to: "/agents", icon: BotIcon, label: "Agents" },
			{ to: "/memory", icon: BrainIcon, label: t("navigation.memory") },
			{
				to: "/commands",
				icon: TerminalIcon,
				label: t("navigation.commands"),
			},
		],
		[
			{
				to: "/notification",
				icon: BellIcon,
				label: t("navigation.notifications"),
			},
			{ to: "/usage", icon: ActivityIcon, label: t("navigation.usage") },
			{
				to: "/settings",
				icon: SettingsIcon,
				label: t("navigation.settings"),
			},
		],
	];

	const dragRegionStyle = {
		WebkitUserSelect: "none",
		WebkitAppRegion: "drag",
	} as React.CSSProperties;

	const isActive = (to: string) => {
		if (to === "/") return location.pathname === "/";
		return location.pathname.startsWith(to);
	};

	return (
		<AppShell
			navbar={{ width: 220, breakpoint: 0 }}
			padding={0}
		>
			<AppShell.Navbar
				data-tauri-drag-region
				style={dragRegionStyle}
				p="xs"
			>
				{isMacOS && (
					<div
						data-tauri-drag-region
						style={{ ...dragRegionStyle, height: 32, flexShrink: 0 }}
					/>
				)}
				<AppShell.Section grow data-tauri-drag-region>
					<Stack gap="lg">
						{navGroups.map((group, gi) => (
							<Stack key={gi} gap={2}>
								{group.map((link) => (
									<MantineNavLink
										key={link.to}
										component={NavLink}
										to={link.to}
										end={link.to === "/"}
										label={link.label}
										leftSection={<link.icon size={16} strokeWidth={1.5} />}
										active={isActive(link.to)}
										variant="light"
										styles={{
											root: { borderRadius: "var(--mantine-radius-md)" },
											label: { fontSize: 13 },
										}}
									/>
								))}
							</Stack>
						))}
					</Stack>
				</AppShell.Section>
				<AppShell.Section>
					<Stack gap="xs" pb="xs">
						<UpdateButton />
						<SegmentedControl
							fullWidth
							size="xs"
							value={colorScheme}
							onChange={(value) => setColorScheme(value as "light" | "dark" | "auto")}
							data={[
								{ value: "light", label: <Center><SunIcon size={14} /><VisuallyHidden>Light</VisuallyHidden></Center> },
								{ value: "dark", label: <Center><MoonIcon size={14} /><VisuallyHidden>Dark</VisuallyHidden></Center> },
								{ value: "auto", label: <Center><MonitorIcon size={14} /><VisuallyHidden>Auto</VisuallyHidden></Center> },
							]}
						/>
					</Stack>
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main
				data-tauri-drag-region
				style={{ height: "100vh", overflow: "auto" }}
			>
				<Outlet />
			</AppShell.Main>
		</AppShell>
	);
}
