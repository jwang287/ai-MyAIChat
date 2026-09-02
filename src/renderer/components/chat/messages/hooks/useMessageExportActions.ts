import type { MessageListActions } from '@renderer/components/chat/messages/types'
import { ipcApi } from '@renderer/ipc'
import { chooseImageExportMode } from '@renderer/services/imageExportModeChooser'
import type { MessageExportView } from '@renderer/types/messageExport'
import { useCallback, useMemo } from 'react'

type MessageExportActions = Pick<
  MessageListActions,
  'saveTextFile' | 'saveImage' | 'saveToKnowledge' | 'exportMessageAsMarkdown' | 'exportToWord'
>

export function useMessageExportActions(): MessageExportActions {
  const saveTextFile = useCallback((fileName: string, content: string) => {
    return window.api.file.save(fileName, content)
  }, [])

  const saveImage = useCallback((fileName: string, dataUrl: string) => {
    return window.api.file.saveImage(fileName, dataUrl)
  }, [])

  const exportToWord = useCallback((markdown: string, title: string) => {
    return ipcApi.request('export.word.from_markdown', { markdown, fileName: title })
  }, [])

  const saveToKnowledge = useCallback(async (message: MessageExportView) => {
    const { default: SaveToKnowledgePopup } = await import('@renderer/components/SaveToKnowledgePopup')
    void SaveToKnowledgePopup.showForMessage(message)
  }, [])

  const exportMessageAsMarkdown = useCallback(async (message: MessageExportView, includeReasoning?: boolean) => {
    const { exportMessageAsMarkdown: exportMessageAsMarkdownFile } = await import('@renderer/services/ExportService')
    return exportMessageAsMarkdownFile(message, includeReasoning, undefined, chooseImageExportMode)
  }, [])

  return useMemo(
    () => ({
      saveTextFile,
      saveImage,
      saveToKnowledge,
      exportMessageAsMarkdown,
      exportToWord
    }),
    [exportMessageAsMarkdown, exportToWord, saveImage, saveTextFile, saveToKnowledge]
  )
}
