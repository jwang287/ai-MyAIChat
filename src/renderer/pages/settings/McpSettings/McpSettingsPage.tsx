import { Flex, MenuDivider, MenuItem, MenuList, PageHeader } from '@cherrystudio/ui'
import { McpLogo } from '@renderer/components/icons/SvgIcon'
import Scrollbar from '@renderer/components/Scrollbar'
import {
  settingsSubmenuDividerClassName,
  settingsSubmenuItemClassName,
  settingsSubmenuItemLabelClassName,
  settingsSubmenuListClassName,
  settingsSubmenuScrollClassName,
  settingsSubmenuSectionTitleClassName
} from '@renderer/pages/settings/settingsStyles'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Server } from 'lucide-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

const McpSettings: FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // 获取当前激活的页面
  const getActiveView = () => {
    const path = location.pathname

    // 精确匹配路径
    if (path === '/settings/mcp/builtin') return 'builtin'
    // 其他所有情况（包括 servers、settings/:serverId）都属于 servers
    return 'servers'
  }

  const activeView = getActiveView()

  return (
    <Flex className="min-w-0 flex-1">
      <div className="flex h-[calc(100vh-var(--navbar-height)-6px)] w-full min-w-0 flex-1 flex-row overflow-hidden">
        <div className={`flex flex-col ${settingsSubmenuScrollClassName}`}>
          <PageHeader title={t('settings.mcp.shortTitle')} />
          <Scrollbar className="min-h-0 flex-1">
            <MenuList className={settingsSubmenuListClassName}>
              <MenuItem
                label={t('settings.mcp.title')}
                active={activeView === 'servers'}
                onClick={() => navigate({ to: '/settings/mcp/servers' })}
                icon={<McpLogo width={18} height={18} className="text-foreground" />}
                className={settingsSubmenuItemClassName}
                labelClassName={settingsSubmenuItemLabelClassName}
              />
              <MenuDivider className={settingsSubmenuDividerClassName} />
              <div className={settingsSubmenuSectionTitleClassName}>{t('settings.mcp.discover', 'Discover')}</div>
              <MenuItem
                label={t('settings.mcp.builtinServers', 'Built-in Servers')}
                active={activeView === 'builtin'}
                onClick={() => navigate({ to: '/settings/mcp/builtin' })}
                icon={<Server size={18} />}
                className={settingsSubmenuItemClassName}
                labelClassName={settingsSubmenuItemLabelClassName}
              />
            </MenuList>
          </Scrollbar>
        </div>
        <div className="relative flex min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </Flex>
  )
}

export default McpSettings
