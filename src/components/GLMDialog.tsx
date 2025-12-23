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

export function GLMDialog(props: {
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
				selectedRegion === "z-ai"
					? "https://api.z.ai/api/anthropic"
					: "https://open.bigmodel.cn/api/anthropic";

			const store = await createConfigMutation.mutateAsync({
				title:
					selectedRegion === "z-ai" ? t("glm.zaiTitle") : t("glm.zhipuTitle"),
				settings: {
					env: {
						ANTHROPIC_AUTH_TOKEN: apiKey.trim(),
						ANTHROPIC_BASE_URL: baseUrl,
						ANTHROPIC_MODEL: "GLM-4.7",
						ANTHROPIC_DEFAULT_OPUS_MODEL: "GLM-4.7",
						ANTHROPIC_DEFAULT_SONNET_MODEL: "GLM-4.7",
						ANTHROPIC_DEFAULT_HAIKU_MODEL: "GLM-4.5-Air",
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
			console.error("Failed to create GLM config:", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{props.trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{selectedRegion === "z-ai"
							? t("glm.configZai")
							: t("glm.configZhipu")}
					</DialogTitle>
					<DialogDescription>
						{t("glm.description", {
							provider: selectedRegion === "z-ai" ? "Z.ai" : t("glm.zhipu"),
						})}
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4">
					<div className="space-y-3">
						<div>
							<div className="my-4 flex  items-center gap-3">
								<NativeSelect
									value={selectedRegion}
									onChange={(e) => setSelectedRegion(e.target.value)}
									className="w-full mt-1"
								>
									<NativeSelectOption value="china-mainland">
										{t("glm.chinaMainland")}
									</NativeSelectOption>
									<NativeSelectOption value="z-ai">
										{t("glm.international")}
									</NativeSelectOption>
								</NativeSelect>
							</div>
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("glm.step1")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg m-2">
								<Button
									onClick={(_) => {
										const url =
											selectedRegion === "z-ai"
												? "https://z.ai/subscribe?ic=EBGYZCJRYJ"
												: "https://www.bigmodel.cn/claude-code?ic=UP1VEQEATH";
										openUrl(url);
									}}
									size="sm"
									variant="outline"
									className="text-sm"
								>
									<ExternalLinkIcon />
									{t("glm.buyFromOfficial")}
								</Button>
								<p className="text-muted-foreground text-sm flex items-center gap-1">
									{t("glm.discount")}
								</p>
							</div>
						</div>

						<div>
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("glm.step2")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg m-2">
								<Button
									onClick={(_) => {
										const url =
											selectedRegion === "z-ai"
												? "https://z.ai/manage-apikey/apikey-list"
												: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys";
										openUrl(url);
									}}
									size="sm"
									variant="outline"
									className="text-sm"
								>
									<ExternalLinkIcon />
									{t("glm.enterConsole")}
								</Button>
							</div>
						</div>

						<div>
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("glm.step3")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg m-2">
								<Input
									value={apiKey}
									onChange={(e) => setApiKey(e.target.value)}
									placeholder={
										selectedRegion === "z-ai"
											? t("glm.zaiApiKeyPlaceholder")
											: t("glm.zhipuApiKeyPlaceholder")
									}
								/>
							</div>
						</div>

						<div className="flex justify-end mx-2 mt-2">
							<Button
								onClick={handleCreateConfig}
								disabled={!apiKey.trim() || createConfigMutation.isPending}
							>
								{createConfigMutation.isPending
									? t("glm.creating")
									: t("glm.createConfig")}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
