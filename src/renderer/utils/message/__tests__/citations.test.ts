import type { CherryMessagePart } from '@shared/data/types/message'
import { describe, expect, it } from 'vitest'

import {
  resolveMessageCitations,
  stripCitationMarkers,
  toExportableCitations,
  withToolCitationTags
} from '../citations'

const kbResults = (prefix: string) => [
  { id: `${prefix}-1`, conceptId: 'doc/one.md', title: 'One.md', type: 'file', content: 'kb chunk', score: 0.9 }
]

const kbToolPart = (results: unknown): CherryMessagePart =>
  ({
    type: 'tool-kb_search',
    toolCallId: 'c2',
    state: 'output-available',
    input: { query: 'q', baseIds: ['b'] },
    output: results
  }) as never

const kbReadPart = (output: unknown, toolCallId = 'c5'): CherryMessagePart =>
  ({
    type: 'tool-kb_read',
    toolCallId,
    state: 'output-available',
    input: { baseId: 'b', conceptId: 'doc/two.md' },
    output
  }) as never

const kbReadOutput = (id: string | undefined, overrides: Record<string, unknown> = {}) => ({
  ...(id === undefined ? {} : { id }),
  conceptId: 'doc/two.md',
  title: 'Two.md',
  type: 'file',
  totalChars: 10,
  charStart: 0,
  charEnd: 10,
  content: 'read slice',
  truncated: false,
  ...overrides
})

const kbGrepOutput = (id: string) => ({
  id,
  conceptId: 'doc/three.md',
  title: 'Three.md',
  type: 'file',
  totalMatches: 2,
  matches: [
    { line: 3, charStart: 10, charEnd: 20, snippet: 'first hit' },
    { line: 9, charStart: 40, charEnd: 50, snippet: 'second hit' }
  ]
})

const dynamicMcpPart = (toolName: string, content: unknown, serverName = 'cherry-tools'): CherryMessagePart =>
  ({
    type: 'dynamic-tool',
    toolName,
    toolCallId: 'c3',
    state: 'output-available',
    input: { query: 'q' },
    output: { content, metadata: { type: 'mcp', serverName } }
  }) as never

const sourceUrlPart = (n: number, url: string, title?: string): CherryMessagePart =>
  ({ type: 'source-url', sourceId: `citation-${n}`, url, title }) as never

const textPart = (text: string): CherryMessagePart => ({ type: 'text', text }) as never

describe('resolveMessageCitations', () => {
  it('resolves agent dynamic-tool parts with MCP-wrapped output', () => {
    const mc = resolveMessageCitations([dynamicMcpPart('mcp__cherry-tools__kb_search', kbResults('qqq'))])
    expect(mc.byId.get('qqq-1')).toMatchObject({ type: 'knowledge', content: 'kb chunk' })
  })

  it('collects provider-native source-url parts keyed by their marker numbers', () => {
    const mc = resolveMessageCitations([sourceUrlPart(0, 'https://s.com/1', 'S1'), sourceUrlPart(1, 'https://s.com/2')])
    expect(mc.byMarkerNumber.get(1)).toMatchObject({ url: 'https://s.com/1', title: 'S1' })
    expect(mc.byMarkerNumber.get(2)).toMatchObject({ url: 'https://s.com/2', title: 's.com' })
  })

  it('resolves a kb_read slice as one document-level citation', () => {
    const mc = resolveMessageCitations([kbReadPart(kbReadOutput('rrr-1'))])
    expect(mc.all).toHaveLength(1)
    expect(mc.byId.get('rrr-1')).toMatchObject({ number: 1, title: 'Two.md', url: '', type: 'knowledge' })
  })

  it('resolves an MCP-wrapped kb_read slice from the agent path', () => {
    const mc = resolveMessageCitations([dynamicMcpPart('mcp__cherry-tools__kb_read', kbReadOutput('rrr-1'))])
    expect(mc.byId.get('rrr-1')).toMatchObject({ title: 'Two.md', content: 'read slice', type: 'knowledge' })
  })

  it('joins grep match snippets into the citation preview', () => {
    const mc = resolveMessageCitations([kbReadPart(kbGrepOutput('ggg-1'))])
    expect(mc.byId.get('ggg-1')).toMatchObject({ title: 'Three.md', content: 'first hit … second hit' })
  })

  it('truncates a long read slice to a tooltip-sized snippet', () => {
    const mc = resolveMessageCitations([kbReadPart(kbReadOutput('rrr-1', { content: 'x'.repeat(2000) }))])
    expect(mc.byId.get('rrr-1')?.content).toBe(`${'x'.repeat(300)}…`)
  })

  it('aliases a document to its existing citation when kb_search already returned it', () => {
    const mc = resolveMessageCitations([
      kbToolPart(kbResults('sss')),
      kbReadPart(kbReadOutput('rrr-1', { conceptId: 'doc/one.md' }))
    ])
    expect(mc.all).toHaveLength(1)
    expect(mc.byId.get('rrr-1')).toBe(mc.byId.get('sss-1'))
  })

  it('keeps same-path documents from different bases apart', () => {
    // conceptId is a base-relative path, so two bases can each hold a `README.md`.
    // Deduping on it alone aliased the second base's hit onto the first document.
    const mc = resolveMessageCitations([
      kbToolPart([
        { id: 'kkk-1', baseId: 'base-a', conceptId: 'README.md', title: 'README', content: 'from A', score: 0.9 },
        { id: 'kkk-2', baseId: 'base-b', conceptId: 'README.md', title: 'README', content: 'from B', score: 0.8 }
      ])
    ])
    expect(mc.all).toHaveLength(2)
    expect(mc.byId.get('kkk-1')).not.toBe(mc.byId.get('kkk-2'))
    expect(mc.all.map((citation) => citation.content)).toEqual(['from A', 'from B'])
  })

  it('still dedupes one base’s document across a search and a read', () => {
    const mc = resolveMessageCitations([
      kbToolPart([
        { id: 'kkk-1', baseId: 'base-a', conceptId: 'README.md', title: 'README', content: 'chunk', score: 0.9 }
      ]),
      kbReadPart(kbReadOutput('rrr-1', { baseId: 'base-a', conceptId: 'README.md' }))
    ])
    expect(mc.all).toHaveLength(1)
    expect(mc.byId.get('rrr-1')).toBe(mc.byId.get('kkk-1'))
  })

  it('dedupes on conceptId alone for results persisted before baseId existed', () => {
    const mc = resolveMessageCitations([
      kbToolPart([
        { id: 'kkk-1', conceptId: 'README.md', title: 'README', content: 'first', score: 0.9 },
        { id: 'kkk-2', conceptId: 'README.md', title: 'README', content: 'second', score: 0.8 }
      ])
    ])
    expect(mc.all).toHaveLength(1)
  })

  it('skips kb_read results persisted before citation ids existed', () => {
    const mc = resolveMessageCitations([kbReadPart(kbReadOutput(undefined))])
    expect(mc.all).toHaveLength(0)
  })

  it('skips kb_read error and no-match outputs', () => {
    const mc = resolveMessageCitations([
      // The assistant path persists the raw core result, the agent path the steer text.
      kbReadPart({ error: 'Knowledge base "b" is not available to this assistant.' }),
      kbReadPart({ ...kbGrepOutput('ggg-1'), totalMatches: 0, matches: [] }, 'c6'),
      kbReadPart('No matches for that pattern in "doc/three.md".', 'c7')
    ])
    expect(mc.all).toHaveLength(0)
  })
})

describe('withToolCitationTags', () => {
  it('collapses adjacent markers that resolve to the same source', () => {
    // Two chunks of one document dedupe to a single citation, so the chained markers the model
    // wrote would otherwise render as the same badge twice.
    const mc = resolveMessageCitations([
      kbToolPart([
        { id: 'sss-1', conceptId: 'doc/one.md', title: 'One.md', type: 'file', content: 'first', score: 0.9 },
        { id: 'sss-2', conceptId: 'doc/one.md', title: 'One.md', type: 'file', content: 'second', score: 0.8 }
      ])
    ])
    const { content, cited } = withToolCitationTags('KB fact. [cite:sss-1][cite:sss-2]', mc)

    expect(content.match(/>1<\/sup>/g)).toHaveLength(1)
    expect(cited).toHaveLength(1)
  })

  it('drops every marker when the message carries no citation at all', () => {
    const mc = resolveMessageCitations([textPart('no tool ran in this message')])
    const { content, cited } = withToolCitationTags(
      '1. 工程立项审计；[cite:2598d0ab-1]\n2. 工程采购审计；[cite:2598d0ab-1]',
      mc
    )
    expect(content).toBe('1. 工程立项审计；\n2. 工程采购审计；')
    expect(cited).toHaveLength(0)
  })

  it('resolves provider-native [N] markers from source-url parts', () => {
    const mc = resolveMessageCitations([sourceUrlPart(0, 'https://s.com/1', 'S1')])
    const { content, cited } = withToolCitationTags('Grounded fact. [1]', mc)
    expect(content).toContain('1</sup>](https://s.com/1)')
    expect(cited.map((c) => c.title)).toEqual(['S1'])
  })
})

describe('toExportableCitations', () => {
  it('strips markers even when the message carries no tool results', () => {
    const { content } = toExportableCitations('Claim [cite:abc-1].', [textPart('hi')])
    expect(content).toBe('Claim.')
  })

  it('collapses repeat markers the way the rendered badges do', () => {
    const parts = [
      kbToolPart([
        { id: 'sss-1', baseId: 'b', conceptId: 'doc/one.md', title: 'One.md', content: 'first', score: 0.9 },
        { id: 'sss-2', baseId: 'b', conceptId: 'doc/one.md', title: 'One.md', content: 'second', score: 0.8 }
      ])
    ]
    const { content, cited } = toExportableCitations('KB fact. [cite:sss-1][cite:sss-2]', parts)

    expect(content).toBe('KB fact. [1]')
    expect(cited).toHaveLength(1)
  })
})

describe('stripCitationMarkers', () => {
  // Used for text outside the numbered answer — reasoning traces above all — where resolving
  // would either restart at [1] or emit numbers that contradict the answer body.
  it('removes every marker along with its separating space', () => {
    expect(stripCitationMarkers('Prices rose. [cite:abc-1] Demand fell. [cite:abc-2]')).toBe(
      'Prices rose. Demand fell.'
    )
  })

  it('removes chained markers without leaving a gap', () => {
    expect(stripCitationMarkers('Both agree. [cite:abc-1][cite:def-3]')).toBe('Both agree.')
  })

  it('leaves text without markers untouched, including plain bracket numbers', () => {
    expect(stripCitationMarkers('Plain reasoning about [1] and [brackets].')).toBe(
      'Plain reasoning about [1] and [brackets].'
    )
  })

  it('preserves canonical markers in inline and fenced code', () => {
    const input = '`[cite:abc-1]`\n```txt\n[cite:def-2, def-3]\n```\nOutside [cite:abc-1, abc-2]'
    expect(stripCitationMarkers(input)).toBe('`[cite:abc-1]`\n```txt\n[cite:def-2, def-3]\n```\nOutside')
  })
})
