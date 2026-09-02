// Curated public surface for the renderer model helpers.
// Named re-exports only (no `export *`) per naming-conventions §5.

export {
  isAudioModel,
  isAudioModels,
  isVideoModel,
  isVideoModels,
  isVisionModels
} from './capabilities'
export { isEmbeddingModel, isRerankModel } from './embedding'
export { getModelLogoRef } from './logo'
export { isGPT5SeriesReasoningModel } from './openai'
// Reasoning checks are the descriptor-backed shared implementations — the
// renderer's regex-table shadows were deleted with the #16598 migration
// (vocabulary now comes from `@shared/ai/reasoning`).
export {
  reconcileReasoningEffortForModel,
  resolveReasoningEffortForModel
} from './reconcile'
export { readDefaultModel, readQuickModel, readTranslateModel } from './resolve'
export { getSearchMatchScore } from './search'
export { isFunctionCallingModel } from './tooluse'
export { isVisionModel } from './vision'
export {
  getModelSupportedReasoningEffortOptions,
  isFixedReasoningModel,
  isReasoningModel,
  isSupportedReasoningEffortModel,
  isSupportedThinkingTokenModel,
  isSupportedThinkingTokenQwenModel
} from '@shared/utils/model'
