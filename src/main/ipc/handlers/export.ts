import { ExportService } from '@main/services/ExportService'
import type { exportRequestSchemas } from '@shared/ipc/schemas/export'
import type { IpcHandlersFor } from '@shared/ipc/types'

const exportService = new ExportService()

export const exportHandlers: IpcHandlersFor<typeof exportRequestSchemas> = {
  'export.word.from_markdown': async ({ markdown, fileName }) => {
    await exportService.exportToWord(markdown, fileName)
  }
}
