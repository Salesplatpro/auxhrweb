import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  Department,
  JobFeedStatus,
  Organization,
} from '@/features/organizations/types'

import { DepartmentsCard, JobFeedCard } from './CompanyCards'

const {
  feedState,
  setEnabledMock,
  addMock,
  removeMock,
  setHeadMock,
  notifyMock,
  departmentState,
} = vi.hoisted(() => ({
  feedState: { feed: null as JobFeedStatus | null, error: undefined },
  setEnabledMock: vi.fn(),
  addMock: vi.fn(),
  removeMock: vi.fn(),
  setHeadMock: vi.fn(),
  notifyMock: vi.fn(),
  departmentState: { departments: [] as Department[] },
}))

vi.mock('@/features/organizations/hooks/useCompanyDetails', () => ({
  useJobFeed: () => ({
    feed: feedState.feed,
    error: feedState.error,
    isLoading: false,
    isToggling: false,
    setEnabled: setEnabledMock,
  }),
  useDepartments: () => ({
    add: addMock,
    remove: removeMock,
    setHead: setHeadMock,
    isSaving: false,
  }),
  useDepartmentList: () => ({ departments: departmentState.departments }),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useStaffOptions: () => ({
    options: [{ id: 'staff-1', fullName: 'Ada Obi', jobTitle: 'Lead' }],
  }),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const organization = {
  id: 'org-1',
  name: 'Kosana Tech Ltd',
  departments: ['Engineering', 'Sales'],
} as Organization

const liveFeed: JobFeedStatus = {
  enabled: true,
  url: 'https://api.auxhr.com/v1/feed/kosana-tech-ltd.xml',
  openJobs: 3,
  updatedAt: '2026-11-17T10:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  feedState.feed = liveFeed
  departmentState.departments = [
    { id: 'd-1', name: 'Engineering', head: null, staffCount: 0 },
    {
      id: 'd-2',
      name: 'Sales',
      head: { staffId: 'staff-1', fullName: 'Ada Obi' },
      staffCount: 4,
    },
  ]
  addMock.mockResolvedValue(true)
})

describe('JobFeedCard', () => {
  it('shows the link and open job count while the feed is on', () => {
    render(<JobFeedCard organization={organization} canEdit />)

    expect((screen.getByLabelText('Feed link') as HTMLInputElement).value).toBe(
      liveFeed.url,
    )
    expect(screen.getByText('3 open jobs in the feed')).toBeTruthy()
  })

  it('hides the link and copy button while the feed is off', () => {
    feedState.feed = { ...liveFeed, enabled: false, url: null }
    render(<JobFeedCard organization={organization} canEdit />)

    expect(screen.queryByLabelText('Feed link')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull()
  })

  it('copies the link and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<JobFeedCard organization={organization} canEdit />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(liveFeed.url))
    expect(notifyMock).toHaveBeenCalledWith(
      'success',
      'Feed link copied',
      expect.anything(),
    )
  })

  it('selects the link for a manual copy when the clipboard is blocked', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    render(<JobFeedCard organization={organization} canEdit />)
    const input = screen.getByLabelText('Feed link') as HTMLInputElement

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'info',
        'Press ⌘C to copy the selected link',
      ),
    )
    expect(input.selectionEnd! - input.selectionStart!).toBe(
      liveFeed.url!.length,
    )
  })

  it('lets the owner switch it off, but not someone else', () => {
    const { unmount } = render(
      <JobFeedCard organization={organization} canEdit />,
    )
    fireEvent.click(screen.getByRole('switch'))
    expect(setEnabledMock).toHaveBeenCalledWith(false)
    unmount()

    render(<JobFeedCard organization={organization} canEdit={false} />)
    expect((screen.getByRole('switch') as HTMLButtonElement).disabled).toBe(
      true,
    )
  })
})

describe('DepartmentsCard', () => {
  it('adds a trimmed department and clears the box', async () => {
    render(
      <DepartmentsCard organization={organization} canEdit canAssignHeads />,
    )
    const input = screen.getByLabelText('New department') as HTMLInputElement

    fireEvent.change(input, { target: { value: '  Finance ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addMock).toHaveBeenCalledWith('Finance'))
    await waitFor(() => expect(input.value).toBe(''))
  })

  it('keeps the typed name when adding fails', async () => {
    addMock.mockResolvedValue(false)
    render(
      <DepartmentsCard organization={organization} canEdit canAssignHeads />,
    )
    const input = screen.getByLabelText('New department') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Engineering' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addMock).toHaveBeenCalled())
    expect(input.value).toBe('Engineering')
  })

  it('removes an empty department straight away, and asks first when people are in it', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <DepartmentsCard organization={organization} canEdit canAssignHeads />,
    )

    fireEvent.click(screen.getByLabelText('Remove Engineering'))
    fireEvent.click(screen.getByLabelText('Remove Sales'))

    expect(removeMock).toHaveBeenCalledTimes(1)
    expect(removeMock).toHaveBeenCalledWith('Engineering')
    expect(confirm).toHaveBeenCalledWith(
      '4 people will have no department. Remove Sales?',
    )
    confirm.mockRestore()
  })

  it('lets only the creator pick heads; others see who the head is', () => {
    const { unmount } = render(
      <DepartmentsCard organization={organization} canEdit canAssignHeads />,
    )
    expect(screen.getByText('Head of Sales')).toBeTruthy()
    unmount()

    render(
      <DepartmentsCard
        organization={organization}
        canEdit
        canAssignHeads={false}
      />,
    )
    expect(screen.queryByText('Head of Sales')).toBeNull()
    expect(screen.getByText('Head: Ada Obi')).toBeTruthy()
  })

  it('shows the list without edit controls to people who cannot manage people', () => {
    render(
      <DepartmentsCard
        organization={organization}
        canEdit={false}
        canAssignHeads={false}
      />,
    )

    expect(screen.getByText('Engineering')).toBeTruthy()
    expect(screen.queryByLabelText('Remove Sales')).toBeNull()
    expect(screen.queryByLabelText('New department')).toBeNull()
  })
})
