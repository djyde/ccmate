import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format, startOfDay, startOfWeek, startOfMonth, subHours, subDays, getYear, getMonth, getDaysInMonth } from "date-fns";
import { ProjectUsageRecord } from "@/lib/query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TokenUsageChartProps {
  data: ProjectUsageRecord[];
  onFilteredDataChange?: (filteredData: ProjectUsageRecord[]) => void;
}

type TimeRange = "5h" | "1h" | "30min" | "today" | "7d" | "30d" | "month" | "week" | "all";

export function TokenUsageChart({ data, onFilteredDataChange }: TokenUsageChartProps) {
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("5h");

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
      case "30min":
        startTime = subHours(now, 0.5);
        break;
      case "1h":
        startTime = subHours(now, 1);
        break;
      case "5h":
        startTime = subHours(now, 5);
        break;
      case "today":
        startTime = startOfDay(now);
        break;
      case "7d":
        startTime = subDays(now, 6);
        break;
      case "30d":
        startTime = subDays(now, 29);
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
  // Group data based on time range
  const groupDataByInterval = (records: ProjectUsageRecord[]) => {
    const intervals: { [key: string]: { input: number; output: number; cache: number } } = {};
    const now = new Date();

    if (timeRange === "all") {
      // For all time, group by month
      const earliestTime = records.length > 0
        ? new Date(Math.min(...records.map((record) => new Date(record.timestamp).getTime())))
        : new Date();

      const startOfEarliestMonth = new Date(getYear(earliestTime), getMonth(earliestTime), 1);
      const startOfCurrentMonth = new Date(getYear(now), getMonth(now), 1);

      // Generate monthly intervals from earliest month to current month
      for (let monthTime = startOfEarliestMonth.getTime(); monthTime <= startOfCurrentMonth.getTime(); monthTime += getDaysInMonth(new Date(monthTime)) * 24 * 60 * 60 * 1000) {
        intervals[monthTime] = { input: 0, output: 0, cache: 0 };
      }

      // Group records into monthly intervals
      records.forEach((record) => {
        const recordTime = new Date(record.timestamp);
        const monthStart = new Date(getYear(recordTime), getMonth(recordTime), 1);
        const monthKey = monthStart.getTime();

        if (intervals[monthKey]) {
          intervals[monthKey].input += record.usage?.input_tokens || 0;
          intervals[monthKey].output += record.usage?.output_tokens || 0;
          intervals[monthKey].cache += record.usage?.cache_read_input_tokens || 0;
        }
      });
    } else if (timeRange === "30min" || timeRange === "1h" || timeRange === "5h") {
      if (timeRange === "30min" || timeRange === "1h") {
        // Group by 5-minute intervals for 30 minutes and 1 hour
        const minutes = timeRange === "30min" ? 30 : 60;
        const currentInterval = Math.floor(now.getMinutes() / 5) * 5;
        now.setMinutes(currentInterval, 0, 0);

        // Generate intervals
        const intervalCount = Math.ceil(minutes / 5);
        for (let i = intervalCount - 1; i >= 0; i--) {
          const intervalTime = new Date(now.getTime() - i * 5 * 60 * 1000);
          const intervalKey = intervalTime.getTime();
          intervals[intervalKey] = { input: 0, output: 0, cache: 0 };
        }

        // Group records into 5-minute intervals
        records.forEach((record) => {
          const recordTime = new Date(record.timestamp);
          const recordIntervalKey = Math.floor(recordTime.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);

          if (intervals[recordIntervalKey]) {
            intervals[recordIntervalKey].input += record.usage?.input_tokens || 0;
            intervals[recordIntervalKey].output += record.usage?.output_tokens || 0;
            intervals[recordIntervalKey].cache += record.usage?.cache_read_input_tokens || 0;
          }
        });
      } else {
        // Group by 30-minute intervals for 5h time range
        const currentInterval = Math.floor(now.getMinutes() / 30) * 30;
        now.setMinutes(currentInterval, 0, 0);

        // Generate intervals (10 intervals for 5 hours)
        for (let i = 9; i >= 0; i--) {
          const intervalTime = new Date(now.getTime() - i * 30 * 60 * 1000);
          const intervalKey = intervalTime.getTime();
          intervals[intervalKey] = { input: 0, output: 0, cache: 0 };
        }

        // Group records into 30-minute intervals
        records.forEach((record) => {
          const recordTime = new Date(record.timestamp);
          const recordIntervalKey = Math.floor(recordTime.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000);

          if (intervals[recordIntervalKey]) {
            intervals[recordIntervalKey].input += record.usage?.input_tokens || 0;
            intervals[recordIntervalKey].output += record.usage?.output_tokens || 0;
            intervals[recordIntervalKey].cache += record.usage?.cache_read_input_tokens || 0;
          }
        });
      }
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
      // Group by day for longer periods (7d, 30d, week, month)
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "week" ? 7 : 30;
      let startDate: Date;

      if (timeRange === "week") {
        startDate = startOfWeek(now);
      } else if (timeRange === "month") {
        startDate = startOfMonth(now);
      } else {
        // For 7d and 30d, start from (days-1) days ago to include today
        startDate = subDays(now, days - 1);
      }

      for (let i = 0; i < days; i++) {
        const dayTime = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
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

  // Prepare chart data
  const labels = Object.keys(groupedData)
    .map(Number)
    .sort((a, b) => a - b)
    .map((timestamp) => {
      const date = new Date(timestamp);
      if (timeRange === "all") {
        return format(date, "MMM yyyy");
      } else if (timeRange === "today") {
        return format(date, "HH:mm");
      } else if (timeRange === "30min" || timeRange === "1h" || timeRange === "5h") {
        return format(date, "HH:mm");
      } else {
        return format(date, "MMM dd");
      }
    });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Input Tokens",
        data: Object.keys(groupedData)
          .map(Number)
          .sort((a, b) => a - b)
          .map((key) => groupedData[key].input),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Output Tokens",
        data: Object.keys(groupedData)
          .map(Number)
          .sort((a, b) => a - b)
          .map((key) => groupedData[key].output),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
      {
        label: "Cache Read Tokens",
        data: Object.keys(groupedData)
          .map(Number)
          .sort((a, b) => a - b)
          .map((key) => groupedData[key].cache),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        hidden: true,
      },
    ],
  };

  // Get chart title based on time range
  const getChartTitle = () => {
    const modelFilter = selectedModel !== "all" ? ` - Model: ${selectedModel}` : "";

    switch (timeRange) {
      case "30min":
        return `Token Usage (Last 30 Minutes - 5 min intervals)${modelFilter}`;
      case "1h":
        return `Token Usage (Last Hour - 5 min intervals)${modelFilter}`;
      case "5h":
        return `Token Usage (Last 5 Hours)${modelFilter}`;
      case "today":
        return `Token Usage (Today)${modelFilter}`;
      case "7d":
        return `Token Usage (Last 7 Days)${modelFilter}`;
      case "30d":
        return `Token Usage (Last 30 Days)${modelFilter}`;
      case "week":
        return `Token Usage (This Week)${modelFilter}`;
      case "month":
        return `Token Usage (This Month)${modelFilter}`;
      case "all":
        return `Token Usage (All Time - Monthly)${modelFilter}`;
      default:
        return `Token Usage${modelFilter}`;
    }
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: getChartTitle(),
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat().format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Tokens",
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No usage data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="model-filter" className="text-sm font-medium">
            Model:
          </label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger id="model-filter" className="w-48">
              <SelectValue placeholder="All models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
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
            Time Range:
          </label>
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger id="time-range" className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30min">Last 30 minutes</SelectItem>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="5h">Last 5 hours</SelectItem>
              <SelectItem value="today">Start of today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="week">Start of this week</SelectItem>
              <SelectItem value="month">Start of this month</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}