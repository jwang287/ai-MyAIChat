import { describe, expect, it } from 'vitest'

import { buildCitationsGuidance } from '../citationsGuidance'

describe('buildCitationsGuidance', () => {
  it('returns undefined when knowledge citations are unavailable', () => {
    expect(buildCitationsGuidance({ kb: false })).toBeUndefined()
  })

  it('mentions knowledge tools when they are available', () => {
    const out = buildCitationsGuidance({ kb: true })
    expect(out).toContain('mcp__cherry-tools__kb_search')
    expect(out).toContain('mcp__cherry-tools__kb_read')
    expect(out).toContain('[cite:ID]')
  })
})
