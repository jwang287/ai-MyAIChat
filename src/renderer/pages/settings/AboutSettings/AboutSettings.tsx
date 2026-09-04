import { Badge, Divider } from '@cherrystudio/ui'
import AppLogo from '@renderer/assets/images/logo.png'
import LogoAvatar from '@renderer/components/icons/LogoAvatar'
import { SettingGroup, SettingsContentColumn, SettingTitle } from '@renderer/components/SettingsPrimitives'
import { useTheme } from '@renderer/hooks/useTheme'
import { ipcApi } from '@renderer/ipc'
import { Github } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const REPOSITORY_URL = 'https://github.com/CherryHQ/cherry-studio'

const AboutSettings: FC = () => {
  const [version, setVersion] = useState('')
  const { t } = useTranslation()
  const { theme } = useTheme()

  const onOpenRepository = () => {
    void ipcApi.request('system.shell.open_website', REPOSITORY_URL)
  }

  useEffect(() => {
    void (async () => {
      const appInfo = await ipcApi.request('app.get_info')
      setVersion(appInfo.version)
    })()
  }, [])

  return (
    <SettingsContentColumn theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle className="gap-2">
          <span className="font-semibold text-[15px]">{t('settings.about.title')}</span>
          <button
            type="button"
            aria-label={t('settings.about.repository')}
            onClick={onOpenRepository}
            className="inline-flex items-center justify-center rounded-md p-1 text-foreground transition-colors hover:bg-muted">
            <Github aria-hidden="true" className="size-5" />
          </button>
        </SettingTitle>

        <Divider className="my-1.5" />

        <div className="flex flex-wrap items-center justify-between gap-3 py-1">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label={t('settings.about.repository')}
              onClick={onOpenRepository}
              className="relative cursor-pointer">
              <LogoAvatar logo={AppLogo} size={72} className="rounded-full" alt="" />
            </button>

            <div className="flex min-h-18 flex-col items-start justify-center">
              <div className="mb-1 font-bold text-foreground text-lg">Cherry Studio</div>
              <div className="text-muted-foreground text-sm">{t('settings.about.description')}</div>
              <Badge className="mt-1.5 rounded-md border-primary/20 bg-primary/10 px-1.5 py-0 text-[11px] text-primary leading-4">
                v{version}
              </Badge>
            </div>
          </div>
        </div>
      </SettingGroup>
    </SettingsContentColumn>
  )
}

export default AboutSettings
