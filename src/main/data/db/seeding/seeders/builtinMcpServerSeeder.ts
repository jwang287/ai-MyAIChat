import { mcpServerTable } from '@data/db/schemas/mcpServer'
import { PRESET_MCP_SERVERS } from '@shared/data/presets/mcpServers'
import { and, eq } from 'drizzle-orm'

import type { DbType, ISeeder } from '../../types'
import { hashObject } from '../hashObject'

/**
 * Adopt the transport a builtin MCP server preset declares for rows that were installed
 * while it was still started in-process (`@cherry/flomo` and `@cherry/nowledge-mem` are HTTP
 * endpoints).
 *
 * Only explicit builtin rows are rewritten. Ambiguous rows without ownership,
 * already-migrated rows, and deleted builtins stay untouched.
 *
 * A rewritten row adopts the preset's connection wholesale — an edit to the retired transport's
 * command or args does not survive, because it describes a way of running the server that no
 * longer exists. Everything else the user owns (env, isActive, timeout, disabled tools) is kept.
 */
export class BuiltinMcpServerSeeder implements ISeeder {
  readonly name = 'builtinMcpServer'
  readonly description = 'Repoint installed builtin MCP servers that still use the retired in-memory transport'
  readonly version: string

  constructor() {
    this.version = hashObject(PRESET_MCP_SERVERS)
  }

  run(db: DbType): void {
    // One transaction for the whole catalog: a half-migrated set would leave some servers
    // pointing at a transport the runtime no longer implements.
    db.transaction((tx) => {
      for (const preset of PRESET_MCP_SERVERS) {
        if (preset.type === 'inMemory' || preset.type === undefined) continue

        const rows = tx
          .select()
          .from(mcpServerTable)
          .where(and(eq(mcpServerTable.name, preset.name), eq(mcpServerTable.type, 'inMemory')))
          .all()

        for (const row of rows) {
          if (row.installSource !== 'builtin') continue

          const transportFields =
            preset.type === 'stdio'
              ? {
                  baseUrl: null,
                  command: preset.command ?? null,
                  args: preset.args ?? null,
                  headers: null
                }
              : {
                  baseUrl: preset.baseUrl ?? null,
                  command: null,
                  registryUrl: null,
                  args: null,
                  headers: preset.headers ?? null
                }

          tx.update(mcpServerTable)
            .set({ type: preset.type, installSource: 'builtin', ...transportFields })
            .where(eq(mcpServerTable.id, row.id))
            .run()
        }
      }
    })
  }
}
