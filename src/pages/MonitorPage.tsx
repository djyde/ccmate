import { useProjectUsageFiles } from "@/lib/query";

export function MonitorPage() {
  const { data: usageData, isLoading, error } = useProjectUsageFiles();

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10 mb-4" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>Monitor</h3>
        </div>
      </div>
      <div className="px-4">
        {isLoading ? (
          <p>Loading usage data...</p>
        ) : error ? (
          <p>Error loading usage data: {error.message}</p>
        ) : usageData && usageData.length > 0 ? (
          <div>
            <ul>
              <li>Total Input Tokens: {usageData.reduce((sum, record) => sum + (record.usage?.input_tokens || 0), 0)}</li>
              <li>Total Output Tokens: {usageData.reduce((sum, record) => sum + (record.usage?.output_tokens || 0), 0)}</li>
              <li>Total Cache Read Input Tokens: {usageData.reduce((sum, record) => sum + (record.usage?.cache_read_input_tokens || 0), 0)}</li>
            </ul>
          </div>
        ) : (
          <p>No usage data found.</p>
        )}
      </div>
    </div>
  );
}