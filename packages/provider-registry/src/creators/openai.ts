import { openaiCompatible } from './_api'
import { defineCreator } from './types'

export default defineCreator({
  id: 'openai',
  name: 'OpenAI',
  fetchModels: openaiCompatible('openai', 'OPENAI_API_KEY'),
  modelsDevProviders: ['openai'],
  reasoningFamilies: [
    { pattern: '^(?:o\\d|gpt).*deep[-_]?research', effort: ['medium'] },
    { pattern: '^gpt-5[.-]1-codex-max', effort: ['medium', 'high', 'xhigh'] },
    { pattern: '^gpt-5[.-]1-codex', effort: ['medium', 'high'] },
    { pattern: '^gpt-5[.-]1(?!\\d)(?!.*chat)', effort: ['none', 'low', 'medium', 'high'] },
    { pattern: '^gpt-5-pro', effort: ['high'] },
    { pattern: '^gpt-5[.-]\\d+-pro', effort: ['medium', 'high', 'xhigh'] },
    { pattern: '^gpt-5-codex', effort: ['low', 'medium', 'high'] },
    { pattern: '^gpt-5[.-]\\d+-codex', effort: ['low', 'medium', 'high', 'xhigh'] },
    // gpt-5.2 and later minor versions inherit the 5.2 vocabulary
    { pattern: '^gpt-5[.-]\\d+(?!.*chat)', effort: ['none', 'low', 'medium', 'high', 'xhigh'] },
    { pattern: '^gpt-5(?![.-]\\d)(?!.*chat)', effort: ['minimal', 'low', 'medium', 'high'] },
    { pattern: '^gpt-oss', effort: ['low', 'medium', 'high'] },
    // o-series reasoning SKUs (excluding the non-reasoning previews)
    { pattern: '^o1(?!-preview|-mini)|^o3|^o4', effort: ['low', 'medium', 'high'] },
    // Membership profiles (no knobs): reasoning SKUs beyond the knob rules above.
    { pattern: '^o\\d+(?:-[\\w-]+)?$' },
    { pattern: '^(?!.*o1-(?:preview|mini)).*o1' },
    { pattern: '^(?!.*o3-mini).*o3' },
    { pattern: 'gpt-oss' },
    { pattern: '^(?!.*chat).*gpt-5' },
    { pattern: '^gpt-realtime-2' }
  ],
  // `text-embedding-3` / `-ada` only — bare `text-embedding` over-claims Google's `text-embedding-00x`
  // (gecko, served by google-vertex), mis-attributing them to OpenAI.
  idPrefixes: [
    'gpt',
    'o1',
    'o3',
    'o4',
    'chatgpt',
    'codex',
    'text-embedding-3',
    'text-embedding-ada',
    'text-moderation',
    'davinci',
    'babbage'
  ],
  models: [
    {
      id: 'gpt-5-chat',
      name: 'GPT-5 Chat',
      capabilities: ['function-call', 'reasoning', 'image-recognition', 'structured-output', 'file-input'],
      outputModalities: ['text']
    },
    {
      id: 'gpt-5-1',
      name: 'GPT 5.1 Thinking',
      capabilities: ['function-call', 'reasoning', 'image-recognition', 'structured-output', 'file-input'],
      outputModalities: ['text']
    }
  ]
})
