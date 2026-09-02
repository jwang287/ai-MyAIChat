import type { Tab } from '@renderer/hooks/tab'
import {
  Code,
  FileSearch,
  Languages,
  MessageCircle,
  MousePointerClick,
  Rocket,
  ScanSearch,
  Settings,
  Sparkles
} from 'lucide-react'

export type IconComponent = React.FC<{ size?: number; strokeWidth?: number; className?: string }>

// ─── Route → Icon mapping ─────────────────────────────────────────────────────

export const ROUTE_ICONS: Record<string, IconComponent> = {
  '/app/chat': MessageCircle,
  '/app/agents': MousePointerClick,
  '/app/translate': Languages,
  '/app/launchpad': Rocket,
  '/app/knowledge': FileSearch,
  '/app/file-preview': ScanSearch,
  '/app/code': Code,
  '/app/release-notes': Sparkles,
  '/settings': Settings
}

export function getTabIcon(tab: Tab): IconComponent {
  const pathname = new URL(tab.url, 'https://www.cherry-ai.com/').pathname
  const segments = pathname.split('/').filter(Boolean)
  const key = segments[0] === 'app' && segments.length >= 2 ? '/app/' + segments[1] : '/' + (segments[0] || '')
  return ROUTE_ICONS[key] || MessageCircle
}
