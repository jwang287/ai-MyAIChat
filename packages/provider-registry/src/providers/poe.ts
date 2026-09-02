import type { ReasoningWireProfile } from '../schemas/reasoningWire'
import { defineProvider } from './types'
import { EFFORT, modeWire } from './wires'

const effortWire = modeWire(
  'extra_body.reasoning_effort',
  { off: 'none', auto: EFFORT, effort: EFFORT },
  { autoEffort: 'medium' }
)

const thinkingBudgetWire: ReasoningWireProfile = {
  auto: {
    operations: [{ target: 'extra_body.thinking_budget', value: { source: 'budget' } }],
    budget: { missing: { type: 'omit-mode' } }
  },
  effort: {
    operations: [{ target: 'extra_body.thinking_budget', value: { source: 'budget' } }],
    budget: { missing: { type: 'omit-mode' } }
  }
}

// Poe's Responses emulation breaks Claude streams, so official bots prefer Anthropic.
// The 4.5 line uses budget thinking; later models use effort controls.
const claudeModels: { apiModelId: string; modelId: string }[] = [
  { apiModelId: 'Claude-Opus-4.8', modelId: 'claude-opus-4-8' },
  { apiModelId: 'Claude-Opus-4.7', modelId: 'claude-opus-4-7' },
  { apiModelId: 'Claude-Opus-4.6', modelId: 'claude-opus-4-6' },
  { apiModelId: 'Claude-Sonnet-4.6', modelId: 'claude-sonnet-4-6' },
  { apiModelId: 'claude-opus-4.5', modelId: 'claude-opus-4-5' },
  { apiModelId: 'claude-sonnet-4.5', modelId: 'claude-sonnet-4-5' },
  { apiModelId: 'claude-haiku-4.5', modelId: 'claude-haiku-4-5' }
]

export default defineProvider({
  id: 'poe',
  name: 'Poe',
  defaultChatEndpoint: 'openai-responses',
  endpointConfigs: {
    'openai-responses': {
      adapterFamily: 'openai',
      baseUrl: 'https://api.poe.com/v1/',
      reasoningFormat: { type: 'openai-responses' }
    },
    'openai-chat-completions': {
      adapterFamily: 'openai-compatible',
      baseUrl: 'https://api.poe.com/v1/',
      // Poe silently ignores top-level reasoning_effort. Unknown/community bots
      // stay fail-closed until their custom parameter contract is known.
      reasoningFormat: { type: 'openai-chat', wire: { disabled: true } },
      dialect: { developerRole: false }
    },
    'anthropic-messages': {
      adapterFamily: 'anthropic',
      baseUrl: 'https://api.poe.com'
    }
  },
  metadata: {
    website: {
      apiKey: 'https://poe.com/api/keys',
      docs: 'https://creator.poe.com/docs',
      models: 'https://poe.com/api/models',
      official: 'https://poe.com/'
    }
  },
  overrides: [
    {
      apiModelId: 'GPT-5.4',
      modelId: 'gpt-5-4',
      reasoningContracts: {
        'openai-chat-completions': { wire: effortWire }
      }
    },
    {
      apiModelId: 'Gemini-3.1-Pro',
      modelId: 'gemini-3-1-pro-preview',
      reasoningContracts: {
        'openai-chat-completions': { wire: thinkingBudgetWire }
      }
    },
    ...claudeModels.map(({ apiModelId, modelId }) => ({
      apiModelId,
      modelId,
      endpointTypes: ['anthropic-messages' as const, 'openai-chat-completions' as const],
      reasoningContracts: {
        'openai-chat-completions': { wire: thinkingBudgetWire }
      }
    }))
  ]
})
