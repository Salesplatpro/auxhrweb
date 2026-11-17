import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  JobFeedStatus,
  Organization,
} from '@/features/organizations/types'

import { DepartmentsCard, JobFeedCard } from './CompanyCards'

const { feedState, setEnabledMock, addMock, removeMock, notifyMock } =
  vi.hoisted(() => ({
    feedState: { feed: null as JobFeedStatus | null, error: undefined },
    setEnabledMock: vi.fn(),
    addMock: vi.fn(),
    removeMock: vi.fn(),
    notifyMock: vi.fn(),
  }))

vi.mock('@/features/organizations/hooks/useCompanyDetails', () => ({
  useJobFeed: () => ({
    feed: feedState.feed,
    error: feedState.error,
    isLoading: false,
    isToggling: false,
    setEnabled: setEnabledMock,
  }),
  useDepartments: () => ({ add: addMock, remove: removeMock, isSaving: false }),
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
    render(<DepartmentsCard organization={organization} canEdit />)
    const input = screen.getByLabelText('New department') as HTMLInputElement

    fireEvent.change(input, { target: { value: '  Finance ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addMock).toHaveBeenCalledWith('Finance'))
    await waitFor(() => expect(input.value).toBe(''))
  })

  it('keeps the typed name when adding fails', async () => {
    addMock.mockResolvedValue(false)
    render(<DepartmentsCard organization={organization} canEdit />)
    const input = screen.getByLabelText('New department') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Engineering' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addMock).toHaveBeenCalled())
    expect(input.value).toBe('Engineering')
  })

  it('removes a department', () => {
    render(<DepartmentsCard organization={organization} canEdit />)

    fireEvent.click(screen.getByLabelText('Remove Sales'))

    expect(removeMock).toHaveBeenCalledWith('Sales')
  })

  it('shows the list without edit controls to people who cannot manage people', () => {
    render(<DepartmentsCard organization={organization} canEdit={false} />)

    expect(screen.getByText('Engineering')).toBeTruthy()
    expect(screen.queryByLabelText('Remove Sales')).toBeNull()
    expect(screen.queryByLabelText('New department')).toBeNull()
  })
})
