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

export function KimiDialog(props: {
	trigger: React.ReactNode;
	onSuccess?: () => void;
}) {
	const { t } = useTranslation();
	const [apiKey, setApiKey] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const createConfigMutation = useCreateConfig();
	const setCurrentConfigMutation = useSetCurrentConfig();

	const handleCreateConfig = async () => {
		if (!apiKey.trim()) {
			return;
		}

		try {
			const store = await createConfigMutation.mutateAsync({
				title: "Kimi For Coding",
				settings: {
					env: {
						ANTHROPIC_AUTH_TOKEN: apiKey.trim(),
						ANTHROPIC_BASE_URL: "https://api.kimi.com/coding/",
						ANTHROPIC_MODEL: "kimi-for-coding",
						ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-for-coding",
						ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-for-coding",
						ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-for-coding",
					},
				},
			});

			await setCurrentConfigMutation.mutateAsync(store.id);

			setIsOpen(false);
			setApiKey("");

			props.onSuccess?.();
		} catch (error) {
			console.error("Failed to create Kimi config:", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{props.trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("kimi.config")}</DialogTitle>
					<DialogDescription>{t("kimi.description")}</DialogDescription>
				</DialogHeader>
				<div className="mt-4">
					<div className="space-y-3">
						<div className="space-y-2">
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("kimi.step1")}
							</h2>

							<div className="space-y-2 bg-secondary p-3 rounded-lg">
								<Button
									onClick={(_) => {
										openUrl("https://www.kimi.com/");
									}}
									size="sm"
									variant="outline"
									className="text-sm"
								>
									<ExternalLinkIcon />
									{t("kimi.goToKimi")}
								</Button>
								<p className="text-muted-foreground text-sm">
									{t("kimi.step1Description")}
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("kimi.step2")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg">
								<p className="text-muted-foreground text-sm">
									{t("kimi.step2Description")}
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<h2 className="text-card-foreground text-sm font-medium flex items-center gap-2">
								{t("kimi.step3")}
							</h2>
							<div className="space-y-2 bg-secondary p-3 rounded-lg">
								<Input
									value={apiKey}
									onChange={(e) => setApiKey(e.target.value)}
									placeholder={t("kimi.apiKeyPlaceholder")}
								/>
							</div>
						</div>

						<div className="flex justify-end mx-2 mt-2">
							<Button
								onClick={handleCreateConfig}
								disabled={!apiKey.trim() || createConfigMutation.isPending}
							>
								{createConfigMutation.isPending
									? t("kimi.creating")
									: t("kimi.createConfig")}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
