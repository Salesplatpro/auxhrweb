import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJobFeed } from './useCompanyDetails'

const { fetchFeedMock, updateOrganizationMock, notifyMock } = vi.hoisted(
  () => ({
    fetchFeedMock: vi.fn(),
    updateOrganizationMock: vi.fn(),
    notifyMock: vi.fn(),
  }),
)

vi.mock('../services/organizationService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/organizationService')>()),
  fetchJobFeed: fetchFeedMock,
  updateOrganization: updateOrganizationMock,
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ mutate: vi.fn() }),
}))

vi.mock('./useMyOrganizations', () => ({
  useMyOrganizations: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

const off = { enabled: false, url: null, openJobs: 2, updatedAt: null }

beforeEach(() => {
  vi.clearAllMocks()
  fetchFeedMock.mockResolvedValue(off)
})

describe('useJobFeed', () => {
  it('turns the feed on and shows the server state', async () => {
    const on = { ...off, enabled: true, url: 'https://api/x.xml' }
    updateOrganizationMock.mockResolvedValue({})
    const { result } = renderHook(() => useJobFeed('org-1'), { wrapper })
    await waitFor(() => expect(result.current.feed).toEqual(off))
    fetchFeedMock.mockResolvedValue(on)

    await act(async () => {
      expect(await result.current.setEnabled(true)).toBe(true)
    })

    expect(updateOrganizationMock).toHaveBeenCalledWith('org-1', {
      indeedFeedEnabled: true,
    })
    expect(result.current.feed).toEqual(on)
  })

  it('puts the switch back and says so when saving fails', async () => {
    updateOrganizationMock.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useJobFeed('org-1'), { wrapper })
    await waitFor(() => expect(result.current.feed).toEqual(off))

    await act(async () => {
      expect(await result.current.setEnabled(true)).toBe(false)
    })

    expect(result.current.feed?.enabled).toBe(false)
    expect(notifyMock).toHaveBeenCalledWith('error', expect.any(String))
  })
})
