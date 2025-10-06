import { Button } from "@/components/ui/button";
import { useStores, useSetCurrentStore, useCreateStore } from "../lib/query";
import { cn } from "@/lib/utils";
import { PencilLineIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const { data: stores } = useStores();
  const setCurrentStoreMutation = useSetCurrentStore();
  const navigate = useNavigate();
  const handleStoreClick = (storeName: string, isCurrentStore: boolean) => {
    if (!isCurrentStore) {
      setCurrentStoreMutation.mutate(storeName);
    }
  };

  const createStoreMutation = useCreateStore();

  const onCreateStore = async () => {
    const store = await createStoreMutation.mutateAsync({
      name: "新配置",
      settings: {},
    });
    navigate(`/edit/${store.id}`);
  };

  if (stores.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <button onClick={onCreateStore} className="flex items-center gap-2 rounded-lg border h-[32px] text-center px-3 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/10 transition-colors duration-100">
          <PlusIcon size={14} />
          新建配置
        </button>
      </div>
    )
  }

  return (
    <div className="px-4">
      <div className="flex my-4 mt-3" data-tauri-drag-region>
        <button onClick={onCreateStore} className="flex items-center gap-2 rounded-lg h-[32px] text-center px-3 text-sm hover:bg-primary/10 hover:text-primary transition-colors duration-100">
          <PlusIcon size={14} />
          新建配置
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {stores.map((store) => {
          const isCurrentStore = store.using
          return (
            <div
              role="button"
              key={store.name}
              onClick={() => handleStoreClick(store.name, isCurrentStore)}
              className={cn("border rounded-xl p-3 h-[100px] flex flex-col justify-between transition-colors disabled:opacity-50", {
                "bg-primary/10 border-primary border-2": isCurrentStore,
              })}
            >
              <div>
                {store.name}
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