import React from 'react'
import { HiOutlineBell, HiOutlineSparkles } from 'react-icons/hi2'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PagePanel } from '@/components/layout/PagePanel'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Typography'
import { useMarkNotificationRead } from '@/features/notifications/hooks/useMarkNotificationRead'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useOpenNotification } from '@/features/notifications/hooks/useOpenNotification'
import { AppNotification } from '@/features/notifications/types'
import { formatTimeAgo } from '@/utils'
import { stripHtml } from '@/utils/truncateTexts'

import styles from './RecruiterDashboard.module.scss'

const LATEST_COUNT = 4

const iconFor = (notification: AppNotification) =>
  notification.type === 'ai_match' ? (
    <HiOutlineSparkles size={18} />
  ) : (
    <HiOutlineBell size={18} />
  )

const textOf = (notification: AppNotification) =>
  stripHtml(notification.message || '') || stripHtml(notification.title || '')

export const DashboardNotifications = () => {
  const { notifications, isLoading, mutate } = useNotifications()
  const { markAsRead } = useMarkNotificationRead()
  const { follow, needsSwitch, isSwitching, confirmSwitch, cancelSwitch } =
    useOpenNotification()

  const open = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
      await mutate()
    }
    follow(notification)
  }

  const latest = notifications.slice(0, LATEST_COUNT)

  return (
    <PagePanel
      title="Notifications"
      hint="New candidates and test updates"
      actionTo="/recruiterDashboard/notifications"
      actionLabel="See All">
      {isLoading ? (
        <Skeleton height="10rem" />
      ) : latest.length === 0 ? (
        <EmptyState title="You're all caught up" />
      ) : (
        <ul className={styles.feed}>
          {latest.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                className={styles.feedRow}
                onClick={() => void open(notification)}>
                <span className={styles.feedIcon} aria-hidden>
                  {iconFor(notification)}
                </span>
                <span className={styles.feedText}>
                  <Text
                    as="span"
                    size="fs-md"
                    weight={notification.isRead ? 'normal' : 'bolder'}>
                    {textOf(notification)}
                  </Text>
                  <Text as="span" size="fs-sm" color="muted">
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={needsSwitch}
        title="Switch company to open this?"
        message="This notification belongs to another company you work with. Switching clears any unsaved job drafts."
        confirmLabel="Switch company"
        isConfirming={isSwitching}
        onConfirm={() => void confirmSwitch()}
        onCancel={cancelSwitch}
      />
    </PagePanel>
  )
}
