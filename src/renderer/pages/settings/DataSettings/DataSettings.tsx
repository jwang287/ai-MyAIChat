import { MenuDivider, MenuItem, MenuList, PageHeader, RowFlex } from '@cherrystudio/ui'
import Scrollbar from '@renderer/components/Scrollbar'
import { SettingsContentColumn } from '@renderer/components/SettingsPrimitives'
import { useTheme } from '@renderer/hooks/useTheme'
import {
  settingsSubmenuDividerClassName,
  settingsSubmenuItemClassName,
  settingsSubmenuItemLabelClassName,
  settingsSubmenuListClassName,
  settingsSubmenuScrollClassName,
  settingsSubmenuSectionTitleClassName
} from '@renderer/pages/settings/settingsStyles'
import { FileText, FolderCog, FolderInput } from 'lucide-react'
import { type FC, lazy, Suspense } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import BasicDataSettings from './BasicDataSettings'

const ExportMenuOptions = lazy(() => import('./ExportMenuSettings'))
const LocalBackupSettings = lazy(() => import('./LocalBackupSettings'))
const MarkdownExportSettings = lazy(() => import('./MarkdownExportSettings'))

const DataSettings: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [menu, setMenu] = useState<string>('data')

  const menuItems = [
    { key: 'data', title: t('settings.data.data.title'), icon: <FolderCog size={16} /> },
    { key: 'local_backup', title: t('settings.data.local.title'), icon: <FolderCog size={16} /> },
    { key: 'divider_1', isDivider: true, text: t('settings.data.divider.export_settings') },
    {
      key: 'export_menu',
      title: t('settings.data.export_menu.title'),
      icon: <FolderInput size={16} />
    },
    {
      key: 'markdown_export',
      title: t('settings.data.markdown_export.title'),
      icon: <FileText size={16} />
    }
  ]

  return (
    <RowFlex className="flex-1">
      <div
        className={`flex flex-col ${settingsSubmenuScrollClassName} [&_.iconfont]:text-current [&_.iconfont]:leading-4`}>
        <PageHeader title={t('settings.data.title')} />
        <Scrollbar className="min-h-0 flex-1">
          <MenuList className={settingsSubmenuListClassName}>
            {menuItems.map((item, index) =>
              item.isDivider ? (
                <div key={item.key}>
                  {index > 0 && <MenuDivider className={settingsSubmenuDividerClassName} />}
                  <div className={settingsSubmenuSectionTitleClassName}>{item.text || ''}</div>
                </div>
              ) : (
                <MenuItem
                  key={item.key}
                  label={item.title || ''}
                  active={menu === item.key}
                  onClick={() => setMenu(item.key)}
                  icon={item.icon}
                  className={settingsSubmenuItemClassName}
                  labelClassName={settingsSubmenuItemLabelClassName}
                />
              )
            )}
          </MenuList>
        </Scrollbar>
      </div>
      <SettingsContentColumn theme={theme}>
        {menu === 'data' ? (
          <BasicDataSettings />
        ) : (
          <Suspense fallback={null}>
            {menu === 'export_menu' && <ExportMenuOptions />}
            {menu === 'markdown_export' && <MarkdownExportSettings />}
            {menu === 'local_backup' && <LocalBackupSettings />}
          </Suspense>
        )}
      </SettingsContentColumn>
    </RowFlex>
  )
}

export default DataSettings
