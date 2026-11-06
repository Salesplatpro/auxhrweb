import { act, renderHook } from '@testing-library/react'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../store/useAuthStore'
import { AUTH_TOKEN_KEY } from '../utils/authPersistence'
import { useLogin } from './useLogin'

const { loginRequestMock, notifyMock } = vi.hoisted(() => ({
  loginRequestMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('../services/authService', () => ({
  loginRequest: (...args: unknown[]) => loginRequestMock(...args),
}))

vi.mock('@/utils/toastNotifications', () => ({
  notify: (...args: unknown[]) => notifyMock(...args),
}))

const session = {
  user: { id: '1', email: 'talent@example.com', userRole: 'talent' },
  token: 'jwt-token',
}

describe('useLogin', () => {
  beforeEach(() => {
    loginRequestMock.mockReset()
    notifyMock.mockReset()
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({
      user: null,
      token: null,
      isLoggedIn: false,
      isSubmitting: false,
      error: null,
    })
  })

  it('persists the session when remember is true and does not send remember to the API', async () => {
    loginRequestMock.mockResolvedValue({ data: { data: session } })
    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.submitLogin({
        email: 'talent@example.com',
        password: 'Password1!',
        remember: true,
      })
    })

    expect(loginRequestMock).toHaveBeenCalledWith({
      email: 'talent@example.com',
      password: 'Password1!',
    })
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-token')
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(JSON.stringify(localStorage)).not.toContain('Password1!')
  })

  it('keeps the session in sessionStorage when remember is false', async () => {
    loginRequestMock.mockResolvedValue({ data: { data: session } })
    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.submitLogin({
        email: 'talent@example.com',
        password: 'Password1!',
        remember: false,
      })
    })

    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-token')
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })

  it('does not persist a token on login failure', async () => {
    const error = new AxiosError('Unauthorized')
    error.response = {
      status: 403,
      data: {
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Invalid email or password',
        },
      },
      statusText: 'Forbidden',
      headers: {},
      config: { headers: {} as never },
    }
    loginRequestMock.mockRejectedValue(error)
    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await expect(
        result.current.submitLogin({
          email: 'talent@example.com',
          password: 'wrong',
          remember: true,
        }),
      ).rejects.toBeTruthy()
    })

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(notifyMock).not.toHaveBeenCalledWith(
      'error',
      expect.anything(),
      expect.anything(),
    )
    expect(result.current.invalidCredentials).toBe(true)
  })

  it('does not treat a deactivated account as wrong credentials', async () => {
    const error = new AxiosError('Forbidden')
    error.response = {
      status: 403,
      data: {
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'This account has been deactivated',
        },
      },
      statusText: 'Forbidden',
      headers: {},
      config: { headers: {} as never },
    }
    loginRequestMock.mockRejectedValue(error)
    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await expect(
        result.current.submitLogin({
          email: 'talent@example.com',
          password: 'Password1!',
          remember: false,
        }),
      ).rejects.toBeTruthy()
    })

    expect(result.current.invalidCredentials).toBe(false)
    expect(useAuthStore.getState().error).toBe(
      'This account has been deactivated',
    )
  })

  it('clears the error and the field highlight together', async () => {
    const error = new AxiosError('Forbidden')
    error.response = {
      status: 403,
      data: {
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Invalid email or password',
        },
      },
      statusText: 'Forbidden',
      headers: {},
      config: { headers: {} as never },
    }
    loginRequestMock.mockRejectedValue(error)
    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current
        .submitLogin({
          email: 'talent@example.com',
          password: 'wrong',
          remember: false,
        })
        .catch(() => undefined)
    })
    act(() => result.current.clearError())

    expect(result.current.invalidCredentials).toBe(false)
    expect(useAuthStore.getState().error).toBeNull()
  })
})
