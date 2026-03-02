import { BarChart } from "@mantine/charts";
import { Box, Flex, Group, Paper, Skeleton, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import dayjs from "dayjs";
import { ChevronRightIcon, CpuIcon, FileJsonIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentStore, useGlobalMcpServers, useProjectUsageFiles } from "@/lib/query";
import { formatLargeNumber } from "@/lib/utils";

export function OverviewPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t("overview.title")}
        description={t("overview.description")}
      />
      <div className="px-5 pb-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrentConfigCard />
          <McpCountCard />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <OutputTokenChart />
          <OutputTokenByModelChart />
        </div>
      </div>
    </div>
  );
}

function CurrentConfigCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentStore } = useCurrentStore();

  const configName = currentStore?.title ?? t("configSwitcher.originalConfig");

  return (
    <Paper
      withBorder
      p="lg"
      className="cursor-pointer hover:border-[var(--mantine-color-brand-6)] hover:bg-[var(--mantine-color-brand-0)] dark:hover:bg-[var(--mantine-color-dark-6)] transition-all duration-200"
      onClick={() => navigate("/configs")}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed" mb={8}>
            {t("overview.currentConfig")}
          </Text>
          <Text fw={600} size="lg">
            {configName}
          </Text>
        </div>
        <ThemeIcon variant="light" size="lg" radius="md">
          <FileJsonIcon size={18} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

function McpCountCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: mcpServers } = useGlobalMcpServers();

  const count = Object.keys(mcpServers).length;

  return (
    <Paper
      withBorder
      p="lg"
      className="cursor-pointer hover:border-[var(--mantine-color-brand-6)] hover:bg-[var(--mantine-color-brand-0)] dark:hover:bg-[var(--mantine-color-dark-6)] transition-all duration-200"
      onClick={() => navigate("/mcp")}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" c="dimmed" mb={8}>
            {t("overview.mcpServers")}
          </Text>
          <Text fw={600} size="lg">
            {count}
          </Text>
        </div>
        <ThemeIcon variant="light" size="lg" radius="md">
          <CpuIcon size={18} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

function OutputTokenChart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: usageData, isFetching } = useProjectUsageFiles();

  const chartData = useMemo(() => {
    if (!usageData || usageData.length === 0) {
      return [];
    }

    const now = dayjs();
    const thirtyDaysAgo = now.subtract(29, "day").startOf("day");

    // Filter to last 30 days
    const filtered = usageData.filter((record) =>
      dayjs(record.timestamp).isAfter(thirtyDaysAgo.subtract(1, "millisecond"))
    );

    // Group by day
    const dailyData: Record<string, number> = {};

    // Initialize all 30 days with 0
    for (let i = 0; i < 30; i++) {
      const day = thirtyDaysAgo.add(i, "day");
      dailyData[day.format("YYYY-MM-DD")] = 0;
    }

    // Sum output tokens per day
    filtered.forEach((record) => {
      const day = dayjs(record.timestamp).format("YYYY-MM-DD");
      if (dailyData[day] !== undefined) {
        dailyData[day] += record.usage?.output_tokens || 0;
      }
    });

    // Convert to chart data format
    return Object.entries(dailyData).map(([date, tokens]) => ({
      date: dayjs(date).format("MMM DD"),
      "Output": tokens,
    }));
  }, [usageData]);

  if (isFetching) {
    return (
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={500}>
            {t("overview.tokenUsage30Days")}
          </Text>
          <ChevronRightIcon size={16} className="text-gray-400" />
        </Group>
        <Skeleton height={200} />
      </Paper>
    );
  }

  if (!chartData || chartData.length === 0) {
    return null;
  }

  return (
    <Paper
      withBorder
      p="lg"
      className="cursor-pointer hover:border-[var(--mantine-color-brand-6)] hover:bg-[var(--mantine-color-brand-0)] dark:hover:bg-[var(--mantine-color-dark-6)] transition-all duration-200"
      onClick={() => navigate("/usage")}
    >
      <Group justify="space-between" mb="md">
        <Text size="sm" fw={500}>
          {t("overview.tokenUsage30Days")}
        </Text>
        <ChevronRightIcon size={16} className="text-gray-400" />
      </Group>
      <BarChart
        h={200}
        data={chartData}
        dataKey="date"
        series={[{ name: "Output", color: "brand.6" }]}
        valueFormatter={formatLargeNumber}
        withBarValueLabel={false}
        barProps={{ radius: 4 }}
        xAxisProps={{ padding: { left: 0, right: 0 } }}
        gridProps={{ horizontal: false, vertical: false }}
      />
    </Paper>
  );
}

function OutputTokenByModelChart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: usageData, isFetching } = useProjectUsageFiles();

  const chartData = useMemo(() => {
    if (!usageData || usageData.length === 0) {
      return [];
    }

    const now = dayjs();
    const thirtyDaysAgo = now.subtract(29, "day").startOf("day");

    // Filter to last 30 days
    const filtered = usageData.filter((record) =>
      dayjs(record.timestamp).isAfter(thirtyDaysAgo.subtract(1, "millisecond"))
    );

    // Group by model
    const modelData: Record<string, number> = {};

    filtered.forEach((record) => {
      const model = record.model || "Unknown";
      modelData[model] = (modelData[model] || 0) + (record.usage?.output_tokens || 0);
    });

    // Convert to chart data format and sort by tokens descending
    const sorted = Object.entries(modelData)
      .map(([model, tokens]) => ({ model, tokens }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 6);

    const maxTokens = sorted[0]?.tokens || 1;
    return sorted.map((item) => ({ ...item, percentage: (item.tokens / maxTokens) * 100 }));
  }, [usageData]);

  if (isFetching) {
    return (
      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Text size="sm" fw={500}>
            {t("overview.tokenByModel")}
          </Text>
          <ChevronRightIcon size={16} className="text-gray-400" />
        </Group>
        <Skeleton height={200} />
      </Paper>
    );
  }

  if (!chartData || chartData.length === 0) {
    return null;
  }

  return (
    <Paper
      withBorder
      p="lg"
      className="cursor-pointer hover:border-[var(--mantine-color-brand-6)] hover:bg-[var(--mantine-color-brand-0)] dark:hover:bg-[var(--mantine-color-dark-6)] transition-all duration-200"
      onClick={() => navigate("/usage")}
    >
      <Group justify="space-between" mb="md">
        <Text size="sm" fw={500}>
          {t("overview.tokenByModel")}
        </Text>
        <ChevronRightIcon size={16} className="text-gray-400" />
      </Group>
      <Stack gap={8}>
        {chartData.map((item) => (
          <Flex key={item.model} gap={12} align="center">
            <Tooltip label={item.model}>
              <Box w={112} style={{ flexShrink: 0 }}>
                <Text size="xs" truncate c="dimmed">
                  {item.model}
                </Text>
              </Box>
            </Tooltip>
            <Tooltip label={formatLargeNumber(item.tokens)}>
              <Box
                h={20}
                bg="brand.6"
                maw={200}
                w={item.percentage * 2}
                style={{ borderRadius: 4, transition: 'width 300ms' }}
              />
            </Tooltip>
          </Flex>
        ))}
      </Stack>
    </Paper>
  );
}
