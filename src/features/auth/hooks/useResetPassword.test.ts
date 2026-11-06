import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTH_TOKEN_KEY } from '../utils/authPersistence'
import { useResetPassword } from './useResetPassword'

const { resetPasswordRequestMock, validateResetTokenRequestMock, notifyMock } =
  vi.hoisted(() => ({
    resetPasswordRequestMock: vi.fn(),
    validateResetTokenRequestMock: vi.fn(),
    notifyMock: vi.fn(),
  }))

vi.mock('../services/authService', () => ({
  resetPasswordRequest: (...args: unknown[]) =>
    resetPasswordRequestMock(...args),
  validateResetTokenRequest: (...args: unknown[]) =>
    validateResetTokenRequestMock(...args),
}))

vi.mock('@/utils/toastNotifications', () => ({
  notify: (...args: unknown[]) => notifyMock(...args),
}))

describe('useResetPassword', () => {
  beforeEach(() => {
    resetPasswordRequestMock.mockReset()
    validateResetTokenRequestMock.mockReset()
    notifyMock.mockReset()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('validates a token without authenticating', async () => {
    validateResetTokenRequestMock.mockResolvedValue({
      data: { data: { valid: true } },
    })
    const { result } = renderHook(() => useResetPassword())

    await act(async () => {
      await result.current.submitValidateToken('reset-token')
    })

    expect(validateResetTokenRequestMock).toHaveBeenCalledWith({
      token: 'reset-token',
    })
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })

  it('stores the returned session after a successful reset', async () => {
    resetPasswordRequestMock.mockResolvedValue({
      data: {
        data: {
          user: { email: 'talent@example.com', userRole: 'talent' },
          token: 'new-jwt',
        },
      },
    })
    const { result } = renderHook(() => useResetPassword())

    await act(async () => {
      await result.current.submitResetPassword({
        token: 'reset-token',
        password: 'NewPassword1!',
      })
    })

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('new-jwt')
    expect(JSON.stringify(localStorage)).not.toContain('NewPassword1!')
    expect(JSON.stringify(localStorage)).not.toContain('reset-token')
  })

  it('keeps the status when the link was rejected on submit', async () => {
    resetPasswordRequestMock.mockRejectedValue({
      response: {
        status: 401,
        data: {
          error: { message: 'Password reset link is invalid or has expired' },
        },
      },
    })
    const { result } = renderHook(() => useResetPassword())

    await act(async () => {
      await expect(
        result.current.submitResetPassword({
          token: 'reset-token',
          password: 'NewPassword1!',
        }),
      ).rejects.toMatchObject({ status: 401 })
    })
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })
})
