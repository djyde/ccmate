import { RefreshCcwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";
import { useCheckForUpdates, useInstallAndRestart } from "../lib/query";

export function UpdateButton() {
	const { t } = useTranslation();
	const { data: updateInfo, isLoading, error } = useCheckForUpdates();
	const installAndRestart = useInstallAndRestart();

	if (isLoading || error) {
		return null;
	}

	if (!updateInfo || !updateInfo.available) {
		return null;
	}

	return (
		<div className="px-3 py-2">
			<Button
				onClick={() => installAndRestart.mutate()}
				disabled={installAndRestart.isPending}
				loading={installAndRestart.isPending}
				variant="default"
				size="sm"
				fullWidth
				leftSection={
					installAndRestart.isPending ? undefined : (
						<RefreshCcwIcon className="h-4 w-4" />
					)
				}
			>
				{installAndRestart.isPending
					? t("updateButton.installing")
					: t("updateButton.newVersionAvailable")}
			</Button>
		</div>
	);
}
