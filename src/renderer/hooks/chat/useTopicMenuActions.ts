import type { ResolvedAction } from '@renderer/components/chat/actions/actionTypes'
import {
  executeTopicMenuAction,
  resolveTopicMenuActions,
  type TopicActionContext,
  type TopicExportMenuOptions,
  type TopicMoveAssistantTarget
} from '@renderer/components/chat/actions/topicContextMenuActions'
import { ipcApi } from '@renderer/ipc'
import { copyTopicAsMarkdown, copyTopicAsPlainText } from '@renderer/services/copy'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { chooseImageExportMode } from '@renderer/services/imageExportModeChooser'
import { toast } from '@renderer/services/toast'
import type { Topic } from '@renderer/types/topic'
import { removeSpecialCharactersForFileName } from '@renderer/utils/file'
import type { TopicTabPosition } from '@shared/data/preference/preferenceTypes'
import type { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'

type TopicMenuHandler = (topic: Topic) => void | Promise<void>
type TopicMoveToAssistantHandler = (topic: Topic, assistantId: string) => void | Promise<void>

export interface TopicMenuActionOptions {
  exportMenuOptions: TopicExportMenuOptions
  isActiveInCurrentTab: boolean
  isRenaming: boolean
  onAutoRename: TopicMenuHandler
  onClearMessages: TopicMenuHandler
  onCopyImage?: TopicMenuHandler
  onDelete: TopicMenuHandler
  onExportImage?: TopicMenuHandler
  assistantMoveTargets?: readonly TopicMoveAssistantTarget[]
  onMoveToAssistant?: TopicMoveToAssistantHandler
  onOpenInNewTab?: TopicMenuHandler
  onOpenInNewWindow?: TopicMenuHandler
  onPinTopic: TopicMenuHandler
  onSetPanePosition?: (position: TopicTabPosition) => void | Promise<void>
  onStartRename: TopicMenuHandler
  panePosition?: TopicTabPosition
  t: TFunction
  topic: Topic
  topicsLength: number
}

export function createTopicActionContext({
  exportMenuOptions,
  isActiveInCurrentTab,
  isRenaming,
  assistantMoveTargets = [],
  onAutoRename,
  onClearMessages,
  onCopyImage,
  onDelete,
  onExportImage,
  onMoveToAssistant,
  onOpenInNewTab,
  onOpenInNewWindow,
  onPinTopic,
  onSetPanePosition,
  onStartRename,
  panePosition,
  t,
  topic,
  topicsLength
}: TopicMenuActionOptions): TopicActionContext {
  return {
    exportMenuOptions,
    isActiveInCurrentTab,
    isRenaming,
    onAutoRename,
    onClearMessages,
    onCopyImage: onCopyImage ?? ((topic) => void EventEmitter.emit(EVENT_NAMES.COPY_TOPIC_IMAGE, topic)),
    onCopyMarkdown: copyTopicAsMarkdown,
    onCopyPlainText: copyTopicAsPlainText,
    onDelete,
    onExportImage: onExportImage ?? ((topic) => void EventEmitter.emit(EVENT_NAMES.EXPORT_TOPIC_IMAGE, topic)),
    onExportMarkdown: async (topic) => {
      const { exportTopicAsMarkdown } = await import('@renderer/services/ExportService')
      return exportTopicAsMarkdown(topic, false, undefined, chooseImageExportMode)
    },
    onExportMarkdownReason: async (topic) => {
      const { exportTopicAsMarkdown } = await import('@renderer/services/ExportService')
      return exportTopicAsMarkdown(topic, true, undefined, chooseImageExportMode)
    },
    onExportWord: async (topic) => {
      const { topicToMarkdown } = await import('@renderer/services/ExportService')
      const markdown = await topicToMarkdown(topic)
      void ipcApi.request('export.word.from_markdown', {
        markdown,
        fileName: removeSpecialCharactersForFileName(topic.name)
      })
    },
    assistantMoveTargets: assistantMoveTargets.filter((target) => target.id !== topic.assistantId),
    onMoveToAssistant,
    onOpenInNewTab,
    onOpenInNewWindow,
    onPinTopic,
    onSetPanePosition,
    onSaveToKnowledge: async (topic) => {
      try {
        const { default: SaveToKnowledgePopup } = await import('@renderer/components/SaveToKnowledgePopup')
        const result = await SaveToKnowledgePopup.showForTopic(topic)
        if (result?.success) {
          toast.success(t('chat.save.topic.knowledge.success', { count: result.savedCount }))
        }
      } catch {
        toast.error(t('chat.save.topic.knowledge.error.save_failed'))
      }
    },
    onStartRename,
    panePosition,
    t,
    topic,
    topicsLength
  }
}

export function getTopicMenuActions(actionContext: TopicActionContext) {
  return resolveTopicMenuActions(actionContext)
}

export async function runTopicMenuAction(
  action: ResolvedAction<TopicActionContext>,
  actionContext: TopicActionContext
) {
  await executeTopicMenuAction(action, actionContext)
}

export type TopicMenuActionContextOverride = Partial<Pick<TopicActionContext, 'onStartRename'>>

export interface TopicMenuPreset<TItem> {
  getActions: (item: TItem, contextOverride?: TopicMenuActionContextOverride) => readonly ResolvedAction[]
  onAction: (
    item: TItem,
    action: ResolvedAction,
    contextOverride?: TopicMenuActionContextOverride
  ) => void | Promise<void>
}

export function useTopicMenuPreset<TItem>({
  getActionContext
}: {
  getActionContext: (item: TItem) => TopicActionContext
}): TopicMenuPreset<TItem> {
  const getActionContextWithOverride = useCallback(
    (item: TItem, contextOverride?: TopicMenuActionContextOverride) => ({
      ...getActionContext(item),
      ...contextOverride
    }),
    [getActionContext]
  )
  const getActions = useCallback(
    (item: TItem, contextOverride?: TopicMenuActionContextOverride) =>
      getTopicMenuActions(getActionContextWithOverride(item, contextOverride)) as ResolvedAction[],
    [getActionContextWithOverride]
  )
  const onAction = useCallback(
    async (item: TItem, action: ResolvedAction, contextOverride?: TopicMenuActionContextOverride) => {
      await runTopicMenuAction(
        action as ResolvedAction<TopicActionContext>,
        getActionContextWithOverride(item, contextOverride)
      )
    },
    [getActionContextWithOverride]
  )

  return useMemo(() => ({ getActions, onAction }), [getActions, onAction])
}

export function useTopicMenuActions(options: TopicMenuActionOptions) {
  const {
    exportMenuOptions,
    isActiveInCurrentTab,
    isRenaming,
    assistantMoveTargets,
    onAutoRename,
    onClearMessages,
    onCopyImage,
    onDelete,
    onExportImage,
    onMoveToAssistant,
    onOpenInNewTab,
    onOpenInNewWindow,
    onPinTopic,
    onSetPanePosition,
    onStartRename,
    panePosition,
    t,
    topic,
    topicsLength
  } = options
  const actionContext = useMemo(
    () =>
      createTopicActionContext({
        exportMenuOptions,
        isActiveInCurrentTab,
        isRenaming,
        assistantMoveTargets,
        onAutoRename,
        onClearMessages,
        onCopyImage,
        onDelete,
        onExportImage,
        onMoveToAssistant,
        onOpenInNewTab,
        onOpenInNewWindow,
        onPinTopic,
        onSetPanePosition,
        onStartRename,
        panePosition,
        t,
        topic,
        topicsLength
      }),
    [
      exportMenuOptions,
      isActiveInCurrentTab,
      isRenaming,
      assistantMoveTargets,
      onAutoRename,
      onClearMessages,
      onCopyImage,
      onDelete,
      onExportImage,
      onMoveToAssistant,
      onOpenInNewTab,
      onOpenInNewWindow,
      onPinTopic,
      onSetPanePosition,
      onStartRename,
      panePosition,
      t,
      topic,
      topicsLength
    ]
  )
  const getMenuActions = useCallback(() => getTopicMenuActions(actionContext), [actionContext])
  const handleMenuAction = useCallback(
    async (action: ResolvedAction<TopicActionContext>) => {
      await runTopicMenuAction(action, actionContext)
    },
    [actionContext]
  )

  return { actionContext, getMenuActions, handleMenuAction }
}
