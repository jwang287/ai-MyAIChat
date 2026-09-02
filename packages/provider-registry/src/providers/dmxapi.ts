import { defineProvider } from './types'

export default defineProvider({
  id: 'dmxapi',
  name: 'DMXAPI',
  defaultChatEndpoint: 'openai-chat-completions',
  endpointConfigs: {
    'anthropic-messages': {
      adapterFamily: 'dmxapi',
      baseUrl: 'https://www.dmxapi.cn'
    },
    'google-generate-content': {
      adapterFamily: 'dmxapi',
      baseUrl: 'https://www.dmxapi.cn/v1beta/'
    },
    'openai-chat-completions': {
      adapterFamily: 'dmxapi',
      baseUrl: 'https://www.dmxapi.cn'
    }
  },
  metadata: {
    website: {
      apiKey: 'https://www.dmxapi.cn/',
      docs: 'https://doc.dmxapi.cn/',
      models: 'https://www.dmxapi.cn/pricing',
      official: 'https://www.dmxapi.cn/'
    }
  },
  overrides: []
})
