import { defineCreator } from './types'

export default defineCreator({
  id: 'minimax',
  name: 'MiniMax',
  modelsDevProviders: ['minimax', 'minimax-cn'],
  idPrefixes: ['minimax', 'abab'],
  reasoningFamilies: [{ pattern: 'minimax-m\\d' }],
  models: [{ id: 'minimax-m2-1' }, { id: 'minimax-m3', maxOutputTokens: 524288 }]
})
