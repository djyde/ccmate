import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLinkIcon, HammerIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useGlobalMcpServers, useUpdateGlobalMcpServer, type McpServer } from "@/lib/query";
import { toast } from "sonner";
import { openUrl } from "@tauri-apps/plugin-opener";
import { match } from "ts-pattern";

function MCPPageContent() {
  const { data: mcpServers } = useGlobalMcpServers();
  const updateMcpServer = useUpdateGlobalMcpServer();
  const [serverConfigs, setServerConfigs] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfigChange = (serverName: string, configText: string) => {
    setServerConfigs(prev => ({
      ...prev,
      [serverName]: configText
    }));
  };

  const handleSaveConfig = (serverName: string) => {
    const configText = serverConfigs[serverName];
    if (!configText) return;

    try {
      const configObject = JSON.parse(configText);
      updateMcpServer.mutate({
        serverName,
        serverConfig: configObject
      });
    } catch (error) {
      toast.error(`Invalid JSON configuration for ${serverName}`);
    }
  };


  const formatConfigForDisplay = (server: McpServer): string => {
    return JSON.stringify(server, null, 2);
  };

  const serverEntries = Object.entries(mcpServers || {});

  return (
    <div className="">
      <div className="flex items-center p-3 border-b px-3 justify-between sticky top-0 bg-background z-10" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h3 className="font-bold" data-tauri-drag-region>MCP</h3>
          <p className="text-sm text-muted-foreground" data-tauri-drag-region>
            Claude Code 全局 MCP 服务配置
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground" size="sm">
              <PlusIcon size={14} />
              添加 MCP 服务
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[700px] h-[500px]">
            <DialogHeader>
              <DialogTitle className="text-primary text-sm">添加 MCP 服务</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                添加全局 MCP 服务，可跨项目使用
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 mt-3">
              <MCPCreatePanel />
            </div>
            {/* <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                关闭
              </Button>
            </div> */}
          </DialogContent>
        </Dialog>
      </div>
      <div className="">
        {serverEntries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No MCP servers configured. Click "添加 MCP 服务" to add one.
          </div>
        ) : (
          <Accordion type="multiple" className="">
            {serverEntries.map(([serverName, serverConfig]) => (
              <AccordionItem key={serverName} value={serverName} className="bg-zinc-50">
                <AccordionTrigger className="hover:no-underline px-4 py-2 bg-zinc-50 hover:bg-zinc-100  duration-150">
                  <div className="flex items-center gap-2">
                    <HammerIcon size={12} />
                    <span className="font-medium">{serverName}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="px-3 pt-3 space-y-3">
                    <textarea
                      value={serverConfigs[serverName] || formatConfigForDisplay(serverConfig)}
                      onChange={(e) => handleConfigChange(serverName, e.target.value)}
                      placeholder="Enter MCP server configuration as JSON"
                      className="min-h-[100px] w-full p-2 text-md outline-none resize-none bg-white rounded-lg"
                      spellCheck={false}
                    />
                    <div className="flex  bg-zinc-50">
                      <Button
                        variant="outline"
                        onClick={() => handleSaveConfig(serverName)}
                        disabled={updateMcpServer.isPending}
                        size="sm"
                      >
                        <SaveIcon size={14} className="" />
                        {updateMcpServer.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

export function MCPPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading MCP servers...</div>
      </div>
    }>
      <MCPPageContent />
    </Suspense>
  );
}

const builtInMcpServers = [
  {
    name: "exa",
    source: "https://docs.exa.ai/reference/exa-mcp",
    description: "fast, efficient web context for coding agents",
    prefill: ``
  },
  {
    name: "context7",
    source: "https://github.com/upstash/context7",
    description: "Up-to-date code documentation for LLMs and AI code editors",
    prefill: ``
  },
  {
    name: "github",
    source: "https://github.com/github/github-mcp-server",
    description: "GitHub's official MCP Server",
    prefill: ``
  }
];

function MCPCreatePanel() {
  const [currentTab, setCurrentTab] = useState<("recommend" | "manual")>("recommend");

  return (
    <div className="">
      <div className="flex mb-3 gap-1">
        <Button size="sm" variant={
          currentTab === "recommend" ? "secondary" : "ghost"
        } className="text-sm" onClick={() => setCurrentTab("recommend")}>
          推荐
        </Button>
        <Button size="sm" variant={
          currentTab === "manual" ? "secondary" : "ghost"
        } className="text-sm" onClick={() => setCurrentTab("manual")}>
          自定义
        </Button>
      </div>

      {match(currentTab)
        .with("recommend", ()=> {
          return (
            <div className="grid grid-cols-3 gap-5">
            {builtInMcpServers.map((mcpServer) => (
              <a role="button" key={mcpServer.name} className="border p-3 rounded-md h-[120px] flex justify-between flex-col hover:bg-primary/10 hover:border-primary/20 hover:text-primary">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-primary">{mcpServer.name}</h3>
                  <a onClick={e => {
                    e.stopPropagation()
                    openUrl(mcpServer.source)
                  }} className="text-sm text-muted-foreground flex items-center gap-1 hover:underline">
                    <ExternalLinkIcon size={12} />
                    Source
                  </a>
                </div>
                <div>
    
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{mcpServer.description}</p>
                  {/* <Button size="sm" variant="outline" className="w-full text-sm">
                    <PlusIcon />
                    添加
                  </Button> */}
                </div>
              </a>
            ))}
          </div>
          )
        })
        .with("manual", ()=> {
          return (
            <div className="">
              <p>手动安装</p>
            </div>
          )
        })
        .exhaustive()
      }
    </div>
  );
}