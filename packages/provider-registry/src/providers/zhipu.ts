import type { ReasoningSupport } from '../schemas/model'
import type { ReasoningWireProfile } from '../schemas/reasoningWire'
import { openaiCompatible } from './types'
import { modeWire } from './wires'

const thinkingWire: ReasoningWireProfile = modeWire('thinking.type', {
  off: 'disabled',
  auto: 'enabled',
  effort: 'enabled'
})

const glm52Support: ReasoningSupport = {
  controls: [{ kind: 'effort', values: ['none', 'high', 'max'], default: 'max' }],
  supportedEfforts: ['none', 'high', 'max'],
  defaultEffort: 'max'
}

const glm52Wire: ReasoningWireProfile = {
  off: { operations: [{ target: 'thinking.type', value: { source: 'literal', value: 'disabled' } }] },
  effort: {
    operations: [
      { target: 'thinking.type', value: { source: 'literal', value: 'enabled' } },
      { target: 'reasoningEffort', value: { source: 'effort' } }
    ]
  }
}

const glm53Wire: ReasoningWireProfile = {
  effort: {
    operations: [
      { target: 'thinking.type', value: { source: 'literal', value: 'enabled' } },
      { target: 'reasoningEffort', value: { source: 'effort' } }
    ]
  }
}

export default openaiCompatible({
  id: 'zhipu',
  name: 'ZhiPu',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
  reasoningFormat: {
    type: 'openai-chat',
    wire: thinkingWire
  },
  anthropic: 'https://open.bigmodel.cn/api/anthropic',
  // delivered by the zhipu transformRequestBody. `vendors` keeps other hosted
  // families (if any appear) from routing to a tool BigModel serves for GLM.
  website: {
    apiKey: 'https://open.bigmodel.cn/apikey/platform',
    docs: 'https://docs.bigmodel.cn/',
    models: 'https://open.bigmodel.cn/modelcenter/square',
    official: 'https://open.bigmodel.cn/'
  },
  overrides: [
    // BigModel serves these with a dotted version; generation derives the canonical key + apiModelId.
    ...['glm-5.2', 'glm-5.2-fast'].map((modelId) => ({
      modelId,
      reasoningContracts: {
        'openai-chat-completions': {
          support: glm52Support,
          wire: glm52Wire
        }
      }
    })),
    ...['glm-5.3', 'glm-5.3-flash'].map((modelId) => ({
      modelId,
      reasoningContracts: {
        'openai-chat-completions': {
          support: { defaultEffort: 'max' as const },
          wire: glm53Wire
        }
      }
    }))
  ]
})
