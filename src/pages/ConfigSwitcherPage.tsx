import { Kimi, Minimax, ZAI } from "@lobehub/icons";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { EllipsisVerticalIcon, PencilLineIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { GLMDialog } from "@/components/GLMBanner";
import { KimiDialog } from "@/components/KimiDialog";
import { MiniMaxDialog } from "@/components/MiniMaxDialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
	useCreateConfig,
	useDeleteConfig,
	useResetToOriginalConfig,
	useSetCurrentConfig,
	useStores,
	useGenerateEnvVars,
	type ConfigStore,
} from "../lib/query";
import { toast } from "sonner";

interface ConfigCardProps {
	store: ConfigStore;
	isCurrentStore: boolean;
	onStoreClick: (storeId: string, isCurrentStore: boolean) => void;
	onEditClick: (storeId: string) => void;
	onDeleteClick: (storeId: string, storeTitle: string) => void;
	onCopyEnvVarsClick: (storeId: string) => void;
}

function ConfigCard({ store, isCurrentStore, onStoreClick, onEditClick, onDeleteClick, onCopyEnvVarsClick }: ConfigCardProps) {
	const { t } = useTranslation();
	const [contextMenuOpen, setContextMenuOpen] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
	const menuIdRef = React.useRef(`menu-${store.id}`);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Close all context menus first
		const closeEvent = new CustomEvent('closeAllContextMenus', {
			detail: { source: menuIdRef.current }
		});
		window.dispatchEvent(closeEvent);

		// Use setTimeout to ensure the close event is processed before opening new menu
		setTimeout(() => {
			setContextMenuPosition({ x: e.clientX, y: e.clientY });
			setContextMenuOpen(true);
		}, 0);
	};

	const closeMenu = () => {
		setContextMenuOpen(false);
	};

	// Listen for global close event
	useEffect(() => {
		const handleCloseEvent = (event: any) => {
			// Don't close if the event is from this same menu (to allow reopening on the same spot)
			if (event.detail?.source !== menuIdRef.current) {
				setContextMenuOpen(false);
			}
		};

		const handleClick = () => {
			setContextMenuOpen(false);
		};

		window.addEventListener('closeAllContextMenus', handleCloseEvent);
		window.addEventListener('click', handleClick);

		return () => {
			window.removeEventListener('closeAllContextMenus', handleCloseEvent);
			window.removeEventListener('click', handleClick);
		};
	}, []);

	return (
		<>
			<div
				role="button"
				onClick={() => onStoreClick(store.id, isCurrentStore)}
				onContextMenu={handleContextMenu}
				className={cn(
					"border rounded-xl p-3 h-[100px] flex flex-col justify-between transition-colors disabled:opacity-50 cursor-pointer relative",
					{
						"bg-primary/10 border-primary border-2": isCurrentStore,
					},
				)}
			>
				<div>
					<div>{store.title}</div>
					{store.settings.env?.ANTHROPIC_BASE_URL && (
						<div
							className="text-xs text-muted-foreground mt-1 truncate"
							title={store.settings.env.ANTHROPIC_BASE_URL}
						>
							{store.settings.env.ANTHROPIC_BASE_URL}
						</div>
					)}
				</div>

				<div className="flex justify-end">
					<button
						className="hover:bg-primary/10 rounded-lg p-2 hover:text-primary"
						onClick={(e) => {
							e.stopPropagation();
							onEditClick(store.id);
						}}
					>
						<PencilLineIcon className="text-muted-foreground" size={14} />
					</button>
				</div>
			</div>

			{contextMenuOpen && (
				<div
					className="fixed z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
					style={{
						left: contextMenuPosition.x,
						top: contextMenuPosition.y,
					}}
					onClick={(e) => e.stopPropagation()} // Prevent clicks inside menu from bubbling up
				>
					<button
						className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
							isCurrentStore ? 'opacity-50 cursor-not-allowed' : ''
						}`}
						onClick={() => {
							if (!isCurrentStore) {
								onStoreClick(store.id, isCurrentStore);
							}
							closeMenu();
						}}
						disabled={isCurrentStore}
					>
						{t("contextMenu.apply")}
					</button>
					<button
						className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
						onClick={() => {
							onEditClick(store.id);
							closeMenu();
						}}
					>
						{t("contextMenu.edit")}
					</button>
					<button
						className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
						onClick={() => {
							onCopyEnvVarsClick(store.id);
							closeMenu();
						}}
					>
						{t("contextMenu.copyEnvVars")}
					</button>
					<button
						className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-destructive focus:text-destructive"
						onClick={() => {
							onDeleteClick(store.id, store.title);
							closeMenu();
						}}
					>
						{t("contextMenu.delete")}
					</button>
				</div>
			)}
		</>
	);
}

export function ConfigSwitcherPage() {
	return (
		<div className="">
			<section>
				<ConfigStores />
			</section>
		</div>
	);
}

function ConfigStores() {
	const { t } = useTranslation();
	const { data: stores } = useStores();
	const setCurrentStoreMutation = useSetCurrentConfig();
	const resetToOriginalMutation = useResetToOriginalConfig();
	const deleteStoreMutation = useDeleteConfig();
	const generateEnvVarsMutation = useGenerateEnvVars();
	const navigate = useNavigate();

	const isOriginalConfigActive = !stores.some((store) => store.using);

	const handleStoreClick = (storeId: string, isCurrentStore: boolean) => {
		if (!isCurrentStore) {
			setCurrentStoreMutation.mutate(storeId);
		}
	};

	const handleOriginalConfigClick = () => {
		if (!isOriginalConfigActive) {
			resetToOriginalMutation.mutate();
		}
	};

	const createStoreMutation = useCreateConfig();

	const onCreateStore = async () => {
		const store = await createStoreMutation.mutateAsync({
			title: t("configSwitcher.newConfig"),
			settings: {},
		});
		navigate(`/edit/${store.id}`);
	};

	const handleDeleteConfig = async (storeId: string, storeTitle: string) => {
		const confirmed = await ask(
			t("configEditor.deleteConfirm", { name: storeTitle }),
			{ title: t("configEditor.deleteTitle"), kind: "warning" },
		);

		if (confirmed) {
			await deleteStoreMutation.mutateAsync({
				storeId,
			});
		}
	};

	const handleCopyEnvVars = async (storeId: string) => {
		try {
			const envVarsString = await generateEnvVarsMutation.mutateAsync(storeId);

			if (!envVarsString) {
				toast.error(t("configSwitcher.noEnvVars"));
				return;
			}

			// Use Tauri backend command to copy to clipboard
			await invoke("copy_to_clipboard", { text: envVarsString });

			toast.success(t("configSwitcher.envVarsCopied"));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			toast.error(t("configSwitcher.copyEnvVarsFailed", { error: errorMessage }));
		}
	};

	if (stores.length === 0) {
		return (
			<div
				className="flex justify-center items-center h-screen"
				data-tauri-drag-region
			>
				<div className="flex flex-col items-center gap-2">
					<Button variant="ghost" onClick={onCreateStore} className="">
						<PlusIcon size={14} />
						{t("configSwitcher.createConfig")}
					</Button>

					<p className="text-sm text-muted-foreground" data-tauri-drag-region>
						{t("configSwitcher.description")}
					</p>

					<div className="mt-4 space-y-2">
						<GLMDialog
							trigger={
								<Button
									variant="ghost"
									className="text-muted-foreground text-sm"
									size="sm"
								>
									<ZAI />
									{t("glm.useZhipuGlm")}
								</Button>
							}
						/>
						<MiniMaxDialog
							trigger={
								<Button
									variant="ghost"
									className="text-muted-foreground text-sm"
									size="sm"
								>
									<Minimax />
									{t("minimax.useMiniMax")}
								</Button>
							}
						/>
						<KimiDialog
							trigger={
								<Button
									variant="ghost"
									className="text-muted-foreground text-sm"
									size="sm"
								>
									<Kimi />
									{t("kimi.useKimi")}
								</Button>
							}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="">
			<div
				className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10"
				data-tauri-drag-region
			>
				<div data-tauri-drag-region>
					<h3 className="font-bold" data-tauri-drag-region>
						{t("configSwitcher.title")}
					</h3>
					<p className="text-sm text-muted-foreground" data-tauri-drag-region>
						{t("configSwitcher.description")}
					</p>
				</div>
				<ButtonGroup>
					<Button
						variant="outline"
						onClick={onCreateStore}
						className="text-muted-foreground"
						size="sm"
					>
						<PlusIcon size={14} />
						{t("configSwitcher.createConfig")}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="text-muted-foreground"
								size="sm"
							>
								<EllipsisVerticalIcon size={14} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<GLMDialog
								trigger={
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<ZAI />
										{t("glm.useZhipuGlm")}
									</DropdownMenuItem>
								}
							/>
							<MiniMaxDialog
								trigger={
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<Minimax />
										{t("minimax.useMiniMax")}
									</DropdownMenuItem>
								}
							/>
							<KimiDialog
								trigger={
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<Kimi />
										{t("kimi.useKimi")}
									</DropdownMenuItem>
								}
							/>
						</DropdownMenuContent>
					</DropdownMenu>
				</ButtonGroup>
			</div>

			{/* <GLMBanner className="mx-4 mt-4" /> */}

			<div className="grid grid-cols-3 lg:grid-cols-4 gap-3 p-4">
				{/* Fixed Claude Original Config Item */}
				<div
					role="button"
					onClick={handleOriginalConfigClick}
					className={cn(
						"border rounded-xl p-3 h-[100px] flex flex-col justify-between transition-colors",
						{
							"bg-primary/10 border-primary border-2": isOriginalConfigActive,
						},
					)}
				>
					<div>
						<div>{t("configSwitcher.originalConfig")}</div>
						<div className="text-xs text-muted-foreground mt-1">
							{t("configSwitcher.originalConfigDescription")}
						</div>
					</div>
				</div>

				{stores.map((store) => {
					const isCurrentStore = store.using;
					return (
						<ConfigCard
							key={store.id}
							store={store}
							isCurrentStore={isCurrentStore}
							onStoreClick={handleStoreClick}
							onEditClick={(storeId) => navigate(`/edit/${storeId}`)}
							onDeleteClick={handleDeleteConfig}
							onCopyEnvVarsClick={handleCopyEnvVars}
						/>
					);
				})}
			</div>
		</div>
	);
}
