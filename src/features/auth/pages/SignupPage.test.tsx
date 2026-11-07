import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../store/useAuthStore'
import { SignupPage } from './SignupPage'

vi.mock('../components/SignupForm', () => ({
  SignupForm: ({ accountType }: { accountType: string }) => (
    <p>Signup form for {accountType}</p>
  ),
}))

const LocationProbe = () => {
  const location = useLocation()
  return (
    <p data-testid="location">{`${location.pathname}${location.search}`}</p>
  )
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/register" element={<SignupPage />} />
        <Route
          path="/recruiterDashboard/dashboard"
          element={<p>Dashboard</p>}
        />
        <Route path="/verify-email" element={<p>Check your inbox</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )

describe('SignupPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ isLoggedIn: false, user: null, token: null })
  })

  it('starts on the role choice when logged out', () => {
    renderAt('/register')
    expect(screen.getByText('How will you use AuxHR?')).toBeTruthy()
    expect(screen.getByText('Step 1 of 3')).toBeTruthy()
  })

  it('puts the chosen role in the URL and keeps other params', () => {
    renderAt('/register?next=%2Fapply%2Fjob-1')
    fireEvent.click(screen.getByLabelText(/I'm looking for work/))
    fireEvent.click(screen.getByRole('button', { name: /Continue as talent/ }))

    expect(screen.getByText('Signup form for talent')).toBeTruthy()
    expect(screen.getByTestId('location').textContent).toBe(
      '/register?next=%2Fapply%2Fjob-1&role=talent',
    )
  })

  it('opens the account form straight from the role param', () => {
    renderAt('/register?role=recruiter')
    expect(screen.getByText('Signup form for recruiter')).toBeTruthy()
    expect(
      screen.getByText(
        'Start hiring with AuxHR. Your team can join you later.',
      ),
    ).toBeTruthy()
  })

  it('falls back to the role choice for an unknown role', () => {
    renderAt('/register?role=admin')
    expect(screen.getByText('How will you use AuxHR?')).toBeTruthy()
  })

  it('sends a logged-in unverified user to the inbox screen', () => {
    useAuthStore.setState({
      isLoggedIn: true,
      token: 'jwt',
      user: {
        userRole: 'recruiter',
        email: 'ada@acmeltd.com',
        emailVerifiedAt: null,
      },
    })
    renderAt('/register?role=recruiter')

    expect(screen.getByText('Check your inbox')).toBeTruthy()
  })

  it('moves a verified user on instead of showing signup', () => {
    useAuthStore.setState({
      isLoggedIn: true,
      token: 'jwt',
      user: {
        userRole: 'recruiter',
        emailVerifiedAt: '2026-11-06T10:00:00.000Z',
      },
    })
    renderAt('/register')

    expect(screen.getByText('Dashboard')).toBeTruthy()
  })
})
