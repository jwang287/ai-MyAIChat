import { application } from '@application'
import { agentService } from '@data/services/AgentService'
import { AgentSessionDeliveryRoutingError, agentSessionMessageService } from '@data/services/AgentSessionMessageService'
import { agentSessionService } from '@data/services/AgentSessionService'
import { agentTaskService as taskService } from '@data/services/AgentTaskService'
import { loggerService } from '@logger'
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js'
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'
import {
  AgentSessionDeliveryStatusSchema,
  SESSION_CREATE_TOOL_NAME,
  SESSION_DELIVERIES_TOOL_NAME,
  SESSION_LIST_TOOL_NAME,
  SESSION_SEARCH_TOOL_NAME,
  SESSION_SEND_TOOL_NAME
} from '@shared/ai/agentSessionDelivery'
import { CONFIG_TOOL_NAME, CRON_TOOL_NAME } from '@shared/ai/builtinTools'
import type { AgentSessionWorkspaceSource } from '@shared/data/api/schemas/agentWorkspaces'
import type { Trigger } from '@shared/data/api/schemas/jobs'

const logger = loggerService.withContext('McpServer:CherryAutonomyTools')

export interface CherryAgentContext {
  agentId: string
  workspaceSource: AgentSessionWorkspaceSource
  workspacePath: string
  canAccessAllKnowledgeBases?: () => boolean
  getKnowledgeBaseIds: () => string[]
}

type CherryAutonomyContext = CherryAgentContext & { sessionId: string }

function parseDurationToMinutes(duration: string): number {
  let totalMinutes = 0
  const hourMatch = duration.match(/(\d+)\s*h/i)
  const minMatch = duration.match(/(\d+)\s*m/i)
  if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60
  if (minMatch) totalMinutes += parseInt(minMatch[1], 10)
  if (totalMinutes > 0) return totalMinutes
  const raw = parseInt(duration, 10)
  if (!isNaN(raw) && raw > 0) return raw
  throw new Error(`Invalid duration: "${duration}". Use formats like '30m', '2h', '1h30m'.`)
}

const CRON_TOOL: Tool = {
  name: CRON_TOOL_NAME,
  description:
    "Manage local scheduled tasks. Use action 'add' to create a recurring or one-time job, 'list' to see all jobs, or 'remove' to delete a job.",
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'list', 'remove'] },
      name: { type: 'string', description: 'Name of the job (required for add)' },
      message: { type: 'string', description: 'Prompt to execute on schedule (required for add)' },
      cron: { type: 'string', description: 'Cron expression (use cron OR every OR at)' },
      every: { type: 'string', description: 'Duration, e.g. 30m or 2h (use every OR cron OR at)' },
      at: { type: 'string', description: 'RFC3339 timestamp for a one-time job' },
      timeout_minutes: { type: 'number', description: 'Timeout in minutes before the task is aborted.' },
      id: { type: 'string', description: 'Job ID (required for remove)' }
    },
    required: ['action']
  }
}

const CONFIG_TOOL: Tool = {
  name: CONFIG_TOOL_NAME,
  description:
    "Inspect and manage your own agent configuration. Use 'status', 'rename', 'complete_bootstrap', or 'reset_bootstrap'.",
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['status', 'rename', 'complete_bootstrap', 'reset_bootstrap'] },
      name: { type: 'string', description: 'New agent display name, required for rename' }
    },
    required: ['action']
  }
}

const SESSION_LIST_TOOL: Tool = {
  name: SESSION_LIST_TOOL_NAME,
  description: 'List active Cherry Agent Sessions that can receive a message.',
  inputSchema: {
    type: 'object',
    properties: { agent_id: { type: 'string' }, cursor: { type: 'string' }, limit: { type: 'number' } }
  }
}
const SESSION_SEARCH_TOOL: Tool = {
  name: SESSION_SEARCH_TOOL_NAME,
  description: 'Search visible Cherry Agent Sessions by metadata and message evidence.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', maxLength: 4096 }, agent_id: { type: 'string' }, limit: { type: 'number' } },
    required: ['query']
  }
}
const SESSION_DELIVERIES_TOOL: Tool = {
  name: SESSION_DELIVERIES_TOOL_NAME,
  description: 'Inspect durable incoming or outgoing cross-Session requests and results.',
  inputSchema: {
    type: 'object',
    properties: {
      direction: { type: 'string', enum: ['incoming', 'outgoing'] },
      request_id: { type: 'string' },
      status: { type: 'string', enum: ['accepted', 'delivering', 'consumed', 'failed'] },
      limit: { type: 'number' }
    }
  }
}
const SESSION_CREATE_TOOL: Tool = {
  name: SESSION_CREATE_TOOL_NAME,
  description: 'Create a new Session for the current Agent and send its first durable message.',
  inputSchema: {
    type: 'object',
    properties: { message: { type: 'string' }, title: { type: 'string', maxLength: 255 } },
    required: ['message']
  }
}
const SESSION_SEND_TOOL: Tool = {
  name: SESSION_SEND_TOOL_NAME,
  description: 'Send a durable message to another Cherry Agent Session.',
  inputSchema: {
    type: 'object',
    properties: {
      target_session_id: { type: 'string' },
      message: { type: 'string' },
      reply: { type: 'string', enum: ['none', 'completion'] }
    },
    required: ['target_session_id', 'message']
  }
}
const AUTONOMY_TOOLS = [
  CRON_TOOL,
  CONFIG_TOOL,
  SESSION_LIST_TOOL,
  SESSION_SEARCH_TOOL,
  SESSION_CREATE_TOOL,
  SESSION_DELIVERIES_TOOL,
  SESSION_SEND_TOOL
] as const

export class CherryAutonomyTools {
  constructor(private readonly context: CherryAutonomyContext) {}

  tools(): Tool[] {
    return [...AUTONOMY_TOOLS]
  }
  handles(toolName: string): boolean {
    return AUTONOMY_TOOLS.some((tool) => tool.name === toolName)
  }

  async call(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
    try {
      switch (toolName) {
        case CRON_TOOL_NAME:
          return await this.callCron(args)
        case CONFIG_TOOL_NAME:
          return this.callConfig(args)
        case SESSION_LIST_TOOL_NAME:
          return this.listSessions(args)
        case SESSION_SEARCH_TOOL_NAME:
          return this.searchSessions(args)
        case SESSION_CREATE_TOOL_NAME:
          return this.createSession(args)
        case SESSION_DELIVERIES_TOOL_NAME:
          return this.listSessionDeliveries(args)
        case SESSION_SEND_TOOL_NAME:
          return this.sendSessionMessage(args)
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`Tool error: ${toolName}`, { agentId: this.context.agentId, error: message })
      if (error instanceof AgentSessionDeliveryRoutingError)
        return {
          content: [{ type: 'text', text: JSON.stringify({ ok: false, error: { code: error.code, message } }) }],
          isError: true
        }
      return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true }
    }
  }

  private async callCron(args: Record<string, unknown>): Promise<CallToolResult> {
    if (args.action === 'list')
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(taskService.listTasks(this.context.agentId, { limit: 100 }).tasks, null, 2)
          }
        ]
      }
    if (args.action === 'remove') {
      const id = typeof args.id === 'string' ? args.id : ''
      if (!id) throw new McpError(ErrorCode.InvalidParams, "'id' is required for remove")
      await application.get('AgentJobsService').deleteTask(this.context.agentId, id)
      return { content: [{ type: 'text', text: `Job removed: ${id}` }] }
    }
    if (args.action !== 'add') throw new McpError(ErrorCode.InvalidParams, 'Unknown action')
    const name = typeof args.name === 'string' ? args.name : ''
    const prompt = typeof args.message === 'string' ? args.message : ''
    if (!name || !prompt) throw new McpError(ErrorCode.InvalidParams, "'name' and 'message' are required for add")
    const choices = [args.cron, args.every, args.at].filter(Boolean)
    if (choices.length !== 1) throw new McpError(ErrorCode.InvalidParams, "Use exactly one of 'cron', 'every', or 'at'")
    let trigger: Trigger
    if (typeof args.cron === 'string') trigger = { kind: 'cron', expr: args.cron }
    else if (typeof args.every === 'string')
      trigger = { kind: 'interval', ms: parseDurationToMinutes(args.every) * 60_000 }
    else {
      const at = new Date(String(args.at)).getTime()
      if (isNaN(at)) throw new McpError(ErrorCode.InvalidParams, 'Invalid timestamp')
      trigger = { kind: 'once', at }
    }
    const timeoutMinutes =
      typeof args.timeout_minutes === 'number' && args.timeout_minutes > 0 ? args.timeout_minutes : undefined
    const task = application.get('AgentJobsService').createTask(this.context.agentId, {
      name,
      prompt,
      trigger,
      workspace: this.context.workspaceSource,
      timeoutMinutes
    })
    return { content: [{ type: 'text', text: `Job created:\n${JSON.stringify(task, null, 2)}` }] }
  }

  private callConfig(args: Record<string, unknown>): CallToolResult {
    const agent = agentService.getAgent(this.context.agentId)
    if (!agent) throw new McpError(ErrorCode.InternalError, `Agent not found: ${this.context.agentId}`)
    switch (args.action) {
      case 'status':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  agentId: agent.id,
                  name: agent.name,
                  model: agent.model,
                  heartbeat_enabled: agent.configuration?.heartbeat_enabled ?? false
                },
                null,
                2
              )
            }
          ]
        }
      case 'rename': {
        const name = typeof args.name === 'string' ? args.name.trim() : ''
        if (!name) throw new McpError(ErrorCode.InvalidParams, "'name' is required for rename")
        agentService.updateAgent(agent.id, { name })
        return { content: [{ type: 'text', text: `Agent renamed to ${name}.` }] }
      }
      case 'complete_bootstrap':
        agentService.updateAgent(agent.id, { configuration: { ...agent.configuration, bootstrap_completed: true } })
        return { content: [{ type: 'text', text: 'Bootstrap completed.' }] }
      case 'reset_bootstrap':
        agentService.updateAgent(agent.id, { configuration: { ...agent.configuration, bootstrap_completed: false } })
        return { content: [{ type: 'text', text: 'Bootstrap reset.' }] }
      default:
        throw new McpError(ErrorCode.InvalidParams, 'Unknown action')
    }
  }

  private assertSessionToolsAuthorized(): void {
    const session = agentSessionService.getById(this.context.sessionId)
    if (session.agentId !== this.context.agentId)
      throw new AgentSessionDeliveryRoutingError('SENDER_FORBIDDEN', 'The active runtime no longer owns this Session')
    const interaction = application.get('AgentSessionRuntimeService').getInteractionState(this.context.sessionId)
    if (interaction.currentTurn === 'headless' || interaction.userResponse === 'unavailable')
      throw new AgentSessionDeliveryRoutingError(
        'SESSION_TOOL_FORBIDDEN',
        'Cross-Session discovery and delegation require an interactive user turn'
      )
  }

  private listSessions(args: Record<string, unknown>): CallToolResult {
    this.assertSessionToolsAuthorized()
    const limit = typeof args.limit === 'number' ? Math.min(Math.max(Math.trunc(args.limit), 1), 100) : 50
    const page = agentSessionService.listAddressableByCursor({
      agentId: typeof args.agent_id === 'string' ? args.agent_id.trim() || undefined : undefined,
      cursor: typeof args.cursor === 'string' ? args.cursor.trim() || undefined : undefined,
      limit
    })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sessions: page.items.map((session) => ({
              ...session,
              isCurrent: session.sessionId === this.context.sessionId
            })),
            nextCursor: page.nextCursor
          })
        }
      ]
    }
  }

  private searchSessions(args: Record<string, unknown>): CallToolResult {
    this.assertSessionToolsAuthorized()
    const query = typeof args.query === 'string' ? args.query.trim() : ''
    if (!query || query.length > 4096)
      throw new McpError(ErrorCode.InvalidParams, "'query' is required and must be at most 4096 characters")
    const limit = typeof args.limit === 'number' ? Math.min(Math.max(Math.trunc(args.limit), 1), 100) : 20
    const sessions = agentSessionMessageService.searchRanked({
      q: query,
      limit,
      agentId: typeof args.agent_id === 'string' ? args.agent_id.trim() || undefined : undefined,
      addressableOnly: true
    })
    return { content: [{ type: 'text', text: JSON.stringify({ sessions }) }] }
  }

  private listSessionDeliveries(args: Record<string, unknown>): CallToolResult {
    this.assertSessionToolsAuthorized()
    const status = args.status === undefined ? undefined : AgentSessionDeliveryStatusSchema.parse(args.status)
    const direction = args.direction === undefined ? 'incoming' : args.direction
    if (direction !== 'incoming' && direction !== 'outgoing')
      throw new McpError(ErrorCode.InvalidParams, "invalid 'direction'")
    const limit = typeof args.limit === 'number' ? Math.min(Math.max(Math.trunc(args.limit), 1), 100) : 20
    const deliveries = agentSessionMessageService.listSessionDeliveries({
      sessionId: this.context.sessionId,
      direction,
      requestId: typeof args.request_id === 'string' ? args.request_id.trim() || undefined : undefined,
      status,
      limit
    })
    return { content: [{ type: 'text', text: JSON.stringify({ deliveries }) }] }
  }

  private createSession(args: Record<string, unknown>): CallToolResult {
    this.assertSessionToolsAuthorized()
    const content = typeof args.message === 'string' ? args.message.trim() : ''
    const title = typeof args.title === 'string' ? args.title.trim() : ''
    if (!content || title.length > 255)
      throw new McpError(ErrorCode.InvalidParams, "'message' is required and title must be at most 255 characters")
    const created = application.get('AgentSessionDeliveryService').acceptWithNewSession({
      senderAgentId: this.context.agentId,
      senderSessionId: this.context.sessionId,
      sessionName: title,
      workspace: this.context.workspaceSource,
      content
    })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ok: true,
            agentId: created.session.agentId,
            sessionId: created.session.id,
            requestId: created.message.id,
            delivery: created.message.delivery
          })
        }
      ]
    }
  }

  private sendSessionMessage(args: Record<string, unknown>): CallToolResult {
    this.assertSessionToolsAuthorized()
    const receiverSessionId = typeof args.target_session_id === 'string' ? args.target_session_id.trim() : ''
    const content = typeof args.message === 'string' ? args.message.trim() : ''
    const reply = args.reply === undefined ? 'none' : args.reply
    if (!receiverSessionId || !content || (reply !== 'none' && reply !== 'completion'))
      throw new McpError(ErrorCode.InvalidParams, 'Invalid target_session_id, message, or reply')
    const accepted = application.get('AgentSessionDeliveryService').accept({
      senderAgentId: this.context.agentId,
      senderSessionId: this.context.sessionId,
      receiverSessionId,
      content,
      replyPolicy: reply
    })
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, requestId: accepted.id, status: 'accepted', delivery: accepted.delivery })
        }
      ]
    }
  }
}
