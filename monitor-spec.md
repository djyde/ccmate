# Claude Code Usage Monitor Implementation

## Overview

This document describes the implementation of the Claude Code usage monitoring feature that reads and analyzes usage data from JSONL files stored in `~/.claude/projects/**/*.jsonl`.

## Architecture

### Backend (Rust/Tauri)

#### Data Structures

```rust
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct UsageData {
    pub input_tokens: Option<u64>,
    pub cache_read_input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ProjectUsageRecord {
    pub uuid: String,
    pub timestamp: String,
    pub model: Option<String>,
    pub usage: Option<UsageData>,
}
```

#### Core Function: `read_project_usage_files()`

1. **Directory Discovery**
   - Base path: `~/.claude/projects/`
   - Recursive search through all subdirectories
   - Finds all files with `.jsonl` extension

2. **File Processing**
   - Reads each JSONL file line by line
   - Parses each line as JSON object
   - Extracts required fields from each record

3. **Field Extraction Logic**

**UUID & Timestamp (Required)**
```rust
let uuid = json_value.get("uuid")
    .and_then(|v| v.as_str())
    .unwrap_or("")
    .to_string();

let timestamp = json_value.get("timestamp")
    .and_then(|v| v.as_str())
    .unwrap_or("")
    .to_string();
```

**Model (Optional)**
```rust
let model = if let Some(model_str) = json_value.get("model")
    .and_then(|v| v.as_str()) {
    Some(model_str.to_string())
} else if let Some(message_obj) = json_value.get("message") {
    message_obj.get("model")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
} else {
    None
};
```

**Usage Data (Optional)**
```rust
let usage = if let Some(usage_obj) = json_value.get("usage") {
    Some(UsageData {
        input_tokens: usage_obj.get("input_tokens").and_then(|v| v.as_u64()),
        cache_read_input_tokens: usage_obj.get("cache_read_input_tokens").and_then(|v| v.as_u64()),
        output_tokens: usage_obj.get("output_tokens").and_then(|v| v.as_u64()),
    })
} else if let Some(message_obj) = json_value.get("message") {
    if let Some(usage_obj) = message_obj.get("usage") {
        Some(UsageData {
            input_tokens: usage_obj.get("input_tokens").and_then(|v| v.as_u64()),
            cache_read_input_tokens: usage_obj.get("cache_read_input_tokens").and_then(|v| v.as_u64()),
            output_tokens: usage_obj.get("output_tokens").and_then(|v| v.as_u64()),
        })
    } else {
        None
    }
} else {
    None
};
```

4. **Filtering Logic**
   - Records must have valid UUID and timestamp
   - Records must have usage data (not None)
   - Records must have meaningful token usage: `input_tokens + output_tokens > 0`

### Frontend (TypeScript/React)

#### TypeScript Interfaces

```typescript
export interface UsageData {
  input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

export interface ProjectUsageRecord {
  uuid: string;
  timestamp: string;
  model?: string;
  usage?: UsageData;
}
```

#### React Query Hook

```typescript
export const useProjectUsageFiles = () => {
  return useQuery({
    queryKey: ["project-usage-files"],
    queryFn: () => invoke<ProjectUsageRecord[]>("read_project_usage_files"),
  });
};
```

#### Monitor Page Implementation

The Monitor page (`src/pages/MonitorPage.tsx`) displays aggregated token usage:

```typescript
<ul>
  <li>Total Input Tokens: {usageData.reduce((sum, record) => sum + (record.usage?.input_tokens || 0), 0)}</li>
  <li>Total Output Tokens: {usageData.reduce((sum, record) => sum + (record.usage?.output_tokens || 0), 0)}</li>
  <li>Total Cache Read Input Tokens: {usageData.reduce((sum, record) => sum + (record.usage?.cache_read_input_tokens || 0), 0)}</li>
</ul>
```

## JSONL File Structure

The system processes JSONL files that contain various types of records. Usage data is typically found in records with the following structure:

```json
{
  "parentUuid": "...",
  "userType": "external",
  "cwd": "...",
  "sessionId": "...",
  "version": "...",
  "gitBranch": "...",
  "message": {
    "id": "...",
    "type": "message",
    "role": "assistant",
    "model": "glm-4.6",
    "content": [...],
    "usage": {
      "input_tokens": 3505,
      "output_tokens": 60,
      "cache_read_input_tokens": 9888
    }
  },
  "type": "assistant",
  "uuid": "...",
  "timestamp": "2025-09-30T09:06:50.519Z"
}
```

## Processing Flow

1. **Directory Scan**: Recursively scan `~/.claude/projects/` for `.jsonl` files
2. **File Read**: Read each JSONL file completely
3. **Line Processing**: Process each line as a separate JSON object
4. **Field Extraction**: Extract UUID, timestamp, model, and usage fields
5. **Filtering**: Filter out records without valid usage data
6. **Aggregation**: Sum tokens across all valid records
7. **Display**: Show aggregated totals in the Monitor page

## Error Handling

- **Missing Directory**: Returns empty array if projects directory doesn't exist
- **Invalid JSON**: Skips malformed JSON lines with error logging
- **Missing Fields**: Gracefully handles missing optional fields (usage, model)
- **File Read Errors**: Returns error message if files can't be read

## Performance Considerations

- All JSONL files are read into memory during processing
- Large project directories may result in longer initial load times
- No pagination implemented - processes all available data at once
- Caching handled by React Query to avoid repeated reads

## Debug Features

The implementation includes debug logging that outputs:
- Projects directory path
- Number of files processed
- Number of lines processed
- Number of valid records found

This helps troubleshoot issues with data discovery and processing.