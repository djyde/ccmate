import { useTranslation } from "react-i18next";
import { useStores, useSetCurrentConfig, useCreateConfig } from "../lib/query";
import { cn } from "@/lib/utils";
import { PencilLineIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
      <div className="flex justify-center items-center h-screen">
        <Button variant="ghost" onClick={onCreateStore} className="">
          <PlusIcon size={14} />
          {t("configSwitcher.createConfig")}
        </Button>
      </div>
    )
  }

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>{t("configSwitcher.title")}</h3>
          <p className="text-sm text-muted-foreground" data-tauri-drag-region>
            {t("configSwitcher.description")}
          </p>
        </div>
        <Button variant="ghost" onClick={onCreateStore} className="text-muted-foreground" size="sm">
          <PlusIcon size={14} />
          {t("configSwitcher.createConfig")}
        </Button>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 px-4">
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