import { application } from '@application'
import { readMcpResourcePreview } from '@main/ai/mcp/resourcePreview'
import type { mcpRequestSchemas } from '@shared/ipc/schemas/mcp'
import type { IpcHandlersFor } from '@shared/ipc/types'

/**
 * MCP request handlers. Delegation spans three services: McpRuntimeService (server
 * lifecycle + queries) and McpToolCacheService (server.refresh_tools). The former
 * NonEmptyString guards now live in the route schemas. The server.added /
 * tool.call_progress / server.log events are emitted by the services, not here.
 */
export const mcpHandlers: IpcHandlersFor<typeof mcpRequestSchemas> = {
  // Server lifecycle + per-server queries.
  'mcp.server.remove': async ({ serverId }) => {
    await application.get('McpRuntimeService').removeServer(serverId)
  },
  'mcp.server.restart': async ({ serverId }) => {
    await application.get('McpRuntimeService').restartServer(serverId)
  },
  'mcp.server.stop': async ({ serverId }) => {
    await application.get('McpRuntimeService').stopServer(serverId)
  },
  'mcp.server.refresh_tools': async ({ serverId }) => {
    await application.get('McpToolCacheService').refreshTools(serverId)
  },
  'mcp.server.list_prompts': async ({ serverId }) => application.get('McpRuntimeService').listPrompts(serverId),
  'mcp.server.list_resources': async ({ serverId }) => application.get('McpRuntimeService').listResources(serverId),
  'mcp.server.get_prompt': async ({ serverId, name, args }) =>
    application.get('McpRuntimeService').getPrompt({ serverId, name, args }),
  'mcp.server.read_resource_preview': async ({ serverId, uri, maxChars }) =>
    readMcpResourcePreview({ serverId, uri, maxChars }),
  'mcp.server.check_connectivity': async ({ serverId }) =>
    application.get('McpRuntimeService').checkMcpConnectivity(serverId),
  'mcp.server.get_version': async ({ serverId }) => application.get('McpRuntimeService').getServerVersion(serverId),
  'mcp.server.get_logs': async ({ serverId }) => application.get('McpRuntimeService').getServerLogs(serverId),
  // In-flight tool-call control.
  'mcp.tool.abort_call': async ({ callId, scope }) => application.get('McpRuntimeService').abortTool(callId, scope)
}
