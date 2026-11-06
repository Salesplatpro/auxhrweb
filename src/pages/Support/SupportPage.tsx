import axios from 'axios'
import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineLifebuoy,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/feedback/Alert'
import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { SupportThread } from '@/features/support/components/SupportThread/SupportThread'
import {
  SUPPORT_MESSAGE_MAX_LENGTH,
  SUPPORT_TOPICS,
} from '@/features/support/constants'
import { useMySupport } from '@/features/support/hooks/useMySupport'
import { sendSupportRequest } from '@/features/support/services/supportService'
import { MySupportRequest, SupportTopic } from '@/features/support/types'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import styles from './SupportPage.module.scss'

const COPY = {
  talent: {
    tips: [
      'Say which page you were on and what you clicked',
      'Name the job if it is about an application',
      'Tell us what you expected to happen',
    ],
    examples: [
      { topic: 'bug', text: "My CV won't upload." },
      { topic: 'applications', text: 'How does the pre-assessment work?' },
      { topic: 'applications', text: "I can't see where my application is." },
    ],
    guide: null,
  },
  recruiter: {
    tips: [
      'Say which job or page it is about',
      'Tell us what you expected and what happened instead',
      'Mention your plan if it is about billing',
    ],
    examples: [
      { topic: 'jobs', text: 'How do I publish my job?' },
      { topic: 'account', text: 'How do I add a teammate?' },
      {
        topic: 'applications',
        text: "Applicants aren't showing up on my job.",
      },
    ],
    guide: { label: 'Open the Guide', to: '/recruiterDashboard/guide' },
  },
} as const satisfies Record<
  string,
  {
    tips: readonly string[]
    examples: ReadonlyArray<{ topic: SupportTopic; text: string }>
    guide: { label: string; to: string } | null
  }
>

const COUNTER_FROM = SUPPORT_MESSAGE_MAX_LENGTH - 500

const statusOf = (request: MySupportRequest, sending: boolean) => {
  if (sending) return 'Sending…'
  if (request.reply) return 'Replied'
  return request.seen ? 'Seen' : 'Sent'
}

const isRateLimited = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 429

export const SupportPage = () => {
  const userRole = useAuthStore((state) => state.user?.userRole)
  const copy = userRole === 'recruiter' ? COPY.recruiter : COPY.talent
  const { requests, error, isLoading, retry, mutate } = useMySupport()

  const [topic, setTopic] = useState<SupportTopic | null>(null)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const [sending, setSending] = useState<MySupportRequest | null>(null)
  const attempt = useRef<{ text: string; id: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const shown = [...(requests ?? []), ...(sending ? [sending] : [])]

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [shown.length])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 280)}px`
  }, [message])

  /** A retry of the same text reuses its id, so the server returns the first copy instead of a second. */
  const idFor = (text: string) => {
    if (attempt.current?.text !== text) {
      attempt.current = { text, id: crypto.randomUUID() }
    }
    return attempt.current.id
  }

  const send = async () => {
    if (sending) return
    const text = message.trim()
    if (!text) {
      setMessageError('Write your message first.')
      textareaRef.current?.focus()
      return
    }
    if (text.length > SUPPORT_MESSAGE_MAX_LENGTH) {
      setMessageError('Keep your message under 5,000 characters.')
      return
    }

    const clientRequestId = idFor(text)
    setMessageError(null)
    setSending({
      id: `sending-${clientRequestId}`,
      topic,
      subject: null,
      message: text,
      createdAt: new Date().toISOString(),
      seen: false,
      reply: null,
      repliedAt: null,
    })
    setMessage('')

    try {
      const saved = await sendSupportRequest({
        message: text,
        topic,
        clientRequestId,
      })
      await mutate(
        (current) => [
          ...(current ?? []).filter((item) => item.id !== saved.id),
          saved,
        ],
        { revalidate: false },
      )
      attempt.current = null
      setTopic(null)
    } catch (err) {
      setMessage(text)
      notify(
        'error',
        isRateLimited(err)
          ? "You've sent a lot of messages this hour. Please try again later."
          : getErrorMessage(err, "Your message didn't send. Please try again."),
      )
    } finally {
      setSending(null)
    }
  }

  const applyExample = (example: { topic: SupportTopic; text: string }) => {
    setTopic(example.topic)
    setMessage(example.text)
    setMessageError(null)
    textareaRef.current?.focus()
  }

  const renderConversation = () => {
    if (isLoading) {
      return (
        <div className={styles.loading} aria-label="Loading your conversation">
          <Skeleton height={72} className={styles.skeletonMine} />
          <Skeleton height={96} className={styles.skeletonTheirs} />
          <Skeleton height={56} className={styles.skeletonMine} />
        </div>
      )
    }
    if (error) {
      return (
        <Alert variant="error" className={styles.loadError}>
          <span>We couldn’t load your conversation.</span>
          <Button size="sm" variant="outline" onClick={retry}>
            Retry
          </Button>
        </Alert>
      )
    }
    if (shown.length === 0) {
      return (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden>
            <HiOutlineChatBubbleLeftRight size={28} />
          </span>
          <h2 className={styles.emptyTitle}>Start a conversation</h2>
          <p className={styles.emptyLead}>
            Pick a topic and tell us what’s going on. Your messages and our
            replies stay here.
          </p>
          <div className={styles.examples}>
            {copy.examples.map((example) => (
              <button
                key={example.text}
                type="button"
                className={styles.example}
                onClick={() => applyExample(example)}>
                {example.text}
              </button>
            ))}
          </div>
        </div>
      )
    }
    return (
      <SupportThread
        requests={shown}
        viewer="user"
        senderName="You"
        ariaLabel="Your support conversation"
        renderRequestMeta={(request) => (
          <span
            className={cn(
              styles.delivery,
              request.reply && styles.deliveryReplied,
            )}>
            {statusOf(request, request.id === sending?.id)}
          </span>
        )}
      />
    )
  }

  return (
    <PageShell>
      <PageHero
        compact
        kicker="Help & support"
        title="How can we help?"
        lead="Ask about your account, jobs, billing or anything that isn't working. We reply here and by email, usually within a day."
      />

      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="support-conversation">
          <header className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden>
              <HiOutlineLifebuoy size={20} />
            </span>
            <div>
              <h2 id="support-conversation" className={styles.cardTitle}>
                Auxhr Support
              </h2>
              <p className={styles.cardLead}>Usually replies within a day</p>
            </div>
          </header>

          <div className={styles.scroll} ref={scrollRef}>
            {renderConversation()}
          </div>

          <form
            className={styles.composer}
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}>
            <div
              className={styles.topics}
              role="group"
              aria-label="What is it about?">
              {SUPPORT_TOPICS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={topic === item.value}
                  className={cn(
                    styles.topic,
                    topic === item.value && styles.topicActive,
                  )}
                  onClick={() =>
                    setTopic((current) =>
                      current === item.value ? null : item.value,
                    )
                  }>
                  {item.label}
                </button>
              ))}
            </div>

            <label htmlFor="support-message" className={styles.srOnly}>
              Your message
            </label>
            <textarea
              id="support-message"
              ref={textareaRef}
              className={cn(styles.textarea, messageError && styles.invalid)}
              rows={3}
              value={message}
              maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
              placeholder="Describe what you need, or what isn't working…"
              aria-invalid={messageError ? true : undefined}
              aria-describedby={
                messageError ? 'support-message-error' : undefined
              }
              onChange={(event) => {
                setMessage(event.target.value)
                if (messageError) setMessageError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  void send()
                }
              }}
            />
            {messageError && (
              <p
                id="support-message-error"
                className={styles.error}
                role="alert">
                {messageError}
              </p>
            )}

            <div className={styles.composerFooter}>
              <span className={styles.hint}>
                {message.length >= COUNTER_FROM
                  ? `${message.length.toLocaleString()} / 5,000`
                  : 'Ctrl or ⌘ + Enter to send'}
              </span>
              <Button
                type="submit"
                loading={!!sending}
                icon={<HiOutlinePaperAirplane size={16} />}>
                Send
              </Button>
            </div>
          </form>
        </section>

        <aside className={styles.aside}>
          <div className={styles.asideBlock}>
            <h2 className={styles.asideTitle}>For a faster answer</h2>
            <ul className={styles.tips}>
              {copy.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className={styles.asideBlock}>
            <h2 className={styles.asideTitle}>What happens next</h2>
            <ol className={styles.steps}>
              <li>We read your message, usually the same day.</li>
              <li>Our reply appears here and in your email.</li>
              <li>You get a notification when we answer.</li>
            </ol>
          </div>
          {copy.guide && (
            <Link to={copy.guide.to} className={styles.guideLink}>
              {copy.guide.label}
            </Link>
          )}
        </aside>
      </div>
    </PageShell>
  )
}
