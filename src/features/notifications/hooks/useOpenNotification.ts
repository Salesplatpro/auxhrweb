import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSwitchOrganization } from '@/features/organizations/hooks/useSwitchOrganization'
import { useProfile } from '@/features/profile/hooks/useProfile'

import { AppNotification } from '../types'

/**
 * Job pages only open for the active company, so a link from another company needs a
 * switch first. Switching clears job drafts, which is why it asks instead of just doing it.
 */
export const useOpenNotification = (onOpened?: () => void) => {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { switchOrganization, isSwitching } = useSwitchOrganization()
  const [needsSwitch, setNeedsSwitch] = useState<AppNotification | null>(null)

  const go = (link: string) => {
    navigate(link)
    onOpened?.()
  }

  const follow = (notification: AppNotification) => {
    if (!notification.link) return
    if (
      notification.organizationId &&
      notification.organizationId !== profile?.activeOrganizationId
    ) {
      setNeedsSwitch(notification)
      return
    }
    go(notification.link)
  }

  const confirmSwitch = async () => {
    if (!needsSwitch?.link || !needsSwitch.organizationId) return
    const switched = await switchOrganization(needsSwitch.organizationId)
    const { link } = needsSwitch
    setNeedsSwitch(null)
    if (switched) go(link)
  }

  return {
    follow,
    needsSwitch: !!needsSwitch,
    isSwitching,
    confirmSwitch,
    cancelSwitch: () => setNeedsSwitch(null),
  }
}
