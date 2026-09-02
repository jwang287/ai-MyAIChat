import { describe, expect, it } from 'vitest'

import { mergeMeta, parseOrEntry } from '../upstream'

describe('mergeMeta', () => {
  it('does not widen an earlier reasoning vocabulary with later source values', () => {
    const result = mergeMeta(
      {
        reasoning: {
          supportedEfforts: ['none', 'low', 'high', 'max'],
          controls: [
            { kind: 'effort', values: ['none', 'low', 'high', 'max'], default: 'low' },
            { kind: 'budget', min: 1_024, max: 32_768, default: 8_192 }
          ]
        }
      },
      {
        reasoning: {
          supportedEfforts: ['xhigh', 'high'],
          controls: [
            { kind: 'effort', values: ['xhigh', 'high'], default: 'xhigh' },
            { kind: 'budget', min: 1, max: 100_000, default: 1 }
          ]
        }
      }
    )

    expect(result.reasoning).toEqual({
      supportedEfforts: ['none', 'low', 'high', 'max'],
      controls: [
        { kind: 'effort', values: ['none', 'low', 'high', 'max'], default: 'low' },
        { kind: 'budget', min: 1_024, max: 32_768, default: 8_192 }
      ]
    })
  })

  it('fills reasoning control kinds missing from the earlier source', () => {
    const result = mergeMeta(
      { reasoning: { controls: [{ kind: 'effort', values: ['low', 'high'] }] } },
      { reasoning: { controls: [{ kind: 'budget', min: 1_024, max: 65_536 }] } }
    )

    expect(result.reasoning?.controls).toEqual([
      { kind: 'effort', values: ['low', 'high'] },
      { kind: 'budget', min: 1_024, max: 65_536 }
    ])
  })
})

describe('parseOrEntry', () => {
  it('preserves image input metadata from OpenRouter catalog entries', () => {
    expect(
      parseOrEntry({
        name: 'Sourceful: Riverflow V2.5 Fast',
        architecture: {
          input_modalities: ['text', 'image'],
          output_modalities: ['image']
        },
        supported_parameters: {
          resolution: { type: 'enum', values: ['1K', '2K', '4K'] },
          seed: { type: 'boolean' }
        }
      })
    ).toEqual({
      name: 'Sourceful: Riverflow V2.5 Fast',
      capabilities: ['image-recognition'],
      inputModalities: ['text', 'image'],
      outputModalities: ['image']
    })
  })
})
