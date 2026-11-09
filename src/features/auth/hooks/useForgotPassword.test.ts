import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useForgotPassword } from './useForgotPassword'

const { requestPasswordResetMock } = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn(),
}))

vi.mock('../services/authService', () => ({
  requestPasswordReset: (...args: unknown[]) =>
    requestPasswordResetMock(...args),
}))

describe('useForgotPassword', () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset()
  })

  it('sends the reset request', async () => {
    requestPasswordResetMock.mockResolvedValue({
      data: { status: true, message: 'ok' },
    })
    const { result } = renderHook(() => useForgotPassword())

    await act(async () => {
      await result.current.submitForgotPassword({
        email: 'talent@example.com',
      })
    })

    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: 'talent@example.com',
    })
  })

  it('surfaces the API message and keeps the status', async () => {
    requestPasswordResetMock.mockRejectedValue({
      response: {
        status: 429,
        data: { message: 'Too many attempts, please try again later.' },
      },
    })
    const { result } = renderHook(() => useForgotPassword())

    await act(async () => {
      await expect(
        result.current.submitForgotPassword({ email: 'talent@example.com' }),
      ).rejects.toMatchObject({
        message: 'Too many attempts, please try again later.',
        status: 429,
      })
    })
  })
})
