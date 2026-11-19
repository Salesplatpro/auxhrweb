import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { HiChevronLeft } from 'react-icons/hi'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Message } from '@/features/messaging/types'
import { DisplayMessage } from '@/pages/RecruiterProfile/MyJobPosts/Messaging/DisplayMessage'
import { BREAKPOINTS, isBelow } from '@/styles/breakpoints'
import { formatTimeAgo } from '@/utils'

import styles from './InboxLayout.module.scss'
import { InboxConversation, InboxSection } from './types'

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

const toHtml = (text: string) => {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<p>${escaped.replace(/\n/g, '<br/>')}</p>`
}

type InboxLayoutProps = {
  sections: InboxSection[]
  selectedApplicationId?: string | null
  onSelect: (applicationId: string | null) => void
  isLoading?: boolean
  emptyTitle: string
  emptyDescription: string
  emptyThreadHint: string
  composerPlaceholder: string
  messages: Message[]
  messagesLoading?: boolean
  onSend: (html: string) => Promise<void>
  isSending?: boolean
  threadAction?: React.ReactNode
}

export const InboxLayout = ({
  sections,
  selectedApplicationId,
  onSelect,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyThreadHint,
  composerPlaceholder,
  messages,
  messagesLoading = false,
  onSend,
  isSending = false,
  threadAction,
}: InboxLayoutProps) => {
  const [draft, setDraft] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)
  const conversations = useMemo(
    () => sections.flatMap((section) => section.conversations),
    [sections],
  )
  const selected = conversations.find(
    (item) => item.applicationId === selectedApplicationId,
  )
  const isNarrow = isBelow(BREAKPOINTS.md)
  const [narrow, setNarrow] = useState(isNarrow)

  useEffect(() => {
    const onResize = () => setNarrow(isBelow(BREAKPOINTS.md))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, selectedApplicationId])

  const showThreadOnly = narrow && !!selected
  const showListOnly = narrow && !selected

  const submitDraft = async () => {
    if (isSending || !draft.trim()) return
    await onSend(toHtml(draft.trim()))
    setDraft('')
  }

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    await submitDraft()
  }

  if (isLoading) return <Spinner fullPage />

  if (conversations.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  const selectedNames = selected ? splitName(selected.title) : null

  return (
    <div
      className={`${styles.layout} ${
        showThreadOnly ? styles.showThreadOnly : ''
      } ${showListOnly ? styles.showListOnly : ''}`}>
      <aside className={styles.listPane}>
        <div className={styles.listScroll}>
          {sections.map((section) => (
            <div key={section.id}>
              {section.heading ? (
                <h3 className={styles.sectionHeading}>{section.heading}</h3>
              ) : null}
              {section.conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.applicationId}
                  conversation={conversation}
                  active={conversation.applicationId === selectedApplicationId}
                  onSelect={() => onSelect(conversation.applicationId)}
                />
              ))}
            </div>
          ))}
        </div>
      </aside>

      <section className={styles.threadPane}>
        {selected ? (
          <>
            <header className={styles.threadHeader}>
              <button
                type="button"
                className={styles.backButton}
                aria-label="Back to conversations"
                onClick={() => onSelect(null)}>
                <HiChevronLeft size={22} />
              </button>
              {selectedNames ? (
                <Avatar
                  firstName={selectedNames.firstName}
                  lastName={selectedNames.lastName}
                  size="md"
                />
              ) : null}
              <div className={styles.threadIdentity}>
                <p className={styles.threadTitle}>{selected.title}</p>
                <p className={styles.threadSubtitle}>{selected.subtitle}</p>
              </div>
              {threadAction ? (
                <div className={styles.threadAction}>{threadAction}</div>
              ) : null}
            </header>
            <div className={styles.threadBody}>
              {messagesLoading ? (
                <Spinner />
              ) : (
                <DisplayMessage messages={messages} />
              )}
              <div ref={threadEndRef} />
            </div>
            <form className={styles.composer} onSubmit={handleSend}>
              <textarea
                className={styles.composerInput}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={composerPlaceholder}
                rows={1}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void submitDraft()
                  }
                }}
              />
              <Button
                type="submit"
                variant="primary"
                loading={isSending}
                disabled={!draft.trim()}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className={styles.threadEmpty}>
            <EmptyState
              title="Select a conversation"
              description={emptyThreadHint}
            />
          </div>
        )}
      </section>
    </div>
  )
}

const ConversationRow = ({
  conversation,
  active,
  onSelect,
}: {
  conversation: InboxConversation
  active: boolean
  onSelect: () => void
}) => {
  const names = splitName(conversation.title)
  return (
    <button
      type="button"
      className={`${styles.row} ${active ? styles.rowActive : ''}`}
      onClick={onSelect}>
      <Avatar firstName={names.firstName} lastName={names.lastName} size="sm" />
      <span className={styles.rowCopy}>
        <span className={styles.rowTop}>
          <span className={styles.rowTitle}>{conversation.title}</span>
          <span className={styles.rowTime}>
            {formatTimeAgo(conversation.lastMessageAt)}
          </span>
        </span>
        <span className={styles.rowSubtitle}>{conversation.subtitle}</span>
        {conversation.lastMessagePreview ? (
          <span className={styles.rowPreview}>
            {conversation.lastMessagePreview}
          </span>
        ) : null}
      </span>
      {conversation.unreadCount > 0 ? (
        <span className={styles.unreadDot} aria-label="Unread" />
      ) : null}
    </button>
  )
}
