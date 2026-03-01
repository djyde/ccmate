import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { Paper, Skeleton, Stack, Switch } from "@mantine/core";
import {
	useNotificationSettings,
	useUpdateNotificationSettings,
} from "@/lib/query";

const switchStyles = {
	body: { alignItems: "center" as const },
	labelWrapper: { flex: 1 },
};

export function NotificationPage() {
	const { t } = useTranslation();
	const { data: notificationSettings, isLoading } = useNotificationSettings();
	const updateNotificationSettings = useUpdateNotificationSettings();

	const handleGeneralToggle = (checked: boolean) => {
		if (!notificationSettings) return;

		const newSettings = {
			enable: checked,
			enabled_hooks: checked ? notificationSettings.enabled_hooks : [],
		};
		updateNotificationSettings.mutate(newSettings);
	};

	const handleHookToggle = (hookName: string, checked: boolean) => {
		if (!notificationSettings) return;

		let newHooks: string[];
		if (checked) {
			newHooks = [...notificationSettings.enabled_hooks, hookName];
		} else {
			newHooks = notificationSettings.enabled_hooks.filter(
				(hook) => hook !== hookName,
			);
		}

		const newSettings = {
			enable: notificationSettings.enable,
			enabled_hooks: newHooks,
		};
		updateNotificationSettings.mutate(newSettings);
	};

	const isHookEnabled = (hookName: string) => {
		return notificationSettings?.enabled_hooks.includes(hookName) || false;
	};

	const enabled = notificationSettings?.enable || false;

	if (isLoading) {
		return (
			<div>
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
							<Skeleton height={24} width={128} mb={4} />
							<Skeleton height={16} width={192} />
						</div>
					</div>
				</div>
				<Stack gap="md" className="px-5">
					<Paper withBorder p="lg">
						<div className="flex items-center justify-between">
							<div>
								<Skeleton height={16} width={96} mb={8} />
								<Skeleton height={12} width={256} />
							</div>
							<Skeleton height={24} width={44} radius="xl" />
						</div>
					</Paper>
					<Paper withBorder p="lg">
						<Stack gap="lg">
							<div className="flex items-center justify-between">
								<div>
									<Skeleton height={16} width={96} mb={8} />
									<Skeleton height={12} width={256} />
								</div>
								<Skeleton height={20} width={36} radius="xl" />
							</div>
							<div className="flex items-center justify-between">
								<div>
									<Skeleton height={16} width={96} mb={8} />
									<Skeleton height={12} width={256} />
								</div>
								<Skeleton height={20} width={36} radius="xl" />
							</div>
						</Stack>
					</Paper>
				</Stack>
			</div>
		);
	}

	return (
		<div>
			<PageHeader
				title={t("notifications.title")}
				description={t("notifications.description")}
			/>
			<Stack gap="md" className="px-5">
				<Paper withBorder p="lg">
					<Switch
						label={t("notifications.general")}
						description={t("notifications.generalDescription")}
						size="md"
						color="brand"
						checked={enabled}
						onChange={(e) => handleGeneralToggle(e.currentTarget.checked)}
						styles={switchStyles}
					/>
				</Paper>
				<Paper
					withBorder
					p="lg"
					style={{
						opacity: enabled ? 1 : 0.45,
						transition: "opacity 0.25s ease",
					}}
				>
					<Stack gap="lg">
						<Switch
							label={t("notifications.toolUse")}
							description={t("notifications.toolUseDescription")}
							size="sm"
							color="brand"
							checked={isHookEnabled("PreToolUse")}
							onChange={(e) =>
								handleHookToggle("PreToolUse", e.currentTarget.checked)
							}
							disabled={!enabled}
							styles={switchStyles}
						/>
						<Switch
							label={t("notifications.completion")}
							description={t("notifications.completionDescription")}
							size="sm"
							color="brand"
							checked={isHookEnabled("Stop")}
							onChange={(e) =>
								handleHookToggle("Stop", e.currentTarget.checked)
							}
							disabled={!enabled}
							styles={switchStyles}
						/>
					</Stack>
				</Paper>
			</Stack>
		</div>
	);
}
