import { useTranslation } from "react-i18next";
import { useStores, useSetCurrentConfig, useCreateConfig } from "../lib/query";
import { cn } from "@/lib/utils";
import { EllipsisVerticalIcon, PencilLineIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GLMDialog } from "@/components/GLMBanner";
import { ZAI } from "@lobehub/icons";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const navigate = useNavigate();
  const handleStoreClick = (storeId: string, isCurrentStore: boolean) => {
    if (!isCurrentStore) {
      setCurrentStoreMutation.mutate(storeId);
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

  if (stores.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen" data-tauri-drag-region>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" onClick={onCreateStore} className="">
            <PlusIcon size={14} />
            {t("configSwitcher.createConfig")}
          </Button>

          <p className="text-sm text-muted-foreground" data-tauri-drag-region>
            {t("configSwitcher.description")}
          </p>

          <div className="mt-4">
            <GLMDialog
              trigger={
                <Button variant="ghost" className="text-muted-foreground text-sm" size="sm">
                  <ZAI />
                  使用智谱 GLM4.6
                </Button>
              }
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>{t("configSwitcher.title")}</h3>
          <p className="text-sm text-muted-foreground" data-tauri-drag-region>
            {t("configSwitcher.description")}
          </p>
        </div>
        <ButtonGroup>
          <Button variant="outline" onClick={onCreateStore} className="text-muted-foreground" size="sm">
            <PlusIcon size={14} />
            {t("configSwitcher.createConfig")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-muted-foreground" size="sm">
                <EllipsisVerticalIcon size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <GLMDialog
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ZAI />
                    使用智谱 GLM4.6
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>

      </div>

      {/* <GLMBanner className="mx-4 mt-4" /> */}

      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {stores.map((store) => {
          const isCurrentStore = store.using
          return (
            <div
              role="button"
              key={store.id}
              onClick={() => handleStoreClick(store.id, isCurrentStore)}
              className={cn("border rounded-xl p-3 h-[100px] flex flex-col justify-between transition-colors disabled:opacity-50", {
                "bg-primary/10 border-primary border-2": isCurrentStore,
              })}
            >
              <div>
                <div>{store.title}</div>
                {store.settings.env?.ANTHROPIC_BASE_URL && (
                  <div className="text-xs text-muted-foreground mt-1 truncate " title={store.settings.env.ANTHROPIC_BASE_URL}>
                    {store.settings.env.ANTHROPIC_BASE_URL}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button className="hover:bg-primary/10 rounded-lg p-2 hover:text-primary" onClick={e => {
                  e.stopPropagation()
                  navigate(`/edit/${store.id}`)
                }}>
                  <PencilLineIcon
                    className="text-muted-foreground"
                    size={14}
                  />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}