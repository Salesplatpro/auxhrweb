import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { InboxLayout } from '@/components/features/messaging/Inbox'
import { PageHero } from '@/components/layout/PageHero'
import { PageShell } from '@/components/layout/PageShell'
import { useMessages } from '@/features/messaging/hooks/useMessages'
import { useSendMessage } from '@/features/messaging/hooks/useSendMessage'
import { useTalentChatSessions } from '@/features/messaging/hooks/useTalentChatSessions'

const InboxList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const applicationId = searchParams.get('applicationId')
  const {
    sessions,
    isLoading,
    mutate: mutateSessions,
  } = useTalentChatSessions()
  const {
    messages,
    isLoading: messagesLoading,
    mutate: mutateMessages,
  } = useMessages(applicationId ?? undefined)
  const { send, isSending } = useSendMessage(applicationId ?? '')

  const selected = sessions.find(
    (session) => session.applicationId === applicationId,
  )

  useEffect(() => {
    if (!applicationId || messagesLoading) return
    void mutateSessions()
  }, [applicationId, messagesLoading, messages.length, mutateSessions])

  const sections = [
    {
      id: 'all',
      conversations: sessions.map((session) => ({
        applicationId: session.applicationId,
        counterpartId: session.recruiterId,
        title: session.recruiterName,
        subtitle: session.companyName || session.jobTitle,
        lastMessageAt: session.lastMessageAt,
        lastMessagePreview: session.lastMessagePreview,
        unreadCount: session.unreadCount,
      })),
    },
  ]

  return (
    <PageShell wide>
      <PageHero
        compact
        title="Inbox"
        lead="Messages from recruiters appear here."
      />
      <InboxLayout
        sections={sections}
        selectedApplicationId={applicationId}
        onSelect={(id) => {
          if (!id) {
            setSearchParams({})
            return
          }
          setSearchParams({ applicationId: id })
        }}
        isLoading={isLoading}
        emptyTitle="No messages yet"
        emptyDescription="When a recruiter messages you about a role, the conversation will show up here."
        emptyThreadHint="Choose a recruiter on the left to read and reply."
        composerPlaceholder="Type a reply…"
        messages={messages}
        messagesLoading={messagesLoading}
        isSending={isSending}
        onSend={async (html) => {
          if (!selected) return
          await send({ content: html, recipient: selected.recruiterId })
          await Promise.all([mutateMessages(), mutateSessions()])
        }}
      />
    </PageShell>
  )
}

export default InboxList
