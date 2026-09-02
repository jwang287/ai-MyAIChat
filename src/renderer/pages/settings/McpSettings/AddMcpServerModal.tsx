import {
  Button,
  CodeEditor,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@cherrystudio/ui'
import { dataApiService } from '@data/DataApiService'
import { usePreference } from '@data/hooks/usePreference'
import { zodResolver } from '@hookform/resolvers/zod'
import { loggerService } from '@logger'
import { useCodeStyle } from '@renderer/hooks/useCodeStyle'
import { ipcApi } from '@renderer/ipc'
import { toast } from '@renderer/services/toast'
import { safeValidateMcpConfig } from '@renderer/types/mcp'
import { formatZodError } from '@renderer/utils/error'
import { parseJSON } from '@renderer/utils/json'
import { objectKeys } from '@renderer/utils/object'
import type { CreateMcpServerDto } from '@shared/data/api/schemas/mcpServers'
import type { McpServer } from '@shared/data/types/mcpServer'
import type { FC } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { toCreateMcpServerDto } from './utils'

const logger = loggerService.withContext('AddMcpServerModal')

interface AddMcpServerModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (servers: CreateMcpServerDto[]) => Promise<McpServer[]>
  existingServers: McpServer[]
}

interface ParsedServerData extends McpServer {
  url?: string // JSON 可能包含此欄位，而不是 baseUrl
}

// 預設的 JSON 範例內容
const initialJsonExample = `// Example JSON (stdio):
// {
//   "mcpServers": {
//     "stdio-server-example": {
//       "command": "npx",
//       "args": ["-y", "mcp-server-example"]
//     }
//   }
// }

// Example JSON (sse):
// {
//   "mcpServers": {
//     "sse-server-example": {
//       "type": "sse",
//       "url": "http://localhost:3000"
//     }
//   }
// }

// Example JSON (streamableHttp):
// {
//   "mcpServers": {
//     "streamable-http-example": {
//       "type": "streamableHttp",
//       "url": "http://localhost:3001",
//       "headers": {
//         "Content-Type": "application/json",
//         "Authorization": "Bearer your-token"
//       }
//     }
//   }
// }
`

const jsonSchema = z.object({
  serverConfig: z.string().min(1)
})
type JsonFieldType = z.infer<typeof jsonSchema>

const AddMcpServerModal: FC<AddMcpServerModalProps> = ({ visible, onClose, onSuccess, existingServers }) => {
  const { t } = useTranslation()
  const [fontSize] = usePreference('chat.message.font_size')
  const { activeCmTheme } = useCodeStyle()
  const [loading, setLoading] = useState(false)

  const form = useForm<JsonFieldType>({
    resolver: zodResolver(
      z.object({
        serverConfig: z.string().min(1, t('settings.mcp.addServer.importFrom.placeholder'))
      })
    ),
    defaultValues: { serverConfig: '' }
  })

  /**
   * 从JSON字符串中解析MCP服务器配置
   * @param inputValue - JSON格式的服务器配置字符串
   * @returns 包含解析后的服务器配置列表和可能的错误信息的对象
   * - serversToAdd: 解析成功时返回服务器配置列表，失败时返回null
   * - error: 解析失败时返回错误信息，成功时返回null
   */
  const getServersFromJson = (
    inputValue: string
  ): { serversToAdd: Partial<ParsedServerData>[]; error: null } | { serversToAdd: null; error: string } => {
    const trimmedInput = inputValue.trim()
    const parsedJson = parseJSON(trimmedInput)
    if (parsedJson === null) {
      logger.error('Failed to parse json.', { input: trimmedInput })
      return { serversToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
    }

    const { data: validConfig, error } = safeValidateMcpConfig(parsedJson)
    if (error) {
      logger.error('Failed to validate json.', { parsedJson, error })
      return { serversToAdd: null, error: formatZodError(error, t('settings.mcp.addServer.importFrom.invalid')) }
    }

    const serversToAdd = objectKeys(validConfig.mcpServers).map((key) => {
      const server = validConfig.mcpServers[key]
      return server.name ? server : { ...server, name: key }
    })

    if (serversToAdd.length === 0) {
      return { serversToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
    }

    return { serversToAdd, error: null }
  }

  const handleOk = async (jsonValues?: JsonFieldType) => {
    try {
      setLoading(true)

      const inputValue = (jsonValues?.serverConfig ?? form.getValues('serverConfig')).trim()

      const { serversToAdd, error } = getServersFromJson(inputValue)

      if (error !== null) {
        form.setError('serverConfig', { type: 'manual', message: error })
        return
      }

      const seenNames = new Set(existingServers.map((server) => server.name))
      const duplicateServer = serversToAdd.find((server) => {
        if (!server.name) return false
        if (seenNames.has(server.name)) return true
        seenNames.add(server.name)
        return false
      })
      if (duplicateServer) {
        form.setError('serverConfig', {
          type: 'manual',
          message: t('settings.mcp.addServer.importFrom.nameExists', { name: duplicateServer.name })
        })
        return
      }

      const installTimestamp = Date.now()
      const serverDtos = serversToAdd.map((serverToAdd) =>
        toCreateMcpServerDto({
          ...serverToAdd,
          name: serverToAdd.name || t('settings.mcp.newServer'),
          baseUrl: serverToAdd.baseUrl ?? serverToAdd.url ?? '',
          isActive: false,
          installSource: 'manual' as const,
          isTrusted: true,
          installedAt: installTimestamp,
          trustedAt: installTimestamp
        })
      )

      const createdServers = await onSuccess(serverDtos)
      form.reset({ serverConfig: '' })
      onClose()

      for (const createdServer of createdServers) {
        ipcApi
          .request('mcp.server.check_connectivity', { serverId: createdServer.id })
          .then((isConnected) => {
            logger.debug(`Connectivity check for ${createdServer.name}: ${isConnected}`)
            void dataApiService.patch(`/mcp-servers/${createdServer.id}`, {
              body: { isActive: isConnected }
            })
          })
          .catch((connError: any) => {
            logger.error(`Connectivity check failed for ${createdServer.name}:`, connError)
            toast.error(createdServer.name + t('settings.mcp.addServer.importFrom.connectionFailed'))
          })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset({ serverConfig: '' })
    onClose()
  }

  return (
    <Dialog open={visible} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent closeOnOverlayClick={false} className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>{t('settings.mcp.addServer.importFrom.json')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => handleOk(values))}
            className="flex flex-col gap-4"
            id="add-mcp-server-form">
            <FormField
              control={form.control}
              name="serverConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.mcp.addServer.importFrom.tooltip')}</FormLabel>
                  <FormControl>
                    <CodeEditor
                      theme={activeCmTheme}
                      fontSize={fontSize - 1}
                      value={field.value}
                      placeholder={initialJsonExample}
                      language="json"
                      onChange={(newContent) => field.onChange(newContent)}
                      height="60vh"
                      expanded={false}
                      wrapped
                      options={{
                        lint: true,
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: true,
                        keymap: true
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="add-mcp-server-form" disabled={loading}>
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddMcpServerModal
