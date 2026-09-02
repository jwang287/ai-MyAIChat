import { OpenAICompatibleChatLanguageModel, OpenAICompatibleEmbeddingModel } from '@ai-sdk/openai-compatible'
import type { EmbeddingModelV3, LanguageModelV3, ProviderV3 } from '@ai-sdk/provider'
import type { FetchFunction } from '@ai-sdk/provider-utils'
import { withoutTrailingSlash } from '@ai-sdk/provider-utils'

export const OVMS_PROVIDER_NAME = 'ovms' as const

export interface OvmsProviderSettings {
  /** OVMS is a local OpenVINO Model Server with no auth — `apiKey` is
   * accepted for type symmetry with other providers but never read. */
  apiKey?: string
  /** Chat / embedding endpoint (e.g. `http://localhost:8000/v3/`). */
  baseURL?: string
  headers?: Record<string, string>
  fetch?: FetchFunction
}

export interface OvmsProvider extends ProviderV3 {
  (modelId: string): LanguageModelV3
  languageModel(modelId: string): LanguageModelV3
  embeddingModel(modelId: string): EmbeddingModelV3
}

/** Unified OVMS chat and embedding provider. */
export function createOvmsProvider(settings: OvmsProviderSettings = {}): OvmsProvider {
  const { baseURL, fetch: customFetch } = settings
  if (!baseURL) {
    throw new Error(
      'OVMS provider requires a non-empty `baseURL`. An empty value would resolve fetch paths against the renderer process origin (app://, file://) and surface as opaque "Failed to fetch" errors.'
    )
  }

  const authHeaders = () => ({ ...settings.headers })

  const url = ({ path }: { path: string; modelId: string }) => `${withoutTrailingSlash(baseURL)}${path}`

  const createChatModel = (modelId: string) =>
    new OpenAICompatibleChatLanguageModel(modelId, {
      provider: `${OVMS_PROVIDER_NAME}.chat`,
      url,
      headers: authHeaders,
      fetch: customFetch
    })

  const provider = (modelId: string) => createChatModel(modelId)
  provider.specificationVersion = 'v3' as const
  provider.languageModel = createChatModel
  provider.embeddingModel = (modelId: string) =>
    new OpenAICompatibleEmbeddingModel(modelId, {
      provider: `${OVMS_PROVIDER_NAME}.embedding`,
      url,
      headers: authHeaders,
      fetch: customFetch
    })
  return provider as unknown as OvmsProvider
}
