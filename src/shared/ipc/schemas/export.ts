import * as z from 'zod'

import { defineRoute } from '../define'

/** Export IPC schemas — document export actions. */
export const exportRequestSchemas = {
  'export.word.from_markdown': defineRoute({
    input: z.object({ markdown: z.string(), fileName: z.string() }),
    output: z.void()
  })
}
