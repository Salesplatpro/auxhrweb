import React, { useState } from 'react'
import { HiOutlineBell } from 'react-icons/hi'
import { Link } from 'react-router-dom'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useMarkAllNotificationsRead } from '@/features/notifications/hooks/useMarkAllNotificationsRead'
import { useMarkNotificationRead } from '@/features/notifications/hooks/useMarkNotificationRead'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useOpenNotification } from '@/features/notifications/hooks/useOpenNotification'
import { AppNotification } from '@/features/notifications/types'
import { formatTimeAgo } from '@/utils'
import { stripHtml } from '@/utils/truncateTexts'

import styles from './NotificationPanel.module.scss'

type NotificationPanelProps = {
  viewAllTo: string
  /** Called when a notification takes the user to another page. */
  onNavigate?: () => void
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

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`${styles.tab} ${tab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setTab('all')}>
          All Notifications
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'unread'}
          className={`${styles.tab} ${
            tab === 'unread' ? styles.tabActive : ''
          }`}
          onClick={() => setTab('unread')}>
          Unread ({unReadCount})
        </button>
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
            return (
              <button
                key={notification.id}
                type="button"
                className={`${styles.row} ${
                  notification.isRead ? '' : styles.unread
                }`}
                onClick={() => void handleOpen(notification)}>
                <span className={styles.icon} aria-hidden>
                  <HiOutlineBell size={18} />
                </span>
                <span className={styles.copy}>
                  <span className={styles.rowTitle}>{title}</span>
                  {body ? <span className={styles.rowBody}>{body}</span> : null}
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
        View all
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
