import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SegmentedControl, Text, UnstyledButton } from "@mantine/core";
import { AreaChart } from "@mantine/charts";
import type { ProjectUsageRecord } from "@/lib/query";
import { formatLargeNumber } from "@/lib/utils";

interface TokenUsageChartProps {
	data: ProjectUsageRecord[];
	onFilteredDataChange?: (filteredData: ProjectUsageRecord[]) => void;
}

type TimeRange = "5h" | "today" | "7d" | "week" | "month" | "all";

export function TokenUsageChart({
	data,
	onFilteredDataChange,
}: TokenUsageChartProps) {
	const { t } = useTranslation();
	const [selectedModel, setSelectedModel] = useState<string | null>("all");
	const [timeRange, setTimeRange] = useState<string>("5h");
	const [activeCategories, setActiveCategories] = useState<string[]>([
		"Input Tokens",
		"Output Tokens",
	]);

	// Get unique models from data
	const availableModels = useMemo(() => {
		const models = new Set<string>();
		data.forEach((record) => {
			if (record.model) {
				models.add(record.model);
			}
		});
		return Array.from(models).sort();
	}, [data]);

	// Filter data based on selected model and time range
	const filteredData = useMemo(() => {
		let filtered = data;

		// Filter by model
		if (selectedModel && selectedModel !== "all") {
			filtered = filtered.filter((record) => record.model === selectedModel);
		}

		// Filter by time range
		const now = dayjs();
		let startTime: dayjs.Dayjs;

		switch (timeRange as TimeRange) {
			case "5h":
				startTime = now.subtract(5, 'hour');
				break;
			case "today":
				startTime = now.startOf('day');
				break;
			case "7d":
				startTime = now.subtract(6, 'day');
				break;
			case "week":
				startTime = now.day(0); // Sunday (start of week)
				break;
			case "month":
				startTime = now.startOf('month');
				break;
			case "all":
				// For "all time", find the earliest timestamp in the data
				if (filtered.length > 0) {
					const earliestTime = dayjs(
						Math.min(
							...filtered.map((record) => dayjs(record.timestamp).valueOf()),
						),
					);
					startTime = earliestTime;
				} else {
					startTime = dayjs(0);
				}
				break;
			default:
				startTime = now.subtract(5, 'hour');
		}

		filtered = filtered.filter(
			(record) => dayjs(record.timestamp).isAfter(startTime.subtract(1, 'millisecond')),
		);

		return filtered;
	}, [data, selectedModel, timeRange]);

	// Notify parent component when filtered data changes
	useEffect(() => {
		if (onFilteredDataChange) {
			onFilteredDataChange(filteredData);
		}
	}, [filteredData, onFilteredDataChange]);

	// Toggle category function
	const toggleCategory = (category: string) => {
		setActiveCategories((prev) => {
			if (prev.includes(category)) {
				return prev.filter((cat) => cat !== category);
			}
			return [...prev, category];
		});
	};

	// Group data based on time range
	const groupDataByInterval = (records: ProjectUsageRecord[]) => {
		const intervals: {
			[key: string]: { input: number; output: number; cache: number };
		} = {};
		const now = dayjs();

		if (timeRange === "all") {
			// For all time, group by week
			const earliestTime =
				records.length > 0
					? dayjs(
							Math.min(
								...records.map((record) =>
									dayjs(record.timestamp).valueOf(),
								),
							),
						)
					: dayjs();

			// Get start of the week for earliest time
			let currentWeekStart = earliestTime.day(0); // Sunday
			const nowWeekStart = now.day(0); // Sunday

			// Generate weekly intervals from earliest week to current week
			while (currentWeekStart.isBefore(nowWeekStart) || currentWeekStart.isSame(nowWeekStart)) {
				intervals[currentWeekStart.valueOf()] = {
					input: 0,
					output: 0,
					cache: 0,
				};
				// Move to next week (7 days)
				currentWeekStart = currentWeekStart.add(1, 'week');
			}

			// Group records into weekly intervals
			records.forEach((record) => {
				const recordTime = dayjs(record.timestamp);
				const weekStart = recordTime.day(0); // Sunday
				const weekKey = weekStart.valueOf();

				if (intervals[weekKey]) {
					intervals[weekKey].input += record.usage?.input_tokens || 0;
					intervals[weekKey].output += record.usage?.output_tokens || 0;
					intervals[weekKey].cache +=
						record.usage?.cache_read_input_tokens || 0;
				}
			});
		} else if (timeRange === "5h") {
			// Group by 30-minute intervals for 5h time range
			const intervalMs = 30 * 60 * 1000; // 30 minutes in milliseconds

			// Round current time down to nearest 30-minute boundary (epoch-based)
			const currentIntervalKey =
				Math.floor(now.valueOf() / intervalMs) * intervalMs;

			// Generate intervals (10 intervals for 5 hours)
			for (let i = 0; i < 10; i++) {
				const intervalKey = currentIntervalKey - i * intervalMs;
				intervals[intervalKey] = { input: 0, output: 0, cache: 0 };
			}

			// Group records into 30-minute intervals
			records.forEach((record) => {
				const recordTime = dayjs(record.timestamp);
				const recordIntervalKey =
					Math.floor(recordTime.valueOf() / intervalMs) * intervalMs;

				if (intervals[recordIntervalKey]) {
					intervals[recordIntervalKey].input += record.usage?.input_tokens || 0;
					intervals[recordIntervalKey].output +=
						record.usage?.output_tokens || 0;
					intervals[recordIntervalKey].cache +=
						record.usage?.cache_read_input_tokens || 0;
				}
			});
		} else if (timeRange === "today") {
			// Group by hour for today
			const startOfToday = now.startOf('day');
			const currentHour = now.hour();

			for (let i = 0; i <= currentHour; i++) {
				const hourTime = startOfToday.add(i, 'hour');
				intervals[hourTime.valueOf()] = { input: 0, output: 0, cache: 0 };
			}

			records.forEach((record) => {
				const recordTime = dayjs(record.timestamp);
				const hourStart = recordTime.startOf('hour');
				const hourKey = hourStart.valueOf();

				if (intervals[hourKey]) {
					intervals[hourKey].input += record.usage?.input_tokens || 0;
					intervals[hourKey].output += record.usage?.output_tokens || 0;
					intervals[hourKey].cache +=
						record.usage?.cache_read_input_tokens || 0;
				}
			});
		} else {
			// Group by day for longer periods (7d, week, month)
			let startDate: dayjs.Dayjs;
			let days: number;

			if (timeRange === "week") {
				startDate = now.day(0); // Sunday
				// Calculate actual days in the current week so far (from start of week to today)
				const todayStart = now.startOf('day');
				days = todayStart.diff(startDate, 'day') + 1;
			} else if (timeRange === "month") {
				startDate = now.startOf('month');
				// Calculate actual days in the current month so far (from start of month to today)
				const todayStart = now.startOf('day');
				days = todayStart.diff(startDate, 'day') + 1;
			} else {
				// For 7d, start from (days-1) days ago to include today
				days = 7;
				startDate = now.subtract(days - 1, 'day').startOf('day');
			}

			for (let i = 0; i < days; i++) {
				const dayTime = startDate.add(i, 'day');
				intervals[dayTime.valueOf()] = { input: 0, output: 0, cache: 0 };
			}

			records.forEach((record) => {
				const recordTime = dayjs(record.timestamp);
				const dayStart = recordTime.startOf('day');
				const dayKey = dayStart.valueOf();

				if (intervals[dayKey]) {
					intervals[dayKey].input += record.usage?.input_tokens || 0;
					intervals[dayKey].output += record.usage?.output_tokens || 0;
					intervals[dayKey].cache += record.usage?.cache_read_input_tokens || 0;
				}
			});
		}

		return intervals;
	};

	const groupedData = groupDataByInterval(filteredData);

	// Prepare chart data for Recharts
	const chartData = Object.keys(groupedData)
		.map(Number)
		.sort((a, b) => a - b)
		.map((timestamp) => {
			const date = dayjs(timestamp);
			let label: string;
			if (timeRange === "all") {
				label = date.format("MMM DD, YYYY");
			} else if (timeRange === "today") {
				label = date.format("HH:mm");
			} else if (timeRange === "5h") {
				label = date.format("HH:mm");
			} else {
				label = date.format("MMM DD");
			}

			return {
				time: label,
				timestamp,
				"Input Tokens": groupedData[timestamp].input,
				"Output Tokens": groupedData[timestamp].output,
				"Cache Read Tokens": groupedData[timestamp].cache,
			};
		});

	if (!data || data.length === 0) {
		return (
			<div className="h-96 flex items-center justify-center">
				<Text c="dimmed">{t("usageChart.noData")}</Text>
			</div>
		);
	}

	const timeRangeData = [
		{ label: t("usageChart.last5Hours"), value: "5h" },
		{ label: t("usageChart.startOfToday"), value: "today" },
		{ label: t("usageChart.last7Days"), value: "7d" },
		{ label: t("usageChart.startOfWeek"), value: "week" },
		{ label: t("usageChart.startOfMonth"), value: "month" },
		{ label: t("usageChart.allTime"), value: "all" },
	];

	const modelData = [
		{ label: t("usageChart.allModels"), value: "all" },
		...availableModels.map((model) => ({ label: model, value: model })),
	];

	return (
		<div className="space-y-4 w-full min-w-0">
			{/* Filter Controls */}
			<div className="flex gap-4 items-center flex-wrap">
				<SegmentedControl
					value={timeRange}
					onChange={(value) => setTimeRange(value)}
					data={timeRangeData}
					size="xs"
				/>

				<Select
					value={selectedModel}
					onChange={setSelectedModel}
					data={modelData}
					size="xs"
					w={200}
					allowDeselect={false}
				/>
			</div>

			{/* Custom Legend */}
			<div className="flex gap-6 items-center justify-center pb-4">
				{[
					{ key: "Input Tokens", label: t("usage.inputTokens"), color: "var(--mantine-color-blue-5)" },
					{ key: "Output Tokens", label: t("usage.outputTokens"), color: "var(--mantine-color-green-5)" },
					{ key: "Cache Read Tokens", label: t("usage.cacheReadTokens"), color: "var(--mantine-color-yellow-5)" },
				].map(({ key, label, color }) => {
					const isActive = activeCategories.includes(key);
					return (
						<UnstyledButton
							key={key}
							onClick={() => toggleCategory(key)}
							className="flex items-center gap-2 px-3 py-1 rounded-md"
							style={{
								opacity: isActive ? 1 : 0.4,
								transition: "opacity 0.15s ease",
							}}
						>
							<span
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: color }}
							/>
							<Text size="sm" c="dimmed">{label}</Text>
						</UnstyledButton>
					);
				})}
			</div>

			{/* Chart */}
			<div className="h-[320px] w-full min-w-0 overflow-hidden">
				<AreaChart
					h="100%"
					data={chartData}
					dataKey="time"
					series={activeCategories.map((cat) => ({
						name: cat,
						color: cat === "Input Tokens" ? "blue.6" : cat === "Output Tokens" ? "green.6" : "yellow.6",
					}))}
					valueFormatter={formatLargeNumber}
					withGradient
					curveType="monotone"
					withLegend={false}
				/>
			</div>
		</div>
	);
}
