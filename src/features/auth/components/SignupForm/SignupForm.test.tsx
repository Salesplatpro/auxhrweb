import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SignupForm } from './SignupForm'

const { submitSignupMock } = vi.hoisted(() => ({
  submitSignupMock: vi.fn(),
}))

vi.mock('../../hooks/useSignup', () => ({
  useSignup: () => ({
    submitSignup: submitSignupMock,
    clearError: vi.fn(),
    isLoading: false,
  }),
}))

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('SignupForm', () => {
  beforeEach(() => {
    submitSignupMock.mockReset()
    submitSignupMock.mockResolvedValue({})
  })

  it('sends the role and the keep-me-signed-in choice', async () => {
    render(
      <MemoryRouter>
        <SignupForm accountType="recruiter" />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Work email')).toBeTruthy()

    fill('First name', ' Ada ')
    fill('Last name', 'Obi')
    fill('Work email', 'ada@acmeltd.com')
    fill('Password', 'Acme2025!')
    fill('Confirm password', 'Acme2025!')
    fireEvent.click(screen.getByLabelText('Keep me signed in'))
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }))

    await waitFor(() =>
      expect(submitSignupMock).toHaveBeenCalledWith({
        firstName: 'Ada',
        lastName: 'Obi',
        email: 'ada@acmeltd.com',
        password: 'Acme2025!',
        remember: false,
        userType: 'recruiter',
      }),
    )
  })

  it('does not submit a password the backend would refuse', async () => {
    render(
      <MemoryRouter>
        <SignupForm accountType="talent" />
      </MemoryRouter>,
    )
    fill('First name', 'Tunde')
    fill('Last name', 'Bakare')
    fill('Email', 'tunde@example.com')
    fill('Password', 'abc1!')
    fill('Confirm password', 'abc1!')
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }))

    await waitFor(() =>
      expect(
        screen.getByText('Password must be between 8 and 72 characters'),
      ).toBeTruthy(),
    )
    expect(submitSignupMock).not.toHaveBeenCalled()
  })
})
