import { openUrl } from "@tauri-apps/plugin-opener";
import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateConfig, useSetCurrentConfig } from "@/lib/query";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";

export function MiniMaxDialog(props: {
	trigger: React.ReactNode;
	onSuccess?: () => void;
}) {
	const { t } = useTranslation();
	const [apiKey, setApiKey] = useState("");
	const [selectedRegion, setSelectedRegion] = useState("china-mainland");
	const [isOpen, setIsOpen] = useState(false);
	const createConfigMutation = useCreateConfig();
	const setCurrentConfigMutation = useSetCurrentConfig();

	const handleCreateConfig = async () => {
		if (!apiKey.trim()) {
			return;
		}

		try {
			const baseUrl =
				selectedRegion === "international"
					? "https://api.minimax.io/anthropic"
					: "https://api.minimaxi.com/anthropic";

			const store = await createConfigMutation.mutateAsync({
				title:
					selectedRegion === "international"
						? t("minimax.internationalTitle")
						: t("minimax.mainlandTitle"),
				settings: {
					env: {
						ANTHROPIC_AUTH_TOKEN: apiKey.trim(),
						ANTHROPIC_BASE_URL: baseUrl,
						API_TIMEOUT_MS: "3000000",
						CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
						ANTHROPIC_MODEL: "MiniMax-M2.1",
						ANTHROPIC_SMALL_FAST_MODEL: "MiniMax-M2.1",
						ANTHROPIC_DEFAULT_SONNET_MODEL: "MiniMax-M2.1",
						ANTHROPIC_DEFAULT_OPUS_MODEL: "MiniMax-M2.1",
						ANTHROPIC_DEFAULT_HAIKU_MODEL: "MiniMax-M2.1",
					},
				},
			});

			// Set the newly created config as the current/active config
			await setCurrentConfigMutation.mutateAsync(store.id);

			setIsOpen(false);
			setApiKey("");
			setSelectedRegion("china-mainland");

			// Call onSuccess callback to dismiss the banner
			props.onSuccess?.();
		} catch (error) {
			console.error("Failed to create MiniMax config:", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{props.trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{selectedRegion === "international"
							? t("minimax.configInternational")
							: t("minimax.configMainland")}
					</DialogTitle>
					<DialogDescription>
						<div className="flex items-center gap-2">
							<p>
								{t("minimax.description", {
									provider:
										selectedRegion === "international"
											? "MiniMax"
											: t("minimax.minimax"),
								})}
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4">
					<div className="space-y-3">
						<div>
							<div className="my-4 flex  items-center gap-3">
								<NativeSelect
									value={selectedRegion}
									onChange={(e) => setSelectedRegion(e.target.value)}
									className="w-full"
								>
									<NativeSelectOption value="china-mainland">
										{t("minimax.chinaMainland")}
									</NativeSelectOption>
									<NativeSelectOption value="international">
										{t("minimax.international")}
									</NativeSelectOption>
								</NativeSelect>
							</div>
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("minimax.step1")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg m-2">
								<Button
									onClick={(_) => {
										const url =
											selectedRegion === "international"
												? "https://platform.minimax.io/user-center/basic-information/interface-key"
												: "https://platform.minimaxi.com/user-center/basic-information/interface-key";
										openUrl(url);
									}}
									size="sm"
									variant="outline"
									className="text-sm"
								>
									<ExternalLinkIcon />
									{t("minimax.enterConsole")}
								</Button>
							</div>
						</div>

						<div>
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("minimax.step2")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg m-2">
								<Input
									value={apiKey}
									onChange={(e) => setApiKey(e.target.value)}
									placeholder={t("minimax.apiKeyPlaceholder")}
								/>
							</div>
						</div>

						<div className="flex justify-end mx-2 mt-2">
							<Button
								onClick={handleCreateConfig}
								disabled={!apiKey.trim() || createConfigMutation.isPending}
							>
								{createConfigMutation.isPending
									? t("minimax.creating")
									: t("minimax.createConfig")}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
