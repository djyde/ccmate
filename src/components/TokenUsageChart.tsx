import { AreaChart } from "@/components/ui/area-chart";
import { format, startOfDay, startOfWeek, startOfMonth, subHours, subDays } from "date-fns";
import { ProjectUsageRecord } from "@/lib/query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { formatLargeNumber } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TokenUsageChartProps {
  data: ProjectUsageRecord[];
  onFilteredDataChange?: (filteredData: ProjectUsageRecord[]) => void;
}

type TimeRange = "5h" | "today" | "7d" | "week" | "month" | "all";

export function TokenUsageChart({ data, onFilteredDataChange }: TokenUsageChartProps) {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("5h");
  const [activeCategories, setActiveCategories] = useState<string[]>(["Input Tokens", "Output Tokens"]);

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
    if (selectedModel !== "all") {
      filtered = filtered.filter((record) => record.model === selectedModel);
    }

    // Filter by time range
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case "5h":
        startTime = subHours(now, 5);
        break;
      case "today":
        startTime = startOfDay(now);
        break;
      case "7d":
        startTime = subDays(now, 6);
        break;
      case "week":
        startTime = startOfWeek(now);
        break;
      case "month":
        startTime = startOfMonth(now);
        break;
      case "all":
        // For "all time", find the earliest timestamp in the data
        if (filtered.length > 0) {
          const earliestTime = new Date(
            Math.min(...filtered.map((record) => new Date(record.timestamp).getTime()))
          );
          startTime = earliestTime;
        } else {
          startTime = new Date(0);
        }
        break;
      default:
        startTime = subHours(now, 5);
    }

    filtered = filtered.filter((record) => new Date(record.timestamp) >= startTime);

    return filtered;
  }, [data, selectedModel, timeRange]);

  // Notify parent component when filtered data changes
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Handle category toggling
  const handleCategoryToggle = (value: any) => {
    if (value && value.categoryClicked) {
      setActiveCategories(prev => {
        if (prev.includes(value.categoryClicked)) {
          return prev.filter(cat => cat !== value.categoryClicked);
        } else {
          return [...prev, value.categoryClicked];
        }
      });
    }
  };

  // Toggle category function for direct use
  const toggleCategory = (category: string) => {
    handleCategoryToggle({ categoryClicked: category });
  };
  // Group data based on time range
  const groupDataByInterval = (records: ProjectUsageRecord[]) => {
    const intervals: { [key: string]: { input: number; output: number; cache: number } } = {};
    const now = new Date();

    if (timeRange === "all") {
      // For all time, group by week
      const earliestTime = records.length > 0
        ? new Date(Math.min(...records.map((record) => new Date(record.timestamp).getTime())))
        : new Date();

      // Get start of the week for earliest time
      let currentWeekStart = startOfWeek(earliestTime);
      const nowWeekStart = startOfWeek(now);

      // Generate weekly intervals from earliest week to current week
      while (currentWeekStart <= nowWeekStart) {
        intervals[currentWeekStart.getTime()] = { input: 0, output: 0, cache: 0 };
        // Move to next week (7 days)
        currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      // Group records into weekly intervals
      records.forEach((record) => {
        const recordTime = new Date(record.timestamp);
        const weekStart = startOfWeek(recordTime);
        const weekKey = weekStart.getTime();

        if (intervals[weekKey]) {
          intervals[weekKey].input += record.usage?.input_tokens || 0;
          intervals[weekKey].output += record.usage?.output_tokens || 0;
          intervals[weekKey].cache += record.usage?.cache_read_input_tokens || 0;
        }
      });
    } else if (timeRange === "5h") {
      // Group by 30-minute intervals for 5h time range
      const intervalMs = 30 * 60 * 1000; // 30 minutes in milliseconds

      // Round current time down to nearest 30-minute boundary (epoch-based)
      const currentIntervalKey = Math.floor(now.getTime() / intervalMs) * intervalMs;

      // Generate intervals (10 intervals for 5 hours)
      for (let i = 0; i < 10; i++) {
        const intervalKey = currentIntervalKey - i * intervalMs;
        intervals[intervalKey] = { input: 0, output: 0, cache: 0 };
      }

      // Group records into 30-minute intervals
      records.forEach((record) => {
        const recordTime = new Date(record.timestamp);
        const recordIntervalKey = Math.floor(recordTime.getTime() / intervalMs) * intervalMs;

        if (intervals[recordIntervalKey]) {
          intervals[recordIntervalKey].input += record.usage?.input_tokens || 0;
          intervals[recordIntervalKey].output += record.usage?.output_tokens || 0;
          intervals[recordIntervalKey].cache += record.usage?.cache_read_input_tokens || 0;
        }
      });
    } else if (timeRange === "today") {
      // Group by hour for today
      const startOfToday = startOfDay(now);
      const currentHour = now.getHours();

      for (let i = 0; i <= currentHour; i++) {
        const hourTime = new Date(startOfToday.getTime() + i * 60 * 60 * 1000);
        intervals[hourTime.getTime()] = { input: 0, output: 0, cache: 0 };
      }

      records.forEach((record) => {
        const recordTime = new Date(record.timestamp);
        const hourStart = new Date(recordTime);
        hourStart.setMinutes(0, 0, 0);
        const hourKey = hourStart.getTime();

        if (intervals[hourKey]) {
          intervals[hourKey].input += record.usage?.input_tokens || 0;
          intervals[hourKey].output += record.usage?.output_tokens || 0;
          intervals[hourKey].cache += record.usage?.cache_read_input_tokens || 0;
        }
      });
    } else {
      // Group by day for longer periods (7d, week, month)
      let startDate: Date;
      let days: number;

      if (timeRange === "week") {
        startDate = startOfWeek(now);
        // Calculate actual days in the current week so far (from start of week to today)
        const todayStart = startOfDay(now);
        days = Math.floor((todayStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      } else if (timeRange === "month") {
        startDate = startOfMonth(now);
        // Calculate actual days in the current month so far (from start of month to today)
        const todayStart = startOfDay(now);
        days = Math.floor((todayStart.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      } else {
        // For 7d, start from (days-1) days ago to include today
        days = 7;
        startDate = startOfDay(subDays(now, days - 1));
      }

      for (let i = 0; i < days; i++) {
        const dayTime = startOfDay(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
        intervals[dayTime.getTime()] = { input: 0, output: 0, cache: 0 };
      }

      records.forEach((record) => {
        const recordTime = new Date(record.timestamp);
        const dayStart = new Date(recordTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayKey = dayStart.getTime();

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
      const date = new Date(timestamp);
      let label: string;
      if (timeRange === "all") {
        label = format(date, "MMM dd, yyyy");
      } else if (timeRange === "today") {
        label = format(date, "HH:mm");
      } else if (timeRange === "5h") {
        label = format(date, "HH:mm");
      } else {
        label = format(date, "MMM dd");
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
      <div className="h-96 flex items-center justify-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">{t("usageChart.noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Filter Controls */}
      <div className="flex gap-4 items-center flex-wrap pb-5">
        <div className="flex items-center gap-2">
          <label htmlFor="model-filter" className="text-sm font-medium">
            {t("usageChart.modelFilter")}
          </label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger id="model-filter" className="w-48">
              <SelectValue placeholder={t("usageChart.allModels")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("usageChart.allModels")}</SelectItem>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="time-range" className="text-sm font-medium">
            {t("usageChart.timeRange")}
          </label>
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger id="time-range" className="w-48">
              <SelectValue placeholder={t("usageChart.selectTimeRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5h">{t("usageChart.last5Hours")}</SelectItem>
              <SelectItem value="today">{t("usageChart.startOfToday")}</SelectItem>
              <SelectItem value="7d">{t("usageChart.last7Days")}</SelectItem>
              <SelectItem value="week">{t("usageChart.startOfWeek")}</SelectItem>
              <SelectItem value="month">{t("usageChart.startOfMonth")}</SelectItem>
              <SelectItem value="all">{t("usageChart.allTime")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="flex gap-6 items-center justify-center pb-4">
        {[
          { key: "Input Tokens", label: t("usage.inputTokens") },
          { key: "Output Tokens", label: t("usage.outputTokens") },
          { key: "Cache Read Tokens", label: t("usage.cacheReadTokens") }
        ].map(({ key, label }) => {
          const isActive = activeCategories.includes(key);
          const color = key === "Input Tokens" ? "bg-blue-500" :
                       key === "Output Tokens" ? "bg-emerald-500" :
                       "bg-amber-500";
          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all ${
                isActive
                  ? 'opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'opacity-40 hover:opacity-60'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full min-w-0">
        <AreaChart
          data={chartData}
          index="time"
          categories={activeCategories}
          colors={activeCategories.map(cat => {
            if (cat === "Input Tokens") return "blue";
            if (cat === "Output Tokens") return "emerald";
            if (cat === "Cache Read Tokens") return "amber";
            return "blue";
          })}
          valueFormatter={formatLargeNumber}
          fill="gradient"
          className="h-full"
          showLegend={false}
        />
      </div>
    </div>
  );
}