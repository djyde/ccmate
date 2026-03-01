import { CircleQuestionMarkIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GLMDialog } from "./GLMDialog";
import { Button, Paper, Text, Tooltip } from "@mantine/core";

export { GLMDialog } from "./GLMDialog";

export function GLMBanner(props: {
	className?: string;
	hideCloseButton?: boolean;
}) {
	const { t, i18n } = useTranslation();
	const [isDismissed, setIsDismissed] = useState(
		localStorage.getItem("glm-banner-dismissed") === "true",
	);
	const [glmOpen, setGlmOpen] = useState(false);

	const handleDismiss = () => {
		localStorage.setItem("glm-banner-dismissed", "true");
		setIsDismissed(true);
	};

	// Only show banner when locale is Chinese
	if (i18n.language !== "zh" || isDismissed) {
		return null;
	}

	return (
		<Paper
			withBorder
			p="xs"
			radius="md"
			className={props.className}
		>
			<Text size="sm" fw={500} mb="xs" className="flex items-center gap-2">
				{t("glm.title")}
				<Tooltip label={t("glm.tooltip")} w={200} multiline openDelay={100}>
					<CircleQuestionMarkIcon
						size={14}
						style={{ color: "var(--mantine-color-dimmed)", cursor: "help" }}
					/>
				</Tooltip>
			</Text>
			<div className="flex items-center gap-1">
				<Button
					size="xs"
					variant="outline"
					onClick={() => setGlmOpen(true)}
				>
					{t("glm.startConfig")}
				</Button>
				{!props.hideCloseButton && (
					<Button
						size="xs"
						variant="subtle"
						onClick={handleDismiss}
					>
						{t("glm.close")}
					</Button>
				)}
			</div>
			<GLMDialog
				opened={glmOpen}
				onClose={() => setGlmOpen(false)}
				onSuccess={handleDismiss}
			/>
		</Paper>
	);
}
