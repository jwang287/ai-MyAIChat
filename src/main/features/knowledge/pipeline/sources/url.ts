import { loggerService } from '@logger'
import { defaultAppHeaders } from '@main/utils/http'
import { net } from 'electron'
import PQueue from 'p-queue'
import { sanitizeUrl } from 'strict-url-sanitise'

const logger = loggerService.withContext('KnowledgeUrlSource')
const DEFAULT_FETCH_TIMEOUT_MS = 30000
const KNOWLEDGE_WEB_FETCH_CONCURRENCY = 3
const KNOWLEDGE_WEB_FETCH_INTERVAL_CAP = 10
const KNOWLEDGE_WEB_FETCH_INTERVAL_MS = 60_000
const JINA_READER_URL = 'https://r.jina.ai'

const knowledgeWebFetchQueue = new PQueue({
  concurrency: KNOWLEDGE_WEB_FETCH_CONCURRENCY,
  intervalCap: KNOWLEDGE_WEB_FETCH_INTERVAL_CAP,
  interval: KNOWLEDGE_WEB_FETCH_INTERVAL_MS
})

export interface KnowledgeWebPage {
  title: string
  markdown: string
}

type JinaReaderResponse = {
  data?: {
    title?: string
    content?: string
    text?: string
  }
  title?: string
  content?: string
  text?: string
}

async function fetchKnowledgeUrl(url: string, signal: AbortSignal): Promise<KnowledgeWebPage> {
  const response = await net.fetch(`${JINA_READER_URL}/${url}`, {
    headers: {
      ...defaultAppHeaders(),
      Accept: 'application/json',
      'X-Retain-Images': 'none'
    },
    signal
  })
  if (!response.ok) {
    throw new Error(`Knowledge URL fetch failed: HTTP ${response.status}`)
  }

  const payload = (await response.json()) as JinaReaderResponse
  const content = payload.data?.content ?? payload.data?.text ?? payload.content ?? payload.text
  if (!content) {
    throw new Error(`Knowledge URL fetch returned no content for ${url}`)
  }

  return {
    title: (payload.data?.title ?? payload.title ?? url).trim(),
    markdown: content.trim()
  }
}

export function sanitizeKnowledgeUrl(rawUrl: string): string {
  try {
    const sanitizedUrl = sanitizeUrl(rawUrl)
    const parsedRawUrl = new URL(rawUrl)

    if (parsedRawUrl.pathname === '/' && !rawUrl.endsWith('/') && !parsedRawUrl.search && !parsedRawUrl.hash) {
      return sanitizedUrl.replace(/\/$/, '')
    }

    return sanitizedUrl
  } catch {
    throw new Error(`Invalid knowledge url: ${rawUrl}`)
  }
}

export async function fetchKnowledgeWebPage(url: string, signal?: AbortSignal): Promise<KnowledgeWebPage> {
  try {
    const safeUrl = sanitizeKnowledgeUrl(url)

    const response = await knowledgeWebFetchQueue.add(
      async () => {
        const timeoutSignal = AbortSignal.timeout(DEFAULT_FETCH_TIMEOUT_MS)
        const fetchSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

        return await fetchKnowledgeUrl(safeUrl, fetchSignal)
      },
      signal ? { signal } : undefined
    )
    if (!response) {
      throw new Error(`Knowledge web fetch queue returned no response for ${safeUrl}`)
    }

    return response
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error))
    logger.error(`Failed to load knowledge web page: ${url}`, normalizedError)
    throw error
  }
}
