import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ResetPasswordPage } from './ResetPasswordPage'

const { submitValidateTokenMock, submitResetPasswordMock, navigateMock } =
  vi.hoisted(() => ({
    submitValidateTokenMock: vi.fn(),
    submitResetPasswordMock: vi.fn(),
    navigateMock: vi.fn(),
  }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../hooks/useResetPassword', () => ({
  useResetPassword: () => ({
    submitValidateToken: submitValidateTokenMock,
    submitResetPassword: submitResetPasswordMock,
    isValidating: false,
    isResetting: false,
  }),
}))

const renderAt = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<div>Forgot page</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    submitValidateTokenMock.mockReset()
    submitResetPasswordMock.mockReset()
    submitValidateTokenMock.mockResolvedValue({ data: { valid: true } })
    submitResetPasswordMock.mockResolvedValue({
      data: {
        user: { userRole: 'talent', emailVerifiedAt: '2026-11-01T00:00:00Z' },
        token: 'new-jwt',
      },
    })
  })

  it('shows the password form when the token is valid', async () => {
    renderAt('?token=valid-token')

    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )
    expect(screen.getByLabelText('Confirm new password')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeTruthy()
    expect(submitValidateTokenMock).toHaveBeenCalledWith('valid-token')
  })

  it('shows the expired message when the token is missing', () => {
    renderAt('')

    expect(screen.getByText('Reset link expired')).toBeTruthy()
    expect(screen.queryByLabelText('New password')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Request a new reset link' }),
    ).toBeTruthy()
    expect(submitValidateTokenMock).not.toHaveBeenCalled()
  })

  it('shows the expired message when the token is rejected', async () => {
    submitValidateTokenMock.mockRejectedValue({ response: { status: 401 } })
    renderAt('?token=expired-token')

    await waitFor(() =>
      expect(screen.getByText('Reset link expired')).toBeTruthy(),
    )
    expect(screen.queryByLabelText('New password')).toBeNull()
  })

  it('blocks submit when passwords do not match', async () => {
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'Mismatch1!' },
    })
    fireEvent.blur(screen.getByLabelText('Confirm new password'))
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() =>
      expect(screen.getByText('Passwords must match')).toBeTruthy(),
    )
    expect(submitResetPasswordMock).not.toHaveBeenCalled()
  })

  it('blocks submit when the password is too weak', async () => {
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'weak' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'weak' },
    })
    fireEvent.blur(screen.getByLabelText('New password'))
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() =>
      expect(
        screen.getByText('Password must be between 8 and 72 characters'),
      ).toBeTruthy(),
    )
    expect(submitResetPasswordMock).not.toHaveBeenCalled()
  })

  it('blocks submit when fields are empty', async () => {
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(submitResetPasswordMock).not.toHaveBeenCalled()
  })

  it('shows a retry screen when the link cannot be checked', async () => {
    submitValidateTokenMock.mockRejectedValueOnce(new Error('Network Error'))
    renderAt('?token=valid-token')

    await waitFor(() =>
      expect(screen.getByText("We couldn't check your link")).toBeTruthy(),
    )
    expect(screen.queryByText('Reset link expired')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )
    expect(submitValidateTokenMock).toHaveBeenCalledTimes(2)
  })

  it('moves to the expired screen when the link dies before submit', async () => {
    submitResetPasswordMock.mockRejectedValue(
      Object.assign(
        new Error('Password reset link is invalid or has expired'),
        {
          status: 401,
        },
      ),
    )
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Reset password' }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByText('Reset link expired')).toBeTruthy(),
    )
  })

  it('authenticates and redirects after a successful reset', async () => {
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Reset password' }).closest('form')!,
    )

    await waitFor(() =>
      expect(submitResetPasswordMock).toHaveBeenCalledWith({
        token: 'valid-token',
        password: 'NewPassword1!',
      }),
    )
    await waitFor(() =>
      expect(screen.getByText('Password updated')).toBeTruthy(),
    )
    expect(navigateMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(navigateMock).toHaveBeenCalledWith('/talentDashboard', {
      replace: true,
    })
    expect(submitValidateTokenMock).toHaveBeenCalledTimes(1)
  })

  it('sends an unverified user to the inbox screen after a reset', async () => {
    submitResetPasswordMock.mockResolvedValue({
      data: { user: { userRole: 'talent', emailVerifiedAt: null }, token: 't' },
    })
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Reset password' }).closest('form')!,
    )
    await waitFor(() =>
      expect(screen.getByText('Password updated')).toBeTruthy(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(navigateMock).toHaveBeenCalledWith('/verify-email', {
      replace: true,
    })
  })

  it('shows an API error when password reset fails', async () => {
    submitResetPasswordMock.mockRejectedValue(
      new Error('Failed to update password. Please try again.'),
    )
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Reset password' }).closest('form')!,
    )

    await waitFor(() =>
      expect(
        screen.getByText('Failed to update password. Please try again.'),
      ).toBeTruthy(),
    )
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('lists the real password rules as they are met', async () => {
    renderAt('?token=valid-token')
    await waitFor(() =>
      expect(screen.getByLabelText('New password')).toBeTruthy(),
    )
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'abcdef12' },
    })
    expect(
      screen.getByText('8 to 72 characters').parentElement?.textContent,
    ).toContain('met')
    expect(
      screen.getByText(/One symbol, such as/).parentElement?.textContent,
    ).toContain('not met')
  })
})
