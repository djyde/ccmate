import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStores, useCreateStore, useUpdateStore } from "../lib/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const claudeConfigSchema = z.object({
  apiKeyHelper: z.string().optional(),
  cleanupPeriodDays: z.number().min(1).max(365).optional(),
  env: z.record(z.string(), z.string()).optional(),
  includeCoAuthoredBy: z.boolean().optional(),
  permissions: z.object({
    allow: z.array(z.string()).optional(),
    ask: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional(),
    additionalDirectories: z.array(z.string()).optional(),
    defaultMode: z.enum(["acceptEdits", "askForEdits", "reviewEdits"]).optional(),
    disableBypassPermissionsMode: z.enum(["disable"]).optional(),
  }).optional(),
  hooks: z.record(z.string(), z.any()).optional(),
  disableAllHooks: z.boolean().optional(),
  model: z.string().optional(),
  statusLine: z.object({
    type: z.enum(["command", "json", "text"]),
    command: z.string().optional(),
    template: z.string().optional(),
  }).optional(),
  outputStyle: z.string().optional(),
  forceLoginMethod: z.enum(["claudeai", "console"]).optional(),
  forceLoginOrgUUID: z.string().optional(),
  enableAllProjectMcpServers: z.boolean().optional(),
  enabledMcpjsonServers: z.array(z.string()).optional(),
  disabledMcpjsonServers: z.array(z.string()).optional(),
  useEnterpriseMcpConfigOnly: z.boolean().optional(),
  awsAuthRefresh: z.string().optional(),
  awsCredentialExport: z.string().optional(),
});

type ClaudeConfigForm = z.infer<typeof claudeConfigSchema>;

export function StoreEditPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { data: stores } = useStores();
  const createStoreMutation = useCreateStore();
  const updateStoreMutation = useUpdateStore();
  const [isExistingStore, setIsExistingStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);
  const [allowPermissions, setAllowPermissions] = useState([""]);
  const [denyPermissions, setDenyPermissions] = useState([""]);
  const [askPermissions, setAskPermissions] = useState([""]);
  const [additionalDirs, setAdditionalDirs] = useState([""]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ClaudeConfigForm>({
    resolver: zodResolver(claudeConfigSchema),
    defaultValues: {
      includeCoAuthoredBy: true,
      cleanupPeriodDays: 30,
    },
  });

  useEffect(() => {
    if (stores && storeId) {
      const existingStore = stores.find(s => s.id === storeId);
      if (existingStore) {
        setIsExistingStore(true);
        setStoreName(existingStore.name);
        const config = existingStore.settings as any;

        // Set form values from existing store
        Object.keys(config).forEach(key => {
          if (key === 'env' && typeof config[key] === 'object') {
            const entries = Object.entries(config[key] || {});
            setEnvVars(entries.length > 0 ? entries.map(([k, v]) => ({ key: k, value: v as string })) : [{ key: "", value: "" }]);
          } else if (key === 'permissions') {
            const perms = config[key] || {};
            setAllowPermissions(perms.allow?.length > 0 ? perms.allow : [""]);
            setDenyPermissions(perms.deny?.length > 0 ? perms.deny : [""]);
            setAskPermissions(perms.ask?.length > 0 ? perms.ask : [""]);
            setAdditionalDirs(perms.additionalDirectories?.length > 0 ? perms.additionalDirectories : [""]);
            setValue('permissions', perms);
          } else {
            setValue(key as any, config[key]);
          }
        });
      } else {
        // New store, set storeName from URL if provided as fallback
        setStoreName("");
      }
    }
  }, [stores, storeId, setValue]);

  const onSubmit = (data: ClaudeConfigForm) => {
    if (!storeName.trim()) {
      alert("Please enter a store name");
      return;
    }

    // Process environment variables
    const envObject: Record<string, string> = {};
    envVars.forEach(({ key, value }) => {
      if (key && value) {
        envObject[key] = value;
      }
    });

    // Process permissions
    const permissions = {
      allow: allowPermissions.filter(p => p.trim()),
      ask: askPermissions.filter(p => p.trim()),
      deny: denyPermissions.filter(p => p.trim()),
      additionalDirectories: additionalDirs.filter(d => d.trim()),
      defaultMode: data.permissions?.defaultMode,
      disableBypassPermissionsMode: data.permissions?.disableBypassPermissionsMode,
    };

    const finalConfig = {
      ...data,
      env: Object.keys(envObject).length > 0 ? envObject : undefined,
      permissions: Object.values(permissions).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== undefined)) ? permissions : undefined,
    };

    if (isExistingStore && storeId) {
      // Update existing store
      updateStoreMutation.mutate({
        storeId,
        name: storeName.trim(),
        settings: finalConfig,
      });
    } else {
      // Create new store
      createStoreMutation.mutate({
        name: storeName.trim(),
        settings: finalConfig,
      });
    }
  };

  const addEnvVar = () => setEnvVars([...envVars, { key: "", value: "" }]);
  const removeEnvVar = (index: number) => setEnvVars(envVars.filter((_, i) => i !== index));
  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const addPermission = (type: 'allow' | 'deny' | 'ask') => {
    if (type === 'allow') setAllowPermissions([...allowPermissions, ""]);
    if (type === 'deny') setDenyPermissions([...denyPermissions, ""]);
    if (type === 'ask') setAskPermissions([...askPermissions, ""]);
  };

  const removePermission = (type: 'allow' | 'deny' | 'ask', index: number) => {
    if (type === 'allow') setAllowPermissions(allowPermissions.filter((_, i) => i !== index));
    if (type === 'deny') setDenyPermissions(denyPermissions.filter((_, i) => i !== index));
    if (type === 'ask') setAskPermissions(askPermissions.filter((_, i) => i !== index));
  };

  const updatePermission = (type: 'allow' | 'deny' | 'ask', index: number, value: string) => {
    if (type === 'allow') {
      const updated = [...allowPermissions];
      updated[index] = value;
      setAllowPermissions(updated);
    }
    if (type === 'deny') {
      const updated = [...denyPermissions];
      updated[index] = value;
      setDenyPermissions(updated);
    }
    if (type === 'ask') {
      const updated = [...askPermissions];
      updated[index] = value;
      setAskPermissions(updated);
    }
  };

  const addDirectory = () => setAdditionalDirs([...additionalDirs, ""]);
  const removeDirectory = (index: number) => setAdditionalDirs(additionalDirs.filter((_, i) => i !== index));
  const updateDirectory = (index: number, value: string) => {
    const updated = [...additionalDirs];
    updated[index] = value;
    setAdditionalDirs(updated);
  };

  useEffect(() => {
    if (createStoreMutation.isSuccess || updateStoreMutation.isSuccess) {
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  }, [createStoreMutation.isSuccess, updateStoreMutation.isSuccess, navigate]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isExistingStore ? `Edit Store: ${storeName}` : `Create Store: ${storeName}`}
        </h1>
        <p className="text-muted-foreground">
          Configure Claude Code settings for this store
        </p>
      </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>Core Claude Code configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Enter store name..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="claude-sonnet-4-5-20250929"
                    {...register("model")}
                  />
                </div>
                <div>
                  <Label htmlFor="cleanupPeriodDays">Cleanup Period (days)</Label>
                  <Input
                    id="cleanupPeriodDays"
                    type="number"
                    min="1"
                    max="365"
                    {...register("cleanupPeriodDays", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeCoAuthoredBy"
                  {...register("includeCoAuthoredBy")}
                />
                <Label htmlFor="includeCoAuthoredBy">Include co-authored-by in commits</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="disableAllHooks"
                  {...register("disableAllHooks")}
                />
                <Label htmlFor="disableAllHooks">Disable all hooks</Label>
              </div>

              <div>
                <Label htmlFor="outputStyle">Output Style</Label>
                <Input
                  id="outputStyle"
                  placeholder="Explanatory"
                  {...register("outputStyle")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Login and API configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKeyHelper">API Key Helper Script</Label>
                <Input
                  id="apiKeyHelper"
                  placeholder="/path/to/script.sh"
                  {...register("apiKeyHelper")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="forceLoginMethod">Force Login Method</Label>
                  <select
                    id="forceLoginMethod"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("forceLoginMethod")}
                  >
                    <option value="">Default</option>
                    <option value="claudeai">Claude.ai</option>
                    <option value="console">Console (API)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="forceLoginOrgUUID">Organization UUID</Label>
                  <Input
                    id="forceLoginOrgUUID"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    {...register("forceLoginOrgUUID")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Environment variables to apply to every session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {envVars.map((envVar, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Variable name"
                    value={envVar.key}
                    onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    value={envVar.value}
                    onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEnvVar(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addEnvVar}>
                Add Environment Variable
              </Button>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Configure tool use permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Allow Permissions</Label>
                <div className="space-y-2">
                  {allowPermissions.map((permission, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Bash(git diff:*)"
                        value={permission}
                        onChange={(e) => updatePermission('allow', index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePermission('allow', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addPermission('allow')}>
                    Add Allow Permission
                  </Button>
                </div>
              </div>

              <div>
                <Label>Deny Permissions</Label>
                <div className="space-y-2">
                  {denyPermissions.map((permission, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="WebFetch, Bash(curl:*)"
                        value={permission}
                        onChange={(e) => updatePermission('deny', index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePermission('deny', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addPermission('deny')}>
                    Add Deny Permission
                  </Button>
                </div>
              </div>

              <div>
                <Label>Ask Permissions</Label>
                <div className="space-y-2">
                  {askPermissions.map((permission, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Bash(git push:*)"
                        value={permission}
                        onChange={(e) => updatePermission('ask', index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePermission('ask', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addPermission('ask')}>
                    Add Ask Permission
                  </Button>
                </div>
              </div>

              <div>
                <Label>Additional Directories</Label>
                <div className="space-y-2">
                  {additionalDirs.map((dir, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="../docs/"
                        value={dir}
                        onChange={(e) => updateDirectory(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDirectory(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addDirectory}>
                    Add Directory
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="defaultMode">Default Permission Mode</Label>
                <select
                  id="defaultMode"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("permissions.defaultMode")}
                >
                  <option value="">Default</option>
                  <option value="acceptEdits">Accept Edits</option>
                  <option value="askForEdits">Ask for Edits</option>
                  <option value="reviewEdits">Review Edits</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* MCP Settings */}
          <Card>
            <CardHeader>
              <CardTitle>MCP Configuration</CardTitle>
              <CardDescription>Model Context Protocol settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableAllProjectMcpServers"
                  {...register("enableAllProjectMcpServers")}
                />
                <Label htmlFor="enableAllProjectMcpServers">Enable all project MCP servers</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useEnterpriseMcpConfigOnly"
                  {...register("useEnterpriseMcpConfigOnly")}
                />
                <Label htmlFor="useEnterpriseMcpConfigOnly">Use enterprise MCP config only</Label>
              </div>

              <div>
                <Label>Enabled MCP Servers</Label>
                <Textarea
                  placeholder="memory, github"
                  {...register("enabledMcpjsonServers")}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of MCP servers to enable
                </p>
              </div>

              <div>
                <Label>Disabled MCP Servers</Label>
                <Textarea
                  placeholder="filesystem"
                  {...register("disabledMcpjsonServers")}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of MCP servers to disable
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AWS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AWS Configuration</CardTitle>
              <CardDescription>AWS authentication and credential settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="awsAuthRefresh">AWS Auth Refresh Script</Label>
                <Input
                  id="awsAuthRefresh"
                  placeholder="aws sso login --profile myprofile"
                  {...register("awsAuthRefresh")}
                />
              </div>

              <div>
                <Label htmlFor="awsCredentialExport">AWS Credential Export Script</Label>
                <Input
                  id="awsCredentialExport"
                  placeholder="/bin/generate_aws_grant.sh"
                  {...register("awsCredentialExport")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Line Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Status Line</CardTitle>
              <CardDescription>Custom status line configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="statusLineType">Status Line Type</Label>
                <select
                  id="statusLineType"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("statusLine.type")}
                >
                  <option value="">Disabled</option>
                  <option value="command">Command</option>
                  <option value="json">JSON</option>
                  <option value="text">Text</option>
                </select>
              </div>

              {watch("statusLine.type") === "command" && (
                <div>
                  <Label htmlFor="statusLineCommand">Command</Label>
                  <Input
                    id="statusLineCommand"
                    placeholder="~/.claude/statusline.sh"
                    {...register("statusLine.command")}
                  />
                </div>
              )}

              {watch("statusLine.type") === "text" && (
                <div>
                  <Label htmlFor="statusLineTemplate">Template</Label>
                  <Textarea
                    id="statusLineTemplate"
                    placeholder="Custom status line template"
                    {...register("statusLine.template")}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hooks Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Hooks</CardTitle>
              <CardDescription>Custom hooks configuration (JSON)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='{"PreToolUse": {"Bash": "echo \"Running command...\""}}'
                {...register("hooks")}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter hooks configuration as valid JSON
              </p>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || createStoreMutation.isPending || updateStoreMutation.isPending}>
              {isSubmitting || createStoreMutation.isPending || updateStoreMutation.isPending ? "Saving..." : isExistingStore ? "Update Store" : "Create Store"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </div>

          {/* Error and Success Messages */}
          {(createStoreMutation.error || updateStoreMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {createStoreMutation.error?.message || updateStoreMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}

          {(createStoreMutation.isSuccess || updateStoreMutation.isSuccess) && (
            <Alert>
              <AlertDescription>
                Store {isExistingStore ? "updated" : "created"} successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}
        </form>
    </div>
  );
}