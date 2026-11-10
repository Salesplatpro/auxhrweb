import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRecruiterNavCounts } from './useRecruiterNavCounts'

const state = vi.hoisted(() => ({
  access: { isOwner: false, canManagePeople: false },
  staffList: vi.fn(),
  swrKey: undefined as unknown,
}))

vi.mock('swr', () => ({
  default: (key: unknown) => {
    state.swrKey = key
    return { data: { applications: 48, shortlisted: 24 } }
  },
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { activeOrganizationId: 'org-1' } }),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => state.access,
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffList: (organizationId: string | null) => {
    state.staffList(organizationId)
    return { total: 9 }
  },
}))

vi.mock('@/features/organizations/hooks/useOrganizationUsage', () => ({
  useOrganizationUsage: () => ({
    usage: { meters: [{ key: 'job_listings', used: 12, limit: 15 }] },
  }),
}))

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => ({ unReadCount: 6 }),
}))

vi.mock('@/features/messaging/hooks/useChatSessions', () => ({
  useChatSessions: () => ({
    sessions: [
      { threads: [{ unreadCount: 2 }, { unreadCount: 0 }] },
      { threads: [{ unreadCount: 1 }] },
    ],
  }),
}))

describe('useRecruiterNavCounts', () => {
  beforeEach(() => {
    state.access = { isOwner: false, canManagePeople: false }
    state.staffList.mockReset()
  })

  it('keys the counts by the active company so a switch never shows the old one', () => {
    renderHook(() => useRecruiterNavCounts())

    expect(state.swrKey).toEqual(['/recruiter/dashboard/counts', 'org-1'])
  })

  it('never asks for staff without People access', () => {
    const { result } = renderHook(() => useRecruiterNavCounts())

    expect(state.staffList).toHaveBeenCalledWith(null)
    expect(result.current.showPeople).toBe(false)
    expect(result.current.counts.employees).toBeUndefined()
  })

  it('counts staff for people managers and sums unread chat threads', () => {
    state.access = { isOwner: false, canManagePeople: true }
    const { result } = renderHook(() => useRecruiterNavCounts())

    expect(state.staffList).toHaveBeenCalledWith('org-1')
    expect(result.current.counts).toEqual({
      jobPosts: 12,
      applications: 48,
      shortlist: 24,
      employees: 9,
      notifications: 6,
      chats: 3,
    })
  })
})
