import type { MessageListProviderValue, MessageListRuntime } from '@renderer/components/chat/messages/types'
import { toast } from '@renderer/services/toast'
import type { Topic } from '@renderer/types/topic'
import type { CherryMessagePart, CherryUIMessage } from '@shared/data/types/message'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const exportActionsMock = vi.hoisted(() => ({
  saveTextFile: vi.fn(),
  saveImage: vi.fn(),
  saveToKnowledge: vi.fn(),
  exportMessageAsMarkdown: vi.fn(),
  exportToNotes: vi.fn(),
  exportToWord: vi.fn()
}))
const useMessageExportActionsMock = vi.hoisted(() => vi.fn(() => exportActionsMock))
const cacheHookMocks = vi.hoisted(() => ({
  setMultiSelectMode: vi.fn(),
  setSelectedMessageIds: vi.fn()
}))
const errorActionsMock = vi.hoisted(() => ({
  diagnoseMessageError: vi.fn(),
  openErrorDetail: vi.fn(),
  navigateErrorTarget: vi.fn()
}))
const useMessageErrorActionsMock = vi.hoisted(() =>
  vi.fn<(options?: unknown) => typeof errorActionsMock>(() => errorActionsMock)
)
const dataApiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn()
}))
const leafCapabilitiesMock = vi.hoisted(() => ({
  previewFile: vi.fn(),
  subscribeToolProgress: vi.fn(),
  openExternalUrl: vi.fn(),
  copyText: vi.fn(),
  copyRichContent: vi.fn(),
  copyImage: vi.fn(),
  exportTableAsExcel: vi.fn(),
  notifyInfo: vi.fn(),
  notifySuccess: vi.fn(),
  notifyWarning: vi.fn(),
  notifyError: vi.fn(),
  getFileView: vi.fn(),
  isToolAutoApproved: vi.fn(() => false)
}))
const headerCapabilitiesMock = vi.hoisted(() => ({
  userProfile: { avatar: '🙂' },
  openUserProfile: vi.fn()
}))
const openRouteMock = vi.hoisted(() => vi.fn())
const ipcApiRequest = vi.hoisted(() => vi.fn())
const eventMocks = vi.hoisted(() => ({
  emit: vi.fn(),
  on: vi.fn(() => vi.fn()),
  // The locate dispatcher polls for a mounted subscriber before emitting; the
  // mock reports one so delivery happens on the first animation frame.
  listenerCount: vi.fn(() => 1)
}))

vi.mock('@renderer/ipc', () => ({ ipcApi: { request: ipcApiRequest } }))

vi.mock('@data/hooks/useCache', () => ({
  useCache: (key: string) => {
    if (key === 'chat.multi_select_mode') return [true, cacheHookMocks.setMultiSelectMode]
    if (key === 'chat.selected_message_ids') return [['user-1'], cacheHookMocks.setSelectedMessageIds]
    return [undefined, vi.fn()]
  }
}))

vi.mock('@data/CacheService', () => ({
  cacheService: {
    get: vi.fn(() => undefined),
    set: vi.fn()
  }
}))

vi.mock('@data/DataApiService', () => ({
  dataApiService: dataApiMocks
}))

vi.mock('@renderer/hooks/useTopicStreamStatus', () => ({
  useTopicStreamStatus: () => ({
    status: 'idle',
    activeExecutions: []
  })
}))

vi.mock('@renderer/components/chat/messages/hooks/useMessageListRenderConfig', () => ({
  useMessageListRenderConfig: () => ({
    renderConfig: {
      userName: '',
      narrowMode: false,
      messageStyle: 'plain',
      messageFont: 'system',
      fontSize: 14,
      renderInputMessageAsMarkdown: false,
      codeFancyBlock: true,
      thoughtAutoCollapse: true,
      mathEnableSingleDollar: false,
      showMessageOutline: false,
      multiModelMessageStyle: 'horizontal',
      multiModelGridColumns: 2,
      multiModelGridPopoverTrigger: 'click'
    },
    updateRenderConfig: vi.fn()
  })
}))

vi.mock('@renderer/components/chat/messages/hooks/useMessageMenuConfig', () => ({
  useMessageMenuConfig: () => ({
    confirmDeleteMessage: false,
    enableDeveloperMode: false,
    exportMenuOptions: {
      image: false,
      markdown: false,
      markdown_reason: false,
      docx: false,
      plain_text: false
    }
  })
}))

vi.mock('@renderer/components/chat/messages/hooks/useMessageExportActions', () => ({
  useMessageExportActions: useMessageExportActionsMock
}))

vi.mock('@renderer/components/chat/messages/hooks/useMessageErrorActions', () => ({
  useMessageErrorActions: useMessageErrorActionsMock
}))

vi.mock('@renderer/components/chat/messages/hooks/useMessageLeafCapabilities', () => ({
  useMessageLeafCapabilities: () => leafCapabilitiesMock
}))

vi.mock('@renderer/components/chat/messages/hooks/useMessageHeaderCapabilities', () => ({
  useMessageHeaderCapabilities: () => headerCapabilitiesMock
}))

vi.mock('@renderer/services/mainWindowNavigation', () => ({
  openRoute: openRouteMock
}))

vi.mock('@renderer/services/EventService', () => ({
  EVENT_NAMES: {
    LOCATE_MESSAGE: 'LOCATE_MESSAGE'
  },
  EventEmitter: eventMocks
}))

vi.mock('@renderer/services/ExportService', () => ({
  messagesToMarkdown: vi.fn(async () => 'markdown')
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

const { useAgentMessageListProviderValue } = await import('../agentMessageListAdapter')
const {
  clearPendingAgentSessionImageActionsForTest,
  consumePendingAgentSessionImageActions,
  requestAgentSessionImageAction
} = await import('../agentSessionImageActionBus')

describe('useAgentMessageListProviderValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPendingAgentSessionImageActionsForTest()
    window.api.file.openPath = vi.fn()
    ipcApiRequest.mockReset()
    ipcApiRequest.mockResolvedValue({
      kind: 'file',
      type: 'other',
      size: 0,
      createdAt: 0,
      modifiedAt: 0,
      mime: 'application/octet-stream'
    })
  })

  it('rejects unresolved relative paths when no workspace root is available', () => {
    const topic = {
      id: 'agent-session:session-1',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic

    let value: MessageListProviderValue | undefined
    const Probe = () => {
      value = useAgentMessageListProviderValue({
        topic,
        messages: [],
        partsByMessageId: {},
        assistantId: 'agent-1',
        isLoading: false,
        messageNavigation: 'anchor'
        // no workspacePath — a session whose workspace has not resolved yet
      })
      return null
    }
    render(<Probe />)

    expect(() => value?.actions.openPath?.('dist/report.md')).toThrow(/absolute path/i)
    expect(window.api.file.openPath).not.toHaveBeenCalled()
  })

  it('injects Agent-session diagnosis persistence into the shared error UI', async () => {
    const topic = {
      id: 'agent-session:session-1',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    dataApiMocks.get.mockResolvedValue({
      data: { parts: [{ type: 'data-error', data: { name: 'AgentRuntimeError', message: 'failed' } }] }
    })
    const diagnosticReport = { location: 'Interactive Agent conversation' }

    const Probe = () => {
      const params = {
        topic,
        messages: [],
        partsByMessageId: {},
        diagnosticReport,
        isLoading: false,
        messageNavigation: 'anchor'
      }
      useAgentMessageListProviderValue(params)
      return null
    }
    render(<Probe />)

    const options = useMessageErrorActionsMock.mock.calls.at(-1)?.[0] as {
      diagnosticReport: { location: string }
      persistDiagnosis: (partId: string, diagnosis: { summary: string }) => Promise<void>
    }
    expect(options.diagnosticReport).toEqual(diagnosticReport)
    await options.persistDiagnosis('message-1-part-0', { summary: 'Runtime failed' })

    expect(dataApiMocks.get).toHaveBeenCalledWith('/agent-sessions/session-1/messages/message-1')
    expect(dataApiMocks.patch).toHaveBeenCalledWith('/agent-sessions/session-1/messages/message-1', {
      body: {
        data: {
          parts: [
            expect.objectContaining({
              providerMetadata: expect.objectContaining({
                cherry: expect.objectContaining({ diagnosis: expect.objectContaining({ summary: 'Runtime failed' }) })
              })
            })
          ]
        }
      }
    })
  })

  it('omits diagnostic-report actions when the consumer does not provide that capability', () => {
    const topic = {
      id: 'agent-session:session-1',
      assistantId: 'agent-1',
      name: 'Read-only Agent tool flow',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic

    const Probe = () => {
      useAgentMessageListProviderValue({
        topic,
        messages: [],
        partsByMessageId: {},
        isLoading: false,
        messageNavigation: 'anchor'
      })
      return null
    }
    render(<Probe />)

    expect(useMessageErrorActionsMock.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ diagnosticReport: undefined })
    )
  })

  it('exposes diagnostic report launch only to the interactive message consumer', () => {
    const topic = {
      id: 'agent-session:session-1',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    const openDiagnosticReport = vi.fn()
    let interactiveValue: MessageListProviderValue | undefined
    let captureValue: MessageListProviderValue | undefined

    const Probe = ({ capture = false }: { capture?: boolean }) => {
      const value = useAgentMessageListProviderValue({
        topic,
        messages: [],
        partsByMessageId: {},
        isLoading: false,
        imageActionConsumer: capture ? 'capture' : undefined,
        messageNavigation: 'anchor',
        openDiagnosticReport
      })
      if (capture) captureValue = value
      else interactiveValue = value
      return null
    }

    const view = render(<Probe />)
    view.rerender(<Probe capture />)

    expect(interactiveValue?.actions.openDiagnosticReport).toBe(openDiagnosticReport)
    expect(captureValue?.actions.openDiagnosticReport).toBeUndefined()
  })

  it('renders terminal fallbacks in both current and sealed history layers', () => {
    const topic = {
      id: 'agent-session:session-1',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    const messages = [
      {
        id: 'assistant-error',
        role: 'assistant',
        parts: [],
        metadata: { createdAt: '2026-01-01T00:00:00.000Z', status: 'error' }
      },
      {
        id: 'assistant-empty-success',
        role: 'assistant',
        parts: [],
        metadata: { createdAt: '2026-01-01T00:00:01.000Z', status: 'success' }
      },
      {
        id: 'assistant-pending',
        role: 'assistant',
        parts: [],
        metadata: { createdAt: '2026-01-01T00:00:02.000Z', status: 'pending' }
      },
      {
        id: 'assistant-hidden-success',
        role: 'assistant',
        parts: [{ type: 'data-agent-task-event', data: {} }],
        metadata: { createdAt: '2026-01-01T00:00:03.000Z', status: 'success' }
      }
    ] as CherryUIMessage[]
    const partsByMessageId = Object.fromEntries(messages.map((message) => [message.id, message.parts ?? []]))
    const streamingLayers = { historyPartsByMessageId: partsByMessageId, liveMessageIds: [] }
    let value: MessageListProviderValue | undefined

    const Probe = () => {
      value = useAgentMessageListProviderValue({
        topic,
        messages,
        partsByMessageId,
        streamingLayers,
        isLoading: false,
        messageNavigation: 'none'
      })
      return null
    }

    render(<Probe />)

    expect(value?.state.partsByMessageId?.['assistant-error']).toEqual([
      expect.objectContaining({ type: 'data-error', data: expect.objectContaining({ message: expect.any(String) }) })
    ])
    expect(value?.state.partsByMessageId?.['assistant-empty-success']).toEqual([
      expect.objectContaining({ type: 'data-error', data: expect.objectContaining({ message: expect.any(String) }) })
    ])
    expect(value?.state.partsByMessageId?.['assistant-pending']).toEqual([])
    expect(value?.state.partsByMessageId?.['assistant-hidden-success']).toEqual([
      expect.objectContaining({ type: 'data-agent-task-event' }),
      expect.objectContaining({ type: 'data-error', data: expect.objectContaining({ message: expect.any(String) }) })
    ])
    expect(value?.state.streamingLayers?.historyPartsByMessageId['assistant-error']).toEqual([
      expect.objectContaining({ type: 'data-error', data: expect.objectContaining({ message: expect.any(String) }) })
    ])
    expect(value?.state.streamingLayers?.historyPartsByMessageId['assistant-hidden-success']).toEqual([
      expect.objectContaining({ type: 'data-agent-task-event' }),
      expect.objectContaining({ type: 'data-error', data: expect.objectContaining({ message: expect.any(String) }) })
    ])
    expect(value?.state.streamingLayers?.liveMessageIds).toEqual([])
  })

  it('preserves sealed MessageListItem identities when only the active agent message changes', () => {
    const topic = {
      id: 'agent-session-topic',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    const historyMessage = {
      id: 'assistant-history',
      role: 'assistant',
      parts: [{ type: 'text', text: 'history' }],
      metadata: { createdAt: '2026-01-01T00:00:00.000Z', status: 'success' }
    } as CherryUIMessage
    const activeMessage = {
      id: 'assistant-active',
      role: 'assistant',
      parts: [{ type: 'text', text: 'a' }],
      metadata: { createdAt: '2026-01-01T00:00:01.000Z', status: 'pending' }
    } as CherryUIMessage
    const historyPartsByMessageId = {
      [historyMessage.id]: (historyMessage.parts ?? []) as CherryMessagePart[],
      [activeMessage.id]: (activeMessage.parts ?? []) as CherryMessagePart[]
    }
    const streamingLayers = { historyPartsByMessageId, liveMessageIds: [activeMessage.id] }
    let value: MessageListProviderValue | undefined

    const Probe = ({
      messages,
      partsByMessageId = Object.fromEntries(messages.map((message) => [message.id, message.parts ?? []]))
    }: {
      messages: CherryUIMessage[]
      partsByMessageId?: Record<string, CherryMessagePart[]>
    }) => {
      value = useAgentMessageListProviderValue({
        topic,
        messages,
        partsByMessageId,
        streamingLayers,
        isLoading: false,
        messageNavigation: 'none'
      })
      return null
    }

    const view = render(<Probe messages={[historyMessage, activeMessage]} />)
    const firstHistoryItem = value?.state.messages[0]
    const firstActiveItem = value?.state.messages[1]
    const nextActiveMessage = {
      ...activeMessage,
      parts: [{ type: 'text', text: 'ab' }]
    } as CherryUIMessage

    view.rerender(
      <Probe
        messages={[historyMessage, nextActiveMessage]}
        partsByMessageId={{
          ...historyPartsByMessageId,
          [nextActiveMessage.id]: nextActiveMessage.parts ?? []
        }}
      />
    )

    expect(value?.state.messages[0]).toBe(firstHistoryItem)
    expect(value?.state.messages[1]).not.toBe(firstActiveItem)
  })

  it('does not expose selected delete action without delete capability', () => {
    const topic = {
      id: 'agent-session-topic',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    const messages = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        metadata: { createdAt: '2026-01-01T00:00:00.000Z' }
      }
    ] as CherryUIMessage[]
    let value: MessageListProviderValue | undefined

    const Probe = () => {
      value = useAgentMessageListProviderValue({
        topic,
        messages,
        partsByMessageId: { 'user-1': messages[0].parts ?? [] },
        assistantId: 'agent-1',
        isLoading: false,
        messageNavigation: 'anchor'
      })
      return null
    }

    render(<Probe />)

    expect(value?.actions.deleteMessage).toBeUndefined()
    expect(value?.actions.deleteSelectedMessages).toBeUndefined()
    expect(value?.actions.copySelectedMessages).toEqual(expect.any(Function))
    expect(value?.actions.saveSelectedMessages).toEqual(expect.any(Function))
  })

  it('does not show a toast when selected-message save is canceled', async () => {
    const topic = {
      id: 'agent-session-topic',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    const messages = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        metadata: { createdAt: '2026-01-01T00:00:00.000Z' }
      }
    ] as CherryUIMessage[]
    let value: MessageListProviderValue | undefined

    exportActionsMock.saveTextFile.mockResolvedValue(null)

    const Probe = () => {
      value = useAgentMessageListProviderValue({
        topic,
        messages,
        partsByMessageId: { 'user-1': messages[0].parts ?? [] },
        assistantId: 'agent-1',
        isLoading: false,
        messageNavigation: 'anchor'
      })
      return null
    }

    render(<Probe />)
    cacheHookMocks.setMultiSelectMode.mockClear()
    cacheHookMocks.setSelectedMessageIds.mockClear()

    await value?.actions.saveSelectedMessages?.(['user-1'])

    expect(exportActionsMock.saveTextFile).toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(cacheHookMocks.setMultiSelectMode).not.toHaveBeenCalled()
    expect(cacheHookMocks.setSelectedMessageIds).not.toHaveBeenCalled()
  })

  it('keeps capture-scoped session image actions away from the visible runtime', async () => {
    const topic = {
      id: 'agent-session:session-a',
      assistantId: 'agent-1',
      name: 'Agent session',
      lastActivityAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: []
    } as Topic
    const messages = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
        metadata: { createdAt: '2026-01-01T00:00:00.000Z' }
      }
    ] as CherryUIMessage[]
    let visibleValue: MessageListProviderValue | undefined
    let captureValue: MessageListProviderValue | undefined

    const VisibleProbe = () => {
      visibleValue = useAgentMessageListProviderValue({
        topic,
        messages,
        partsByMessageId: { 'user-1': messages[0].parts ?? [] },
        assistantId: 'agent-1',
        isLoading: false,
        messageNavigation: 'anchor'
      })
      return null
    }

    const CaptureProbe = () => {
      captureValue = useAgentMessageListProviderValue({
        topic,
        messages,
        partsByMessageId: { 'user-1': messages[0].parts ?? [] },
        assistantId: 'agent-1',
        isLoading: false,
        imageActionConsumer: 'capture',
        messageNavigation: 'anchor'
      })
      return null
    }

    render(<VisibleProbe />)

    const visibleRuntime: MessageListRuntime = {
      copyTopicImage: vi.fn().mockResolvedValue(undefined),
      exportTopicImage: vi.fn().mockResolvedValue(undefined),
      locateMessage: vi.fn(),
      scrollToBottom: vi.fn()
    }
    const unbindVisible = visibleValue?.actions.bindRuntime?.(visibleRuntime)
    const request = requestAgentSessionImageAction('copy', { id: 'session-a', name: 'Session A' })
    const unbindVisibleRebound = visibleValue?.actions.bindRuntime?.(visibleRuntime)

    expect(visibleRuntime.copyTopicImage).not.toHaveBeenCalled()

    const listenerCountBeforeCaptureBind = eventMocks.on.mock.calls.length
    render(<CaptureProbe />)

    expect(useMessageErrorActionsMock.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ diagnosticReport: undefined })
    )

    const captureRuntime: MessageListRuntime = {
      copyTopicImage: vi.fn().mockResolvedValue(undefined),
      exportTopicImage: vi.fn().mockResolvedValue(undefined),
      locateMessage: vi.fn(),
      scrollToBottom: vi.fn()
    }
    const unbindCapture = captureValue?.actions.bindRuntime?.(captureRuntime)

    await expect(request.promise).resolves.toBeUndefined()
    expect(captureRuntime.copyTopicImage).toHaveBeenCalledTimes(1)
    expect(eventMocks.on.mock.calls.length).toBe(listenerCountBeforeCaptureBind)
    expect(consumePendingAgentSessionImageActions('session-a')).toEqual([])

    unbindCapture?.()
    unbindVisibleRebound?.()
    unbindVisible?.()
  })
})
