import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/store/useAuthStore'

import JoinStaffPage from './JoinStaffPage'

const { previewMock, acceptMock, passwordMock, profileMock } = vi.hoisted(
  () => ({
    previewMock: vi.fn(),
    acceptMock: vi.fn(),
    passwordMock: vi.fn(),
    profileMock: vi.fn(),
  }),
)

vi.mock('@/features/people/services/peopleService', () => ({
  fetchStaffInvitePreview: previewMock,
  acceptStaffInvite: acceptMock,
  joinStaffWithPassword: passwordMock,
}))

vi.mock('@/features/profile/services/profileService', () => ({
  PROFILE_ENDPOINT: '/user/me',
  fetchProfile: profileMock,
}))

const TOKEN = 'a'.repeat(64)

const pending = (inviteeExists: boolean) => ({
  status: 'pending',
  organizationName: 'Kosana Tech Ltd',
  organizationLogoUrl: null,
  jobTitle: 'Data Analyst',
  invitedEmail: 'kelechi@example.com',
  invitedByName: 'Philip Kosana',
  expiresAt: null,
  inviteeExists,
})

const joined = {
  organizationName: 'Kosana Tech Ltd',
  jobTitle: 'Data Analyst',
  joinedAt: '2026-11-18T09:00:00.000Z',
  documentsToSign: 2,
  openTasks: 4,
  hasPay: true,
  hasShareOptions: true,
}

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter initialEntries={[`/join-staff/${TOKEN}`]}>
        <Routes>
          <Route path="/join-staff/:token" element={<JoinStaffPage />} />
          <Route
            path="/talentDashboard/my-work"
            element={<p>My work page</p>}
          />
        </Routes>
      </MemoryRouter>
    </SWRConfig>,
  )

const typePassword = (value: string) => {
  fireEvent.change(screen.getByPlaceholderText('Choose a password'), {
    target: { value },
  })
  fireEvent.change(screen.getByPlaceholderText('Type it again'), {
    target: { value },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ token: null, user: null, isLoggedIn: false })
  profileMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
})

describe('JoinStaffPage', () => {
  it('sets a password, joins and lists what is waiting in My work', async () => {
    previewMock.mockResolvedValue(pending(false))
    passwordMock.mockResolvedValue({
      user: { id: 'u1', email: 'kelechi@example.com', userRole: 'talent' },
      token: 'jwt',
      joined,
    })
    renderPage()

    expect(
      await screen.findByText('Set a password to join Kosana Tech Ltd'),
    ).toBeTruthy()
    typePassword('Password1!')
    fireEvent.click(
      screen.getByRole('button', { name: 'Set password and accept' }),
    )

    expect(
      await screen.findByText("You've joined Kosana Tech Ltd"),
    ).toBeTruthy()
    expect(passwordMock).toHaveBeenCalledWith(TOKEN, 'Password1!')
    expect(useAuthStore.getState().token).toBe('jwt')
    expect(screen.getByText('2 documents to sign')).toBeTruthy()
    expect(screen.getByText('4 first-week tasks')).toBeTruthy()
    expect(screen.getByText('Your pay and share options')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Go to My work' }))
    expect(await screen.findByText('My work page')).toBeTruthy()
  })

  it('switches to log in when an account already exists for the email', async () => {
    previewMock.mockResolvedValue(pending(false))
    passwordMock.mockRejectedValue({
      response: {
        status: 409,
        data: { error: { code: 'ACCOUNT_EXISTS', message: 'Log in to join.' } },
      },
    })
    renderPage()

    await screen.findByText('Set a password to join Kosana Tech Ltd')
    typePassword('Password1!')
    fireEvent.click(
      screen.getByRole('button', { name: 'Set password and accept' }),
    )

    expect(
      await screen.findByText('Log in to join Kosana Tech Ltd'),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Log in and accept' }),
    ).toBeTruthy()
  })

  it('shows an accept button again when joining fails, and retries', async () => {
    previewMock.mockResolvedValue(pending(true))
    useAuthStore.setState({
      token: 'jwt',
      user: { email: 'kelechi@example.com', userRole: 'talent' } as never,
      isLoggedIn: true,
    })
    acceptMock.mockRejectedValueOnce(new Error('Network down'))
    acceptMock.mockResolvedValueOnce(joined)
    renderPage()

    const button = await screen.findByRole('button', {
      name: 'Accept and join',
    })
    fireEvent.click(button)
    await waitFor(() => expect(acceptMock).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: 'Accept and join' }))
    expect(
      await screen.findByText("You've joined Kosana Tech Ltd"),
    ).toBeTruthy()
  })

  it('reopens the joined screen for a signed-in person after a refresh', async () => {
    previewMock.mockResolvedValue({ status: 'accepted' })
    acceptMock.mockResolvedValue(joined)
    useAuthStore.setState({
      token: 'jwt',
      user: { email: 'kelechi@example.com', userRole: 'talent' } as never,
      isLoggedIn: true,
    })
    renderPage()

    expect(
      await screen.findByText("You've joined Kosana Tech Ltd"),
    ).toBeTruthy()
    expect(acceptMock).toHaveBeenCalledTimes(1)
  })

  it('tells an expired invite who to ask and when it ran out', async () => {
    previewMock.mockResolvedValue({
      status: 'expired',
      organizationName: 'Kosana Tech Ltd',
      organizationLogoUrl: null,
      invitedEmail: 'kelechi@example.com',
      invitedAt: '2026-11-03T09:05:00.000Z',
      expiresAt: '2026-11-10T09:05:00.000Z',
      contactEmail: 'philip@kosanatech.ng',
    })
    renderPage()

    expect(await screen.findByText('This invite has expired')).toBeTruthy()
    expect(
      screen.getByText('Sent to kelechi@example.com on 3 Nov · expired 10 Nov'),
    ).toBeTruthy()
    const email = screen.getByRole('link', { name: 'Email Kosana Tech Ltd' })
    expect(email.getAttribute('href')).toMatch(/^mailto:philip@kosanatech\.ng/)
  })
})
