import { ENDPOINT_TYPE, type EndpointType, type Modality, type ModelCapability } from '@shared/data/types/model'
import type { Provider } from '@shared/data/types/provider'
import { matchesPreset } from '@shared/utils/provider'
import { isSystemProviderId } from '@shared/utils/systemProviderId'

import type { ModelDrawerMode } from './types'

export type ModelPurpose = 'chat'

export const MODEL_CHAT_ENDPOINT_TYPES = [
  ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS,
  ENDPOINT_TYPE.OPENAI_RESPONSES,
  ENDPOINT_TYPE.ANTHROPIC_MESSAGES,
  ENDPOINT_TYPE.GOOGLE_GENERATE_CONTENT
] as const
export type ModelChatEndpointType = (typeof MODEL_CHAT_ENDPOINT_TYPES)[number]

export interface ModelPurposeFields {
  endpointTypes?: readonly EndpointType[]
  capabilities?: readonly ModelCapability[]
  inputModalities?: readonly Modality[]
  outputModalities?: readonly Modality[]
}
export interface AppliedModelPurposeFields {
  endpointTypes: EndpointType[]
  capabilities: ModelCapability[]
  inputModalities?: Modality[]
  outputModalities?: Modality[]
}
export interface ApplyModelPurposeOptions {
  chatEndpointType?: ModelChatEndpointType
  previousPurpose?: ModelPurpose
}

type ModelDrawerProvider = Pick<Provider, 'id' | 'presetProviderId'>
type ProviderChatEndpoints = Pick<Provider, 'defaultChatEndpoint' | 'endpointConfigs'>

function isModelChatEndpointType(endpointType: string | undefined): endpointType is ModelChatEndpointType {
  return MODEL_CHAT_ENDPOINT_TYPES.some((candidate) => candidate === endpointType)
}

export function getModelDrawerMode(provider: ModelDrawerProvider): ModelDrawerMode {
  if (matchesPreset(provider, 'new-api') || matchesPreset(provider, 'cherryin') || matchesPreset(provider, 'aionly')) {
    return 'endpoint-types'
  }
  if (provider.presetProviderId == null && !isSystemProviderId(provider.id)) return 'purpose'
  return 'legacy'
}

export function getProviderChatEndpointTypes(provider: ProviderChatEndpoints): ModelChatEndpointType[] {
  const endpointTypes: ModelChatEndpointType[] = []
  if (isModelChatEndpointType(provider.defaultChatEndpoint)) endpointTypes.push(provider.defaultChatEndpoint)
  for (const endpointType of Object.keys(provider.endpointConfigs ?? {})) {
    if (isModelChatEndpointType(endpointType) && !endpointTypes.includes(endpointType)) endpointTypes.push(endpointType)
  }
  return endpointTypes
}

export const inferModelPurpose = (fields: ModelPurposeFields): ModelPurpose => {
  void fields
  return 'chat'
}

export function getInitialChatEndpointType(
  fields: ModelPurposeFields,
  fallback: ModelChatEndpointType = ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS
): ModelChatEndpointType {
  return fields.endpointTypes?.find(isModelChatEndpointType) ?? fallback
}

export function applyModelPurpose(
  fields: ModelPurposeFields,
  _purpose: ModelPurpose,
  options: ApplyModelPurposeOptions = {}
): AppliedModelPurposeFields {
  return {
    endpointTypes: [options.chatEndpointType ?? getInitialChatEndpointType(fields)],
    capabilities: [...(fields.capabilities ?? [])],
    inputModalities: fields.inputModalities ? [...fields.inputModalities] : undefined,
    outputModalities: fields.outputModalities ? [...fields.outputModalities] : undefined
  }
}
