import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { SWRConfig, useSWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OrganizationMember } from '../types'
import { organizationMembersKey } from './useOrganizationMembers'
import { useSetMemberCanManagePeople } from './useSetMemberCanManagePeople'

const { updateMock, notifyMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('../services/organizationService', () => ({
  updateMemberCanManagePeople: updateMock,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const member = (id: string, canManagePeople: boolean): OrganizationMember => ({
  id,
  userId: `u-${id}`,
  organizationId: 'org-1',
  workEmail: `${id}@acme.com`,
  role: 'member',
  canManagePeople,
  createdAt: '2026-01-01T00:00:00.000Z',
  user: {
    id: `u-${id}`,
    firstName: 'Hana',
    lastName: id,
    email: `${id}@acme.com`,
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
)

const setup = async () => {
  const hook = renderHook(
    () => ({
      access: useSetMemberCanManagePeople('org-1'),
      swr: useSWRConfig(),
    }),
    { wrapper },
  )
  await act(() =>
    hook.result.current.swr.mutate(
      organizationMembersKey('org-1'),
      [member('a', false), member('b', true)],
      { revalidate: false },
    ),
  )
  return hook
}

const cached = (hook: Awaited<ReturnType<typeof setup>>) =>
  hook.result.current.swr.cache.get(organizationMembersKey('org-1'))
    ?.data as OrganizationMember[]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSetMemberCanManagePeople', () => {
  it('updates only that member in the cached list', async () => {
    updateMock.mockResolvedValue(undefined)
    const hook = await setup()

    let ok = false
    await act(async () => {
      ok = await hook.result.current.access.setCanManagePeople(
        member('a', false),
        true,
      )
    })

    expect(ok).toBe(true)
    expect(updateMock).toHaveBeenCalledWith('org-1', 'a', true)
    expect(cached(hook).map((m) => [m.id, m.canManagePeople])).toEqual([
      ['a', true],
      ['b', true],
    ])
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      'Hana a can now manage people',
    )
  })

  it('puts the switch back and says why when the server refuses', async () => {
    updateMock.mockRejectedValue({
      response: {
        data: { error: { message: 'Only the company owner can do this' } },
      },
    })
    const hook = await setup()

    let ok = true
    await act(async () => {
      ok = await hook.result.current.access.setCanManagePeople(
        member('a', false),
        true,
      )
    })

    expect(ok).toBe(false)
    expect(cached(hook).map((m) => [m.id, m.canManagePeople])).toEqual([
      ['a', false],
      ['b', true],
    ])
    expect(notifyMock).toHaveBeenCalledWith(
      'error',
      'Only the company owner can do this',
    )
    expect(hook.result.current.access.pendingMemberId).toBeNull()
  })
})
