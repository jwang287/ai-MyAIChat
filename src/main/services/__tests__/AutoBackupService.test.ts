import { BaseService } from '@main/core/lifecycle/BaseService'
import { SchedulerService } from '@main/core/scheduler/SchedulerService'
import type * as LegacyFile from '@main/utils/legacyFile'
import { MockMainCacheServiceExport, MockMainCacheServiceUtils } from '@test-mocks/main/CacheService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AutoBackupService } from '../AutoBackupService'

const mocks = vi.hoisted(() => ({
  applicationGet: vi.fn(),
  applicationGetPath: vi.fn((key: string) => (key === 'app.userdata' ? '/mock/userData' : '/mock/install')),
  backupToLocalDir: vi.fn().mockResolvedValue({ result: '/backups/test.zip', cleanupError: null }),
  broadcastToType: vi.fn(),
  hasWritePermission: vi.fn(async () => true)
}))

vi.mock('@application', () => ({ application: { get: mocks.applicationGet, getPath: mocks.applicationGetPath } }))
vi.mock('@logger', () => ({
  loggerService: { withContext: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }) }
}))
vi.mock('@main/utils/legacyFile', async (importOriginal) => ({
  ...(await importOriginal<typeof LegacyFile>()),
  hasWritePermission: mocks.hasWritePermission
}))
vi.mock('../LegacyBackupManager', () => ({ legacyBackupManager: { backupToLocalDir: mocks.backupToLocalDir } }))

const enabledPreferences: Record<string, unknown> = {
  'data.backup.local.auto_sync': true,
  'data.backup.local.dir': '/backups',
  'data.backup.local.max_backups': 0,
  'data.backup.local.skip_backup_file': false,
  'data.backup.local.sync_interval': 1
}

describe('AutoBackupService', () => {
  let service: AutoBackupService
  let scheduler: SchedulerService
  let preferences: Record<string, unknown>
  let preferenceListener: ((key: string, newValue: unknown, oldValue: unknown) => void) | undefined

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    MockMainCacheServiceUtils.resetMocks()
    BaseService.resetInstances()
    preferences = { ...enabledPreferences }
    const preferenceService = {
      get: vi.fn((key: string) => preferences[key]),
      subscribeMultipleChanges: vi.fn((_keys, listener) => {
        preferenceListener = listener
        return vi.fn()
      })
    }
    scheduler = new SchedulerService()
    service = new AutoBackupService()
    mocks.applicationGet.mockImplementation((name: string) => {
      if (name === 'PreferenceService') return preferenceService
      if (name === 'SchedulerService') return scheduler
      if (name === 'CacheService') return MockMainCacheServiceExport.cacheService
      if (name === 'IpcApiService') return { broadcastToType: mocks.broadcastToType }
      throw new Error(`Unexpected service: ${name}`)
    })
    await scheduler._doInit()
    await service._doInit()
    await service._doAllReady()
  })

  afterEach(async () => {
    await service._doStop()
    await scheduler._doStop()
    vi.useRealTimers()
    BaseService.resetInstances()
  })

  const setPreference = (key: string, value: unknown) => {
    const oldValue = preferences[key]
    preferences[key] = value
    preferenceListener?.(key, value, oldValue)
  }

  it('runs local automatic backup after its configured interval', async () => {
    await vi.advanceTimersByTimeAsync(59_000)
    expect(mocks.backupToLocalDir).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1_000)
    expect(mocks.backupToLocalDir).toHaveBeenCalledWith(
      null,
      undefined,
      expect.objectContaining({ localBackupDir: '/backups' }),
      expect.any(AbortSignal)
    )
  })

  it('does not run when the configured local directory is inside application data', async () => {
    setPreference('data.backup.local.dir', '/mock/userData/backups')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mocks.backupToLocalDir).not.toHaveBeenCalled()
  })

  it('reports a local retention cleanup warning without treating backup as failed', async () => {
    mocks.backupToLocalDir.mockResolvedValueOnce({
      result: '/backups/test.zip',
      cleanupError: new Error('delete denied')
    })
    await vi.advanceTimersByTimeAsync(60_000)
    await vi.advanceTimersByTimeAsync(7_000)
    expect(mocks.broadcastToType).toHaveBeenCalledWith(
      expect.anything(),
      'backup.auto_sync_state_changed',
      expect.objectContaining({ type: 'local', status: 'warning', reason: 'cleanup_failed' })
    )
  })
})
