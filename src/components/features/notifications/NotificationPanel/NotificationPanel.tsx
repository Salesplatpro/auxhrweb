import cn from 'classnames'
import React, { ReactNode, useState } from 'react'
import { HiOutlineBell } from 'react-icons/hi'
import {
  HiOutlineBriefcase,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlinePuzzlePiece,
  HiOutlineVideoCamera,
} from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FilterChip } from '@/components/ui/FilterChip'
import { Spinner } from '@/components/ui/Spinner'
import { useMarkAllNotificationsRead } from '@/features/notifications/hooks/useMarkAllNotificationsRead'
import { useMarkNotificationRead } from '@/features/notifications/hooks/useMarkNotificationRead'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useOpenNotification } from '@/features/notifications/hooks/useOpenNotification'
import {
  AppNotification,
  NOTIFICATION_META,
} from '@/features/notifications/types'
import { formatTimeAgo } from '@/utils'
import { stripHtml } from '@/utils/truncateTexts'

import styles from './NotificationPanel.module.scss'

type NotificationPanelProps = {
  viewAllTo: string
  /** Called when a notification takes the user to another page. */
  onNavigate?: () => void
}

const ICONS: Record<string, ReactNode> = {
  interview_invite: <HiOutlineVideoCamera size={18} />,
  test_sent: <HiOutlinePuzzlePiece size={18} />,
  application_received: <HiOutlineCheck size={18} />,
  profile_viewed: <HiOutlineEye size={18} />,
  staff_invite: <HiOutlineBriefcase size={18} />,
}

const previewOf = (notification: AppNotification) => {
  const titleText = stripHtml(notification.title || '')
  const messageText = stripHtml(notification.message || '')
  return {
    title: titleText || messageText,
    body:
      titleText && messageText && messageText !== titleText ? messageText : '',
  }
}

export const NotificationPanel = ({
  viewAllTo,
  onNavigate,
}: NotificationPanelProps) => {
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const { notifications, unReadCount, isLoading, mutate } = useNotifications()
  const { markAsRead } = useMarkNotificationRead()
  const { markAllAsRead, isMarkingAll } = useMarkAllNotificationsRead()
  const { follow, needsSwitch, isSwitching, confirmSwitch, cancelSwitch } =
    useOpenNotification(onNavigate)

  const visible =
    tab === 'unread'
      ? notifications.filter((notification) => !notification.isRead)
      : notifications

  const handleOpen = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
      await mutate()
    }
    follow(notification)
  }

  const handleMarkAll = async () => {
    await markAllAsRead()
    await mutate()
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Notifications">
      <div className={styles.header}>
        <h2 className={styles.title}>Notifications</h2>
        <button
          type="button"
          className={styles.markAll}
          onClick={() => void handleMarkAll()}
          disabled={isMarkingAll || unReadCount === 0}>
          Mark all as read
        </button>
      </div>

      <div className={styles.chips}>
        <FilterChip active={tab === 'all'} onClick={() => setTab('all')}>
          All
        </FilterChip>
        <FilterChip active={tab === 'unread'} onClick={() => setTab('unread')}>
          Unread {unReadCount}
        </FilterChip>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <p className={styles.empty}>
            {tab === 'unread'
              ? 'You are all caught up.'
              : 'You do not have any notifications at the moment'}
          </p>
        ) : (
          visible.map((notification) => {
            const { title, body } = previewOf(notification)
            const meta = NOTIFICATION_META[notification.type ?? '']
            return (
              <button
                key={notification.id}
                type="button"
                className={`${styles.row} ${
                  notification.isRead ? '' : styles.unread
                }`}
                onClick={() => void handleOpen(notification)}>
                <span
                  className={cn(styles.icon, meta && styles[meta.tone])}
                  aria-hidden>
                  {ICONS[notification.type ?? ''] ?? (
                    <HiOutlineBell size={18} />
                  )}
                </span>
                <span className={styles.copy}>
                  <span className={styles.rowTitle}>{title}</span>
                  {body ? <span className={styles.rowBody}>{body}</span> : null}
                  {meta?.action && notification.link ? (
                    <span className={styles.action}>{meta.action}</span>
                  ) : null}
                </span>
                <span className={styles.meta}>
                  <span className={styles.time}>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.isRead ? (
                    <span className={styles.dot} aria-label="Unread" />
                  ) : null}
                </span>
              </button>
            )
          })
        )}
      </div>

      <Link to={viewAllTo} className={styles.viewAll}>
        View all notifications
      </Link>

      <ConfirmDialog
        open={needsSwitch}
        title="Switch company to open this?"
        message="This notification belongs to another company you work with. Switching clears any unsaved job drafts."
        confirmLabel="Switch company"
        isConfirming={isSwitching}
        onConfirm={() => void confirmSwitch()}
        onCancel={cancelSwitch}
      />
    </div>
  )
}
