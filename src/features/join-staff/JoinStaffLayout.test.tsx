import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JoinStaffLayout from './JoinStaffLayout'

const { useJoinStaffInviteMock } = vi.hoisted(() => ({
  useJoinStaffInviteMock: vi.fn(),
}))

vi.mock('./useJoinStaffInvite', () => ({
  useJoinStaffInvite: useJoinStaffInviteMock,
}))

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/join-staff/abc']}>
      <Routes>
        <Route path="/join-staff/:token" element={<JoinStaffLayout />}>
          <Route index element={<p>Current step</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

const state = (overrides: Record<string, unknown>) =>
  useJoinStaffInviteMock.mockReturnValue({
    invite: null,
    isLoading: false,
    isInvalid: false,
    ...overrides,
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('JoinStaffLayout', () => {
  it('tells the invitee who invited them and shows the current step', () => {
    state({
      invite: {
        status: 'pending',
        organizationName: 'Acme Ltd',
        organizationLogoUrl: null,
        jobTitle: 'Product Designer',
        invitedEmail: 'ada@example.com',
        invitedByName: 'Hana Resources',
        expiresAt: null,
        inviteeExists: false,
      },
    })
    renderLayout()

    expect(
      screen.getByText('Acme Ltd has added you as Product Designer'),
    ).toBeTruthy()
    expect(screen.getByText('Invited by Hana Resources')).toBeTruthy()
    expect(screen.getByText('Current step')).toBeTruthy()
    expect(screen.getByText('Verify email')).toBeTruthy()
  })

  it.each([
    ['expired', 'This invite has expired'],
    ['accepted', 'This invite has already been used'],
  ])('explains a %s invite and hides the steps', (status, title) => {
    state({ invite: { status } })
    renderLayout()

    expect(screen.getByText(title)).toBeTruthy()
    expect(screen.queryByText('Current step')).toBeNull()
  })

  it('explains an unknown link', () => {
    state({ isInvalid: true })
    renderLayout()

    expect(screen.getByText("This invite link isn't valid")).toBeTruthy()
    expect(screen.queryByText('Current step')).toBeNull()
  })
})
