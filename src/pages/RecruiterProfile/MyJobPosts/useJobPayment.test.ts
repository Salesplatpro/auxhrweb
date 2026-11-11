import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useJobPayment } from './useJobPayment'

const { activateJobPaymentMock, notifyMock } = vi.hoisted(() => ({
  activateJobPaymentMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/redux/api/recruiter', () => ({
  useActivateJobPaymentMutation: () => [activateJobPaymentMock],
}))

vi.mock('@/utils/toastNotifications', () => ({
  notify: (...args: unknown[]) => notifyMock(...args),
}))

describe('useJobPayment', () => {
  const assignMock = vi.fn()
  const originalLocation = window.location

  beforeEach(() => {
    activateJobPaymentMock.mockReset()
    notifyMock.mockReset()
    assignMock.mockReset()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('redirects to the checkout link and marks the job as paying', async () => {
    activateJobPaymentMock.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ data: { link: 'https://checkout.example/abc' } }),
    })
    const { result } = renderHook(() => useJobPayment())

    await act(() => result.current.payForJob('job-1'))

    expect(activateJobPaymentMock).toHaveBeenCalledWith('job-1')
    expect(assignMock).toHaveBeenCalledWith('https://checkout.example/abc')
    expect(result.current.payingJobId).toBe('job-1')
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('shows the server’s error and clears the paying state when checkout is refused', async () => {
    activateJobPaymentMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { message: 'Your plan still has job slots available' },
        }),
    })
    const { result } = renderHook(() => useJobPayment())

    await act(() => result.current.payForJob('job-1'))

    expect(assignMock).not.toHaveBeenCalled()
    expect(result.current.payingJobId).toBeNull()
    expect(notifyMock).toHaveBeenCalledWith('error', expect.any(String))
  })

  it('treats a response without a link as a failure', async () => {
    activateJobPaymentMock.mockReturnValue({
      unwrap: () => Promise.resolve({ data: {} }),
    })
    const { result } = renderHook(() => useJobPayment())

    await act(() => result.current.payForJob('job-1'))

    expect(assignMock).not.toHaveBeenCalled()
    expect(result.current.payingJobId).toBeNull()
    expect(notifyMock).toHaveBeenCalledWith('error', expect.any(String))
  })
})
