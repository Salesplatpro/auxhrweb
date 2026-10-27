import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { SWRConfig, useSWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StaffMember } from '../types'
import { useStaffActions } from './useStaffActions'

const { serviceMock, notifyMock } = vi.hoisted(() => ({
  serviceMock: {
    createStaff: vi.fn(),
    updateStaff: vi.fn(),
    endStaff: vi.fn(),
    inviteStaff: vi.fn(),
    fetchStaffMember: vi.fn(),
  },
  notifyMock: vi.fn(),
}))

vi.mock('../services/peopleService', async () => {
  const actual = await vi.importActual<
    typeof import('../services/peopleService')
  >('../services/peopleService')
  return { ...actual, ...serviceMock }
})

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const staff = (overrides: Partial<StaffMember> = {}): StaffMember => ({
  id: 's-1',
  fullName: 'Ada Obi',
  email: 'ada@example.com',
  jobTitle: 'Designer',
  department: null,
  managerId: null,
  managerName: null,
  startDate: '2026-01-05',
  endDate: null,
  status: 'active',
  hiredThroughAuxhr: false,
  isExecutive: false,
  hasAccount: false,
  invite: {
    state: 'none',
    invitedByName: null,
    invitedAt: null,
    expiresAt: null,
    joinedAt: null,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
)

const setup = (organizationId: string | null = 'org-1') =>
  renderHook(
    () => ({
      actions: useStaffActions(organizationId),
      swr: useSWRConfig(),
    }),
    { wrapper },
  )

const payload = {
  fullName: 'Ada Obi',
  email: 'ada@example.com',
  jobTitle: 'Designer',
  startDate: '2026-01-05',
  isExecutive: false,
  sendInvite: true,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useStaffActions', () => {
  it('tells HR the invite went out', async () => {
    serviceMock.createStaff.mockResolvedValue({
      staff: staff(),
      inviteEmailSent: true,
    })
    const { result } = setup()

    await act(() => result.current.actions.addStaff(payload))
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      'Ada Obi added. Invite sent to ada@example.com.',
    )
  })

  it('warns, rather than claiming success, when the invite email failed', async () => {
    serviceMock.createStaff.mockResolvedValue({
      staff: staff(),
      inviteEmailSent: false,
    })
    const { result } = setup()

    await act(() => result.current.actions.addStaff(payload))
    expect(notifyMock).toHaveBeenCalledWith(
      'warning',
      expect.stringContaining("invite email didn't go out"),
      expect.anything(),
    )
    expect(notifyMock).not.toHaveBeenCalledWith('success', expect.anything())
  })

  it('does not mention an invite when none was requested', async () => {
    serviceMock.createStaff.mockResolvedValue({
      staff: staff(),
      inviteEmailSent: null,
    })
    const { result } = setup()

    await act(() =>
      result.current.actions.addStaff({ ...payload, sendInvite: false }),
    )
    expect(notifyMock).toHaveBeenCalledWith('success', 'Ada Obi added')
  })

  it('reports the server message and returns null when saving fails', async () => {
    serviceMock.createStaff.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Someone with this email is already on your staff',
          },
        },
      },
    })
    const { result } = setup()

    let outcome: unknown
    await act(async () => {
      outcome = await result.current.actions.addStaff(payload)
    })
    expect(outcome).toBeNull()
    expect(notifyMock).toHaveBeenCalledWith(
      'error',
      'Someone with this email is already on your staff',
    )
    expect(result.current.actions.isSaving).toBe(false)
  })

  it('does nothing without a company', async () => {
    const { result } = setup(null)

    await act(() => result.current.actions.addStaff(payload))
    expect(serviceMock.createStaff).not.toHaveBeenCalled()
  })

  it('caches the saved record from the response instead of re-fetching it', async () => {
    const saved = staff({ jobTitle: 'Lead Designer' })
    serviceMock.updateStaff.mockResolvedValue(saved)
    const { result } = setup()

    await act(() =>
      result.current.actions.saveStaff('s-1', { jobTitle: 'Lead Designer' }),
    )
    expect(
      result.current.swr.cache.get('/organizations/org-1/staff/s-1')?.data,
    ).toEqual(saved)
    expect(serviceMock.fetchStaffMember).not.toHaveBeenCalled()
  })

  it('warns when a resent invite could not be emailed', async () => {
    serviceMock.inviteStaff.mockResolvedValue({
      staff: staff(),
      inviteEmailSent: false,
    })
    const { result } = setup()

    await act(() => result.current.actions.sendInvite('s-1'))
    expect(notifyMock).toHaveBeenCalledWith(
      'warning',
      expect.any(String),
      expect.anything(),
    )
  })

  it('confirms when employment has ended', async () => {
    serviceMock.endStaff.mockResolvedValue(staff({ status: 'ended' }))
    const { result } = setup()

    await act(() => result.current.actions.endEmployment('s-1', '2026-04-01'))
    expect(serviceMock.endStaff).toHaveBeenCalledWith(
      'org-1',
      's-1',
      '2026-04-01',
    )
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      "Ada Obi's employment has ended",
    )
  })
})
