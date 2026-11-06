import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SupportRequestDetail,
  SupportRequestWithUser,
  SupportUserContext,
} from '@/features/support/types'

import { AUTOSAVE_MS } from './ReplyBox'
import SupportRequestPage from './SupportRequest'

const mocks = vi.hoisted(() => ({
  fetchSupportRequest: vi.fn(),
  fetchSupportUserContext: vi.fn(),
  markSupportRead: vi.fn(),
  markSupportUnread: vi.fn(),
  saveSupportDraft: vi.fn(),
  draftSupportReplyWithAi: vi.fn(),
  sendSupportReply: vi.fn(),
  retrySupportReplyEmail: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/features/support/services/supportService', () => ({
  fetchSupportRequest: mocks.fetchSupportRequest,
  fetchSupportUserContext: mocks.fetchSupportUserContext,
  markSupportRead: mocks.markSupportRead,
  markSupportUnread: mocks.markSupportUnread,
  saveSupportDraft: mocks.saveSupportDraft,
  draftSupportReplyWithAi: mocks.draftSupportReplyWithAi,
  sendSupportReply: mocks.sendSupportReply,
  retrySupportReplyEmail: mocks.retrySupportReplyEmail,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: mocks.notify }))

const request = (
  overrides: Partial<SupportRequestWithUser> = {},
): SupportRequestWithUser => ({
  id: 'req-1',
  userId: 'user-1',
  topic: 'bug',
  subject: null,
  message: "My CV won't upload",
  status: 'read',
  isRead: true,
  createdAt: '2026-11-06T09:00:00.000Z',
  reply: null,
  repliedAt: null,
  replyEmailStatus: null,
  replyEmailError: null,
  draftReply: null,
  draftUpdatedAt: null,
  aiDraft: null,
  aiNote: null,
  aiDraftStatus: null,
  aiDraftAttempts: 0,
  aiDraftLastError: null,
  aiDraftBusy: false,
  user: {
    id: 'user-1',
    firstName: 'Tola',
    lastName: 'Ade',
    email: 'tola@example.com',
    userRole: 'talent',
    profileImageUrl: null,
  },
  ...overrides,
})

const detail = (
  overrides: Partial<SupportRequestWithUser> = {},
): SupportRequestDetail => {
  const current = request(overrides)
  return { request: current, history: [current] }
}

const context: SupportUserContext = {
  account: {
    firstName: 'Tola',
    lastName: 'Ade',
    email: 'tola@example.com',
    role: 'talent',
    country: 'Nigeria',
    signedUpAt: '2026-11-01T09:00:00.000Z',
    daysSinceSignup: 5,
    emailVerified: true,
    active: true,
  },
  onboarding: {
    stage: 'complete_profile',
    steps: [{ label: 'Verify email', done: true }],
    nextSteps: [],
  },
  talent: {
    profileCompletion: 43,
    roles: [],
    cvUploaded: false,
    cvUploadedAt: null,
    prescreeningScore: null,
    assessmentRetryDate: null,
    applicationsByStatus: {},
    stuckApplications: [],
  },
  recruiter: null,
  recentErrors: [],
}

const conflict = { isAxiosError: true, response: { status: 409 } }

const renderPage = () =>
  render(
    <React.StrictMode>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <MemoryRouter initialEntries={['/adminDashboard/support/req-1']}>
          <Routes>
            <Route path="/adminDashboard/support" element={<p>Inbox page</p>} />
            <Route
              path="/adminDashboard/support/:requestId"
              element={<SupportRequestPage />}
            />
          </Routes>
        </MemoryRouter>
      </SWRConfig>
    </React.StrictMode>,
  )

const replyBox = () =>
  screen.getByLabelText('Your reply to Tola') as HTMLTextAreaElement

const typeReply = (text: string) =>
  fireEvent.change(replyBox(), { target: { value: text } })

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('SupportRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchSupportRequest.mockResolvedValue(detail())
    mocks.fetchSupportUserContext.mockResolvedValue(context)
    mocks.saveSupportDraft.mockResolvedValue({
      draftReply: 'x',
      draftUpdatedAt: null,
    })
    mocks.markSupportRead.mockImplementation(async () =>
      request({ isRead: true }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks an unopened request read exactly once', async () => {
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({ isRead: false, status: 'unread' }),
    )
    renderPage()

    await screen.findByLabelText('Your reply to Tola')
    await waitFor(() => expect(mocks.markSupportRead).toHaveBeenCalledTimes(1))
    expect(mocks.markSupportRead).toHaveBeenCalledWith('req-1')
  })

  it('leaves an opened request alone', async () => {
    renderPage()
    await screen.findByLabelText('Your reply to Tola')
    expect(mocks.markSupportRead).not.toHaveBeenCalled()
  })

  it('starts the reply box with the AI draft and shows its note', async () => {
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({
        aiDraftStatus: 'drafted',
        aiDraft: 'Hi Tola, try a PDF.',
        aiNote: 'No CV yet.',
      }),
    )
    renderPage()

    await waitFor(() => expect(replyBox().value).toBe('Hi Tola, try a PDF.'))
    expect(
      screen.getByText('AI draft ready: review it before sending.'),
    ).toBeTruthy()
    expect(screen.getByText('No CV yet.')).toBeTruthy()
  })

  it('prefers the admin’s saved draft over the AI draft', async () => {
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({
        draftReply: 'My own words',
        aiDraftStatus: 'drafted',
        aiDraft: 'AI words',
      }),
    )
    renderPage()

    await waitFor(() => expect(replyBox().value).toBe('My own words'))
    fireEvent.click(screen.getByRole('button', { name: 'Use AI draft' }))
    expect(replyBox().value).toBe('AI words')
  })

  it('leaves a complex request for the admin, with no draft', async () => {
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({ aiDraftStatus: 'complex', aiNote: 'Asks for a refund.' }),
    )
    renderPage()

    expect(
      await screen.findByText('Left for you: this one needs your judgement.'),
    ).toBeTruthy()
    expect(screen.getByText('Asks for a refund.')).toBeTruthy()
    expect(replyBox().value).toBe('')
  })

  it('fills an untouched box when the AI draft arrives, but never replaces typed text', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mocks.fetchSupportRequest
      .mockResolvedValueOnce(detail({ aiDraftStatus: 'pending' }))
      .mockResolvedValue(
        detail({ aiDraftStatus: 'drafted', aiDraft: 'AI words' }),
      )
    renderPage()

    expect(await screen.findByText('AI is drafting a reply…')).toBeTruthy()
    typeReply('I am on it')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500)
    })

    expect(
      await screen.findByText('AI draft ready: review it before sending.'),
    ).toBeTruthy()
    expect(replyBox().value).toBe('I am on it')
    expect(screen.getByRole('button', { name: 'Use AI draft' })).toBeTruthy()
  })

  it('fills an untouched box when a polled AI draft arrives', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mocks.fetchSupportRequest
      .mockResolvedValueOnce(detail({ aiDraftStatus: 'pending' }))
      .mockResolvedValue(
        detail({ aiDraftStatus: 'drafted', aiDraft: 'AI words' }),
      )
    renderPage()

    await screen.findByText('AI is drafting a reply…')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500)
    })
    await waitFor(() => expect(replyBox().value).toBe('AI words'))
    expect(screen.queryByRole('button', { name: 'Use AI draft' })).toBeNull()
  })

  it('stops polling after two minutes and says so', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({ aiDraftStatus: 'pending' }),
    )
    renderPage()
    await screen.findByText('AI is drafting a reply…')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000 + 100)
    })
    expect(
      await screen.findByText('Still drafting. Refresh the page later.'),
    ).toBeTruthy()
    const calls = mocks.fetchSupportRequest.mock.calls.length

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
    })
    expect(mocks.fetchSupportRequest.mock.calls.length).toBe(calls)
  })

  it('saves the draft after a pause, one save at a time, newest text next', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const first = deferred<{ draftReply: string; draftUpdatedAt: null }>()
    mocks.saveSupportDraft
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ draftReply: 'x', draftUpdatedAt: null })
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    typeReply('One')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 100)
    })
    expect(mocks.saveSupportDraft).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    expect(mocks.saveSupportDraft).toHaveBeenCalledWith('req-1', 'One')

    typeReply('One two')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS + 100)
    })
    typeReply('One two three')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS + 100)
    })
    expect(mocks.saveSupportDraft).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve({ draftReply: 'One', draftUpdatedAt: null })
      await vi.advanceTimersByTimeAsync(10)
    })
    await waitFor(() => expect(mocks.saveSupportDraft).toHaveBeenCalledTimes(2))
    expect(mocks.saveSupportDraft).toHaveBeenLastCalledWith(
      'req-1',
      'One two three',
    )
    expect(await screen.findByText('Draft saved')).toBeTruthy()
  })

  it('cancels a waiting autosave when the reply is sent', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mocks.sendSupportReply.mockResolvedValue(
      request({
        reply: 'Done',
        repliedAt: '2026-11-06T10:00:00.000Z',
        status: 'replied',
        replyEmailStatus: 'sent',
      }),
    )
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    typeReply('Done')
    fireEvent.click(screen.getByRole('button', { name: /Send reply/ }))
    await waitFor(() =>
      expect(mocks.sendSupportReply).toHaveBeenCalledWith('req-1', 'Done'),
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2)
    })
    expect(mocks.saveSupportDraft).not.toHaveBeenCalled()
    expect(mocks.notify).toHaveBeenCalledWith('success', 'Reply sent')
  })

  it('treats a 409 on send as already sent and shows the reply', async () => {
    mocks.fetchSupportRequest.mockResolvedValueOnce(detail()).mockResolvedValue(
      detail({
        reply: 'Sent from another tab',
        repliedAt: '2026-11-06T10:00:00.000Z',
        status: 'replied',
        replyEmailStatus: 'sent',
      }),
    )
    mocks.sendSupportReply.mockRejectedValue(conflict)
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    typeReply('Hello')
    fireEvent.click(screen.getByRole('button', { name: /Send reply/ }))

    expect(await screen.findByText('Sent from another tab')).toBeTruthy()
    expect(mocks.notify).not.toHaveBeenCalledWith('error', expect.anything())
  })

  it('keeps the text and explains when sending fails', async () => {
    mocks.sendSupportReply.mockRejectedValue(new Error('offline'))
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    typeReply('Hello')
    fireEvent.click(screen.getByRole('button', { name: /Send reply/ }))

    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith(
        'error',
        'The reply didn’t send. Please try again.',
      ),
    )
    expect(replyBox().value).toBe('Hello')
  })

  it('asks before Draft with AI replaces typed text', async () => {
    mocks.draftSupportReplyWithAi.mockResolvedValue(
      request({ aiDraftStatus: 'drafted', aiDraft: 'Fresh AI words' }),
    )
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    typeReply('Mine')
    fireEvent.click(screen.getByRole('button', { name: /Draft with AI/ }))
    expect(mocks.draftSupportReplyWithAi).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Replace it' }))

    await waitFor(() => expect(replyBox().value).toBe('Fresh AI words'))
    expect(mocks.draftSupportReplyWithAi).toHaveBeenCalledTimes(1)
  })

  it('drafts straight away when the box is empty', async () => {
    mocks.draftSupportReplyWithAi.mockResolvedValue(
      request({ aiDraftStatus: 'drafted', aiDraft: 'Fresh AI words' }),
    )
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    fireEvent.click(screen.getByRole('button', { name: /Draft with AI/ }))
    await waitFor(() => expect(replyBox().value).toBe('Fresh AI words'))
  })

  it('waits while a background draft is running', async () => {
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({ aiDraftStatus: 'pending', aiDraftBusy: true }),
    )
    renderPage()
    await screen.findByText('AI is drafting a reply…')
    expect(
      (
        screen.getByRole('button', {
          name: /Draft with AI/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('offers to resend a failed email', async () => {
    mocks.fetchSupportRequest.mockResolvedValue(
      detail({
        status: 'replied',
        reply: 'Done',
        repliedAt: '2026-11-06T10:00:00.000Z',
        replyEmailStatus: 'failed',
        replyEmailError: 'Resend is down',
      }),
    )
    mocks.retrySupportReplyEmail.mockResolvedValue(
      request({
        status: 'replied',
        reply: 'Done',
        repliedAt: '2026-11-06T10:00:00.000Z',
        replyEmailStatus: 'sent',
      }),
    )
    renderPage()

    expect(
      await screen.findByText(/The email didn’t send: Resend is down/),
    ).toBeTruthy()
    expect(screen.queryByLabelText('Your reply to Tola')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry email' }))

    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith('success', 'Email sent'),
    )
    expect(await screen.findByText(/Emailed to tola@example.com/)).toBeTruthy()
  })

  it('marks a request unread and goes back to the inbox', async () => {
    mocks.markSupportUnread.mockResolvedValue(
      request({ isRead: false, status: 'unread' }),
    )
    renderPage()
    await screen.findByLabelText('Your reply to Tola')

    fireEvent.click(screen.getByRole('button', { name: 'Mark as unread' }))
    expect(await screen.findByText('Inbox page')).toBeTruthy()
  })

  it('shows what we know about the user, and says when a part is missing', async () => {
    mocks.fetchSupportUserContext.mockResolvedValue({
      ...context,
      onboarding: null,
    })
    renderPage()

    expect(await screen.findByText('About this user')).toBeTruthy()
    expect(screen.getByText('tola@example.com')).toBeTruthy()
    expect(screen.getByText('43% complete')).toBeTruthy()
    expect(screen.getAllByText('Couldn’t load this part.')).toHaveLength(1)
  })
})
