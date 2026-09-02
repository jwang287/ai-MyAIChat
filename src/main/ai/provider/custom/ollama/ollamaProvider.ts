import { createOllama, type OllamaProvider, type OllamaProviderSettings } from 'ollama-ai-provider-v2'

export const OLLAMA_PROVIDER_NAME = 'ollama' as const

export function createOllamaProvider(settings: OllamaProviderSettings = {}): OllamaProvider {
  return createOllama(settings)
}
