import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import InboxList from './InboxList'

const { useTalentChatSessionsMock, useMessagesMock, sendFn } = vi.hoisted(
  () => ({
    useTalentChatSessionsMock: vi.fn(),
    useMessagesMock: vi.fn(),
    sendFn: vi.fn(),
  }),
)

vi.mock('@/features/messaging/hooks/useTalentChatSessions', () => ({
  useTalentChatSessions: useTalentChatSessionsMock,
}))

vi.mock('@/features/messaging/hooks/useMessages', () => ({
  useMessages: useMessagesMock,
}))

vi.mock('@/features/messaging/hooks/useSendMessage', () => ({
  useSendMessage: () => ({ send: sendFn, isSending: false }),
}))

describe('InboxList', () => {
  it('lists recruiter name, company, and relative time', () => {
    useTalentChatSessionsMock.mockReturnValue({
      sessions: [
        {
          applicationId: 'app-1',
          recruiterId: 'rec-1',
          recruiterName: 'Jane Recruiter',
          companyName: 'Acme Corp',
          jobTitle: 'Engineer',
          lastMessagePreview: 'You are shortlisted',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 1,
        },
      ],
      unreadCount: 1,
      isLoading: false,
      mutate: vi.fn(),
    })
    useMessagesMock.mockReturnValue({
      messages: [],
      isLoading: false,
      mutate: vi.fn(),
    })

    render(
      <MemoryRouter>
        <InboxList />
      </MemoryRouter>,
    )

    expect(screen.getByText('Jane Recruiter')).toBeTruthy()
    expect(screen.getByText('Acme Corp')).toBeTruthy()
    expect(screen.getByText('You are shortlisted')).toBeTruthy()
    expect(screen.queryByText('Acknowledge')).toBeNull()
    expect(screen.queryByText('Reject')).toBeNull()
  })

  it('opens a thread when a conversation is selected', () => {
    useTalentChatSessionsMock.mockReturnValue({
      sessions: [
        {
          applicationId: 'app-1',
          recruiterId: 'rec-1',
          recruiterName: 'Jane Recruiter',
          companyName: 'Acme Corp',
          jobTitle: 'Engineer',
          lastMessagePreview: 'You are shortlisted',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        },
      ],
      unreadCount: 0,
      isLoading: false,
      mutate: vi.fn(),
    })
    useMessagesMock.mockReturnValue({
      messages: [
        {
          id: 'm1',
          content: 'You are shortlisted',
          createdAt: new Date().toISOString(),
          senderId: 'rec-1',
          recipientId: 'tal-1',
          applicationId: 'app-1',
          acknowledged: null,
          isRead: true,
          sender: {
            firstName: 'Jane',
            lastName: 'Recruiter',
            userRole: 'recruiter',
          },
        },
      ],
      isLoading: false,
      mutate: vi.fn(),
    })

    render(
      <MemoryRouter>
        <InboxList />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Jane Recruiter'))
    expect(screen.getAllByText('You are shortlisted').length).toBeGreaterThan(0)
  })
})
