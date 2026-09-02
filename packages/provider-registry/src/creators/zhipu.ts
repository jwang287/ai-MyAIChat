import { openaiCompatible } from './_api'
import { defineCreator } from './types'

export default defineCreator({
  id: 'zhipu',
  name: 'Zhipu / Z.ai (GLM)',
  fetchModels: openaiCompatible('zhipu', 'ZHIPU_API_KEY'),
  modelsDevProviders: ['zhipuai', 'zai'],
  families: ['glm'],
  idPrefixes: ['glm', 'cogview', 'cogvideo', 'codegeex', 'chatglm'],
  reasoningFamilies: [
    // GLM-5.3 models always reason; the API exposes only low/high/max effort.
    { pattern: 'glm-5[.-]3(?:-|$)', effort: ['low', 'high', 'max'], toggle: false },
    // GLM-5 and GLM-4.5/4.6/4.7. Unanchored to handle provider-prefixed ids.
    // On/off only — bigmodel's API has no thinking budget parameter; depth
    // control is GLM-5.2's reasoning_effort (declared upstream per SKU).
    { pattern: 'glm-?5|glm-4[.-][567]', toggle: true },
    // Membership profiles (no knobs): reasoning SKUs beyond the knob rules above.
    { pattern: 'glm-zero-preview' },
    { pattern: 'glm-z1' }
  ],
  models: [
    { id: 'glm-4', name: 'GLM-4', capabilities: ['function-call'], contextWindow: 131072 },
    { id: 'glm-4-plus', name: 'GLM-4-Plus', capabilities: ['function-call'], contextWindow: 131072 },
    { id: 'glm-4-air', name: 'GLM-4-Air', capabilities: ['function-call'], contextWindow: 131072 },
    { id: 'glm-4-airx', name: 'GLM-4-AirX', capabilities: ['function-call'], contextWindow: 8192 },
    { id: 'glm-4-flash', name: 'GLM-4-Flash', capabilities: ['function-call'], contextWindow: 131072 },
    { id: 'glm-4-flashx', name: 'GLM-4-FlashX', capabilities: ['function-call'], contextWindow: 131072 },
    { id: 'glm-4-long', name: 'GLM-4-Long', capabilities: ['function-call'], contextWindow: 1024000 },
    { id: 'glm-3-turbo', name: 'GLM-3-Turbo', capabilities: ['function-call'], contextWindow: 131072 },
    {
      id: 'glm-4v',
      name: 'GLM-4V',
      capabilities: ['image-recognition'],
      inputModalities: ['text', 'image'],
      contextWindow: 8192
    },
    {
      id: 'glm-4v-plus',
      name: 'GLM-4V-Plus',
      capabilities: ['image-recognition'],
      inputModalities: ['text', 'image'],
      contextWindow: 8192
    },
    {
      id: 'glm-4v-flash',
      name: 'GLM-4V-Flash',
      capabilities: ['image-recognition'],
      inputModalities: ['text', 'image'],
      contextWindow: 8192
    },
    {
      id: 'glm-4-1v',
      name: 'GLM-4.1V-Thinking',
      capabilities: ['reasoning', 'image-recognition'],
      inputModalities: ['text', 'image'],
      contextWindow: 65536
    },
    { id: 'glm-z1', name: 'GLM-Z1', capabilities: ['reasoning'], contextWindow: 131072 },
    { id: 'glm-z1-air', name: 'GLM-Z1-Air', capabilities: ['reasoning'], contextWindow: 131072 },
    { id: 'glm-z1-airx', name: 'GLM-Z1-AirX', capabilities: ['reasoning'], contextWindow: 131072 },
    { id: 'glm-z1-flash', name: 'GLM-Z1-Flash', capabilities: ['reasoning'], contextWindow: 131072 },
    {
      id: 'glm-5-3-flash',
      name: 'GLM-5.3-Flash',
      family: 'glm',
      capabilities: [
        'function-call',
        'reasoning',
        'image-recognition',
        'video-recognition',
        'structured-output',
        'file-input'
      ],
      inputModalities: ['text', 'image', 'video'],
      outputModalities: ['text'],
      contextWindow: 1000000,
      maxOutputTokens: 131072,
      openWeights: true
    },
    { id: 'embedding-3', name: 'Embedding-3', outputModalities: ['vector'], contextWindow: 8192 }
  ]
})
