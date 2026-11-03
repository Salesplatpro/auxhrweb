import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { httpClient } from '@/features/auth/services/httpClient'
import { getErrorMessage } from '@/utils/getErrorMessage'

import styles from './Unsubscribe.module.scss'

/** Asks first, because mail scanners open links in emails and must not unsubscribe anyone. */
export const Unsubscribe = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [isSending, setIsSending] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const unsubscribe = async () => {
    setIsSending(true)
    setProblem(null)
    try {
      await httpClient.post('/email-preferences/unsubscribe', null, {
        params: { token },
      })
      setIsDone(true)
    } catch (err) {
      setProblem(getErrorMessage(err, 'Could not unsubscribe you. Try again.'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        {!token ? (
          <>
            <h1>This link isn&apos;t complete</h1>
            <p>Open the unsubscribe link from your email again.</p>
          </>
        ) : isDone ? (
          <>
            <h1>You&apos;re unsubscribed</h1>
            <p>
              We won&apos;t send you any more reminders about finishing your
              setup or your applications. You&apos;ll still get emails you need,
              like messages from recruiters.
            </p>
          </>
        ) : (
          <>
            <h1>Stop reminder emails?</h1>
            <p>
              We&apos;ll stop reminding you about finishing your setup or your
              applications. You&apos;ll still get emails you need, like messages
              from recruiters.
            </p>
            {problem && (
              <p className={styles.problem} role="alert">
                {problem}
              </p>
            )}
            <Button
              type="button"
              loading={isSending}
              onClick={() => void unsubscribe()}>
              Unsubscribe
            </Button>
          </>
        )}
      </section>
    </main>
  )
}
