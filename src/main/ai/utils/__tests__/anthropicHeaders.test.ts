import { describe, expect, it } from 'vitest'

import { makeModel, makeProvider } from '../../__tests__/fixtures'
import { addAnthropicHeaders } from '../anthropicHeaders'

const claudeModel = () =>
  makeModel({ id: 'anthropic::claude-sonnet-4-5-20250101', providerId: 'anthropic', name: 'Claude 4.5 Sonnet' })

describe('addAnthropicHeaders', () => {
  it('adds interleaved-thinking beta for Claude 4.5 reasoning on direct Anthropic', () => {
    const headers = addAnthropicHeaders(claudeModel(), makeProvider({ id: 'anthropic', name: 'Anthropic' }))
    expect(headers).toContain('interleaved-thinking-2025-05-14')
  })

  it('skips interleaved-thinking on Bedrock', () => {
    const headers = addAnthropicHeaders(
      claudeModel(),
      makeProvider({ id: 'aws-bedrock', presetProviderId: 'aws-bedrock', authType: 'iam-aws' })
    )
    expect(headers).not.toContain('interleaved-thinking-2025-05-14')
  })

  it('returns an empty list for non-qualifying model/provider combos', () => {
    const headers = addAnthropicHeaders(makeModel(), makeProvider({ id: 'openai' }))
    expect(headers).toEqual([])
  })
})
