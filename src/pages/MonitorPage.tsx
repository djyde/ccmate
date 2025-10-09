import { useProjectUsageFiles } from "@/lib/query";
import { TokenUsageChart } from "@/components/TokenUsageChart";
import { useState, useEffect } from "react";
import { ProjectUsageRecord } from "@/lib/query";

export function MonitorPage() {
  const { data: usageData, isLoading, error } = useProjectUsageFiles();
  const [filteredUsageData, setFilteredUsageData] = useState<ProjectUsageRecord[]>([]);

  // Initialize filtered data with full data
  useEffect(() => {
    if (usageData) {
      setFilteredUsageData(usageData);
    }
  }, [usageData]);

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>Monitor</h3>
        </div>
      </div>
      <div className="px-4 space-y-6">
        {isLoading ? (
          <p>Loading usage data...</p>
        ) : error ? (
          <p>Error loading usage data: {error.message}</p>
        ) : usageData && usageData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Input Tokens</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {new Intl.NumberFormat().format(filteredUsageData.reduce((sum, record) => sum + (record.usage?.input_tokens || 0), 0))}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <h3 className="font-semibold text-green-800 dark:text-green-200">Output Tokens</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {new Intl.NumberFormat().format(filteredUsageData.reduce((sum, record) => sum + (record.usage?.output_tokens || 0), 0))}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Cache Read Tokens</h3>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                  {new Intl.NumberFormat().format(filteredUsageData.reduce((sum, record) => sum + (record.usage?.cache_read_input_tokens || 0), 0))}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <TokenUsageChart data={usageData} onFilteredDataChange={setFilteredUsageData} />
            </div>
          </>
        ) : (
          <p>No usage data found.</p>
        )}
      </div>
    </div>
  );
}