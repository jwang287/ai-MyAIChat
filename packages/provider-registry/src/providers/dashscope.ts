import type { ReasoningSupport } from '../schemas/model'
import type { ProviderModelOverride } from '../schemas/provider-models'
import type { ReasoningWireProfile } from '../schemas/reasoningWire'
import { defineProvider } from './types'
import { EFFORT, modeWire } from './wires'

const qwenChatWire: ReasoningWireProfile = {
  off: { operations: [{ target: 'enable_thinking', value: { source: 'literal', value: false } }] },
  auto: {
    operations: [
      { target: 'enable_thinking', value: { source: 'literal', value: true } },
      { target: 'thinking_budget', value: { source: 'budget' } }
    ],
    budget: { missing: { type: 'omit-value' } }
  },
  effort: {
    operations: [
      { target: 'enable_thinking', value: { source: 'literal', value: true } },
      { target: 'thinking_budget', value: { source: 'budget' } }
    ],
    budget: { missing: { type: 'omit-value' } }
  }
}

const responsesEffortWire = modeWire(
  'reasoningEffort',
  { off: 'none', auto: EFFORT, effort: EFFORT },
  { autoEffort: 'xhigh' }
)

/**
 * Bailian's Responses API controls reasoning via `reasoning.effort` — seven tiers
 * (none/minimal/low/medium/high/xhigh/max) defaulting to `xhigh`; `thinking_budget` is NOT supported
 * there and `enable_thinking` is being retired
 * (help.aliyun.com/zh/model-studio/qwen-api-via-openai-responses). Mirror the vendor default instead of
 * pinning a lower tier, so leaving reasoning unset doesn't silently weaken it. The chat contract keeps
 * qwen's native toggle + thinking_budget.
 *
 * `xhigh`/`max` are only served by 华北2（北京）and 新加坡; this provider's baseUrl is the Beijing host.
 */
const qwenResponsesSupport: ReasoningSupport = {
  controls: [
    { kind: 'effort', values: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'], default: 'xhigh' }
  ],
  defaultEffort: 'xhigh',
  supportedEfforts: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
}

/** `qwen3.8-max-preview` serves thinking mode only, so its Responses contract drops the `'none'` tier. */
const qwenResponsesThinkingOnlySupport: ReasoningSupport = {
  controls: [{ kind: 'effort', values: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'], default: 'xhigh' }],
  defaultEffort: 'xhigh',
  supportedEfforts: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max']
}

const qwen38Support: ReasoningSupport = {
  controls: [{ kind: 'effort', values: ['none', 'low', 'medium', 'xhigh'], default: 'xhigh' }],
  defaultEffort: 'xhigh',
  supportedEfforts: ['none', 'low', 'medium', 'xhigh'],
  // NOT a budget knob — Qwen3.8 has no `thinking_budget` (the parameter's model
  // list stops at Qwen3.7), which is why `controls` carries effort only. The
  // limits exist so the API gateway can reverse a caller-supplied `budget_tokens`
  // into the nearest effort tier (`nearestEffortForBudget`).
  thinkingTokenLimits: { min: 0, max: 262_144 }
}

/** `qwen3.8-max-preview` serves thinking mode only — no `'none'` tier, so reasoning cannot be disabled. */
const qwen38PreviewSupport: ReasoningSupport = {
  ...qwen38Support,
  controls: [{ kind: 'effort', values: ['low', 'medium', 'xhigh'], default: 'xhigh' }],
  supportedEfforts: ['low', 'medium', 'xhigh']
}

const highMaxSupport: ReasoningSupport = {
  controls: [{ kind: 'effort', values: ['none', 'high', 'max'], default: 'high' }],
  defaultEffort: 'high',
  supportedEfforts: ['none', 'high', 'max']
}

const kimiK3Support: ReasoningSupport = {
  controls: [{ kind: 'effort', values: ['none', 'max'], default: 'max' }],
  defaultEffort: 'max',
  supportedEfforts: ['none', 'max']
}

const effortChatWire: ReasoningWireProfile = {
  off: { operations: [{ target: 'enable_thinking', value: { source: 'literal', value: false } }] },
  effort: { operations: [{ target: 'reasoning_effort', value: { source: 'effort' } }] }
}

const qwen38ChatWire: ReasoningWireProfile = modeWire('reasoning_effort', { off: 'none', effort: EFFORT })

// Preview variants omit the off mode entirely: thinking is always on there.
const qwen38PreviewChatWire: ReasoningWireProfile = modeWire('reasoning_effort', { effort: EFFORT })
const qwen38PreviewResponsesWire: ReasoningWireProfile = modeWire(
  'reasoningEffort',
  { auto: EFFORT, effort: EFFORT },
  { autoEffort: 'xhigh' }
)

const minimaxM3Wire: ReasoningWireProfile = modeWire('thinking.type', {
  off: 'disabled',
  auto: 'adaptive',
  effort: 'adaptive'
})

const qwenChatModels = [
  'qwen-plus',
  'qwen-flash',
  'qwen-turbo',
  'qwen3-14b',
  'qwen3-32b',
  'qwen3-235b-a22b',
  'qwen3.5-9b',
  'qwen3.5-27b',
  'qwen3.5-35b-a3b',
  'qwen3.5-122b-a10b',
  'qwen3.5-397b-a17b',
  'qwen3.5-flash',
  'qwen3.5-plus',
  'qwen3.6-27b',
  'qwen3.6-35b-a3b',
  'qwen3.6-flash',
  'qwen3.6-plus',
  'qwen3.6-max-preview',
  'qwen3.7-plus',
  'qwen3.7-max',
  'qwen3-max',
  'qwen3-omni-flash',
  'qwen3-vl',
  'qwen3-vl-plus',
  'qwen3-vl-8b',
  'qwen3-vl-30b-a3b',
  'qwen3-vl-235b-a22b'
]

/**
 * SKUs Bailian serves over the Responses API (help.aliyun.com/zh/model-studio model support list).
 */
const responsesModels = new Set([
  'qwen-plus',
  'qwen-flash',
  'qwen-plus-character',
  'qwen3.5-27b',
  'qwen3.5-35b-a3b',
  'qwen3.5-122b-a10b',
  'qwen3.5-397b-a17b',
  'qwen3.5-flash',
  'qwen3.5-plus',
  'qwen3.6-35b-a3b',
  'qwen3.6-flash',
  'qwen3.6-plus',
  'qwen3.7-plus',
  'qwen3.7-max',
  'qwen3-max',
  'qwen3.8-flash',
  'qwen3.8-max',
  'qwen3.8-max-preview'
])

/** Dual-endpoint aliases whose broadly compatible Chat Completions route remains preferred. */
const chatPreferredModels = new Set(['qwen-plus', 'qwen-flash', 'qwen-plus-character'])

/**
 * Per-model endpoint routing. The provider default stays Chat Completions, because endpoint selection
 * falls back to it for any model without `endpointTypes` — user-added custom models and models fetched
 * from `/models` that miss an override included. Only SKUs confirmed to serve Responses opt in here,
 * and every one of them keeps Chat Completions as a second, selectable endpoint. Everything else
 * inherits the safe chat default.
 */
const endpointPin = (modelId: string): Partial<ProviderModelOverride> =>
  chatPreferredModels.has(modelId)
    ? { endpointTypes: ['openai-chat-completions', 'openai-responses'] }
    : responsesModels.has(modelId)
      ? { endpointTypes: ['openai-responses', 'openai-chat-completions'] }
      : {}

const qwenReasoningOverrides: Partial<ProviderModelOverride>[] = qwenChatModels.map((modelId) => ({
  modelId,
  ...endpointPin(modelId),
  reasoningContracts: {
    'openai-chat-completions': { wire: qwenChatWire },
    'openai-responses': { support: qwenResponsesSupport, wire: responsesEffortWire }
  }
}))

const endpointReasoningOverrides: Partial<ProviderModelOverride>[] = [
  ...qwenReasoningOverrides,
  {
    apiModelId: 'qwen3.8-flash',
    modelId: 'qwen3-8-flash',
    name: 'Qwen3.8 Flash',
    ...endpointPin('qwen3.8-flash'),
    reasoningContracts: {
      'openai-chat-completions': { support: qwen38Support, wire: qwen38ChatWire },
      'openai-responses': { support: qwenResponsesSupport, wire: responsesEffortWire }
    }
  },
  {
    apiModelId: 'qwen3.8-max',
    modelId: 'qwen3-8-max',
    name: 'Qwen3.8 Max',
    ...endpointPin('qwen3.8-max'),
    reasoningContracts: {
      'openai-chat-completions': { support: qwen38Support, wire: qwen38ChatWire },
      'openai-responses': { support: qwenResponsesSupport, wire: responsesEffortWire }
    }
  },
  {
    apiModelId: 'qwen3.8-max-preview',
    modelId: 'qwen3-8-max-preview',
    name: 'Qwen3.8 Max Preview',
    ...endpointPin('qwen3.8-max-preview'),
    reasoningContracts: {
      'openai-chat-completions': { support: qwen38PreviewSupport, wire: qwen38PreviewChatWire },
      'openai-responses': { support: qwenResponsesThinkingOnlySupport, wire: qwen38PreviewResponsesWire }
    }
  },
  {
    modelId: 'minimax-m3',
    ...endpointPin('minimax-m3'),
    reasoningContracts: {
      'openai-chat-completions': {
        support: { controls: [{ kind: 'toggle', default: true }] },
        wire: minimaxM3Wire
      }
    }
  },
  ...['deepseek-v4-pro', 'deepseek-v4-flash', 'glm-5', 'glm-5.1', 'glm-5.2'].map((modelId) => ({
    modelId,
    ...endpointPin(modelId),
    reasoningContracts: {
      'openai-chat-completions': { support: highMaxSupport, wire: effortChatWire }
    }
  })),
  {
    apiModelId: 'kimi/kimi-k3',
    modelId: 'kimi-k3',
    ...endpointPin('kimi-k3'),
    reasoningContracts: {
      'openai-chat-completions': { support: kimiK3Support, wire: effortChatWire }
    }
  },
  // Web-search rows for SKUs with no reasoning contract above. Bailian's wire ids keep the vendor's dots
  // and casing, while catalog `modelId`s are normalized — so carry an explicit `apiModelId` wherever the
  // two differ, otherwise the request would send the normalized spelling and fail.
  // (`qwen-flash-character` / `qwen3.5-ocr` are not in the catalog yet — skipped.)
  ...(
    [
      { modelId: 'qwq-plus' },
      { modelId: 'qwen-plus-character' },
      { modelId: 'deepseek-r1' },
      { modelId: 'deepseek-v3' },
      { apiModelId: 'deepseek-v3.2', modelId: 'deepseek-v3-2' },
      { apiModelId: 'deepseek-v3.1', modelId: 'deepseek-v3-1' },
      { apiModelId: 'Moonshot-Kimi-K2-Instruct', modelId: 'kimi-k2' },
      { apiModelId: 'MiniMax-M2.1', modelId: 'minimax-m2-1' }
    ] satisfies Partial<ProviderModelOverride>[]
  ).map((row) => ({ ...row, ...endpointPin(row.modelId) }))
]

export default defineProvider({
  id: 'dashscope',
  // Chat Completions stays the provider default: it is the fallback for every model that arrives without
  // `endpointTypes` (custom models, `/models` discoveries with no override), and Bailian serves it far
  // more widely than Responses. Responses is opted into per model via `endpointPin`.
  name: 'Bailian',
  defaultChatEndpoint: 'openai-chat-completions',
  endpointConfigs: {
    'anthropic-messages': {
      adapterFamily: 'anthropic',
      baseUrl: 'https://dashscope.aliyuncs.com/apps/anthropic'
    },
    'openai-chat-completions': {
      adapterFamily: 'openai-compatible',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/',
      reasoningFormat: { type: 'openai-chat' }
    },
    'openai-responses': {
      adapterFamily: 'openai',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/',
      reasoningFormat: { type: 'openai-responses' }
    }
  },
  metadata: {
    website: {
      apiKey: 'https://bailian.console.aliyun.com/?tab=model#/api-key',
      docs: 'https://help.aliyun.com/zh/model-studio/getting-started/',
      models: 'https://bailian.console.aliyun.com/?tab=model#/model-market',
      official: 'https://www.aliyun.com/product/bailian'
    }
  },
  overrides: [...endpointReasoningOverrides]
})
