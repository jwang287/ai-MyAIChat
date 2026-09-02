import { CHERRYAI_PROVIDER_ID } from '@shared/data/presets/cherryai'
import { ENDPOINT_TYPE, type EndpointType, type Model } from '@shared/data/types/model'
import type { EndpointDialect, Provider } from '@shared/data/types/provider'

import { getProviderHostTopology } from './providerTopology'

// Azure/Vertex/Bedrock reuse other vendors' endpoint protocols, so authType
// is the only reliable discriminator (seeded skeletons may lack a distinct
// defaultChatEndpoint). See presetProviderSeeder.ts.
export function isVertexProvider(provider: Provider): boolean {
  return provider.authType === 'iam-gcp'
}

export function isAzureOpenAIProvider(provider: Provider): boolean {
  return provider.authType === 'iam-azure'
}

export function isAwsBedrockProvider(provider: Provider): boolean {
  return provider.authType === 'iam-aws' || provider.authType === 'api-key-aws'
}

export function isOllamaProvider(provider: Pick<Provider, 'id' | 'presetProviderId' | 'defaultChatEndpoint'>): boolean {
  return (
    provider.id === 'ollama' ||
    provider.presetProviderId === 'ollama' ||
    provider.defaultChatEndpoint === ENDPOINT_TYPE.OLLAMA_CHAT
  )
}

/**
 * Ollama's local server does not validate credentials, but the SDKs backing
 * Claude Code and OpenCode still require a non-empty auth token string — used
 * as a stand-in wherever an Ollama provider has no configured API key.
 */
export const OLLAMA_PLACEHOLDER_AUTH_TOKEN = 'ollama'

// `&& !iam-gcp` excludes Vertex, which the seeder gives the same
// google-generate-content endpoint as Gemini.
export function isGeminiProvider(provider: Provider): boolean {
  return (
    (provider.id === 'google' ||
      provider.id === 'gemini' ||
      provider.presetProviderId === 'gemini' ||
      provider.defaultChatEndpoint === ENDPOINT_TYPE.GOOGLE_GENERATE_CONTENT) &&
    provider.authType !== 'iam-gcp'
  )
}

export function isAnthropicProvider(provider: Provider): boolean {
  return (
    provider.presetProviderId === 'anthropic' ||
    provider.id === 'anthropic' ||
    provider.defaultChatEndpoint === ENDPOINT_TYPE.ANTHROPIC_MESSAGES
  )
}

export function isOpenAIProvider(provider: Provider): boolean {
  return provider.defaultChatEndpoint === ENDPOINT_TYPE.OPENAI_RESPONSES
}

export function isOpenAIChatProvider(provider: Provider): boolean {
  return provider.defaultChatEndpoint === ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS
}

export function isOpenAIResponsesProvider(provider: Provider): boolean {
  return provider.defaultChatEndpoint === ENDPOINT_TYPE.OPENAI_RESPONSES
}

export function isOpenAICompatibleProvider(provider: Provider): boolean {
  return (
    provider.defaultChatEndpoint === ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS ||
    provider.defaultChatEndpoint === ENDPOINT_TYPE.OPENAI_RESPONSES ||
    provider.presetProviderId === 'new-api' ||
    provider.presetProviderId === 'mistral'
  )
}

export function isPerplexityProvider(provider: Provider): boolean {
  return provider.id === 'perplexity' || provider.presetProviderId === 'perplexity'
}

export function isCherryAIProvider(provider: Provider): boolean {
  return provider.id === CHERRYAI_PROVIDER_ID || provider.presetProviderId === CHERRYAI_PROVIDER_ID
}

export function isNewApiProvider(provider: Provider): boolean {
  return matchesPreset(provider, 'new-api') || matchesPreset(provider, 'cherryin') || matchesPreset(provider, 'aionly')
}

export function isAIGatewayProvider(provider: Provider): boolean {
  return provider.presetProviderId === 'gateway' || provider.id === 'gateway'
}

export function isSystemProvider(provider: Provider): boolean {
  return provider.presetProviderId != null
}

export function matchesPreset(provider: Pick<Provider, 'id' | 'presetProviderId'>, presetId: string): boolean {
  return provider.id === presetId || provider.presetProviderId === presetId
}

export function canManageProvider(provider: Provider): boolean {
  return provider.presetProviderId == null || provider.presetProviderId !== provider.id
}

export const API_KEY_OAUTH_PROVIDER_IDS = ['302ai', 'silicon', 'aihubmix', 'ppio', 'aionly'] as const

export function isProviderSupportAuth(provider: Pick<Provider, 'id'>): boolean {
  return (API_KEY_OAUTH_PROVIDER_IDS as readonly string[]).includes(provider.id)
}

export function isLoginBasedProvider(provider: Pick<Provider, 'authMethods'>): boolean {
  const methods = provider.authMethods
  return methods !== undefined && methods.length > 0 && !methods.includes('api-key')
}

export function isExternalCliProvider(provider: Pick<Provider, 'authMethods'>): boolean {
  return provider.authMethods?.includes('external-cli') ?? false
}

export function isAnthropicSupportedProvider(provider: Provider): boolean {
  return getProviderHostTopology(provider).hasAnthropicEndpoint
}

export function isSupportFastMode(
  provider: Pick<Provider, 'fastMode'>,
  model: Pick<Model, 'supportsFastMode'>
): provider is Pick<Provider, 'fastMode'> & { fastMode: NonNullable<Provider['fastMode']> } {
  return provider.fastMode !== undefined && model.supportsFastMode === true
}

export function resolveEndpointDialect(
  provider: Pick<Provider, 'endpointConfigs'>,
  endpointType: EndpointType | undefined
): Required<EndpointDialect> {
  const declared = endpointType ? provider.endpointConfigs?.[endpointType]?.dialect : undefined
  return {
    streamOptions: declared?.streamOptions ?? true,
    developerRole: declared?.developerRole ?? false,
    reasoningSummary: declared?.reasoningSummary ?? false
  }
}

const NOT_SUPPORT_QWEN3_ENABLE_THINKING_PROVIDERS = ['ollama', 'lmstudio', 'nvidia', 'gpustack'] as const

export function isSupportEnableThinkingProvider(provider: Provider): boolean {
  return !NOT_SUPPORT_QWEN3_ENABLE_THINKING_PROVIDERS.some((id) => id === provider.id)
}

export function hasApiKeys(provider: Provider): boolean {
  return provider.apiKeys.length > 0 && provider.apiKeys.some((k) => k.isEnabled)
}

export function getClaudeSupportedProviders<T extends Provider>(providers: T[]): T[] {
  return providers.filter(
    (p) =>
      isAnthropicProvider(p) ||
      isNewApiProvider(p) ||
      p.id === 'aihubmix' ||
      p.id === 'openrouter' ||
      isAzureOpenAIProvider(p)
  )
}

export function isSupportAnthropicPromptCacheProvider(provider: Provider): boolean {
  return (
    isAnthropicProvider(provider) ||
    isNewApiProvider(provider) ||
    provider.id === 'aihubmix' ||
    provider.id === 'openrouter' ||
    isAzureOpenAIProvider(provider)
  )
}

/**
 * Sanitize a provider display name for use in config file keys / launch args.
 * Shared by the renderer (writes CLI config files) and main (assembles the
 * matching launch command) — they must agree on the exact same output.
 */
export function sanitizeProviderName(name: string, fallback: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_\s.-]/g, '').replace(/\s+/g, '-')
  return sanitized || fallback
}
