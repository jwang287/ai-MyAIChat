import { afterEach, describe, expect, it, vi } from 'vitest'

const createOllamaFn = vi.fn()

vi.mock('ollama-ai-provider-v2', () => ({
  createOllama: (settings: unknown) => {
    createOllamaFn(settings)
    return { languageModel: vi.fn(), embeddingModel: vi.fn() }
  }
}))

import { createOllamaProvider } from '../ollama/ollamaProvider'

describe('createOllamaProvider', () => {
  afterEach(() => {
    createOllamaFn.mockReset()
  })

  it('preserves the base ollama-ai-provider-v2 chat and embedding models', () => {
    const provider = createOllamaProvider({ baseURL: 'http://localhost:11434/api' })

    expect(createOllamaFn).toHaveBeenCalledWith({ baseURL: 'http://localhost:11434/api' })
    expect(typeof provider.languageModel).toBe('function')
    expect(typeof provider.embeddingModel).toBe('function')
  })
})
