/**
 * Runtime-neutral inline-citation guidance for agent sessions, appended to the system prompt
 * only when the resolved knowledge scope is non-empty — a static binding or a
 * per-turn composer selection.
 * Mirrors the assistant-path `CITATIONS_SYSTEM_PROMPT`
 * (`../aiSdk/prompts/citations.ts`); the `[cite:id]` markers are resolved by
 * the renderer against the message's own tool results.
 */

import { toCherryBuiltinRuntimeName } from '@main/ai/toolApproval/builtinToolPolicy'
import { KB_READ_TOOL_NAME, KB_SEARCH_TOOL_NAME } from '@shared/ai/builtinTools'

const CHERRY_KB_SEARCH_RUNTIME_NAME = toCherryBuiltinRuntimeName(KB_SEARCH_TOOL_NAME)
const CHERRY_KB_READ_RUNTIME_NAME = toCherryBuiltinRuntimeName(KB_READ_TOOL_NAME)

export interface CitationsGuidanceOptions {
  kb: boolean
}

export function buildCitationsGuidance({ kb }: CitationsGuidanceOptions): string | undefined {
  if (!kb) return undefined
  const tools = `\`${CHERRY_KB_SEARCH_RUNTIME_NAME}\` / \`${CHERRY_KB_READ_RUNTIME_NAME}\``
  return `## Citations

Results from ${tools} each carry an \`id\` field. When a statement in your reply is based on one of those results, append a citation marker immediately after it: [cite:ID] with the exact id (e.g. "Prices rose 3% in June. [cite:3f2a1b9c-2]"). Chain markers when several results support one statement: [cite:3f2a1b9c-1][cite:7d4e0a51-3]. Copy ids exactly — never invent or renumber them — and do not add a "References" or "Sources" section: the app renders citations from the inline markers.`
}
