export const builtInMcpServers = [
  {
    name: "exa",
    source: "https://docs.exa.ai/reference/exa-mcp",
    description: "fast, efficient web context for coding agents",
    prefill: `"exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp",
      "headers": {}
    }`
  },
  {
    name: "context7",
    source: "https://github.com/upstash/context7",
    description: "Up-to-date code documentation for LLMs and AI code editors",
    prefill: `"context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": ""
      }
    }`
  },
  {
    name: "github",
    source: "https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md",
    description: "GitHub's official MCP Server",
    prefill: `"github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer <YOUR_GITHUB_TOKEN>"
      }
    }`
  }
];
