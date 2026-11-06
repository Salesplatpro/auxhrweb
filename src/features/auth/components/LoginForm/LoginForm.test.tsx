import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../../store/useAuthStore'
import { LoginForm } from './LoginForm'

const { submitLoginMock, clearErrorMock, loginState } = vi.hoisted(() => ({
  submitLoginMock: vi.fn(),
  clearErrorMock: vi.fn(),
  loginState: { invalidCredentials: false },
}))

vi.mock('../../hooks/useLogin', () => ({
  useLogin: () => ({
    submitLogin: submitLoginMock,
    clearError: clearErrorMock,
    invalidCredentials: loginState.invalidCredentials,
    isLoading: false,
  }),
}))

const renderForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  )

describe('LoginForm', () => {
  beforeEach(() => {
    submitLoginMock.mockReset()
    submitLoginMock.mockResolvedValue(undefined)
    clearErrorMock.mockReset()
    loginState.invalidCredentials = false
    useAuthStore.setState({ error: null })
  })

  it('submits with remember=true when Remember me is checked', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'talent@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password1!' },
    })
    fireEvent.click(screen.getByLabelText('Remember me on this device'))
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() =>
      expect(submitLoginMock).toHaveBeenCalledWith({
        email: 'talent@example.com',
        password: 'Password1!',
        remember: true,
      }),
    )
  })

  it('submits with remember=false by default', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'talent@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() =>
      expect(submitLoginMock).toHaveBeenCalledWith({
        email: 'talent@example.com',
        password: 'Password1!',
        remember: false,
      }),
    )
  })

  it('links Forgot password to the forgot-password page', () => {
    renderForm()

    expect(
      screen
        .getByRole('link', { name: 'Forgot password?' })
        .getAttribute('href'),
    ).toBe('/forgot-password')
  })

  it('does not submit when email is empty', async () => {
    renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() =>
      expect(screen.getByText('Email is required')).toBeTruthy(),
    )
    expect(submitLoginMock).not.toHaveBeenCalled()
  })

  it('locks the invited email and hides signup when used on a company invite', () => {
    render(
      <MemoryRouter>
        <LoginForm lockedEmail="joiner@invitecorp.com" hideSignupLink />
      </MemoryRouter>,
    )

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      'joiner@invitecorp.com',
    )
    expect(screen.getByLabelText('Email')).toHaveProperty('disabled', true)
    expect(screen.queryByRole('link', { name: 'Sign up' })).toBeNull()
  })

  it('highlights both fields with safe wording when credentials are wrong', () => {
    loginState.invalidCredentials = true
    useAuthStore.setState({ error: 'Invalid email or password' })
    renderForm()

    expect(screen.getByText('Invalid email or password')).toBeTruthy()
    expect(
      screen.getByText(
        'Check your details and try again, or reset your password.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Check your password and try again.')).toBeTruthy()
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(screen.queryByText(/doesn't match this email/)).toBeNull()
  })

  it('shows other errors in the banner only', () => {
    useAuthStore.setState({ error: 'This account has been deactivated' })
    renderForm()

    expect(screen.getByText('This account has been deactivated')).toBeTruthy()
    expect(
      screen.getByLabelText('Email').getAttribute('aria-invalid'),
    ).toBeNull()
    expect(screen.queryByText('Check your password and try again.')).toBeNull()
  })

  it('clears the error when a field changes', () => {
    useAuthStore.setState({ error: 'Invalid email or password' })
    renderForm()

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'x' },
    })
    expect(clearErrorMock).toHaveBeenCalled()
  })
})
