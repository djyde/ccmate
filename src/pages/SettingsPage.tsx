import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { DownloadIcon, ExternalLinkIcon, RotateCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaXTwitter } from "react-icons/fa6";
import { PageHeader } from "@/components/PageHeader";
import {
  ActionIcon,
  Button,
  Group,
  NativeSelect,
  Text,
} from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { useCheckForUpdates, useInstallAndRestart } from "@/lib/query";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="min-w-0 mr-4">
        <Text size="sm">{label}</Text>
        {description && (
          <Text size="xs" c="dimmed" mt={2}>
            {description}
          </Text>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const { data: updateInfo, isLoading: checkingUpdate } = useCheckForUpdates();
  const { mutate: installUpdate, isPending: installingUpdate } =
    useInstallAndRestart();
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
    <div>
      <PageHeader title={t("settings.title")} />
      <div className="px-5">
        <SettingRow label={t("settings.language")}>
          <NativeSelect
            size="xs"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.currentTarget.value)}
            data={[
              { label: "English", value: "en" },
              { label: "中文", value: "zh-CN" },
              { label: "繁體中文", value: "zh-TW" },
              { label: "Français", value: "fr" },
              { label: "日本語", value: "ja" },
            ]}
            w={140}
          />
        </SettingRow>

        <SettingRow label={t("settings.theme")}>
          <NativeSelect
            size="xs"
            value={colorScheme}
            onChange={(e) => setColorScheme(e.currentTarget.value as "light" | "dark" | "auto")}
            data={[
              { label: t("settings.theme.system"), value: "auto" },
              { label: t("settings.theme.light"), value: "light" },
              { label: t("settings.theme.dark"), value: "dark" },
            ]}
            w={140}
          />
        </SettingRow>

        <SettingRow label={t("settings.version")}>
          <Group gap="sm">
            <Text size="xs" c="dimmed">
              v{version}
            </Text>
            {checkingUpdate ? (
              <Group gap={6}>
                <RotateCwIcon className="w-3 h-3 animate-spin text-[var(--mantine-color-dimmed)]" />
                <Text size="xs" c="dimmed">
                  {t("settings.checkingUpdate")}
                </Text>
              </Group>
            ) : updateInfo?.available ? (
              <Group gap="xs">
                <Text size="xs" c="green">
                  {t("settings.newVersionAvailable", {
                    version: updateInfo.version,
                  })}
                </Text>
                <Button
                  onClick={handleInstallUpdate}
                  disabled={installingUpdate}
                  size="compact-xs"
                  variant="light"
                  leftSection={
                    installingUpdate ? (
                      <RotateCwIcon className="w-3 h-3 animate-spin" />
                    ) : (
                      <DownloadIcon className="w-3 h-3" />
                    )
                  }
                >
                  {installingUpdate
                    ? t("settings.installing")
                    : t("settings.installAndRestart")}
                </Button>
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                {t("settings.upToDate")}
              </Text>
            )}
          </Group>
        </SettingRow>

        {updateInfo?.body && (
          <Text size="xs" c="dimmed" py="xs">
            {updateInfo.body}
          </Text>
        )}

        <SettingRow label={t("settings.contact")}>
          <Group gap="xs">
            <Button
              component="a"
              onClick={(e) => {
                e.preventDefault();
                openUrl(
                  "https://github.com/djyde/ccmate/issues",
                );
              }}
              variant="default"
              size="compact-xs"
              leftSection={<ExternalLinkIcon className="w-3 h-3" />}
            >
              {t("settings.reportIssue")}
            </Button>
            <ActionIcon
              variant="subtle"
              size="sm"
              color="gray"
              onClick={() => openUrl("https://x.com/randyloop")}
              aria-label="X (Twitter)"
            >
              <FaXTwitter size={13} />
            </ActionIcon>
          </Group>
        </SettingRow>
      </div>
    </div>
  );
}
