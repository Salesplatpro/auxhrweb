import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MySupportRequest } from '@/features/support/types'

import { SupportPage } from './SupportPage'

const { fetchMySupportMock, sendSupportRequestMock, notifyMock, auth } =
  vi.hoisted(() => ({
    fetchMySupportMock: vi.fn(),
    sendSupportRequestMock: vi.fn(),
    notifyMock: vi.fn(),
    auth: { userRole: 'talent' },
  }))

vi.mock('@/features/support/services/supportService', () => ({
  fetchMySupport: fetchMySupportMock,
  sendSupportRequest: sendSupportRequestMock,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { userRole: auth.userRole } }),
}))

const request = (
  overrides: Partial<MySupportRequest> = {},
): MySupportRequest => ({
  id: 'req-1',
  topic: 'bug',
  subject: null,
  message: "My CV won't upload",
  createdAt: '2026-11-05T10:00:00.000Z',
  seen: false,
  reply: null,
  repliedAt: null,
  ...overrides,
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    </SWRConfig>,
  )

const textbox = () =>
  screen.getByLabelText('Your message') as HTMLTextAreaElement

const type = (text: string) =>
  fireEvent.change(textbox(), { target: { value: text } })

const clickSend = () =>
  fireEvent.click(screen.getByRole('button', { name: /Send/ }))

describe('SupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.userRole = 'talent'
    fetchMySupportMock.mockResolvedValue([])
  })

  it('shows the conversation with replies and delivery states', async () => {
    fetchMySupportMock.mockResolvedValue([
      request({
        seen: true,
        reply: 'Try a PDF under 5 MB.',
        repliedAt: '2026-11-05T12:00:00.000Z',
      }),
      request({ id: 'req-2', message: 'Still stuck', seen: true }),
      request({ id: 'req-3', message: 'Any news?' }),
    ])
    renderPage()

    expect(await screen.findByText('Try a PDF under 5 MB.')).toBeTruthy()
    expect(screen.getAllByText('Auxhr Support')).toHaveLength(2)
    expect(screen.getByText('Replied')).toBeTruthy()
    expect(screen.getByText('Seen')).toBeTruthy()
    expect(screen.getByText('Sent')).toBeTruthy()
  })

  it('offers example questions when there is no conversation yet', async () => {
    renderPage()

    expect(await screen.findByText('Start a conversation')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: "My CV won't upload." }))
    expect(textbox().value).toBe("My CV won't upload.")
    expect(
      screen
        .getByRole('button', { name: "Something isn't working" })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('shows recruiter examples to a recruiter', async () => {
    auth.userRole = 'recruiter'
    renderPage()
    expect(
      await screen.findByRole('button', { name: 'How do I publish my job?' }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open the Guide' })).toBeTruthy()
  })

  it('shows a sent message at once, then keeps it once saved', async () => {
    const pending = deferred<MySupportRequest>()
    sendSupportRequestMock.mockReturnValue(pending.promise)
    renderPage()
    await screen.findByText('Start a conversation')

    fireEvent.click(screen.getByRole('button', { name: 'Billing & plans' }))
    type('  Can I pay yearly?  ')
    clickSend()

    expect(screen.getByText('Can I pay yearly?')).toBeTruthy()
    expect(screen.getByText('Sending…')).toBeTruthy()
    expect(textbox().value).toBe('')
    expect(sendSupportRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Can I pay yearly?',
        topic: 'billing',
      }),
    )

    pending.resolve(
      request({ id: 'saved', message: 'Can I pay yearly?', topic: 'billing' }),
    )
    expect(await screen.findByText('Sent')).toBeTruthy()
    expect(screen.queryByText('Sending…')).toBeNull()
  })

  it('removes a failed message and gives the text back', async () => {
    sendSupportRequestMock.mockRejectedValue(new Error('offline'))
    renderPage()
    await screen.findByText('Start a conversation')

    type('Help please')
    clickSend()

    await waitFor(() => expect(textbox().value).toBe('Help please'))
    expect(screen.queryByText('Sending…')).toBeNull()
    expect(notifyMock).toHaveBeenCalledWith(
      'error',
      "Your message didn't send. Please try again.",
    )
  })

  it('reuses the request id when the same text is retried, and not after an edit', async () => {
    sendSupportRequestMock.mockRejectedValue(new Error('offline'))
    renderPage()
    await screen.findByText('Start a conversation')

    type('Help please')
    clickSend()
    await waitFor(() => expect(textbox().value).toBe('Help please'))
    clickSend()
    await waitFor(() => expect(sendSupportRequestMock).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(textbox().value).toBe('Help please'))
    type('Help please, it is urgent')
    clickSend()
    await waitFor(() => expect(sendSupportRequestMock).toHaveBeenCalledTimes(3))

    const ids = sendSupportRequestMock.mock.calls.map(
      ([body]) => (body as { clientRequestId: string }).clientRequestId,
    )
    expect(ids[0]).toBe(ids[1])
    expect(ids[2]).not.toBe(ids[0])
  })

  it('explains the hourly limit', async () => {
    sendSupportRequestMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 429 },
    })
    renderPage()
    await screen.findByText('Start a conversation')

    type('Hello')
    clickSend()

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        "You've sent a lot of messages this hour. Please try again later.",
      ),
    )
  })

  it('asks for a message before sending', async () => {
    renderPage()
    await screen.findByText('Start a conversation')

    type('   ')
    clickSend()

    expect(screen.getByRole('alert').textContent).toBe(
      'Write your message first.',
    )
    expect(sendSupportRequestMock).not.toHaveBeenCalled()
  })

  it('sends with Ctrl + Enter', async () => {
    sendSupportRequestMock.mockResolvedValue(
      request({ id: 'saved', message: 'Quick one' }),
    )
    renderPage()
    await screen.findByText('Start a conversation')

    type('Quick one')
    fireEvent.keyDown(textbox(), { key: 'Enter', ctrlKey: true })

    await waitFor(() => expect(sendSupportRequestMock).toHaveBeenCalledTimes(1))
  })

  it('offers a retry when the conversation fails to load', async () => {
    fetchMySupportMock
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue([])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Start a conversation')).toBeTruthy()
  })
})
