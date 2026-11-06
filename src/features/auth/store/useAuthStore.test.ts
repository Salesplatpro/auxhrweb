import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../utils/authPersistence'
import { useAuthStore } from './useAuthStore'

const user = {
  id: 'user-1',
  email: 'talent@example.com',
  userRole: 'talent' as const,
}

afterEach(() => {
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

describe('useAuthStore session persistence', () => {
  it('persists a remembered login to localStorage', () => {
    useAuthStore
      .getState()
      .setSession({ user, token: 'jwt' }, { persist: true })

    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt')
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(
      JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null').email,
    ).toBe(user.email)
  })

  it('keeps a non-remembered login in sessionStorage', () => {
    useAuthStore
      .getState()
      .setSession({ user, token: 'jwt' }, { persist: false })

    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt')
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })

  it('does not persist a session when login never succeeds', () => {
    useAuthStore.getState().setError('Invalid email or password')

    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })
})

describe('useAuthStore logout', () => {
  it('still resets the talent and recruiter caches', async () => {
    const { store } = await import('@/redux/store/store')
    const { talentApi } = await import('@/redux/api/talent')
    const { recruiterApi } = await import('@/redux/api/recruiter')
    const dispatch = vi.spyOn(store, 'dispatch')

    useAuthStore.getState().logout()

    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledTimes(2))
    expect(
      dispatch.mock.calls.map(([action]) => (action as { type: string }).type),
    ).toEqual([
      talentApi.util.resetApiState().type,
      recruiterApi.util.resetApiState().type,
    ])
    dispatch.mockRestore()
  })

  it('removes saved company drafts so they do not stay on the device', () => {
    localStorage.setItem(
      'auxhr:company-draft:user-1',
      JSON.stringify({ name: 'Acme Ltd' }),
    )

    useAuthStore.getState().logout()

    expect(localStorage.getItem('auxhr:company-draft:user-1')).toBeNull()
  })
})
