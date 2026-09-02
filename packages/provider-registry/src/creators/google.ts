import { googleModels } from './_api'
import { defineCreator } from './types'

export default defineCreator({
  id: 'google',
  name: 'Google',
  fetchModels: googleModels(),
  modelsDevProviders: ['google', 'google-vertex'],
  reasoningFamilies: [
    // Native-protocol dialect (google-generate-content). Gemini 2.x takes
    // `thinkingConfig.thinkingBudget` and hard-rejects the Gemini 3
    // `thinkingLevel` field, so the split is declared here rather than inferred
    // — it does not line up with the effort/budget knob rules below (several
    // Gemini 3 SKUs carry both knobs). Most specific first; first match wins.
    { pattern: '^gemini-2', wireDialect: 'budget', template: true },
    { pattern: '^gemini-omni', wireDialect: 'budget', template: true },
    // Robotics-ER is a 2.x-era derivative on thinking_budget — never pinned
    // before, so it had been silently taking the Gemini 3 level wire.
    { pattern: '^gemini-robotics', wireDialect: 'budget', template: true },
    { pattern: '^gemini-(?:3|flash-latest|pro-latest|flash-lite-latest)', wireDialect: 'effort', template: true },

    { pattern: '^gemma-?4', toggle: true },
    {
      pattern: '^gemini-3(?:\\.\\d+)?-flash|^gemini-3\\.1-flash-lite|^gemini-flash-latest',
      effort: ['minimal', 'low', 'medium', 'high']
    },
    { pattern: '^gemini-3-pro', effort: ['low', 'high'] },
    { pattern: '^gemini-3\\.\\d+-pro|^gemini-pro-latest', effort: ['low', 'medium', 'high'] },
    // Robotics ER (vision-language-action) exposes a thinking on/off toggle; not a flash/pro budget SKU.
    { pattern: '^gemini-robotics', toggle: true },
    // Gemini 2.x budget models: flash can be turned off (budget 0); pro
    // cannot (budget-only via the tiers below — no vocabulary rule).
    { pattern: '^gemini-[\\d.]+.*flash', toggle: true, template: true },
    { pattern: 'gemini-2[.-]5-flash-lite.*$', budget: { min: 512, max: 24576 }, template: true },
    // -latest aliases (point at the current Gemini 3 flagships).
    { pattern: 'gemini-flash-lite-latest$', budget: { min: 512, max: 24576 }, template: true },
    { pattern: 'gemini-flash-latest$', budget: { min: 0, max: 24576 }, template: true },
    { pattern: 'gemini-pro-latest$', budget: { min: 128, max: 32768 }, template: true },
    { pattern: 'gemini-.*-flash.*$', budget: { min: 0, max: 24576 }, template: true },
    { pattern: 'gemini-.*-pro.*$', budget: { min: 128, max: 32768 }, template: true },
    // Membership profiles (no knobs): reasoning SKUs beyond the knob rules above.
    { pattern: '^gemini.*thinking' },
    { pattern: 'gemini-3(?:[.-]\\d+)?-pro-image' },
    // Gemini 3.x Flash TTS ships a thinking budget/toggle upstream (unlike the older 2.5 TTS line),
    // so claim it — the general reasoning rule below deliberately excludes all `tts` ids.
    { pattern: '^gemini-3(?:[.-]\\d+)?-flash-tts' },
    {
      pattern:
        '^(?!.*tts).*gemini-(?:2[.-]5.*(?:-latest)?|3(?:[.-]\\d+)?-(?:flash|pro)(?:-preview)?|flash-latest|pro-latest|flash-lite-latest)(?:-[\\w-]+)*$'
    },
    { pattern: '^gemini-omni-flash' },
    { pattern: '^gemini-robotics' },
    { pattern: 'gemma-?4' }
  ],
  families: ['gemini', 'gemma'],
  // `text-embedding-004/005` + `text-multilingual-embedding-*` are Google's Vertex embeddings — claim them
  // here so they aren't mis-attributed to OpenAI (bare `text-embedding`) or left to a gateway listing.
  idPrefixes: [
    'gemini',
    'gemma',
    'palm',
    'learnlm',
    'text-embedding-004',
    'text-embedding-005',
    'text-multilingual-embedding'
  ],
  models: []
})
