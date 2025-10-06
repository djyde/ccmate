import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsPage() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4" data-tauri-drag-region>{t("settings.title")}</h1>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.language")}</label>
          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("settings.language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}