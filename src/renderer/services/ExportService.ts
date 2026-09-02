import { preferenceService } from '@data/PreferenceService'
import { loggerService } from '@logger'
// Known same-tier soft-edge (inherited from the former utils/export):
// `getTopicMessages` is a non-React data accessor that happens to live in the
// `useTopic` hook module, so this is a service -> hook import. Sinking the
// accessor below the hooks tier is deferred as out of scope here.
import { getTopicMessages } from '@renderer/hooks/useTopic'
import { getProviderLabelKey } from '@renderer/i18n/label'
import i18n from '@renderer/i18n/resolver'
import { ipcApi } from '@renderer/ipc'
import { toast } from '@renderer/services/toast'
import type { ExportableMessage } from '@renderer/types/messageExport'
import type { Topic } from '@renderer/types/topic'
import { fetchMessagesSummary } from '@renderer/utils/aiGeneration'
import { getTitleFromString, messagesToPlainText, processCitations } from '@renderer/utils/export'
import { removeSpecialCharactersForFileName } from '@renderer/utils/file'
import { convertMathFormula, markdownToPlainText } from '@renderer/utils/markdown'
import { stripCitationMarkers } from '@renderer/utils/message/citations'
import { getComposerTextFromMessage } from '@renderer/utils/message/composerTokens'
import {
  getCitationContent,
  getMainTextContent,
  getNamingTextContent,
  getThinkingContent,
  getToolCitationExport
} from '@renderer/utils/message/find'
import type { ContentHash } from '@shared/data/types/file'
import { AbsoluteFilePathSchema, type FileVersion } from '@shared/types/file'
import { createFilePathHandle } from '@shared/utils/file'
import dayjs from 'dayjs'
import DOMPurify from 'dompurify'

import {
  collectExportableImages,
  type ImageExportMode,
  serializeMessagesWithImages,
  writeImageAssets
} from './markdownImageExport'

const logger = loggerService.withContext('ExportService')
type PendingImageWrite = Awaited<ReturnType<typeof serializeMessagesWithImages>>['pendingWrites'][number]

// Single export-in-progress mutex shared by every exporter below
// (Markdown and Word): a second export
// started while one is still running is rejected with a warning toast. This
// mutable runtime state is what classifies the module as a `service` (runtime
// logic) rather than a pure `util`.
let exportState = false

const getExportState = () => exportState
const setExportingState = (isExporting: boolean) => {
  exportState = isExporting
}

/**
 * 安全地处理思维链内容，保留安全的 HTML 标签如 <br>，移除危险内容
 *
 * 支持的标签：
 * - 结构：br, p, div, span, h1-h6, blockquote
 * - 格式：strong, b, em, i, u, s, del, mark, small, sup, sub
 * - 列表：ul, ol, li
 * - 代码：code, pre, kbd, var, samp
 * - 表格：table, thead, tbody, tfoot, tr, td, th
 *
 * @param content 原始思维链内容
 * @returns 安全处理后的内容
 */
const sanitizeReasoningContent = (content: string): string => {
  // 先处理换行符转换为 <br>
  const contentWithBr = content.replace(/\n/g, '<br>')

  // 使用 DOMPurify 清理内容，保留常用的安全标签和属性
  return DOMPurify.sanitize(contentWithBr, {
    ALLOWED_TAGS: [
      // 换行和基础结构
      'br',
      'p',
      'div',
      'span',
      // 文本格式化
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'del',
      'mark',
      'small',
      // 上标下标（数学公式、引用等）
      'sup',
      'sub',
      // 标题
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // 引用
      'blockquote',
      // 列表
      'ul',
      'ol',
      'li',
      // 代码相关
      'code',
      'pre',
      'kbd',
      'var',
      'samp',
      // 表格（AI输出中可能包含表格）
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',
      // 分隔线
      'hr'
    ],
    ALLOWED_ATTR: [
      // 安全的通用属性
      'class',
      'title',
      'lang',
      'dir',
      // code 标签的语言属性
      'data-language',
      // 表格属性
      'colspan',
      'rowspan',
      // 列表属性
      'start',
      'type'
    ],
    KEEP_CONTENT: true, // 保留被移除标签的文本内容
    RETURN_DOM: false,
    SANITIZE_DOM: true,
    // 允许的协议（预留，虽然目前没有允许链接标签）
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
  })
}

const getRoleText = async (
  role: string,
  modelName?: string,
  providerId?: string,
  author?: { name: string; emoji?: string }
): Promise<string> => {
  const { showModelNameInMarkdown, showModelProviderInMarkdown } = await preferenceService.getMultiple({
    showModelNameInMarkdown: 'data.export.markdown.show_model_name',
    showModelProviderInMarkdown: 'data.export.markdown.show_model_provider'
  })
  if (role === 'user') {
    return '🧑‍💻 User'
  } else if (role === 'system') {
    return '🤖 System'
  } else {
    // Prefer the frozen producing author (survives rename/delete); fall back to the generic label.
    const emoji = author?.emoji || '🤖'
    const authorLabel = author?.name || 'Assistant'
    let assistantText = `${emoji} `
    if (showModelNameInMarkdown && modelName) {
      // Author-first (mirrors the on-screen header); model is secondary when the author is known.
      assistantText += author?.name ? `${authorLabel} | ${modelName}` : modelName
      if (showModelProviderInMarkdown && providerId) {
        const providerDisplayName = i18n.t(getProviderLabelKey(providerId), { defaultValue: providerId })
        assistantText += ` | ${providerDisplayName}`
        return assistantText
      }
      return assistantText
    } else if (showModelProviderInMarkdown && providerId) {
      const providerDisplayName = i18n.t(getProviderLabelKey(providerId), { defaultValue: providerId })
      assistantText += `${authorLabel} | ${providerDisplayName}`
      return assistantText
    }
    return assistantText + authorLabel
  }
}

/**
 * 标准化引用内容为Markdown脚注格式
 * @param citations 引用列表
 * @returns Markdown脚注格式的引用内容
 */
const formatCitationsAsFootnotes = (citations: string): string => {
  if (!citations.trim()) return ''

  // 将引用列表转换为脚注格式
  const lines = citations.split('\n\n')
  const footnotes = lines.map((line) => {
    const match = line.match(/^\[(\d+)\]\s*(.+)/)
    if (match) {
      const [, num, content] = match
      return `[^${num}]: ${content}`
    }
    return line
  })

  return footnotes.join('\n\n')
}

const createBaseMarkdown = async (
  message: ExportableMessage,
  includeReasoning: boolean = false,
  excludeCitations: boolean = false,
  normalizeCitations: boolean = true,
  rawContentOverride?: string
): Promise<{ titleSection: string; reasoningSection: string; contentSection: string; citation: string }> => {
  const forceDollarMathInMarkdown = await preferenceService.get('data.export.markdown.force_dollar_math')
  const author = 'messageSnapshot' in message ? message.messageSnapshot : undefined
  // Fall back to the frozen author's model when the projection didn't populate a live `model`
  // (e.g. topic exports), so the model/provider still render when those export prefs are on.
  const model = message.model ?? author?.model
  const roleText = await getRoleText(message.role, model?.name, model?.provider, author)
  const titleSection = `## ${roleText}`
  let reasoningSection = ''

  if (includeReasoning) {
    let reasoningContent = getThinkingContent(message)
    if (reasoningContent) {
      if (reasoningContent.startsWith('<think>\n')) {
        reasoningContent = reasoningContent.substring(8)
      } else if (reasoningContent.startsWith('<think>')) {
        reasoningContent = reasoningContent.substring(7)
      }
      // 使用 DOMPurify 安全地处理思维链内容
      reasoningContent = sanitizeReasoningContent(reasoningContent)
      // The model cites its sources while reasoning too, but the `[N]` numbering below
      // belongs to the answer body — strip rather than resolve, so no internal marker
      // survives and no second, conflicting sequence appears.
      reasoningContent = stripCitationMarkers(reasoningContent)
      if (forceDollarMathInMarkdown) {
        reasoningContent = convertMathFormula(reasoningContent)
      }
      reasoningSection = `<div style="border: 2px solid #dddddd; border-radius: 10px;">
  <details style="padding: 5px;">
    <summary>${i18n.t('common.reasoning_content')}</summary>
    ${reasoningContent}
  </details>
</div>
`
    }
  }

  // Image-bearing exports pass an interleaved text+image serialization here (already
  // composer-token processed) and bypass the shared extraction — user messages would
  // otherwise have their parts text re-extracted, dropping the images again.
  const rawContent =
    rawContentOverride !== undefined
      ? rawContentOverride
      : getComposerTextFromMessage(message, getMainTextContent(message))
  // Tool-derived citations live as `[cite:id]` markers in the text with no persisted
  // reference metadata, so resolve them to plain `[N]` here — otherwise the internal
  // marker leaks into the export and the sources list comes back empty. Messages that
  // do carry reference metadata keep the legacy path (see `getToolCitationExport`).
  const { content, citation: toolCitation } = getToolCitationExport(message, rawContent)
  let citation = excludeCitations ? '' : getCitationContent(message) || toolCitation

  let processedContent = forceDollarMathInMarkdown ? convertMathFormula(content) : content

  // 处理引用标记
  if (excludeCitations) {
    processedContent = processCitations(processedContent, 'remove')
  } else if (normalizeCitations) {
    processedContent = processCitations(processedContent, 'normalize')
    citation = formatCitationsAsFootnotes(citation)
  }

  return { titleSection, reasoningSection, contentSection: processedContent, citation }
}

export async function getMessageTitle(message: ExportableMessage, length = 30): Promise<string> {
  const content = getNamingTextContent(message)

  // Read from v2 Preference (`data.export.markdown.use_topic_naming_for_message_title`)
  // — the v1 Redux key was migrated; the renderer settings page reads the same
  // Preference key, so a stale read here would diverge from the settings UI value.
  const useTopicNaming = await preferenceService.get('data.export.markdown.use_topic_naming_for_message_title')
  if (useTopicNaming) {
    try {
      const titlePromise = fetchMessagesSummary({ messages: [message] })
      toast.loading({ title: i18n.t('chat.topics.export.wait_for_title_naming'), promise: titlePromise })
      const { text: title } = await titlePromise

      if (title) {
        toast.success(i18n.t('chat.topics.export.title_naming_success'))
        return title
      }
    } catch (e) {
      toast.error(i18n.t('chat.topics.export.title_naming_failed'))
      logger.error('Failed to generate title using topic naming, downgraded to default logic', e as Error)
    }
  }

  let title = getTitleFromString(content, length)

  if (!title) {
    title = dayjs(message.createdAt).format('YYYYMMDDHHmm')
  }

  return title
}

export const messageToMarkdown = async (
  message: ExportableMessage,
  excludeCitations?: boolean,
  rawContentOverride?: string
): Promise<string> => {
  const { excludeCitationsInExport, standardizeCitationsInExport } = await preferenceService.getMultiple({
    excludeCitationsInExport: 'data.export.markdown.exclude_citations',
    standardizeCitationsInExport: 'data.export.markdown.standardize_citations'
  })
  const shouldExcludeCitations = excludeCitations ?? excludeCitationsInExport
  const { titleSection, contentSection, citation } = await createBaseMarkdown(
    message,
    false,
    shouldExcludeCitations,
    standardizeCitationsInExport,
    rawContentOverride
  )
  return [titleSection, '', contentSection, citation].join('\n')
}

export const messageToMarkdownWithReasoning = async (
  message: ExportableMessage,
  excludeCitations?: boolean,
  rawContentOverride?: string
): Promise<string> => {
  const { excludeCitationsInExport, standardizeCitationsInExport } = await preferenceService.getMultiple({
    excludeCitationsInExport: 'data.export.markdown.exclude_citations',
    standardizeCitationsInExport: 'data.export.markdown.standardize_citations'
  })
  const shouldExcludeCitations = excludeCitations ?? excludeCitationsInExport
  const { titleSection, reasoningSection, contentSection, citation } = await createBaseMarkdown(
    message,
    true,
    shouldExcludeCitations,
    standardizeCitationsInExport,
    rawContentOverride
  )
  return [titleSection, '', reasoningSection, contentSection, citation].join('\n')
}

export const messagesToMarkdown = async (
  messages: ExportableMessage[],
  exportReasoning?: boolean,
  excludeCitations?: boolean,
  rawContentOverrides?: Map<string, string>
): Promise<string> => {
  const converter = exportReasoning ? messageToMarkdownWithReasoning : messageToMarkdown
  const markdowns = await Promise.all(
    messages.map((message) => converter(message, excludeCitations, rawContentOverrides?.get(message.id)))
  )
  return markdowns.join('\n---\n')
}

export const topicToMarkdown = async (
  topic: Topic,
  exportReasoning?: boolean,
  excludeCitations?: boolean,
  rawContentOverrides?: Map<string, string>,
  messagesOverride?: ExportableMessage[]
): Promise<string> => {
  const topicName = `# ${topic.name}`

  // Callers that already read the topic (image export collects refs from a snapshot)
  // pass it back so collection and rendering can never diverge mid-export.
  const messages = messagesOverride ?? (await getTopicMessages(topic.id))

  if (messages && messages.length > 0) {
    return (
      topicName + '\n\n' + (await messagesToMarkdown(messages, exportReasoning, excludeCitations, rawContentOverrides))
    )
  }

  return topicName
}

export const topicToPlainText = async (topic: Topic): Promise<string> => {
  const topicName = markdownToPlainText(topic.name).trim()

  const topicMessages = await getTopicMessages(topic.id)

  if (topicMessages && topicMessages.length > 0) {
    return topicName + '\n\n' + messagesToPlainText(topicMessages)
  }

  return topicName
}

export const exportMarkdownContentAsFile = async (title: string, markdown: string): Promise<void> => {
  if (getExportState()) {
    toast.warning(i18n.t('message.warn.export.exporting'))
    return
  }

  setExportingState(true)

  const markdownExportPath = await preferenceService.get('data.export.markdown.path')
  if (!markdownExportPath) {
    try {
      const fileName = removeSpecialCharactersForFileName(title) + '.md'
      const result = await window.api.file.save(fileName, markdown)
      if (result) {
        toast.success(i18n.t('message.success.markdown.export.specified'))
      }
    } catch (error: any) {
      toast.error(i18n.t('message.error.markdown.export.specified'))
      logger.error('Failed to export markdown content:', error)
    } finally {
      setExportingState(false)
    }
  } else {
    try {
      const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
      const fileName = removeSpecialCharactersForFileName(title) + ` ${timestamp}.md`
      await window.api.file.write(markdownExportPath + '/' + fileName, markdown)
      toast.success(i18n.t('message.success.markdown.export.preconf'))
    } catch (error: any) {
      toast.error(i18n.t('message.error.markdown.export.preconf'))
      logger.error('Failed to export markdown content:', error)
    } finally {
      setExportingState(false)
    }
  }
}

/** Containing directory of a saved file path, tolerating both path separators. */
const dirOf = (filePath: string): string => {
  const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  if (idx < 0) return filePath
  const dir = filePath.slice(0, idx) || '/'
  // A bare drive letter is not a usable directory — keep its separator ('C:\a.md' → 'C:\').
  return /^[A-Za-z]:$/.test(dir) ? `${dir}\\` : dir
}

/**
 * UI decision injected by the hook entry points (services must not import
 * components or render UI — renderer-architecture §2). Null = the user cancelled;
 * undefined = no implementation available (both abort).
 */
export type ImageModeChooser = (imageCount: number) => Promise<ImageExportMode | null | undefined>

/**
 * Image-mode gate for Markdown file exports: collect images, ask the user how to
 * carry them via the injected chooser (only consulted when images exist), then
 * serialize when a carrying mode is chosen. Returns null when the user cancels —
 * the caller aborts without any file write.
 */
const buildMarkdownWithImages = async (
  messages: ExportableMessage[],
  build: (rawContentOverrides?: Map<string, string>) => Promise<string>,
  chooseImageMode?: ImageModeChooser
): Promise<{ markdown: string; pendingWrites: PendingImageWrite[] } | null> => {
  const { refs, unresolvedCount: unresolved } = await collectExportableImages(messages)
  if (refs.length === 0) {
    if (unresolved > 0) {
      toast.warning(i18n.t('chat.topics.export.image_mode.skipped', { count: unresolved }))
    }
    return { markdown: await build(), pendingWrites: [] }
  }
  // undefined = no chooser injected (service called without UI context); null = user cancelled.
  const mode = chooseImageMode ? await chooseImageMode(refs.length) : undefined
  if (mode === undefined) {
    logger.warn('No image-mode chooser provided; aborting an image-bearing markdown export')
    return null
  }
  if (mode === null || mode === 'none') {
    return mode === null ? null : { markdown: await build(), pendingWrites: [] }
  }
  const { overrides, pendingWrites, skippedCount } = await serializeMessagesWithImages(messages, mode, refs)
  const totalSkipped = skippedCount + unresolved
  if (totalSkipped > 0) {
    // Embed mode skips oversized OR unreadable images; folder mode has no size
    // cap, so its skips (and collection failures) are purely availability.
    const key =
      mode === 'embed' ? 'chat.topics.export.image_mode.skipped_embed' : 'chat.topics.export.image_mode.skipped'
    toast.warning(i18n.t(key, { count: totalSkipped }))
  }
  return { markdown: await build(overrides), pendingWrites }
}

const escapeAssetName = (fileName: string): string => fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Strips the failed images' assets/ links from the just-written .md; the atomic
// conditional write refuses when the file changed since expectedVersion (user edits win).
const repairDanglingImageLinks = async (
  mdPath: string,
  markdown: string,
  failedFileNames: string[],
  expectedVersion: FileVersion,
  expectedContentHash: ContentHash | undefined
): Promise<void> => {
  let repaired = markdown
  for (const fileName of failedFileNames) {
    // 'g' clears every occurrence of a deduped asset name; the alt class excludes
    // '[' and '\n' so a stray unpaired '![' in user text can never widen the match.
    repaired = repaired.replace(
      new RegExp(`!\\[[^\\][\\n]*\\]\\(assets/${escapeAssetName(fileName)}\\)\\n{0,2}`, 'g'),
      ''
    )
  }
  if (repaired === markdown) {
    logger.warn('No dangling image links matched during the markdown repair', { mdPath, failedFileNames })
    return
  }
  await ipcApi.request('file.write_if_unchanged', {
    handle: createFilePathHandle(AbsoluteFilePathSchema.parse(mdPath)),
    data: new TextEncoder().encode(repaired),
    expectedVersion,
    expectedContentHash
  })
}

// Returns the version+hash pair only while the .md still holds exactly our markdown —
// an external rewrite voids the repair; the hash closes same-second mtime ambiguity (FAT32/SMB/NFS).
const readWrittenMarkdownVersion = async (
  mdPath: string,
  markdown: string
): Promise<{ version: FileVersion; contentHash?: ContentHash } | null> => {
  try {
    const { content, version, contentHash } = await ipcApi.request('file.read', {
      handle: createFilePathHandle(AbsoluteFilePathSchema.parse(mdPath)),
      options: { mode: 'full', encoding: 'binary', withContentHash: true }
    })
    return new TextDecoder().decode(content) === markdown ? { version, contentHash } : null
  } catch {
    return null
  }
}

/** Folder mode: write image assets next to the .md; failed images get their links stripped and warn. */
const exportImageAssets = async (
  mdPath: string,
  markdown: string,
  pendingWrites: PendingImageWrite[]
): Promise<void> => {
  if (pendingWrites.length === 0) return
  const failed = await writeImageAssets(dirOf(mdPath), pendingWrites)
  if (failed.length === 0) return
  // Read back only on failure — the content-equality gate protects external
  // rewrites, and the all-assets-succeeded path pays no extra IPC.
  const snapshot = await readWrittenMarkdownVersion(mdPath, markdown)
  if (snapshot) {
    try {
      await repairDanglingImageLinks(mdPath, markdown, failed, snapshot.version, snapshot.contentHash)
    } catch (error) {
      logger.warn('Failed to strip dangling image links from the exported markdown', { mdPath, error })
    }
  } else {
    logger.warn('Skipped the dangling-link repair: the exported .md no longer holds this export', { mdPath })
  }
  toast.warning(i18n.t('chat.topics.export.image_mode.write_failed', { count: failed.length }))
}

export const exportTopicAsMarkdown = async (
  topic: Topic,
  exportReasoning?: boolean,
  excludeCitations?: boolean,
  chooseImageMode?: ImageModeChooser
): Promise<void> => {
  if (getExportState()) {
    toast.warning(i18n.t('message.warn.export.exporting'))
    return
  }

  setExportingState(true)

  const markdownExportPath = await preferenceService.get('data.export.markdown.path')
  if (!markdownExportPath) {
    try {
      const fileName = removeSpecialCharactersForFileName(topic.name) + '.md'
      const messages = await getTopicMessages(topic.id)
      const built = await buildMarkdownWithImages(
        messages ?? [],
        (overrides) => topicToMarkdown(topic, exportReasoning, excludeCitations, overrides, messages ?? []),
        chooseImageMode
      )
      if (!built) return
      const result = await window.api.file.save(fileName, built.markdown)
      if (result) {
        await exportImageAssets(result, built.markdown, built.pendingWrites)
        toast.success(i18n.t('message.success.markdown.export.specified'))
      }
    } catch (error: any) {
      toast.error(i18n.t('message.error.markdown.export.specified'))
      logger.error('Failed to export topic as markdown:', error)
    } finally {
      setExportingState(false)
    }
  } else {
    try {
      const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
      const fileName = removeSpecialCharactersForFileName(topic.name) + ` ${timestamp}.md`
      const messages = await getTopicMessages(topic.id)
      const built = await buildMarkdownWithImages(
        messages ?? [],
        (overrides) => topicToMarkdown(topic, exportReasoning, excludeCitations, overrides, messages ?? []),
        chooseImageMode
      )
      if (!built) return
      const mdPath = markdownExportPath + '/' + fileName
      await window.api.file.write(mdPath, built.markdown)
      await exportImageAssets(mdPath, built.markdown, built.pendingWrites)
      toast.success(i18n.t('message.success.markdown.export.preconf'))
    } catch (error: any) {
      toast.error(i18n.t('message.error.markdown.export.preconf'))
      logger.error('Failed to export topic as markdown:', error)
    } finally {
      setExportingState(false)
    }
  }
}

export const exportMessageAsMarkdown = async (
  message: ExportableMessage,
  exportReasoning?: boolean,
  excludeCitations?: boolean,
  chooseImageMode?: ImageModeChooser
): Promise<void> => {
  if (getExportState()) {
    toast.warning(i18n.t('message.warn.export.exporting'))
    return
  }

  setExportingState(true)

  const buildWithOverrides = async (overrides?: Map<string, string>): Promise<string> => {
    const rawContentOverride = overrides?.get(message.id)
    return exportReasoning
      ? await messageToMarkdownWithReasoning(message, excludeCitations, rawContentOverride)
      : await messageToMarkdown(message, excludeCitations, rawContentOverride)
  }

  const markdownExportPath = await preferenceService.get('data.export.markdown.path')
  if (!markdownExportPath) {
    try {
      const title = await getMessageTitle(message)
      const fileName = removeSpecialCharactersForFileName(title) + '.md'
      const built = await buildMarkdownWithImages([message], buildWithOverrides, chooseImageMode)
      if (!built) return
      const result = await window.api.file.save(fileName, built.markdown)
      if (result) {
        await exportImageAssets(result, built.markdown, built.pendingWrites)
        toast.success(i18n.t('message.success.markdown.export.specified'))
      }
    } catch (error: any) {
      toast.error(i18n.t('message.error.markdown.export.specified'))
      logger.error('Failed to export message as markdown:', error)
    } finally {
      setExportingState(false)
    }
  } else {
    try {
      const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
      const title = await getMessageTitle(message)
      const fileName = removeSpecialCharactersForFileName(title) + ` ${timestamp}.md`
      const built = await buildMarkdownWithImages([message], buildWithOverrides, chooseImageMode)
      if (!built) return
      const mdPath = markdownExportPath + '/' + fileName
      await window.api.file.write(mdPath, built.markdown)
      await exportImageAssets(mdPath, built.markdown, built.pendingWrites)
      toast.success(i18n.t('message.success.markdown.export.preconf'))
    } catch (error: any) {
      toast.error(i18n.t('message.error.markdown.export.preconf'))
      logger.error('Failed to export message as markdown:', error)
    } finally {
      setExportingState(false)
    }
  }
}
