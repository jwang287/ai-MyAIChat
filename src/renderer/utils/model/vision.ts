import type { Model } from '@shared/data/types/model'
import { isVisionModel as sharedIsVisionModel } from '@shared/utils/model'

/**
 * Vision-capable model. Reads shared's IMAGE_RECOGNITION / IMAGE input-
 * modality capabilities. v2 `Model.capabilities` is authoritative (registry
 * inference + baked-in user overrides merged by `ModelService`).
 */
export function isVisionModel(model: Model): boolean {
  if (!model) return false
  return sharedIsVisionModel(model)
}
