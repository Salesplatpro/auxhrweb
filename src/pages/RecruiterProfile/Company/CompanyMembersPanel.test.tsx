import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Organization,
  OrganizationMember,
} from '@/features/organizations/types'

import { CompanyMembersPanel } from './CompanyMembersPanel'

const { setCanManagePeopleMock, membersMock } = vi.hoisted(() => ({
  setCanManagePeopleMock: vi.fn(),
  membersMock: vi.fn(),
}))

vi.mock('@/features/organizations/hooks/useOrganizationMembers', () => ({
  useOrganizationMembers: () => ({
    members: membersMock(),
    isLoading: false,
    refresh: vi.fn(),
  }),
}))

vi.mock('@/features/organizations/hooks/useSetMemberCanManagePeople', () => ({
  useSetMemberCanManagePeople: () => ({
    setCanManagePeople: setCanManagePeopleMock,
    pendingMemberId: null,
  }),
}))

const member = (
  overrides: Partial<OrganizationMember> = {},
): OrganizationMember => ({
  id: 'mem-1',
  userId: 'u-1',
  organizationId: 'org-1',
  workEmail: 'hana@acme.com',
  role: 'member',
  canManagePeople: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  user: {
    id: 'u-1',
    firstName: 'Hana',
    lastName: 'Resources',
    email: 'hana@acme.com',
  },
  ...overrides,
})

const owner = member({
  id: 'mem-0',
  userId: 'u-0',
  role: 'owner',
  canManagePeople: true,
  user: {
    id: 'u-0',
    firstName: 'Olu',
    lastName: 'Owner',
    email: 'olu@acme.com',
  },
})

const organization = { id: 'org-1', name: 'Acme Ltd' } as Organization

beforeEach(() => {
  vi.clearAllMocks()
  setCanManagePeopleMock.mockResolvedValue(true)
})

describe('CompanyMembersPanel — Can manage people', () => {
  it('shows a switch for each recruiter but not for the creator', () => {
    membersMock.mockReturnValue([owner, member()])
    render(<CompanyMembersPanel organization={organization} />)

    expect(screen.getAllByRole('switch')).toHaveLength(1)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false',
    )
  })

  it('asks for confirmation before giving access', () => {
    membersMock.mockReturnValue([owner, member()])
    render(<CompanyMembersPanel organization={organization} />)

    fireEvent.click(screen.getByRole('switch'))
    expect(
      screen.getByText(
        "This person will see everyone's pay, contracts and performance.",
      ),
    ).toBeTruthy()
    expect(setCanManagePeopleMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Allow access' }))
    expect(setCanManagePeopleMock).toHaveBeenCalledWith(member(), true)
  })

  it('does nothing if the owner cancels the confirmation', () => {
    membersMock.mockReturnValue([owner, member()])
    render(<CompanyMembersPanel organization={organization} />)

    fireEvent.click(screen.getByRole('switch'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(setCanManagePeopleMock).not.toHaveBeenCalled()
  })

  it('takes access away straight away without a confirmation', () => {
    const hr = member({ canManagePeople: true })
    membersMock.mockReturnValue([owner, hr])
    render(<CompanyMembersPanel organization={organization} />)

    fireEvent.click(screen.getByRole('switch'))
    expect(setCanManagePeopleMock).toHaveBeenCalledWith(hr, false)
  })
})
