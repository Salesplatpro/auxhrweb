import cn from 'classnames'
import React, { ReactNode, useEffect, useMemo, useRef } from 'react'
import { HiOutlineLifebuoy } from 'react-icons/hi2'

import { topicLabel } from '../../constants'
import { SupportTopic } from '../../types'
import styles from './SupportThread.module.scss'

export interface ThreadRequest {
  id: string
  topic: SupportTopic | null
  subject: string | null
  message: string
  createdAt: string
  reply: string | null
  repliedAt: string | null
}

interface SupportThreadProps<T extends ThreadRequest> {
  requests: T[]
  /** The user sees their own messages on the right; the admin sees support's replies there. */
  viewer: 'user' | 'admin'
  senderName: string
  ariaLabel: string
  highlightId?: string
  renderRequestMeta?: (request: T) => ReactNode
  renderAfterRequest?: (request: T) => ReactNode
}

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const dayLabel = (iso: string) => {
  const date = new Date(iso)
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === new Date().getFullYear()
      ? {}
      : { year: 'numeric' }),
  })
}

const timeLabel = (iso: string, alongside?: string) => {
  const date = new Date(iso)
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (alongside && startOfDay(date) !== startOfDay(new Date(alongside))) {
    return `${date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })}, ${time}`
  }
  return time
}

interface BubbleProps {
  own: boolean
  support?: boolean
  author: string
  at: string
  alongside?: string
  children: ReactNode
  footer?: ReactNode
}

const Bubble = ({
  own,
  support,
  author,
  at,
  alongside,
  children,
  footer,
}: BubbleProps) => (
  <div className={cn(styles.row, own ? styles.own : styles.theirs)}>
    {support && !own && (
      <span className={styles.supportMark} aria-hidden>
        <HiOutlineLifebuoy size={16} />
      </span>
    )}
    <div className={styles.column}>
      <div className={cn(styles.bubble, support && styles.supportBubble)}>
        <p className={styles.author}>
          {author}
          <time dateTime={at} className={styles.time}>
            {timeLabel(at, alongside)}
          </time>
        </p>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  </div>
)

export function SupportThread<T extends ThreadRequest>({
  requests,
  viewer,
  senderName,
  ariaLabel,
  highlightId,
  renderRequestMeta,
  renderAfterRequest,
}: SupportThreadProps<T>) {
  const highlightRef = useRef<HTMLLIElement | null>(null)

  const days = useMemo(() => {
    const groups: Array<{ label: string; items: T[] }> = []
    for (const request of requests) {
      const label = dayLabel(request.createdAt)
      const last = groups[groups.length - 1]
      if (last?.label === label) last.items.push(request)
      else groups.push({ label, items: [request] })
    }
    return groups
  }, [requests])

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'center' })
  }, [highlightId])

  return (
    <ol className={styles.thread} aria-label={ariaLabel}>
      {days.map((day) => (
        <li key={day.label} className={styles.day}>
          <p className={styles.dayLabel}>
            <span>{day.label}</span>
          </p>
          <ol className={styles.exchanges}>
            {day.items.map((request) => {
              const highlighted = request.id === highlightId
              return (
                <li
                  key={request.id}
                  ref={highlighted ? highlightRef : undefined}
                  className={cn(
                    styles.exchange,
                    highlighted && styles.highlighted,
                  )}
                  aria-current={highlighted ? 'true' : undefined}>
                  <Bubble
                    own={viewer === 'user'}
                    author={senderName}
                    at={request.createdAt}
                    footer={renderRequestMeta?.(request)}>
                    <span className={styles.topic}>
                      {topicLabel(request.topic)}
                    </span>
                    {request.subject && (
                      <p className={styles.subject}>{request.subject}</p>
                    )}
                    <p className={styles.text}>{request.message}</p>
                  </Bubble>
                  {request.reply && request.repliedAt && (
                    <Bubble
                      own={viewer === 'admin'}
                      support
                      author="Auxhr Support"
                      at={request.repliedAt}
                      alongside={request.createdAt}>
                      <p className={styles.text}>{request.reply}</p>
                    </Bubble>
                  )}
                  {renderAfterRequest?.(request)}
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}
