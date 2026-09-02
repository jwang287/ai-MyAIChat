import type { ProviderModelOverride } from '../schemas/provider-models'
import { defineProvider } from './types'
import { modeWire } from './wires'

const deepSeekThinkingWire = modeWire('extra_body.thinking.type', {
  off: 'disabled',
  auto: 'enabled',
  effort: 'enabled'
})

const deepSeekModelOverrides = [
  {
    apiModelId: 'deepseek/deepseek-v3.2',
    modelId: 'deepseek-v3-2',
    reasoningContracts: {
      'openai-chat-completions': { wire: deepSeekThinkingWire }
    }
  }
] satisfies Array<Partial<ProviderModelOverride>>

const qwenAudioCompatibilityOverrides = [
  {
    apiModelId: 'qwen/qwen3.5-122b-a10b',
    modelId: 'qwen3-5-122b-a10b',
    capabilities: { remove: ['audio-recognition'] },
    inputModalities: ['text', 'image', 'video'],
    reason: 'CherryIN rejects native audio; base Qwen3.5 supports text/image/video input'
  },
  {
    apiModelId: 'qwen/qwen3.5-27b',
    modelId: 'qwen3-5-27b',
    capabilities: { remove: ['audio-recognition'] },
    inputModalities: ['text', 'image', 'video'],
    reason: 'CherryIN rejects native audio; base Qwen3.5 supports text/image/video input'
  },
  {
    apiModelId: 'qwen/qwen3.5-35b-a3b',
    modelId: 'qwen3-5-35b-a3b',
    capabilities: { remove: ['audio-recognition'] },
    inputModalities: ['text', 'image', 'video'],
    reason: 'CherryIN rejects native audio; base Qwen3.5 supports text/image/video input'
  },
  {
    modelId: 'qwen3-5-35b-a3b-free',
    apiModelId: 'qwen/qwen3.5-35b-a3b(free)',
    modelVariants: ['35b', 'free'],
    name: 'Qwen3.5 35B A3B (Free)',
    capabilities: { remove: ['audio-recognition', 'video-recognition'] },
    inputModalities: ['text', 'image'],
    reason: 'CherryIN free endpoint accepts text and image_url parts only'
  },
  {
    apiModelId: 'qwen/qwen3.5-397b-a17b',
    modelId: 'qwen3-5-397b-a17b',
    capabilities: { remove: ['audio-recognition'] },
    inputModalities: ['text', 'image', 'video'],
    reason: 'CherryIN rejects native audio; base Qwen3.5 supports text/image/video input'
  },
  {
    modelId: 'qwen3-5-4b',
    apiModelId: 'qwen/qwen3.5-4b(free)',
    modelVariants: ['4b', 'free'],
    name: 'Qwen3.5 4B (Free)',
    capabilities: { remove: ['video-recognition'] },
    inputModalities: ['text', 'image'],
    reason: 'CherryIN free endpoint accepts text and image_url parts only'
  },
  {
    modelId: 'qwen3-5-9b',
    apiModelId: 'qwen/qwen3.5-9b(free)',
    modelVariants: ['9b', 'free'],
    capabilities: { remove: ['audio-recognition', 'video-recognition'] },
    inputModalities: ['text', 'image'],
    reason: 'CherryIN free endpoint accepts text and image_url parts only'
  }
] satisfies Array<Partial<ProviderModelOverride>>

export default defineProvider({
  id: 'cherryin',
  name: 'CherryIN',
  defaultChatEndpoint: 'openai-chat-completions',
  endpointConfigs: {
    'anthropic-messages': {
      adapterFamily: 'cherryin',
      baseUrl: 'https://open.cherryin.net'
    },
    'google-generate-content': {
      adapterFamily: 'cherryin',
      baseUrl: 'https://open.cherryin.net'
    },
    'openai-responses': {
      adapterFamily: 'cherryin',
      baseUrl: 'https://open.cherryin.net'
    },
    'openai-chat-completions': {
      adapterFamily: 'cherryin',
      baseUrl: 'https://open.cherryin.net',
      reasoningFormat: { type: 'openai-chat' }
    }
  },
  // Gateway-mapped delivery: `resolveToolCapability` falls back to the vendor
  // segment of the model provider id (`cherryin.gemini` → google's factory), so
  // only vendors owning a native tool factory are servable — a deepseek/glm/kimi
  // model would resolve no factory and inject nothing.
  metadata: {
    website: {
      apiKey: 'https://open.cherryin.ai/console/token',
      docs: 'https://open.cherryin.ai',
      models: 'https://open.cherryin.ai/pricing',
      official: 'https://open.cherryin.ai'
    }
  },
  overrides: [...deepSeekModelOverrides, ...qwenAudioCompatibilityOverrides]
})
