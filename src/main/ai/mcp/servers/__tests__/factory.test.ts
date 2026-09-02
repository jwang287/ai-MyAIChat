import type { McpServer } from '@shared/data/types/mcpServer'
import { BuiltinMcpServerNames } from '@shared/utils/mcp'
import { describe, expect, it } from 'vitest'

const { createInMemoryMcpServer, getBuiltinHttpHeaders } = await import('../factory')

const server = (overrides: Partial<McpServer>): McpServer =>
  ({ id: 'id', name: 'custom', type: 'stdio', isActive: true, ...overrides }) as McpServer

describe('getBuiltinHttpHeaders', () => {
  const qveris = (apiKey?: string) =>
    server({
      name: BuiltinMcpServerNames.qveris,
      type: 'streamableHttp',
      installSource: 'builtin',
      env: { QVERIS_API_KEY: apiKey ?? '' }
    })

  it('authenticates QVeris with the API key the user configured', () => {
    expect(getBuiltinHttpHeaders(qveris('secret'))).toEqual({ Authorization: 'Bearer secret' })
  })

  it('fails activation instead of connecting QVeris anonymously', () => {
    expect(() => getBuiltinHttpHeaders(qveris())).toThrow(/QVERIS_API_KEY/)
    expect(() => getBuiltinHttpHeaders(qveris('   '))).toThrow(/QVERIS_API_KEY/)
  })

  it('adds nothing for any other server', () => {
    expect(getBuiltinHttpHeaders(server({ name: BuiltinMcpServerNames.flomo, type: 'streamableHttp' }))).toEqual({})
    expect(
      getBuiltinHttpHeaders(
        server({ name: BuiltinMcpServerNames.qveris, type: 'streamableHttp', installSource: 'manual' })
      )
    ).toEqual({})
  })
})

describe('createInMemoryMcpServer', () => {
  it('rejects a name with no in-process implementation', async () => {
    await expect(createInMemoryMcpServer('missing-server')).rejects.toThrow(/Unknown in-memory MCP server/)
  })
})
