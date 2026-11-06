import React, { useEffect, useRef, useState } from 'react'
import { HiArrowLeft } from 'react-icons/hi2'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { SupportStatusBadge } from '@/features/support/components/SupportStatusBadge'
import { SupportThread } from '@/features/support/components/SupportThread/SupportThread'
import {
  useRefreshSupportInbox,
  useSupportRequest,
} from '@/features/support/hooks/useAdminSupport'
import {
  markSupportRead,
  markSupportUnread,
  retrySupportReplyEmail,
} from '@/features/support/services/supportService'
import {
  SupportRequestDetail,
  SupportRequestWithUser,
} from '@/features/support/types'
import { formatTimeAgo } from '@/utils/calculateDaysFromCreation'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { ReplyBox } from './ReplyBox'
import styles from './Support.module.scss'
import { UserContextPanel } from './UserContextPanel'

const INBOX_PATH = '/adminDashboard/support'

const withRequest = (
  detail: SupportRequestDetail | undefined,
  request: SupportRequestWithUser,
): SupportRequestDetail | undefined =>
  detail && {
    request: { ...request, user: request.user ?? detail.request.user },
    history: detail.history.map((item) =>
      item.id === request.id ? { ...item, ...request } : item,
    ),
  }

const SentFooter = ({
  request,
  onRetried,
}: {
  request: SupportRequestWithUser
  onRetried: (request: SupportRequestWithUser) => void
}) => {
  const [retrying, setRetrying] = useState(false)

  const retry = async () => {
    setRetrying(true)
    try {
      const updated = await retrySupportReplyEmail(request.id)
      onRetried(updated)
      notify(
        updated.replyEmailStatus === 'sent' ? 'success' : 'error',
        updated.replyEmailStatus === 'sent'
          ? 'Email sent'
          : 'The email still didn’t send.',
      )
    } catch (err) {
      notify('error', getErrorMessage(err, 'Couldn’t retry the email.'))
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className={styles.sentFooter}>
      <p className={styles.sentLine}>
        Replied {formatTimeAgo(request.repliedAt)}.
        {request.replyEmailStatus === 'sent' &&
          ` Emailed to ${request.user.email}.`}
        {request.replyEmailStatus === 'pending' && ' The email is on its way.'}
      </p>
      {request.replyEmailStatus !== 'sent' && (
        <Alert variant="warning" className={styles.emailAlert}>
          <span>
            {request.replyEmailStatus === 'failed'
              ? `The email didn’t send${
                  request.replyEmailError ? `: ${request.replyEmailError}` : ''
                }. They can still read the reply in the app.`
              : 'If the email doesn’t arrive, you can send it again.'}
          </span>
          <Button
            size="sm"
            variant="outline"
            loading={retrying}
            onClick={retry}>
            Retry email
          </Button>
        </Alert>
      )}
    </div>
  )
}

const SupportRequestPage = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { detail, error, isLoading, mutate, stillDrafting } =
    useSupportRequest(requestId)
  const refreshInbox = useRefreshSupportInbox()
  const markedRead = useRef<string | null>(null)

  const updateRequest = (updated: SupportRequestWithUser) =>
    mutate((current) => withRequest(current, updated), { revalidate: false })

  useEffect(() => {
    const request = detail?.request
    if (!request || request.isRead || markedRead.current === request.id) return
    markedRead.current = request.id
    markSupportRead(request.id)
      .then((updated) => {
        void updateRequest(updated)
        void refreshInbox()
      })
      .catch(() => {
        markedRead.current = null
      })
  }, [detail?.request.id, detail?.request.isRead])

  const markUnread = async () => {
    if (!detail) return
    try {
      await markSupportUnread(detail.request.id)
      void refreshInbox()
      navigate(INBOX_PATH)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Couldn’t mark it as unread.'))
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page} aria-label="Loading the request">
        <Skeleton height={64} />
        <Skeleton height={360} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className={styles.page}>
        <Link to={INBOX_PATH} className={styles.back}>
          <HiArrowLeft aria-hidden /> Support inbox
        </Link>
        <Alert variant="error" className={styles.loadError}>
          <span>We couldn’t load this request.</span>
          <Button size="sm" variant="outline" onClick={() => void mutate()}>
            Retry
          </Button>
        </Alert>
      </div>
    )
  }

  const { request, history } = detail
  const { user } = request
  const replied = !!request.repliedAt

  return (
    <div className={styles.page}>
      <Link to={INBOX_PATH} className={styles.back}>
        <HiArrowLeft aria-hidden /> Support inbox
      </Link>

      <header className={styles.requestHeader}>
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          src={user.profileImageUrl}
          size="md"
        />
        <div className={styles.requestHeading}>
          <h1 className={styles.requestName}>
            {user.firstName} {user.lastName}
          </h1>
          <p className={styles.requestMeta}>
            {user.userRole === 'recruiter' ? 'Recruiter' : 'Talent'} · Received{' '}
            {formatTimeAgo(request.createdAt)}
          </p>
        </div>
        <SupportStatusBadge status={request.status} />
        {!replied && (
          <Button variant="outline" size="sm" onClick={markUnread}>
            Mark as unread
          </Button>
        )}
      </header>

      <div className={styles.columns}>
        <section className={styles.conversation} aria-label="Conversation">
          <div className={styles.threadScroll}>
            <SupportThread
              requests={history}
              viewer="admin"
              senderName={user.firstName}
              ariaLabel={`Conversation with ${user.firstName}`}
              highlightId={request.id}
              renderRequestMeta={(item) => (
                <SupportStatusBadge status={item.status} />
              )}
              renderAfterRequest={(item) =>
                item.id !== request.id && item.status !== 'replied' ? (
                  <Link
                    to={`${INBOX_PATH}/${item.id}`}
                    className={styles.replyLink}>
                    Reply to this one
                  </Link>
                ) : null
              }
            />
          </div>
          {replied ? (
            <SentFooter request={request} onRetried={updateRequest} />
          ) : (
            <ReplyBox
              key={request.id}
              request={request}
              stillDrafting={stillDrafting}
              onRequestChange={(updated) => void updateRequest(updated)}
              onSent={async () => {
                await mutate()
                void refreshInbox()
              }}
            />
          )}
        </section>

        <UserContextPanel requestId={request.id} userId={request.userId} />
      </div>
    </div>
  )
}

export default SupportRequestPage
