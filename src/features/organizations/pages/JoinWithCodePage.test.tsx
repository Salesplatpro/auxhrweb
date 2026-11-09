import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JoinWithCodePage from './JoinWithCodePage'

const { profileState, mutateMock, joinMock, navigateMock } = vi.hoisted(() => ({
  profileState: { profile: null as Record<string, unknown> | null },
  mutateMock: vi.fn(),
  joinMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: profileState.profile,
    isLoading: false,
    mutate: mutateMock,
  }),
}))

vi.mock('../services/organizationService', () => ({
  joinOrganizationWithAccessCode: joinMock,
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/join-team']}>
      <Routes>
        <Route path="/join-team" element={<JoinWithCodePage />} />
        <Route path="*" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )

const typeCode = (value: string) =>
  fireEvent.change(screen.getByLabelText('Access code'), {
    target: { value },
  })

describe('JoinWithCodePage', () => {
  beforeEach(() => {
    profileState.profile = { userRole: 'recruiter', activeOrganizationId: null }
    mutateMock.mockReset()
    joinMock.mockReset()
    navigateMock.mockReset()
  })

  it('formats the code as it is typed', () => {
    renderPage()
    typeCode('abcd2345')
    expect(
      (screen.getByLabelText('Access code') as HTMLInputElement).value,
    ).toBe('ABCD-2345')
  })

  it('asks for the full code before sending', async () => {
    renderPage()
    typeCode('abc')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Join company/ }))
    })
    expect(screen.getByText(/Enter the 8-character code/)).toBeTruthy()
    expect(joinMock).not.toHaveBeenCalled()
  })

  it('joins once, refreshes the account, then opens the dashboard', async () => {
    let finish: (value: unknown) => void = () => undefined
    joinMock.mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    )
    const order: string[] = []
    mutateMock.mockImplementation(async () => {
      order.push('refresh')
    })
    navigateMock.mockImplementation(() => order.push('navigate'))
    renderPage()
    typeCode('abcd2345')

    const button = screen.getByRole('button', { name: /Join company/ })
    fireEvent.click(button)
    fireEvent.click(button)
    await act(async () =>
      finish({ data: { organizationId: 'org-1', organizationName: 'Acme' } }),
    )

    expect(joinMock).toHaveBeenCalledTimes(1)
    expect(joinMock).toHaveBeenCalledWith('ABCD-2345')
    expect(order).toEqual(['refresh', 'navigate'])
    expect(navigateMock).toHaveBeenCalledWith('/recruiterDashboard/dashboard', {
      replace: true,
      state: { toast: { type: 'success', message: 'You joined Acme.' } },
    })
  })

  it('shows the server message and lets them try again', async () => {
    joinMock.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: "That code doesn't match a company." },
      },
    })
    renderPage()
    typeCode('abcd2345')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Join company/ }))
    })

    expect(screen.getByText("That code doesn't match a company.")).toBeTruthy()
    joinMock.mockResolvedValueOnce({
      data: { organizationId: 'org-1', organizationName: 'Acme' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Join company/ }))
    })
    expect(joinMock).toHaveBeenCalledTimes(2)
  })

  it('sends a recruiter who already has a company to the dashboard', () => {
    profileState.profile = {
      userRole: 'recruiter',
      activeOrganizationId: 'org-1',
    }
    renderPage()
    expect(screen.getByText('Dashboard')).toBeTruthy()
  })
})
