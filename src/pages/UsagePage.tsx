import { RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionIcon, SimpleGrid, Skeleton, Text, Tooltip } from "@mantine/core";
import { ActivityGrid } from "@/components/ActivityGrid";
import { PageHeader } from "@/components/PageHeader";
import { TokenUsageChart } from "@/components/TokenUsageChart";
import { type ProjectUsageRecord, useProjectUsageFiles } from "@/lib/query";
import { cn, formatLargeNumber } from "@/lib/utils";

export function UsagePage() {
	const { t } = useTranslation();
	const {
		data: usageData,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = useProjectUsageFiles();
	const [filteredUsageData, setFilteredUsageData] = useState<
		ProjectUsageRecord[]
	>([]);

	// Initialize filtered data with full data
	useEffect(() => {
		if (usageData) {
			setFilteredUsageData(usageData);
		}
	}, [usageData]);

	const inputTokens = filteredUsageData.reduce(
		(sum, record) => sum + (record.usage?.input_tokens || 0),
		0,
	);
	const outputTokens = filteredUsageData.reduce(
		(sum, record) => sum + (record.usage?.output_tokens || 0),
		0,
	);
	const cacheReadTokens = filteredUsageData.reduce(
		(sum, record) => sum + (record.usage?.cache_read_input_tokens || 0),
		0,
	);

	return (
		<>
			<PageHeader
				title={t("usage.title")}
				description={t("usage.description")}
				actions={
					<Tooltip
						label={
							isRefetching || isLoading
								? t("usage.refreshing")
								: t("usage.refresh")
						}
					>
						<ActionIcon
							variant="subtle"
							color="gray"
							size="md"
							disabled={isRefetching || isLoading}
							onClick={() => refetch()}
						>
							<RefreshCwIcon
								size={16}
								className={cn({
									"animate-spin": isRefetching || isLoading,
								})}
							/>
						</ActionIcon>
					</Tooltip>
				}
			/>
			<div className="px-5 space-y-6 pb-6 min-w-0 overflow-hidden">
				{isLoading ? (
					<div className="space-y-8">
						<Skeleton height={120} radius="md" />
						<SimpleGrid cols={3}>
							{[1, 2, 3].map((i) => (
								<div key={i} className="space-y-3">
									<Skeleton height={12} width="40%" radius="sm" />
									<Skeleton height={36} width="60%" radius="sm" />
								</div>
							))}
						</SimpleGrid>
						<Skeleton height={320} radius="md" />
					</div>
				) : error ? (
					<Text c="dimmed">
						{t("usage.error", { error: error.message })}
					</Text>
				) : usageData && usageData.length > 0 ? (
					<>
						<SimpleGrid cols={3}>
							<div className="py-2">
								<div className="flex items-center gap-2 mb-1">
									<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--mantine-color-blue-5)" }} />
									<Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
										{t("usage.inputTokens")}
									</Text>
								</div>
								<p className="text-3xl font-light tracking-tight">
									{formatLargeNumber(inputTokens)}
								</p>
							</div>
							<div className="py-2 pl-6" style={{ borderLeft: "1px solid var(--mantine-color-default-border)" }}>
								<div className="flex items-center gap-2 mb-1">
									<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--mantine-color-green-5)" }} />
									<Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
										{t("usage.outputTokens")}
									</Text>
								</div>
								<p className="text-3xl font-light tracking-tight">
									{formatLargeNumber(outputTokens)}
								</p>
							</div>
							<div className="py-2 pl-6" style={{ borderLeft: "1px solid var(--mantine-color-default-border)" }}>
								<div className="flex items-center gap-2 mb-1">
									<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--mantine-color-yellow-5)" }} />
									<Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
										{t("usage.cacheReadTokens")}
									</Text>
								</div>
								<p className="text-3xl font-light tracking-tight">
									{formatLargeNumber(cacheReadTokens)}
								</p>
							</div>
						</SimpleGrid>

						<div className="min-w-0">
							<TokenUsageChart
								data={usageData}
								onFilteredDataChange={setFilteredUsageData}
							/>
						</div>

						<ActivityGrid data={usageData} />
					</>
				) : (
					<Text c="dimmed">{t("usage.noData")}</Text>
				)}
			</div>
		</>
	);
}
