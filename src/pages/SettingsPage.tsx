import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVersion } from "@tauri-apps/api/app";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, DownloadIcon, RotateCwIcon } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useCheckForUpdates, useInstallAndRestart } from "@/lib/query";
import { FaXTwitter } from "react-icons/fa6";

export function SettingsPage() {
  const { t, i18n } = useTranslation();

  const { data: updateInfo, isLoading: checkingUpdate } = useCheckForUpdates();
  const { mutate: installUpdate, isPending: installingUpdate } = useInstallAndRestart();
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  const handleInstallUpdate = () => {
    installUpdate();
  };

  return (
    <div className="" >
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>{t("settings.title")}</h3>
        </div>
      </div>
      <div className="space-y-6 px-4 ">
        <div>
          <label className="block text-sm font-medium mb-2 mx-2">{t("settings.language")}</label>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("settings.language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 mx-2">{t("settings.version")}</label>
          <div className="flex items-center gap-2 mx-2">
            <p className="text-sm text-muted-foreground">v{version}</p>
            {checkingUpdate ? (
              <Button variant="outline" size="sm" disabled>
                <RotateCwIcon className="w-4 h-4 animate-spin" />
                {t("settings.checkingUpdate")}
              </Button>
            ) : updateInfo?.available ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 font-medium">
                  {t("settings.newVersionAvailable", { version: updateInfo.version })}
                </span>
                <Button
                  onClick={handleInstallUpdate}
                  disabled={installingUpdate}
                  variant="default"
                  size="sm"
                >
                  {installingUpdate ? (
                    <>
                      <RotateCwIcon className="w-4 h-4 animate-spin mr-1" />
                      {t("settings.installing")}
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="w-4 h-4 mr-1" />
                      {t("settings.installAndRestart")}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t("settings.upToDate")}</span>
            )}
          </div>
          {updateInfo?.body && (
            <p className="text-xs text-muted-foreground mx-2 mt-1">
              {updateInfo.body}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 mx-2">{t("settings.contact")}</label>
          <div className="flex items-center gap-2">
            <Button onClick={_ => {
              openUrl("https://github.com/djyde/ccmate-release/issues")
            }} variant="outline" size="sm" className="text-sm">
              <ExternalLinkIcon />
              {t("settings.reportIssue")}
            </Button>

            <Button onClick={_ => {
              openUrl("https://x.com/randyloop")
            }} variant="ghost" size="sm" className="text-sm">
              <FaXTwitter />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}