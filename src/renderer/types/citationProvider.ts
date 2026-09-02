import type { LanguageModelV3Source } from '@ai-sdk/provider'
import type { WebSearchResultBlock } from '@anthropic-ai/sdk/resources'
import type OpenAI from '@cherrystudio/openai'
import type { GroundingMetadata } from '@google/genai'
import { objectValues } from '@renderer/utils/object'
import * as z from 'zod'

export type AiSdkCitationResult = Omit<Extract<LanguageModelV3Source, { sourceType: 'url' }>, 'sourceType'>

export type CitationResults =
  | GroundingMetadata
  | OpenAI.Chat.Completions.ChatCompletionMessage.Annotation.URLCitation[]
  | OpenAI.Responses.ResponseOutputText.URLCitation[]
  | WebSearchResultBlock[]
  | AiSdkCitationResult[]
  | any[]

export const CITATION_SOURCE = {
  WEBSEARCH: 'websearch',
  OPENAI: 'openai',
  OPENAI_RESPONSE: 'openai-response',
  OPENROUTER: 'openrouter',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  PERPLEXITY: 'perplexity',
  QWEN: 'qwen',
  HUNYUAN: 'hunyuan',
  ZHIPU: 'zhipu',
  GROK: 'grok',
  AISDK: 'ai-sdk'
} as const

export const CitationSourceSchema = z.enum(objectValues(CITATION_SOURCE))
export type CitationSource = z.infer<typeof CitationSourceSchema>

export type CitationProviderResponse = {
  results?: CitationResults
  source: CitationSource
}
