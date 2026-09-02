import { defineProvider } from './types'

export default defineProvider({
  id: 'aihubmix',
  name: 'AiHubMix',
  defaultChatEndpoint: 'openai-chat-completions',
  endpointConfigs: {
    'anthropic-messages': {
      adapterFamily: 'aihubmix',
      baseUrl: 'https://aihubmix.com'
    },
    'openai-chat-completions': {
      adapterFamily: 'aihubmix',
      baseUrl: 'https://aihubmix.com/v1'
    },
    'openai-responses': {
      adapterFamily: 'aihubmix',
      baseUrl: 'https://aihubmix.com/v1'
    },
    'google-generate-content': {
      adapterFamily: 'aihubmix',
      baseUrl: 'https://aihubmix.com/gemini/v1beta'
    }
  },
  // AiHubMix serves the vendors' native endpoints, so its language models carry
  // `aihubmix.<vendor>` provider strings and resolveToolCapability's aggregator fallback finds the
  // real vendor factory. `vendors` keeps the openai-compatible passthrough line (grok, deepseek,
  // qwen …) out — those resolve to `aihubmix.chat`, which owns no tool factory.
  metadata: {
    website: {
      apiKey: 'https://aihubmix.com',
      docs: 'https://doc.aihubmix.com/',
      models: 'https://aihubmix.com/models',
      official: 'https://aihubmix.com'
    }
  },
  overrides: []
})
