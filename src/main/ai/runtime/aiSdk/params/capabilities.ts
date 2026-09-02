/** Derive per-request capability flags from (model, provider, assistant). */

import type { Assistant } from '@shared/data/types/assistant'
import type { Model } from '@shared/data/types/model'
import type { Provider } from '@shared/data/types/provider'
import {
  isFixedReasoningModel,
  isFunctionCallingModel,
  isSupportedReasoningEffortModel,
  isSupportedThinkingTokenModel
} from '@shared/utils/model'

export interface ResolvedCapabilities {
  enableReasoning: boolean
  isSupportedToolUse: boolean
  streamOutput: boolean
}

export function resolveCapabilities(model: Model, _provider: Provider, assistant: Assistant): ResolvedCapabilities {
  // This flag means the model exposes reasoning behavior, not that the persisted assistant setting
  // enabled it. The request snapshot may legitimately be `none`, `default`, or a freshly selected
  // effort that has not reached assistant persistence yet; the resolver/profile decides what emits.
  const enableReasoning =
    isSupportedThinkingTokenModel(model) || isSupportedReasoningEffortModel(model) || isFixedReasoningModel(model)

  const isSupportedToolUse = isFunctionCallingModel(model)

  const streamOutput = assistant.settings?.streamOutput !== false

  return {
    enableReasoning,
    isSupportedToolUse,
    streamOutput
  }
}
