import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createUpdateTimestamps, orderKeyColumns, orderKeyIndex, uuidPrimaryKey } from './_columnHelpers'

/**
 * Historical painting row retained for migration and reference integrity.
 *
 * Output and input files are NOT stored on the row. Each painting has zero or
 * Existing rows retain their `painting_file_ref` associations so their files
 * are not collected. The active application no longer creates or presents
 * paintings.
 */
export const paintingTable = sqliteTable(
  'painting',
  {
    id: uuidPrimaryKey(),
    providerId: text('provider_id').notNull(),
    modelId: text('model_id'),
    prompt: text().notNull(),
    ...orderKeyColumns,
    ...createUpdateTimestamps
  },
  (t) => [orderKeyIndex('painting')(t)]
)

export type PaintingRow = typeof paintingTable.$inferSelect
export type InsertPaintingRow = typeof paintingTable.$inferInsert
