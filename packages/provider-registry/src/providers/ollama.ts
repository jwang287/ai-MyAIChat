import { defineProvider } from './types'

export default defineProvider({
  id: 'ollama',
  name: 'Ollama',
  authOptional: true,
  endpointConfigs: {
    'anthropic-messages': {
      adapterFamily: 'anthropic',
      baseUrl: 'http://localhost:11434'
    },
    'ollama-chat': {
      adapterFamily: 'ollama',
      baseUrl: 'http://localhost:11434',
      reasoningFormat: { type: 'ollama' }
    }
  },
  metadata: {
    website: {
      docs: 'https://github.com/ollama/ollama/tree/main/docs',
      models: 'https://ollama.com/library',
      official: 'https://ollama.com/'
    }
  },
  overrides: [
    // Ollama's own experimental image-gen models (served through `/api/generate`,
    // not a separate creator catalog) — vendor-exclusive, so declared standalone
    // here rather than in `src/creators/`. No `vendorTransport`: the AI SDK
    // adapter (`src/main/ai/provider/custom/ollama/`) always calls the local
    // `/api/generate` endpoint directly, it doesn't read registry-declared routing.
  ]
})
