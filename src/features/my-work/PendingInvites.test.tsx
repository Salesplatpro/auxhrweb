import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PendingInvites } from './PendingInvites'

const { fetchMock, acceptMock, notifyMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  acceptMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', () => ({
  MY_STAFF_INVITES_KEY: '/staff-invites/mine',
  MY_WORK_KEY: '/my-work',
  fetchMyStaffInvites: () => fetchMock(),
  acceptMyStaffInvite: (id: string) => acceptMock(id),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const renderInvites = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PendingInvites />
    </SWRConfig>,
  )

describe('pending staff invites', () => {
  afterEach(cleanup)

  beforeEach(() => {
    acceptMock.mockReset()
    notifyMock.mockReset()
    fetchMock.mockResolvedValue([
      {
        id: 'staff1',
        organizationName: 'Kosana Tech Ltd',
        organizationLogoUrl: null,
        jobTitle: 'Product Designer',
        invitedByName: 'Hana Resources',
        expiresAt: null,
      },
    ])
  })

  it('lists an invite and joins the company when accepted', async () => {
    acceptMock.mockResolvedValue({ organizationName: 'Kosana Tech Ltd' })
    renderInvites()

    expect(
      await screen.findByText('Kosana Tech Ltd added you as staff'),
    ).toBeTruthy()
    expect(
      screen.getByText('Product Designer · Invited by Hana Resources'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    await waitFor(() => expect(acceptMock).toHaveBeenCalledWith('staff1'))
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      "You've joined Kosana Tech Ltd",
    )
  })

  it('asks the talent to finish their profile first', async () => {
    acceptMock.mockRejectedValue({
      data: { error: { code: 'PROFILE_INCOMPLETE', message: 'x' } },
    })
    renderInvites()

    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        'Complete your profile before joining this company.',
      ),
    )
  })

  it('shows nothing when there are no invites', async () => {
    fetchMock.mockResolvedValue([])
    const { container } = renderInvites()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })
})
