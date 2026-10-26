import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JoinStep from './JoinStep'

const { acceptMock } = vi.hoisted(() => ({ acceptMock: vi.fn() }))

vi.mock('@/features/people/services/peopleService', () => ({
  acceptStaffInvite: acceptMock,
}))

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { userRole: 'talent' } }),
}))

const context = {
  token: 'abc',
  invite: {
    status: 'pending',
    organizationName: 'Acme Ltd',
    organizationLogoUrl: null,
    jobTitle: 'Product Designer',
    invitedEmail: 'ada@example.com',
    invitedByName: 'Hana Resources',
    expiresAt: null,
    inviteeExists: true,
  },
}

const renderStep = () =>
  render(
    <MemoryRouter initialEntries={['/join-staff/abc/join']}>
      <Routes>
        <Route path="/join-staff/:token" element={<Outlet context={context} />}>
          <Route path="join" element={<JoinStep />} />
          <Route path="profile" element={<p>Profile step</p>} />
        </Route>
        <Route path="/talentDashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe('JoinStep', () => {
  it('joins the company and offers the dashboard', async () => {
    acceptMock.mockResolvedValue({
      organizationName: 'Acme Ltd',
      jobTitle: 'Product Designer',
      joinedAt: '2026-03-05T09:00:00.000Z',
    })
    renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Join Acme Ltd' }))
    expect(await screen.findByText("You've joined Acme Ltd")).toBeTruthy()
    expect(acceptMock).toHaveBeenCalledWith('abc')

    fireEvent.click(screen.getByRole('button', { name: 'Go to my dashboard' }))
    expect(await screen.findByText('Dashboard')).toBeTruthy()
  })

  it('sends the person back to finish their profile when the server says it is incomplete', async () => {
    acceptMock.mockRejectedValue({
      response: {
        data: { error: { code: 'PROFILE_INCOMPLETE', message: 'Complete it' } },
      },
    })
    renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Join Acme Ltd' }))
    expect(await screen.findByText('Profile step')).toBeTruthy()
  })

  it('shows the server message and lets them retry for any other failure', async () => {
    acceptMock.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Sign in with the email address this invite was sent to',
          },
        },
      },
    })
    renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Join Acme Ltd' }))
    expect(
      await screen.findByText(
        'Sign in with the email address this invite was sent to',
      ),
    ).toBeTruthy()
    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: 'Join Acme Ltd',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    )
  })
})
