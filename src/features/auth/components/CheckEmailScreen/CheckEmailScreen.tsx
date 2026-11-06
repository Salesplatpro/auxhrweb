import React, { useEffect, useRef, useState } from 'react'
import { LuArrowLeft, LuMail, LuMailCheck } from 'react-icons/lu'

import { Alert } from '@/components/feedback'
import { Button } from '@/components/ui/Button'
import { TextLink } from '@/components/ui/TextLink'
import { formatCountdown, useCooldown } from '@/hooks/useCooldown'
import { paths } from '@/paths'
import { getErrorMessage } from '@/utils/getErrorMessage'

import { AuthScreen } from '../AuthScreen'
import styles from './CheckEmailScreen.module.scss'

export const RESEND_COOLDOWN_SECONDS = 60

const INBOXES = [
  { label: 'Open Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
  { label: 'Open Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
]

type CheckEmailScreenProps = {
  title?: string
  message: React.ReactNode
  onResend: () => Promise<unknown>
  footer?: React.ReactNode
  progress?: { step: number; total: number }
}

export const CheckEmailScreen = ({
  title = 'Check your email',
  message,
  onResend,
  footer,
  progress,
}: CheckEmailScreenProps) => {
  const { remaining, isCoolingDown, start } = useCooldown(
    RESEND_COOLDOWN_SECONDS,
  )
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    start()
  }, [start])

  const resend = async () => {
    if (inFlight.current || isCoolingDown) return
    inFlight.current = true
    setIsSending(true)
    setError(null)
    try {
      await onResend()
      setResent(true)
      start()
    } catch (err) {
      setError(getErrorMessage(err, 'We could not send the email. Try again.'))
    } finally {
      inFlight.current = false
      setIsSending(false)
    }
  }

  return (
    <AuthScreen
      progress={progress}
      icon={{ icon: <LuMailCheck /> }}
      title={title}
      subtitle={message}>
      {error && <Alert variant="error">{error}</Alert>}
      {resent && !error && (
        <Alert variant="success">
          We sent a new email. Only the newest link will work.
        </Alert>
      )}
      <div className={styles.inboxes}>
        {INBOXES.map((inbox) => (
          <Button
            key={inbox.url}
            type="button"
            variant="outline"
            size="xl"
            pill
            stretch
            icon={<LuMail />}
            onClick={() =>
              window.open(inbox.url, '_blank', 'noopener,noreferrer')
            }>
            {inbox.label}
          </Button>
        ))}
      </div>
      <p className={styles.resend}>
        Didn&apos;t get the email?{' '}
        <button
          type="button"
          className={styles.resendButton}
          onClick={resend}
          disabled={isCoolingDown || isSending}>
          {isSending
            ? 'Sending…'
            : isCoolingDown
            ? `Resend in ${formatCountdown(remaining)}`
            : 'Resend'}
        </button>
      </p>
      {footer ?? (
        <TextLink to={`/${paths.login}`} tone="muted" icon={<LuArrowLeft />}>
          Back to log in
        </TextLink>
      )}
    </AuthScreen>
  )
}
