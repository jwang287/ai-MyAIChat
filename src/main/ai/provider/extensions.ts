/** App-specific Provider Extensions registered alongside `coreExtensions`. */

import type { AmazonBedrockProvider, AmazonBedrockProviderSettings } from '@ai-sdk/amazon-bedrock'
import type { ByteDanceProviderSettings } from '@ai-sdk/bytedance'
import type { CerebrasProviderSettings } from '@ai-sdk/cerebras'
import type { GatewayProviderSettings } from '@ai-sdk/gateway'
import type { GoogleVertexAnthropicProvider } from '@ai-sdk/google-vertex/anthropic/edge'
import type { GoogleVertexProvider, GoogleVertexProviderSettings } from '@ai-sdk/google-vertex/edge'
import type { GoogleVertexMaasProvider, GoogleVertexMaasProviderSettings } from '@ai-sdk/google-vertex/maas/edge'
import type { GroqProviderSettings } from '@ai-sdk/groq'
import type { HuggingFaceProviderSettings } from '@ai-sdk/huggingface'
import type { MistralProviderSettings } from '@ai-sdk/mistral'
import type { PerplexityProviderSettings } from '@ai-sdk/perplexity'
import type { ProviderV3 } from '@ai-sdk/provider'
import type { TogetherAIProviderSettings } from '@ai-sdk/togetherai'
import { ProviderExtension, type ProviderExtensionConfig } from '@cherrystudio/ai-core/provider'
import type { GitHubCopilotProviderSettings } from '@opeoginni/github-copilot-openai-compatible'
import { LOCAL_EMBEDDING_PROVIDER_ID } from '@shared/data/presets/localEmbedding'
import { SystemProviderIds } from '@shared/utils/systemProviderId'
import type { OllamaProviderSettings } from 'ollama-ai-provider-v2'
import type { VoyageProviderSettings } from 'voyage-ai-provider'

import type { AihubmixProviderSettings } from './custom/aihubmix/aihubmixProvider'
import type { DashScopeProviderSettings } from './custom/dashscope/dashscopeProvider'
import type { DmxapiProviderSettings } from './custom/dmxapi/dmxapiProvider'
import type { LocalEmbeddingProviderSettings } from './custom/localEmbedding/localEmbeddingProvider'
import type { MinimaxProviderSettings } from './custom/minimax/minimaxProvider'
import type { ModelscopeProviderSettings } from './custom/modelscope/modelscopeProvider'
import type { MoonshotProvider, MoonshotProviderSettings } from './custom/moonshotProvider'
import type { NewApiProviderSettings } from './custom/newapiProvider'
import type { OvmsProviderSettings } from './custom/ovms/ovmsProvider'
import type { PpioProviderSettings } from './custom/ppio/ppioProvider'
import type { SiliconProviderSettings } from './custom/silicon/siliconProvider'
import type { ZhipuProviderSettings } from './custom/zhipuProvider'

export const GoogleVertexExtension = ProviderExtension.create({
  name: 'google-vertex',
  aliases: ['vertexai'] as const,
  create: async (settings) => (await import('@ai-sdk/google-vertex/edge')).createVertex(settings)
} as const satisfies ProviderExtensionConfig<GoogleVertexProviderSettings, GoogleVertexProvider, 'google-vertex'>)

export const GoogleVertexAnthropicExtension = ProviderExtension.create({
  name: 'google-vertex-anthropic',
  aliases: ['vertexai-anthropic'] as const,
  create: async (settings) => (await import('@ai-sdk/google-vertex/anthropic/edge')).createVertexAnthropic(settings)
} as const satisfies ProviderExtensionConfig<
  GoogleVertexProviderSettings,
  GoogleVertexAnthropicProvider,
  'google-vertex-anthropic'
>)

/**
 * Vertex MaaS — open/partner models (Llama, DeepSeek, Qwen, GLM, Kimi, gpt-oss)
 * served over Vertex's OpenAI-compatible Chat Completions endpoint. Distinct from
 * `google-vertex` (Gemini generateContent) and `google-vertex-anthropic` (Claude
 * messages); the adapter mints the GCP bearer token itself from the same iam-gcp
 * service-account credentials.
 */
export const GoogleVertexMaaSExtension = ProviderExtension.create({
  name: 'google-vertex-maas',
  aliases: ['vertexai-maas'] as const,
  create: async (settings) => (await import('@ai-sdk/google-vertex/maas/edge')).createVertexMaas(settings)
} as const satisfies ProviderExtensionConfig<
  GoogleVertexMaasProviderSettings,
  GoogleVertexMaasProvider,
  'google-vertex-maas'
>)

export const GitHubCopilotExtension = ProviderExtension.create({
  name: 'github-copilot-openai-compatible',
  aliases: ['copilot', 'github-copilot'] as const,
  // Cast because the upstream package doesn't fully implement `ProviderV3`.
  create: async (options?: GitHubCopilotProviderSettings) =>
    (await import('@opeoginni/github-copilot-openai-compatible')).createGitHubCopilotOpenAICompatible(
      options
    ) as unknown as ProviderV3
} as const satisfies ProviderExtensionConfig<
  GitHubCopilotProviderSettings,
  ProviderV3,
  'github-copilot-openai-compatible'
>)

export const BedrockExtension = ProviderExtension.create({
  name: 'bedrock',
  aliases: ['aws-bedrock'] as const,
  create: async (settings) => (await import('@ai-sdk/amazon-bedrock')).createAmazonBedrock(settings)
} as const satisfies ProviderExtensionConfig<AmazonBedrockProviderSettings, AmazonBedrockProvider, 'bedrock'>)

export const PerplexityExtension = ProviderExtension.create({
  name: 'perplexity',
  create: async (settings) => (await import('@ai-sdk/perplexity')).createPerplexity(settings)
} as const satisfies ProviderExtensionConfig<PerplexityProviderSettings, ProviderV3, 'perplexity'>)

export const MistralExtension = ProviderExtension.create({
  name: 'mistral',
  create: async (settings) => (await import('@ai-sdk/mistral')).createMistral(settings)
} as const satisfies ProviderExtensionConfig<MistralProviderSettings, ProviderV3, 'mistral'>)

/** Local mirror of the package's unexported settings type (TS4023 otherwise). */
export interface OpenResponsesProviderSettings {
  /** Full POST endpoint URL (`<base>/responses`). */
  url: string
  /** providerOptions namespace + `provider` string prefix (`<name>.responses`). */
  name: string
  apiKey?: string
  headers?: Record<string, string>
  fetch?: typeof globalThis.fetch
}

/**
 * Spec-neutral Responses dialect (openresponses.org) for third-party providers.
 * NOT named `openai-responses`: that id would be picked up by `resolveProviderVariant`
 * and silently reroute every `adapterFamily: 'openai'` responses endpoint.
 */
export const OpenResponsesExtension = ProviderExtension.create({
  name: 'open-responses',
  // `url`/`name` are required and always supplied by the config builder.
  create: async (options?: OpenResponsesProviderSettings): Promise<ProviderV3> =>
    (await import('@ai-sdk/open-responses')).createOpenResponses(options!)
} as const satisfies ProviderExtensionConfig<OpenResponsesProviderSettings, ProviderV3, 'open-responses'>)

export const HuggingFaceExtension = ProviderExtension.create({
  name: 'huggingface',
  aliases: ['hf', 'hugging-face'] as const,
  create: async (settings) => (await import('@ai-sdk/huggingface')).createHuggingFace(settings)
} as const satisfies ProviderExtensionConfig<HuggingFaceProviderSettings, ProviderV3, 'huggingface'>)

export const GatewayExtension = ProviderExtension.create({
  name: 'gateway',
  aliases: ['ai-gateway'] as const,
  create: async (settings) => (await import('@ai-sdk/gateway')).createGateway(settings)
} as const satisfies ProviderExtensionConfig<GatewayProviderSettings, ProviderV3, 'gateway'>)

export const CerebrasExtension = ProviderExtension.create({
  name: 'cerebras',
  create: async (settings) => (await import('@ai-sdk/cerebras')).createCerebras(settings)
} as const satisfies ProviderExtensionConfig<CerebrasProviderSettings, ProviderV3, 'cerebras'>)

export const GroqExtension = ProviderExtension.create({
  name: 'groq',
  create: async (settings) => (await import('@ai-sdk/groq')).createGroq(settings)
} as const satisfies ProviderExtensionConfig<GroqProviderSettings, ProviderV3, 'groq'>)

export const OllamaExtension = ProviderExtension.create({
  name: 'ollama',
  create: async (options?: OllamaProviderSettings) =>
    (await import('./custom/ollama/ollamaProvider')).createOllamaProvider(options)
} as const satisfies ProviderExtensionConfig<OllamaProviderSettings, ProviderV3, 'ollama'>)

export const MinimaxExtension = ProviderExtension.create({
  name: 'minimax',
  aliases: ['minimax-global'] as const,
  create: async (settings) => (await import('./custom/minimax/minimaxProvider')).createMinimaxProvider(settings)
} as const satisfies ProviderExtensionConfig<MinimaxProviderSettings, ProviderV3, 'minimax'>)

/** Moonshot (Kimi) — OpenAI-compatible chat. */
export const MoonshotExtension = ProviderExtension.create({
  name: 'moonshot',
  create: async (settings) => (await import('./custom/moonshotProvider')).createMoonshotProvider(settings)
} as const satisfies ProviderExtensionConfig<MoonshotProviderSettings, MoonshotProvider, 'moonshot'>)

/** AiHubMix — multi-backend gateway (claude→anthropic, gemini→google, gpt→openai-responses). */
export const AiHubMixExtension = ProviderExtension.create({
  name: 'aihubmix',
  create: async (settings) => (await import('./custom/aihubmix/aihubmixProvider')).createAihubmix(settings)
} as const satisfies ProviderExtensionConfig<AihubmixProviderSettings, ProviderV3, 'aihubmix'>)

/** NewAPI — multi-backend gateway routed by endpoint_type. */
export const NewApiExtension = ProviderExtension.create({
  name: 'newapi',
  aliases: ['new-api', 'o3'] as const,
  create: async (settings) => (await import('./custom/newapiProvider')).createNewApi(settings)
} as const satisfies ProviderExtensionConfig<NewApiProviderSettings, ProviderV3, 'newapi'>)

export const TogetherAIExtension = ProviderExtension.create({
  name: 'togetherai',
  aliases: [SystemProviderIds.together] as const,
  create: async (settings) => (await import('@ai-sdk/togetherai')).createTogetherAI(settings)
} as const satisfies ProviderExtensionConfig<TogetherAIProviderSettings, ProviderV3, 'togetherai'>)

/** PPIO Extension - unified chat and embedding provider. */
export const PpioExtension = ProviderExtension.create({
  name: 'ppio',
  create: async (settings) => (await import('./custom/ppio/ppioProvider')).createPpioProvider(settings)
} as const satisfies ProviderExtensionConfig<PpioProviderSettings, ProviderV3, 'ppio'>)

/** DMXAPI Extension - unified chat and embedding provider. */
export const DmxapiExtension = ProviderExtension.create({
  name: 'dmxapi',
  create: async (settings) => (await import('./custom/dmxapi/dmxapiProvider')).createDmxapiProvider(settings)
} as const satisfies ProviderExtensionConfig<DmxapiProviderSettings, ProviderV3, 'dmxapi'>)

/** SiliconFlow Extension - OpenAI-compatible chat and embedding. */
export const SiliconExtension = ProviderExtension.create({
  name: 'silicon',
  create: async (settings) => (await import('./custom/silicon/siliconProvider')).createSiliconProvider(settings)
} as const satisfies ProviderExtensionConfig<SiliconProviderSettings, ProviderV3, 'silicon'>)

/** Zhipu Extension - OpenAI-compatible chat and embedding. */
export const ZhipuExtension = ProviderExtension.create({
  name: 'zhipu',
  create: async (settings) => (await import('./custom/zhipuProvider')).createZhipuProvider(settings)
} as const satisfies ProviderExtensionConfig<ZhipuProviderSettings, ProviderV3, 'zhipu'>)

/** Doubao (Volcengine Ark) provider extension. */
export const DoubaoExtension = ProviderExtension.create({
  name: 'doubao',
  create: async (settings) => (await import('@ai-sdk/bytedance')).createByteDance(settings)
} as const satisfies ProviderExtensionConfig<ByteDanceProviderSettings, ProviderV3, 'doubao'>)

/** OVMS Extension - unified chat and embedding (local OpenVINO Model Server, no auth). */
export const OvmsExtension = ProviderExtension.create({
  name: 'ovms',
  create: async (settings) => (await import('./custom/ovms/ovmsProvider')).createOvmsProvider(settings)
} as const satisfies ProviderExtensionConfig<OvmsProviderSettings, ProviderV3, 'ovms'>)

/** ModelScope Extension - OpenAI-compatible chat and embedding. */
export const ModelscopeExtension = ProviderExtension.create({
  name: 'modelscope',
  create: async (settings) =>
    (await import('./custom/modelscope/modelscopeProvider')).createModelscopeProvider(settings)
} as const satisfies ProviderExtensionConfig<ModelscopeProviderSettings, ProviderV3, 'modelscope'>)

/** DashScope (Bailian) Extension - OpenAI-compatible chat and embedding. */
export const DashScopeExtension = ProviderExtension.create({
  name: 'dashscope',
  aliases: ['bailian'] as const,
  create: async (settings) => (await import('./custom/dashscope/dashscopeProvider')).createDashScopeProvider(settings)
} as const satisfies ProviderExtensionConfig<DashScopeProviderSettings, ProviderV3, 'dashscope'>)

/**
 * Voyage AI Extension - embeddings and reranking
 */
export const VoyageExtension = ProviderExtension.create({
  name: 'voyage',
  aliases: [SystemProviderIds.voyageai] as const,
  create: async (settings) => (await import('voyage-ai-provider')).createVoyage(settings)
} as const satisfies ProviderExtensionConfig<VoyageProviderSettings, ProviderV3, 'voyage'>)

/**
 * Local Embedding Extension - optional in-process text embeddings via
 * transformers.js + onnxruntime-node (no auth, no network). Embedding-only.
 */
export const LocalEmbeddingExtension = ProviderExtension.create({
  name: LOCAL_EMBEDDING_PROVIDER_ID,
  create: async (settings) =>
    (await import('./custom/localEmbedding/localEmbeddingProvider')).createLocalEmbeddingProvider(settings)
} as const satisfies ProviderExtensionConfig<
  LocalEmbeddingProviderSettings,
  ProviderV3,
  typeof LOCAL_EMBEDDING_PROVIDER_ID
>)

export const extensions = [
  GoogleVertexExtension,
  GoogleVertexAnthropicExtension,
  GoogleVertexMaaSExtension,
  GitHubCopilotExtension,
  BedrockExtension,
  PerplexityExtension,
  MistralExtension,
  OpenResponsesExtension,
  HuggingFaceExtension,
  GatewayExtension,
  CerebrasExtension,
  OllamaExtension,
  MinimaxExtension,
  MoonshotExtension,
  AiHubMixExtension,
  NewApiExtension,
  PpioExtension,
  DmxapiExtension,
  SiliconExtension,
  ZhipuExtension,
  DoubaoExtension,
  OvmsExtension,
  ModelscopeExtension,
  DashScopeExtension,
  VoyageExtension,
  TogetherAIExtension,
  GroqExtension,
  LocalEmbeddingExtension
] as const
