import { describe, expect, it } from 'vitest'

import { createMinimaxProvider } from '../minimax/minimaxProvider'

describe('createMinimaxProvider', () => {
  it('uses OpenAI-compatible chat and embedding models', () => {
    const provider = createMinimaxProvider({
      apiKey: 'sk-test',
      baseURL: 'https://api.minimax.io/v1'
    })

    expect(provider.languageModel('MiniMax-M3').provider).toBe('minimax.chat')
    expect(provider.embeddingModel('embedding-model').provider).toBe('minimax.embedding')
  })
})
