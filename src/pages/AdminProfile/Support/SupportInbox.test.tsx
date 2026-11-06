import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SupportInbox, SupportInboxRow } from '@/features/support/types'

import SupportInboxPage from './SupportInbox'

const { fetchSupportInboxMock } = vi.hoisted(() => ({
  fetchSupportInboxMock: vi.fn(),
}))

vi.mock('@/features/support/services/supportService', () => ({
  fetchSupportInbox: fetchSupportInboxMock,
}))

const row = (overrides: Partial<SupportInboxRow> = {}): SupportInboxRow => ({
  id: 'req-1',
  topic: 'bug',
  subject: null,
  preview: "My CV won't upload",
  status: 'unread',
  isRead: false,
  hasDraft: false,
  aiDraftStatus: 'drafted',
  replyEmailStatus: null,
  createdAt: '2026-11-06T09:00:00.000Z',
  repliedAt: null,
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

const inbox = (rows: SupportInboxRow[]): SupportInbox => ({
  feedback: rows,
  total: rows.length,
  counts: { unread: 1, read: 1, unreplied: 1, replied: 1 },
})

const renderInbox = (path = '/adminDashboard/support') =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/adminDashboard/support"
            element={<SupportInboxPage />}
          />
          <Route
            path="/adminDashboard/support/:requestId"
            element={<p>Request page</p>}
          />
        </Routes>
      </MemoryRouter>
    </SWRConfig>,
  )

const lastQuery = () =>
  fetchSupportInboxMock.mock.calls[
    fetchSupportInboxMock.mock.calls.length - 1
  ]![0]

describe('SupportInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchSupportInboxMock.mockResolvedValue(
      inbox([
        row({ id: 'a', status: 'unreplied', aiDraftStatus: 'complex' }),
        row({ id: 'b', status: 'unread' }),
        row({
          id: 'c',
          status: 'read',
          isRead: true,
          aiDraftStatus: 'pending',
        }),
        row({
          id: 'd',
          status: 'replied',
          isRead: true,
          repliedAt: '2026-11-06T10:00:00.000Z',
          replyEmailStatus: 'failed',
        }),
      ]),
    )
  })

  it('shows a colour tag for each status and what the AI did', async () => {
    renderInbox()
    const table = await screen.findByRole('table', { name: 'Support requests' })

    expect(
      [
        'No reply for over 48 hours',
        'Not opened yet',
        'Opened, no reply yet',
        'Reply sent',
      ].map((hint) => within(table).getByTitle(hint).textContent),
    ).toEqual(['Unreplied', 'Unread', 'Read', 'Replied'])
    expect(within(table).getByText('Needs you')).toBeTruthy()
    expect(within(table).getByText('Draft ready')).toBeTruthy()
    expect(within(table).getByText('Drafting…')).toBeTruthy()
    expect(within(table).getByText('Email failed')).toBeTruthy()
  })

  it('asks the server for the most urgent first by default', async () => {
    renderInbox()
    await screen.findByRole('table', { name: 'Support requests' })
    expect(lastQuery()).toMatchObject({
      sortBy: 'status',
      sort: 'asc',
      offset: 0,
      limit: 20,
    })
  })

  it('filters by status from the tabs', async () => {
    renderInbox()
    await screen.findByRole('table', { name: 'Support requests' })

    fireEvent.click(screen.getByRole('tab', { name: /Unreplied/ }))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ status: 'unreplied', offset: 0 }),
    )
  })

  it('reads the status from the link it was opened with', async () => {
    renderInbox('/adminDashboard/support?status=unread')
    await screen.findByRole('table', { name: 'Support requests' })
    expect(lastQuery()).toMatchObject({ status: 'unread' })
  })

  it('sorts by when it arrived from the column header', async () => {
    renderInbox()
    const table = await screen.findByRole('table', { name: 'Support requests' })

    fireEvent.click(within(table).getByRole('button', { name: /Received/ }))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ sortBy: 'createdAt' }),
    )
  })

  it('bolds requests nobody has opened, but not answered ones', async () => {
    renderInbox()
    const table = await screen.findByRole('table', { name: 'Support requests' })
    const rows = within(table).getAllByRole('row').slice(1)

    expect(rows[0]!.className).toContain('unreadRow')
    expect(rows[1]!.className).toContain('unreadRow')
    expect(rows[2]!.className).not.toContain('unreadRow')
    expect(rows[3]!.className).not.toContain('unreadRow')
  })

  it('opens a request when its row is clicked', async () => {
    renderInbox()
    const table = await screen.findByRole('table', { name: 'Support requests' })
    fireEvent.click(within(table).getAllByText('Tola Ade')[0]!)
    expect(await screen.findByText('Request page')).toBeTruthy()
  })

  it('says when a tab has nothing in it', async () => {
    fetchSupportInboxMock.mockResolvedValue({
      feedback: [],
      total: 0,
      counts: { unread: 0, read: 0, unreplied: 0, replied: 0 },
    })
    renderInbox('/adminDashboard/support?status=unreplied')
    expect(await screen.findByText('Nothing overdue')).toBeTruthy()
  })

  it('offers a retry when the list fails to load', async () => {
    fetchSupportInboxMock.mockRejectedValueOnce(new Error('down'))
    renderInbox()
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByRole('table', { name: 'Support requests' }),
    ).toBeTruthy()
  })
})
