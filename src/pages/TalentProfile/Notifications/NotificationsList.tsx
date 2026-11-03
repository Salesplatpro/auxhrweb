import { Alert } from '@mui/material'
import React from 'react'

import RichTextDisplay from '@/components/features/shared/global/RichTextDisplay'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHero } from '@/components/layout/PageHero'
import { PagePanel } from '@/components/layout/PagePanel'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useMarkNotificationRead } from '@/features/notifications/hooks/useMarkNotificationRead'
import { useNotificationPages } from '@/features/notifications/hooks/useNotificationPages'
import { useOpenNotification } from '@/features/notifications/hooks/useOpenNotification'
import { AppNotification } from '@/features/notifications/types'
import { stripHtml } from '@/utils/truncateTexts'

import { formatTimeAgo } from '../../../utils'
import styles from './NotificationsList.module.scss'

const NotificationsList: React.FC = () => {
  const { notifications, isLoading, isLoadingMore, hasMore, loadMore, mutate } =
    useNotificationPages()
  const { markAsRead } = useMarkNotificationRead()
  const { follow, needsSwitch, isSwitching, confirmSwitch, cancelSwitch } =
    useOpenNotification()

  const handleOpen = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
      await mutate()
    }
    follow(notification)
  }

  if (isLoading) return <Spinner fullPage />
  if (notifications.length === 0) {
    return (
      <PageShell>
        <PageHero
          compact
          title="Notifications"
          lead="Updates about your applications and account."
        />
        <Alert severity="info">
          You do not have any notifications at the moment
        </Alert>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHero
        compact
        title="Notifications"
        lead="Updates about your applications and account."
      />
      <PagePanel>
        {notifications.map((notification) => {
          const titleText = stripHtml(notification.title || '')
          const messageHtml = notification.message || ''
          const messageText = stripHtml(messageHtml)
          const showBody = Boolean(messageText) && messageText !== titleText
          return (
            <button
              key={notification.id}
              type="button"
              className={`${styles.card} ${
                notification.isRead ? '' : styles.unread
              }`}
              onClick={() => void handleOpen(notification)}>
              {titleText ? <p className={styles.title}>{titleText}</p> : null}
              {showBody ? (
                <RichTextDisplay
                  content={messageHtml}
                  className={styles.message}
                />
              ) : !titleText && messageText ? (
                <p className={styles.message}>{messageText}</p>
              ) : null}
              <span className={styles.timestamp}>
                {formatTimeAgo(notification.createdAt)}
              </span>
            </button>
          )
        })}
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            loading={isLoadingMore}
            onClick={() => void loadMore()}>
            Load more
          </Button>
        )}
      </PagePanel>
      <ConfirmDialog
        open={needsSwitch}
        title="Switch company to open this?"
        message="This notification belongs to another company you work with. Switching clears any unsaved job drafts."
        confirmLabel="Switch company"
        isConfirming={isSwitching}
        onConfirm={() => void confirmSwitch()}
        onCancel={cancelSwitch}
      />
    </PageShell>
  )
}

export default NotificationsList
