import path from 'node:path'
import { buffer as readStreamToBuffer } from 'node:stream/consumers'

import type { FileAttachment } from '@main/utils/downloadAsBase64'
import { MAX_FILE_SIZE_BYTES } from '@main/utils/downloadAsBase64'
import { lstat, openReadableFileSnapshot, realpath } from '@main/utils/file'
import { AbsoluteFilePathSchema } from '@shared/types/file'

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR')
  )
}

async function resolveFile(basePath: string, userPath: string, restrictToBase: boolean): Promise<FileAttachment> {
  const requested = path.resolve(basePath, userPath)
  const [base, target] = await Promise.all([
    realpath(AbsoluteFilePathSchema.parse(basePath)),
    realpath(AbsoluteFilePathSchema.parse(requested))
  ]).catch((error) => {
    if (isNotFound(error)) throw new Error(`File not found: ${userPath}`)
    throw error
  })
  if (restrictToBase && target !== base && !target.startsWith(base + path.sep))
    throw new Error(`Path is outside the workspace: ${userPath}`)
  const stats = await lstat(AbsoluteFilePathSchema.parse(target))
  if (!stats.isFile) throw new Error(`Not a regular file: ${userPath}`)
  const snapshot = await openReadableFileSnapshot(AbsoluteFilePathSchema.parse(target))
  try {
    if (snapshot.size > MAX_FILE_SIZE_BYTES)
      throw new Error(`File exceeds the ${MAX_FILE_SIZE_BYTES} byte limit: ${userPath}`)
    const data = await readStreamToBuffer(snapshot.createReadStream())
    if (data.length > MAX_FILE_SIZE_BYTES)
      throw new Error(`File exceeds the ${MAX_FILE_SIZE_BYTES} byte limit: ${userPath}`)
    return {
      filename: path.basename(requested),
      data: data.toString('base64'),
      media_type: 'application/octet-stream',
      size: data.length
    }
  } finally {
    await snapshot.close().catch(() => {})
  }
}

export const resolveWorkspaceFile = (workspacePath: string, userPath: string) =>
  resolveFile(workspacePath, userPath, true)
export const resolveLocalFile = (basePath: string, userPath: string) => resolveFile(basePath, userPath, false)
