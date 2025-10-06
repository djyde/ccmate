import { useCheckForUpdates, useInstallAndRestart } from "../lib/query";
import { RotateCwIcon, RefreshCcwIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useTranslation } from "react-i18next";

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
      <div className="space-y-2">
        <button
          onClick={() => installAndRestart.mutate()}
          disabled={installAndRestart.isPending}
          className={cn("flex items-center justify-center text-sm gap-2  bg-zinc-100 hover:bg-zinc-200 rounded-md px-2 py-2 w-full",
            {
              "opacity-50": installAndRestart.isPending,
            }
          )}
        >
          {installAndRestart.isPending ? (
            <>
              <RotateCwIcon className="mr-2 h-4 w-4 animate-spin" />
              {t("updateButton.installing")}
            </>
          ) : (
            <>
              <RefreshCcwIcon className="h-4 w-4" />
              {t("updateButton.newVersionAvailable")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}