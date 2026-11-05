import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Organization,
  OrganizationMember,
} from '@/features/organizations/types'

import { CompanyMembersPanel } from './CompanyMembersPanel'

const { setCanManagePeopleMock, membersMock, saveAssignmentsMock } = vi.hoisted(
  () => ({
    setCanManagePeopleMock: vi.fn(),
    membersMock: vi.fn(),
    saveAssignmentsMock: vi.fn(),
  }),
)

vi.mock('@/features/people/hooks/useHrAssignments', () => ({
  useAssignedStaffIds: () => ({
    assignedStaffIds: ['s-1'],
    isLoading: false,
    hasError: false,
  }),
  useSaveHrAssignments: () => saveAssignmentsMock,
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffList: () => ({
    items: [
      {
        id: 's-1',
        fullName: 'Ada Obi',
        jobTitle: 'Designer',
        status: 'active',
      },
      {
        id: 's-2',
        fullName: 'Bayo Ade',
        jobTitle: 'Engineer',
        status: 'active',
      },
      { id: 's-3', fullName: 'Chi Eze', jobTitle: 'Writer', status: 'ended' },
    ],
    total: 3,
    isLoading: false,
    hasError: false,
  }),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: vi.fn() }))

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
        "This person will be able to add, edit and end employees and see everyone's performance. They won't see pay, benefits or contracts, which stay with the company's creator.",
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

  it('lets the creator assign themselves and their teammates', () => {
    membersMock.mockReturnValue([owner, member()])
    render(<CompanyMembersPanel organization={organization} />)

    expect(
      screen.getAllByRole('button', { name: /^Manage people for/ }),
    ).toHaveLength(2)
  })

  it("saves only the people whose ticks changed, and can't add an ended employee", async () => {
    saveAssignmentsMock.mockResolvedValue(undefined)
    const teammate = member()
    membersMock.mockReturnValue([owner, teammate])
    render(<CompanyMembersPanel organization={organization} />)

    const name = `${teammate.user.firstName} ${teammate.user.lastName}`.trim()
    fireEvent.click(
      screen.getByRole('button', { name: `Manage people for ${name}` }),
    )

    const save = screen.getByRole('button', {
      name: 'Save',
    }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
    expect(
      (screen.getByLabelText('Chi Eze') as HTMLInputElement).disabled,
    ).toBe(true)

    fireEvent.click(screen.getByLabelText('Ada Obi'))
    fireEvent.click(screen.getByLabelText('Bayo Ade'))
    fireEvent.click(save)

    await waitFor(() =>
      expect(saveAssignmentsMock).toHaveBeenCalledWith({
        assigneeUserId: teammate.userId,
        add: ['s-2'],
        remove: ['s-1'],
      }),
    )
  })
})
