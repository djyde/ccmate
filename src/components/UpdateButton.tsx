import React from "react";
import { useCheckForUpdates, useInstallAndRestart } from "../lib/query";
import { Button } from "./ui/button";
import { RotateCwIcon, DownloadIcon, CheckIcon } from "lucide-react";
import { cn } from "../lib/utils";

export function UpdateButton() {
  const { data: updateInfo, isLoading, error } = useCheckForUpdates();
  const installAndRestart = useInstallAndRestart();

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="w-full justify-start"
        >
          <RotateCwIcon className="mr-2 h-4 w-4 animate-spin" />
          检查更新中...
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="w-full justify-start text-muted-foreground"
        >
          检查更新失败
        </Button>
      </div>
    );
  }

  if (!updateInfo?.available) {
    return (
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="w-full justify-start text-muted-foreground"
        >
          <CheckIcon className="mr-2 h-4 w-4" />
          已是最新版本
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground px-3">
          新版本可用: {updateInfo.version}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => installAndRestart.mutate()}
          disabled={installAndRestart.isPending}
          className={cn(
            "w-full justify-start",
            installAndRestart.isPending && "opacity-50"
          )}
        >
          {installAndRestart.isPending ? (
            <>
              <RotateCwIcon className="mr-2 h-4 w-4 animate-spin" />
              安装中...
            </>
          ) : (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" />
              重启更新
            </>
          )}
        </Button>
      </div>
    </div>
  );
}