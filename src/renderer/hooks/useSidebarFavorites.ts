import { usePreference } from '@data/hooks/usePreference'
import { toast } from '@renderer/services/toast'
import type { SidebarAppId } from '@renderer/utils/sidebar'
import {
  getOrderedVisibleSidebarFavoriteItems,
  getOrderedVisibleSidebarFavorites,
  removeSidebarEntityFavorite,
  reorderSidebarFavorites,
  setSidebarAppPinned,
  toggleSidebarEntityFavorite
} from '@renderer/utils/sidebar'
import type { SidebarFavoriteItem } from '@shared/data/preference/preferenceTypes'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Single entry point for the `ui.sidebar.favorites` preference.
 *
 * `favorites` is the ordered sidebar list. Every mutation goes through the
 * centralized helpers in `utils/sidebar`, so components never touch raw tags.
 */
export function useSidebarFavorites() {
  const { t } = useTranslation()
  const [favorites, setFavorites] = usePreference('ui.sidebar.favorites')

  const favoriteItems = useMemo(() => getOrderedVisibleSidebarFavoriteItems(favorites), [favorites])
  const appFavorites = useMemo(() => getOrderedVisibleSidebarFavorites(favorites), [favorites])
  const agentFavoriteIds = useMemo(
    () => favoriteItems.flatMap((favorite) => (favorite.type === 'agent' ? [favorite.id] : [])),
    [favoriteItems]
  )
  const assistantFavoriteIds = useMemo(
    () => favoriteItems.flatMap((favorite) => (favorite.type === 'assistant' ? [favorite.id] : [])),
    [favoriteItems]
  )

  const persist = useCallback(
    (next: SidebarFavoriteItem[]) => {
      void setFavorites(next).catch(() => {
        toast.error(t('common.error'))
      })
    },
    [setFavorites, t]
  )

  const setAppPinned = useCallback(
    (id: SidebarAppId, pinned: boolean) => persist(setSidebarAppPinned(favorites, id, pinned)),
    [favorites, persist]
  )
  const toggleAgent = useCallback(
    (id: string) => persist(toggleSidebarEntityFavorite(favorites, 'agent', id)),
    [favorites, persist]
  )
  const toggleAssistant = useCallback(
    (id: string) => persist(toggleSidebarEntityFavorite(favorites, 'assistant', id)),
    [favorites, persist]
  )
  const removeAgent = useCallback(
    (id: string) => {
      if (!agentFavoriteIds.includes(id)) return
      persist(removeSidebarEntityFavorite(favorites, 'agent', id))
    },
    [favorites, agentFavoriteIds, persist]
  )
  const removeAssistant = useCallback(
    (id: string) => {
      if (!assistantFavoriteIds.includes(id)) return
      persist(removeSidebarEntityFavorite(favorites, 'assistant', id))
    },
    [favorites, assistantFavoriteIds, persist]
  )
  const reorderFavorites = useCallback(
    (orderedItems: readonly SidebarFavoriteItem[]) => persist(reorderSidebarFavorites(favorites, orderedItems)),
    [favorites, persist]
  )

  return {
    favorites: favoriteItems,
    appFavorites,
    agentFavoriteIds,
    assistantFavoriteIds,
    setAppPinned,
    reorderFavorites,
    toggleAgent,
    toggleAssistant,
    removeAgent,
    removeAssistant
  }
}
