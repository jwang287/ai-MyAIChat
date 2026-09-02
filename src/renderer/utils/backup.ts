import i18n from '@renderer/i18n/resolver'
import { formatFileSize } from '@renderer/utils/file'
import { BACKUP_ACTIVE_WRITERS_ERROR_CODE, BACKUP_DISK_FULL_ERROR_CODE } from '@shared/types/backup'

type BackupErrorFallbackKey =
  | 'error.backup.file_format'
  | 'message.backup.failed'
  | 'message.restore.failed'
  | 'settings.data.local.backup.manager.restore.error'

// Closed set: every key this mapper can select, so a typo cannot compile.
type BackupMessageKey = BackupErrorFallbackKey | 'backup.error.active_data_writers' | 'backup.error.disk_full'

export function getLocalizedBackupErrorMessage(
  error: unknown,
  fallbackKey: BackupErrorFallbackKey = 'message.backup.failed'
): string {
  const errorMessage = error instanceof Error ? error.message : ''
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined

  // Disk-full carries a parameterized payload, so it renders outside the key union.
  const diskFullDetails = errorMessage.match(new RegExp(`${BACKUP_DISK_FULL_ERROR_CODE}:(\\d+)`))
  if (diskFullDetails) {
    return i18n.t('backup.error.disk_full_with_available', {
      available: formatFileSize(Number(diskFullDetails[1]))
    })
  }

  let messageKey: BackupMessageKey = fallbackKey
  if (errorMessage.includes(BACKUP_ACTIVE_WRITERS_ERROR_CODE)) {
    messageKey = 'backup.error.active_data_writers'
  } else if (
    errorCode === 'ENOSPC' ||
    errorMessage.includes('ENOSPC') ||
    /no space left on device/i.test(errorMessage)
  ) {
    messageKey = 'backup.error.disk_full'
  }

  return i18n.t(messageKey)
}
