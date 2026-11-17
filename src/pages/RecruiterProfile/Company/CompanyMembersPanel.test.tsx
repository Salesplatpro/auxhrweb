import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Organization,
  OrganizationMember,
} from '@/features/organizations/types'

import { CompanyMembersPanel } from './CompanyMembersPanel'

const {
  setCanManagePeopleMock,
  membersMock,
  saveAssignmentsMock,
  setTitleMock,
} = vi.hoisted(() => ({
  setCanManagePeopleMock: vi.fn(),
  membersMock: vi.fn(),
  saveAssignmentsMock: vi.fn(),
  setTitleMock: vi.fn(),
}))

vi.mock('@/features/organizations/hooks/useCompanyDetails', () => ({
  useSetMemberTitle: () => ({ setTitle: setTitleMock, isSaving: false }),
}))

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
  title: null,
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

const renderPanel = (seats?: { used: number; limit: number | null }) =>
  render(
    <CompanyMembersPanel
      organization={organization}
      seats={seats}
      onInvite={vi.fn()}
    />,
  )

const openMenuFor = (name: string) =>
  fireEvent.click(screen.getByLabelText(`Actions for ${name}`))

beforeEach(() => {
  vi.clearAllMocks()
  setCanManagePeopleMock.mockResolvedValue(true)
  setTitleMock.mockResolvedValue(true)
})

describe('CompanyMembersPanel — Can manage people', () => {
  it("keeps the owner's switch on and locked, and gives each recruiter a working one", () => {
    membersMock.mockReturnValue([owner, member()])
    renderPanel()

    const [ownerSwitch, memberSwitch] = screen.getAllByRole(
      'switch',
    ) as HTMLButtonElement[]
    expect(ownerSwitch!.getAttribute('aria-checked')).toBe('true')
    expect(ownerSwitch!.disabled).toBe(true)
    expect(memberSwitch!.getAttribute('aria-checked')).toBe('false')
    expect(memberSwitch!.disabled).toBe(false)
  })

  it('shows Owner for the owner and the job title or Member for others', () => {
    membersMock.mockReturnValue([
      owner,
      member(),
      member({ id: 'mem-2', title: 'HR lead' }),
    ])
    renderPanel({ used: 3, limit: 7 })

    expect(screen.getByText('Owner')).toBeTruthy()
    expect(screen.getAllByText('Member')).toHaveLength(2)
    expect(screen.getByText('HR lead')).toBeTruthy()
    expect(
      screen.getByText(
        '3 of 7 seats used · Only the owner can change people access',
      ),
    ).toBeTruthy()
  })

  it('leaves out the seats when usage could not load', () => {
    membersMock.mockReturnValue([owner])
    renderPanel()

    expect(
      screen.getByText('Only the owner can change people access'),
    ).toBeTruthy()
  })

  it('asks for confirmation before giving access', () => {
    membersMock.mockReturnValue([owner, member()])
    renderPanel()

    fireEvent.click(screen.getAllByRole('switch')[1]!)
    expect(screen.getByText('Let Hana Resources manage people?')).toBeTruthy()
    expect(setCanManagePeopleMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(setCanManagePeopleMock).toHaveBeenCalledWith(member(), true)
  })

  it('does nothing if the owner cancels the confirmation', () => {
    membersMock.mockReturnValue([owner, member()])
    renderPanel()

    fireEvent.click(screen.getAllByRole('switch')[1]!)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(setCanManagePeopleMock).not.toHaveBeenCalled()
  })

  it('takes access away straight away without a confirmation', () => {
    const hr = member({ canManagePeople: true })
    membersMock.mockReturnValue([owner, hr])
    renderPanel()

    fireEvent.click(screen.getAllByRole('switch')[1]!)
    expect(setCanManagePeopleMock).toHaveBeenCalledWith(hr, false)
  })

  it('lets the owner set a job title from the row menu', async () => {
    const teammate = member()
    membersMock.mockReturnValue([owner, teammate])
    renderPanel()

    openMenuFor('Hana Resources')
    fireEvent.click(screen.getByText('Set job title'))
    fireEvent.change(screen.getByLabelText('Job title'), {
      target: { value: 'HR lead' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(setTitleMock).toHaveBeenCalledWith(teammate, 'HR lead'),
    )
  })

  it("saves only the people whose ticks changed, and can't add an ended employee", async () => {
    saveAssignmentsMock.mockResolvedValue(undefined)
    const teammate = member()
    membersMock.mockReturnValue([owner, teammate])
    renderPanel()

    openMenuFor('Hana Resources')
    fireEvent.click(screen.getByText('Choose who they manage'))

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
