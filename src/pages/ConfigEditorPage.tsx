import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { set, get, transform, isEmpty, isPlainObject } from "lodash-es";
import { match } from "ts-pattern";
import { useDeleteConfig, useStore, useUpdateConfig } from "../lib/query";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeftIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ask } from "@tauri-apps/plugin-dialog";
import { useState, useEffect, useRef } from "react";

type FieldConfig = {
  label: string;
  name: string;
  type: "text" | "number" | "boolean" | "textarea" | "tags" | "select";
  description?: string;
  placeholder?: string;
  options?: string[];
};

type SectionConfig = {
  sectionName: string;
  fields: FieldConfig[];
};

// Helper function to check if a leaf value should be included
function isValidValue(value: any): boolean {
  // Exclude undefined, null, NaN
  if (value === undefined || value === null || Number.isNaN(value)) {
    return false;
  }

  // Exclude empty strings (trim to handle whitespace-only strings)
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }

  return true;
}

// Helper function to recursively remove invalid values and empty objects
function deepClean(obj: any): any {
  // If it's not a plain object, check if it's a valid value
  if (!isPlainObject(obj)) {
    return isValidValue(obj) ? obj : undefined;
  }

  // Recursively clean nested objects
  const cleaned = transform(obj, (result: any, value, key) => {
    const cleanedValue = deepClean(value);

    // Only add if the cleaned value is valid (not undefined and not an empty object)
    if (cleanedValue !== undefined && !(isPlainObject(cleanedValue) && isEmpty(cleanedValue))) {
      result[key] = cleanedValue;
    }
  }, {});

  return cleaned;
}

// Helper function to convert flat form data to nested JSON using lodash
function convertToNestedJSON(formData: Record<string, any>) {
  const { configName, ...settings } = formData;

  // Transform flat keypaths to nested structure
  const settingsJSON = transform(
    settings,
    (result, value, key) => {
      set(result, key, value);
    },
    {} as Record<string, any>
  );

  // Recursively remove invalid values and empty objects
  const cleanedSettings = deepClean(settingsJSON);

  return {
    configName,
    "settings.json": cleanedSettings
  };
}

const createFields = (t: (key: string) => string): SectionConfig[] => [
  {
    sectionName: t("configEditor.sections.common"),
    fields: [
      {
        label: "ANTHROPIC_BASE_URL",
        name: "env.ANTHROPIC_BASE_URL",
        type: "text",
        description: "Override the API URL for model requests"
      },
      {
        label: "ANTHROPIC_AUTH_TOKEN",
        name: "env.ANTHROPIC_AUTH_TOKEN",
        type: "text",
        description: "This value will be sent as the Authorization header."
      },
      {
        label: "ANTHROPIC_MODEL",
        name: "env.ANTHROPIC_MODEL",
        type: "text",
        description: "Name of the model setting to use"
      },
      {
        label: "ANTHROPIC_DEFAULT_HAIKU_MODEL",
        name: "env.ANTHROPIC_DEFAULT_HAIKU_MODEL",
        type: "text",
        description: "Default Haiku model configuration"
      },
      {
        label: "ANTHROPIC_DEFAULT_OPUS_MODEL",
        name: "env.ANTHROPIC_DEFAULT_OPUS_MODEL",
        type: "text",
        description: "Default Opus model configuration"
      },
      {
        label: "ANTHROPIC_DEFAULT_SONNET_MODEL",
        name: "env.ANTHROPIC_DEFAULT_SONNET_MODEL",
        type: "text",
        description: "Default Sonnet model configuration"
      },
      {
        label: "ANTHROPIC_SMALL_FAST_MODEL",
        name: "env.ANTHROPIC_SMALL_FAST_MODEL",
        type: "text",
        description: "[DEPRECATED] Name of Haiku-class model for background tasks"
      },
      {
        label: "ANTHROPIC_API_KEY",
        name: "env.ANTHROPIC_API_KEY",
        type: "text",
        description: "API key sent as X-Api-Key header, typically for the Claude SDK"
      },

    ]
  },
  {
    sectionName: t("configEditor.sections.generalSettings"),
    fields: [
      {
        label: "API Key Helper",
        name: "apiKeyHelper",
        type: "text",
        description: "Custom script to generate an auth value (executed in /bin/sh)",
        placeholder: "/bin/generate_temp_api_key.sh"
      },
      {
        label: "Cleanup Period (Days)",
        name: "cleanupPeriodDays",
        type: "number",
        description: "How long to retain chat transcripts based on last activity date",
        placeholder: "30"
      },
      {
        label: "Include Co-Authored By",
        name: "includeCoAuthoredBy",
        type: "boolean",
        description: "Include co-authored-by Claude byline in git commits and pull requests",
      },
      {
        label: "Model",
        name: "model",
        type: "text",
        description: "Override the default model to use for Claude Code",
        placeholder: "claude-sonnet-4-5-20250929"
      },
      {
        label: "Output Style",
        name: "outputStyle",
        type: "select",
        description: "Configure output style to adjust the system prompt",
        options: ["Default", "Explanatory", "Concise"]
      },
      {
        label: "Disable All Hooks",
        name: "disableAllHooks",
        type: "boolean",
        description: "Disable all hooks"
      }
    ]
  },
  {
    sectionName: t("configEditor.sections.authLogin"),
    fields: [
      {
        label: "Force Login Method",
        name: "forceLoginMethod",
        type: "select",
        description: "Restrict login method",
        options: ["claudeai", "console"],
        placeholder: "None"
      },
      {
        label: "Force Login Org UUID",
        name: "forceLoginOrgUUID",
        type: "text",
        description: "Specify organization UUID to auto-select during login",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    ]
  },
  {
    sectionName: t("configEditor.sections.mcpConfig"),
    fields: [
      {
        label: "Enable All Project MCP Servers",
        name: "enableAllProjectMcpServers",
        type: "boolean",
        description: "Automatically approve all MCP servers in .mcp.json"
      },
      {
        label: "Enabled MCP Servers",
        name: "enabledMcpjsonServers",
        type: "tags",
        description: "List of specific MCP servers to approve",
        placeholder: 'e.g., ["memory", "github"]'
      },
      {
        label: "Disabled MCP Servers",
        name: "disabledMcpjsonServers",
        type: "tags",
        description: "List of specific MCP servers to reject",
        placeholder: 'e.g., ["filesystem"]'
      },
      {
        label: "Use Enterprise MCP Config Only",
        name: "useEnterpriseMcpConfigOnly",
        type: "boolean",
        description: "Restrict MCP servers to only those in managed-mcp.json"
      }
    ]
  },
  {
    sectionName: t("configEditor.sections.awsConfig"),
    fields: [
      {
        label: "AWS Auth Refresh",
        name: "awsAuthRefresh",
        type: "text",
        description: "Custom script that modifies the .aws directory",
        placeholder: "aws sso login --profile myprofile"
      },
      {
        label: "AWS Credential Export",
        name: "awsCredentialExport",
        type: "text",
        description: "Custom script that outputs JSON with AWS credentials",
        placeholder: "/bin/generate_aws_grant.sh"
      }
    ]
  },
  {
    sectionName: t("configEditor.sections.environmentVars"),
    fields: [
      {
        label: "ANTHROPIC_CUSTOM_HEADERS",
        name: "env.ANTHROPIC_CUSTOM_HEADERS",
        type: "text",
        description: "Custom headers to add to the request (in 'Name: Value' format)"
      },

      {
        label: "ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION",
        name: "env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION",
        type: "text",
        description: "Override AWS region for the Haiku-class model when using Bedrock"
      },
      {
        label: "AWS_BEARER_TOKEN_BEDROCK",
        name: "env.AWS_BEARER_TOKEN_BEDROCK",
        type: "text",
        description: "Bedrock API key for authentication"
      },
      {
        label: "AWS_PROFILE",
        name: "env.AWS_PROFILE",
        type: "text",
        description: "Specify AWS profile when using Bedrock"
      },
      {
        label: "AWS_REGION",
        name: "env.AWS_REGION",
        type: "text",
        description: "Specify AWS region when using Bedrock"
      },
      {
        label: "BASH_DEFAULT_TIMEOUT_MS",
        name: "env.BASH_DEFAULT_TIMEOUT_MS",
        type: "number",
        description: "Default timeout for long-running bash commands"
      },
      {
        label: "BASH_MAX_OUTPUT_LENGTH",
        name: "env.BASH_MAX_OUTPUT_LENGTH",
        type: "number",
        description: "Maximum number of characters in bash outputs before they are middle-truncated"
      },
      {
        label: "BASH_MAX_TIMEOUT_MS",
        name: "env.BASH_MAX_TIMEOUT_MS",
        type: "number",
        description: "Maximum timeout the model can set for long-running bash commands"
      },
      {
        label: "BEDROCK_REGION_CLAUDE_3_5_HAIKU",
        name: "env.BEDROCK_REGION_CLAUDE_3_5_HAIKU",
        type: "text",
        description: "Override region for Claude 3.5 Haiku on Bedrock"
      },
      {
        label: "BEDROCK_REGION_CLAUDE_3_5_SONNET",
        name: "env.BEDROCK_REGION_CLAUDE_3_5_SONNET",
        type: "text",
        description: "Override region for Claude 3.5 Sonnet on Bedrock"
      },
      {
        label: "BEDROCK_REGION_CLAUDE_3_7_SONNET",
        name: "env.BEDROCK_REGION_CLAUDE_3_7_SONNET",
        type: "text",
        description: "Override region for Claude 3.7 Sonnet on Bedrock"
      },
      {
        label: "BEDROCK_REGION_CLAUDE_4_0_OPUS",
        name: "env.BEDROCK_REGION_CLAUDE_4_0_OPUS",
        type: "text",
        description: "Override region for Claude 4.0 Opus on Bedrock"
      },
      {
        label: "BEDROCK_REGION_CLAUDE_4_0_SONNET",
        name: "env.BEDROCK_REGION_CLAUDE_4_0_SONNET",
        type: "text",
        description: "Override region for Claude 4.0 Sonnet on Bedrock"
      },
      {
        label: "BEDROCK_REGION_CLAUDE_4_1_OPUS",
        name: "env.BEDROCK_REGION_CLAUDE_4_1_OPUS",
        type: "text",
        description: "Override region for Claude 4.1 Opus on Bedrock"
      },
      {
        label: "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR",
        name: "env.CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR",
        type: "boolean",
        description: "Return to the original working directory after each Bash command"
      },
      {
        label: "CLAUDE_CODE_API_KEY_HELPER_TTL_MS",
        name: "env.CLAUDE_CODE_API_KEY_HELPER_TTL_MS",
        type: "number",
        description: "Interval in milliseconds at which credentials should be refreshed (when using apiKeyHelper)"
      },
      {
        label: "CLAUDE_CODE_CLIENT_CERT",
        name: "env.CLAUDE_CODE_CLIENT_CERT",
        type: "text",
        description: "Path to client certificate file for mTLS authentication"
      },
      {
        label: "CLAUDE_CODE_CLIENT_KEY",
        name: "env.CLAUDE_CODE_CLIENT_KEY",
        type: "text",
        description: "Path to client private key file for mTLS authentication"
      },
      {
        label: "CLAUDE_CODE_CLIENT_KEY_PASSPHRASE",
        name: "env.CLAUDE_CODE_CLIENT_KEY_PASSPHRASE",
        type: "text",
        description: "Passphrase for encrypted CLAUDE_CODE_CLIENT_KEY (optional)"
      },
      {
        label: "CLAUDE_CODE_CUSTOM_INSTRUCTIONS",
        name: "env.CLAUDE_CODE_CUSTOM_INSTRUCTIONS",
        type: "textarea",
        description: "Custom instructions appended to the system prompt"
      },
      {
        label: "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
        name: "env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
        type: "boolean",
        description: "Equivalent of setting DISABLE_AUTOUPDATER, DISABLE_BUG_COMMAND, DISABLE_ERROR_REPORTING, and DISABLE_TELEMETRY"
      },
      {
        label: "CLAUDE_CODE_DISABLE_TERMINAL_TITLE",
        name: "env.CLAUDE_CODE_DISABLE_TERMINAL_TITLE",
        type: "boolean",
        description: "Disable automatic terminal title updates"
      },
      {
        label: "CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL",
        name: "env.CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL",
        type: "boolean",
        description: "Skip auto-installation of IDE extensions"
      },
      {
        label: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
        name: "env.CLAUDE_CODE_MAX_OUTPUT_TOKENS",
        type: "number",
        description: "Maximum number of output tokens for most requests"
      },
      {
        label: "CLAUDE_CODE_SKIP_BEDROCK_AUTH",
        name: "env.CLAUDE_CODE_SKIP_BEDROCK_AUTH",
        type: "boolean",
        description: "Skip AWS authentication for Bedrock (e.g., when using LLM gateway)"
      },
      {
        label: "CLAUDE_CODE_SKIP_VERTEX_AUTH",
        name: "env.CLAUDE_CODE_SKIP_VERTEX_AUTH",
        type: "boolean",
        description: "Skip Google authentication for Vertex (e.g., when using LLM gateway)"
      },
      {
        label: "CLAUDE_CODE_SUBAGENT_MODEL",
        name: "env.CLAUDE_CODE_SUBAGENT_MODEL",
        type: "text",
        description: "Model configuration for subagents"
      },
      {
        label: "CLAUDE_CODE_USE_BEDROCK",
        name: "env.CLAUDE_CODE_USE_BEDROCK",
        type: "boolean",
        description: "Use Amazon Bedrock"
      },
      {
        label: "CLAUDE_CODE_USE_VERTEX",
        name: "env.CLAUDE_CODE_USE_VERTEX",
        type: "boolean",
        description: "Use Google Vertex AI"
      },
      {
        label: "DISABLE_AUTOUPDATER",
        name: "env.DISABLE_AUTOUPDATER",
        type: "boolean",
        description: "Disable automatic updates"
      },
      {
        label: "DISABLE_BUG_COMMAND",
        name: "env.DISABLE_BUG_COMMAND",
        type: "boolean",
        description: "Disable the /bug command"
      },
      {
        label: "DISABLE_COST_WARNINGS",
        name: "env.DISABLE_COST_WARNINGS",
        type: "boolean",
        description: "Disable cost warning messages"
      },
      {
        label: "DISABLE_ERROR_REPORTING",
        name: "env.DISABLE_ERROR_REPORTING",
        type: "boolean",
        description: "Opt out of Sentry error reporting"
      },
      {
        label: "DISABLE_NON_ESSENTIAL_MODEL_CALLS",
        name: "env.DISABLE_NON_ESSENTIAL_MODEL_CALLS",
        type: "boolean",
        description: "Disable model calls for non-critical paths like flavor text"
      },
      {
        label: "DISABLE_TELEMETRY",
        name: "env.DISABLE_TELEMETRY",
        type: "boolean",
        description: "Opt out of Statsig telemetry"
      },
      {
        label: "HTTP_PROXY",
        name: "env.HTTP_PROXY",
        type: "text",
        description: "HTTP proxy server for network connections"
      },
      {
        label: "HTTPS_PROXY",
        name: "env.HTTPS_PROXY",
        type: "text",
        description: "HTTPS proxy server for network connections"
      },
      {
        label: "MAX_MCP_OUTPUT_TOKENS",
        name: "env.MAX_MCP_OUTPUT_TOKENS",
        type: "number",
        description: "Maximum tokens in MCP tool responses (default: 25000)",
        placeholder: "25000"
      },
      {
        label: "MAX_THINKING_TOKENS",
        name: "env.MAX_THINKING_TOKENS",
        type: "number",
        description: "Enable extended thinking and set token budget"
      },
      {
        label: "MCP_TIMEOUT",
        name: "env.MCP_TIMEOUT",
        type: "number",
        description: "Timeout in milliseconds for MCP server startup"
      },
      {
        label: "MCP_TOOL_TIMEOUT",
        name: "env.MCP_TOOL_TIMEOUT",
        type: "number",
        description: "Timeout in milliseconds for MCP tool execution"
      },
      {
        label: "NO_PROXY",
        name: "env.NO_PROXY",
        type: "text",
        description: "Domains and IPs to bypass proxy"
      },
      {
        label: "SLASH_COMMAND_TOOL_CHAR_BUDGET",
        name: "env.SLASH_COMMAND_TOOL_CHAR_BUDGET",
        type: "number",
        description: "Maximum characters for slash command metadata (default: 15000)",
        placeholder: "15000"
      },
      {
        label: "USE_BUILTIN_RIPGREP",
        name: "env.USE_BUILTIN_RIPGREP",
        type: "boolean",
        description: "Use built-in ripgrep (uncheck to use system-installed rg)",
      },
      {
        label: "VERTEX_REGION_CLAUDE_3_5_HAIKU",
        name: "env.VERTEX_REGION_CLAUDE_3_5_HAIKU",
        type: "text",
        description: "Override region for Claude 3.5 Haiku on Vertex AI"
      },
      {
        label: "VERTEX_REGION_CLAUDE_3_5_SONNET",
        name: "env.VERTEX_REGION_CLAUDE_3_5_SONNET",
        type: "text",
        description: "Override region for Claude 3.5 Sonnet on Vertex AI"
      },
      {
        label: "VERTEX_REGION_CLAUDE_3_7_SONNET",
        name: "env.VERTEX_REGION_CLAUDE_3_7_SONNET",
        type: "text",
        description: "Override region for Claude 3.7 Sonnet on Vertex AI"
      },
      {
        label: "VERTEX_REGION_CLAUDE_4_0_OPUS",
        name: "env.VERTEX_REGION_CLAUDE_4_0_OPUS",
        type: "text",
        description: "Override region for Claude 4.0 Opus on Vertex AI"
      },
      {
        label: "VERTEX_REGION_CLAUDE_4_0_SONNET",
        name: "env.VERTEX_REGION_CLAUDE_4_0_SONNET",
        type: "text",
        description: "Override region for Claude 4.0 Sonnet on Vertex AI"
      },
      {
        label: "VERTEX_REGION_CLAUDE_4_1_OPUS",
        name: "env.VERTEX_REGION_CLAUDE_4_1_OPUS",
        type: "text",
        description: "Override region for Claude 4.1 Opus on Vertex AI"
      }
    ]
  }
];

export function ConfigEditorPage() {
  const { t } = useTranslation();
  const { storeId } = useParams();
  const navigate = useNavigate();

  const storeQuery = useStore(storeId!);
  const updateStore = useUpdateConfig();
  const deleteStore = useDeleteConfig();

  const storeData = storeQuery.data;

  const fields = createFields(t);

  // Prepare default values from store data
  const defaultValues: Record<string, any> = { configName: storeData.title };
  fields.forEach(section => {
    section.fields.forEach(field => {
      const value = get(storeData.settings, field.name);
      if (value !== undefined) {
        defaultValues[field.name] = value;
      }
    });
  });

  const { register, control, handleSubmit, setValue } = useForm({ defaultValues });
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const applyPreset = (preset: 'glm' | 'kimi') => {
    console.log('Applying preset:', preset);

    if (preset === 'glm') {
      setValue('env.ANTHROPIC_BASE_URL', 'https://open.bigmodel.cn/api/anthropic');
      setValue('env.ANTHROPIC_MODEL', 'GLM-4.6');
      setValue('env.ANTHROPIC_DEFAULT_OPUS_MODEL', 'GLM-4.6');
      setValue('env.ANTHROPIC_DEFAULT_SONNET_MODEL', 'GLM-4.6');
      setValue('env.ANTHROPIC_DEFAULT_HAIKU_MODEL', 'GLM-4.5-Air');
    } else if (preset === 'kimi') {
      setValue('env.ANTHROPIC_BASE_URL', 'https://api.moonshot.cn/anthropic');
      setValue('env.ANTHROPIC_MODEL', 'kimi-k2-turbo-preview');
      setValue('env.ANTHROPIC_DEFAULT_OPUS_MODEL', 'kimi-k2-turbo-preview');
      setValue('env.ANTHROPIC_DEFAULT_SONNET_MODEL', 'kimi-k2-turbo-preview');
      setValue('env.ANTHROPIC_DEFAULT_HAIKU_MODEL', 'kimi-k2-turbo-preview');
    }

    // Clear any existing highlight timer
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    // Highlight the ANTHROPIC_AUTH_TOKEN field
    console.log('Setting highlighted field to: env.ANTHROPIC_AUTH_TOKEN');
    setHighlightedField('env.ANTHROPIC_AUTH_TOKEN');
    highlightTimerRef.current = window.setTimeout(() => {
      console.log('Clearing highlighted field');
      setHighlightedField(null);
      highlightTimerRef.current = null;
    }, 1500); // 0.5s * 3 = 1.5s total animation time
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const onSave = handleSubmit((formValues) => {
    const { configName, ...rest } = convertToNestedJSON(formValues);
    updateStore.mutate({
      storeId: storeId!,
      title: configName,
      settings: rest["settings.json"]
    });
  });

  const onDelete = async () => {
    const confirmed = await ask(
      t("configEditor.deleteConfirm", { name: storeData.title }),
      { title: t("configEditor.deleteTitle"), kind: "warning" }
    );

    if (confirmed) {
      await deleteStore.mutateAsync({
        storeId: storeId!,
      });
      navigate("/");
    }
  };

  return (
    <div className="space-y-4 ">
      <nav className="px-2 py-3 flex items-center justify-between sticky top-0 bg-background z-10 border-b" data-tauri-drag-region>
        <Button asChild variant="ghost" size="sm">
          <Link to="/" className="">
            <ChevronLeftIcon size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">{t("configSwitcher.allConfigs")}</span>
          </Link>
        </Button>

        <div className="mr-2 flex items-center gap-2">
         
          <Button
            onClick={onDelete}
            disabled={deleteStore.isPending}
            variant="ghost"
            size="sm"
            className=""
          >
            <TrashIcon size={14} className="text-muted-foreground" />
          </Button>

          <Button
            onClick={onSave}
            disabled={updateStore.isPending}
            size="sm"
          >
            {t("configEditor.save")}
          </Button>

        </div>
      </nav>

      <section className="px-8">
        <h3 className="pb-2 font-medium mx-2 text-muted-foreground text-sm">{t("configEditor.configName")}</h3>
        <input
          {...register("configName")}
          type="text"
          className="text-sm px-2 text-muted-foreground border rounded-sm w-[200px] h-7 bg-white"
        />
      </section>
      <section className="space-y-8 pb-8">
        {fields.map((field) => (
          <div key={field.sectionName}>
            <h3 className="px-10 py-2 font-medium  text-muted-foreground text-sm">{field.sectionName}</h3>
            <div className="mx-8 rounded-lg bg-zinc-100/60 p-3 space-y-5">
              {field.fields.map((field) => (
                <div className="" key={field.name}>
                  <div className="flex gap-2 items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm min-w-40 shrink-0">{field.label}</div>
                      {field.description && (
                        <p className="text-muted-foreground/50 text-sm line-clamp-1">{field.description}</p>
                      )}
                    </div>
                    {match({ type: field.type, name: field.name })
                      .with({ type: 'boolean' }, () => (
                        <Controller
                          name={field.name}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              value={value !== undefined ? String(value) : undefined}
                              onValueChange={(val) => onChange(val === "true")}
                            >
                              <SelectTrigger className={`w-1/2 ${highlightedField === field.name ? 'animate-blink' : ''}`}>
                                <SelectValue placeholder="Default" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">true</SelectItem>
                                <SelectItem value="false">false</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      ))
                      .with({ type: 'select' }, () => (
                        <Controller
                          name={field.name}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select value={value} onValueChange={onChange}>
                              <SelectTrigger className={`w-1/2 ${highlightedField === field.name ? 'animate-blink' : ''}`}>
                                <SelectValue placeholder={field.placeholder || "Select..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      ))
                      .with({ type: 'textarea' }, () => (
                        <Textarea
                          {...register(field.name)}
                          className={`w-1/2 text-sm ${highlightedField === field.name ? 'animate-blink' : ''}`}
                          placeholder={field.placeholder}
                        />
                      ))
                      .with({ type: 'number' }, () => (
                        <Input
                          {...register(field.name, {
                            setValueAs: (v) => v === '' ? undefined : Number(v)
                          })}
                          type="number"
                          className={`text-sm w-1/2 h-7 ${highlightedField === field.name ? 'animate-blink' : ''}`}
                          placeholder={field.placeholder}
                        />
                      ))
                      .with({ name: 'env.ANTHROPIC_BASE_URL' }, () => (
                        <div className="inline-flex items-center gap-2 w-1/2 flex-row-reverse">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 shrink-0"
                              >
                                <PlusIcon className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => applyPreset('glm')}>
                                GLM
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => applyPreset('kimi')}>
                                KIMI
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Input
                            {...register(field.name)}
                            type="text"
                            className={`text-sm h-7 flex-1 ${highlightedField === field.name ? 'animate-blink' : ''}`}
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))
                      .otherwise(() => {
                        const className = `text-sm w-1/2 h-7 ${highlightedField === field.name ? 'animate-blink' : ''}`;
                        if (highlightedField === field.name) {
                          console.log('Highlighting field:', field.name, 'with class:', className);
                        }
                        return (
                          <Input
                            {...register(field.name)}
                            type="text"
                            className={className}
                            placeholder={field.placeholder}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}
      </section>
    </div>
  )
}