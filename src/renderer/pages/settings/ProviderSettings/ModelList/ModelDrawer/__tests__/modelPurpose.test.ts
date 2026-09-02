import { ENDPOINT_TYPE, MODALITY, MODEL_CAPABILITY } from '@shared/data/types/model'
import { describe, expect, it } from 'vitest'

import {
  applyModelPurpose,
  getInitialChatEndpointType,
  getModelDrawerMode,
  getProviderChatEndpointTypes,
  inferModelPurpose,
  type ModelPurposeFields
} from '../modelPurpose'

describe('getModelDrawerMode', () => {
  it.each([
    [{ id: 'custom-provider', presetProviderId: undefined }, 'purpose'],
    [{ id: 'new-api', presetProviderId: 'new-api' }, 'endpoint-types'],
    [{ id: 'custom-new-api', presetProviderId: 'new-api' }, 'endpoint-types'],
    [{ id: 'cherryin', presetProviderId: 'cherryin' }, 'endpoint-types'],
    [{ id: 'custom-cherryin', presetProviderId: 'cherryin' }, 'endpoint-types'],
    [{ id: 'aionly', presetProviderId: 'aionly' }, 'endpoint-types'],
    [{ id: 'openai', presetProviderId: undefined }, 'legacy'],
    [{ id: 'openai', presetProviderId: 'openai' }, 'legacy'],
    [{ id: 'custom-anthropic', presetProviderId: 'anthropic' }, 'legacy']
  ] as const)('returns %s for %o', (provider, expected) => {
    expect(getModelDrawerMode(provider)).toBe(expected)
  })
})

describe('getProviderChatEndpointTypes', () => {
  it('returns a single configured text endpoint', () => {
    expect(
      getProviderChatEndpointTypes({
        defaultChatEndpoint: ENDPOINT_TYPE.ANTHROPIC_MESSAGES,
        endpointConfigs: {
          [ENDPOINT_TYPE.ANTHROPIC_MESSAGES]: { baseUrl: 'https://example.com' }
        }
      })
    ).toEqual([ENDPOINT_TYPE.ANTHROPIC_MESSAGES])
  })

  it('puts the default endpoint first and preserves the remaining configuration order', () => {
    expect(
      getProviderChatEndpointTypes({
        defaultChatEndpoint: ENDPOINT_TYPE.OPENAI_RESPONSES,
        endpointConfigs: {
          [ENDPOINT_TYPE.ANTHROPIC_MESSAGES]: {},
          [ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS]: {},
          [ENDPOINT_TYPE.OPENAI_RESPONSES]: {},
          [ENDPOINT_TYPE.GOOGLE_GENERATE_CONTENT]: {}
        }
      })
    ).toEqual([
      ENDPOINT_TYPE.OPENAI_RESPONSES,
      ENDPOINT_TYPE.ANTHROPIC_MESSAGES,
      ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS,
      ENDPOINT_TYPE.GOOGLE_GENERATE_CONTENT
    ])
  })
})

describe('model purpose mapping', () => {
  it('preserves fields until a chat protocol is explicitly selected', () => {
    const endpointTypes = [ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS, ENDPOINT_TYPE.ANTHROPIC_MESSAGES]
    const fields: ModelPurposeFields = {
      endpointTypes,
      capabilities: [MODEL_CAPABILITY.REASONING]
    }

    expect(inferModelPurpose(fields)).toBe('chat')
    expect(getInitialChatEndpointType(fields)).toBe(ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS)
    expect(fields.endpointTypes).toBe(endpointTypes)
  })

  it('uses the selected chat endpoint while preserving independent fields', () => {
    const result = applyModelPurpose(
      {
        endpointTypes: [ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS],
        capabilities: [MODEL_CAPABILITY.REASONING],
        inputModalities: [MODALITY.TEXT],
        outputModalities: [MODALITY.TEXT]
      },
      'chat',
      { chatEndpointType: ENDPOINT_TYPE.ANTHROPIC_MESSAGES }
    )

    expect(result).toEqual({
      endpointTypes: [ENDPOINT_TYPE.ANTHROPIC_MESSAGES],
      capabilities: [MODEL_CAPABILITY.REASONING],
      inputModalities: [MODALITY.TEXT],
      outputModalities: [MODALITY.TEXT]
    })
  })
})
