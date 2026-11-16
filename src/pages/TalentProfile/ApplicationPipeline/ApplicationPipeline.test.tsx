import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApplicationPipeline } from './ApplicationPipeline'

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))

vi.mock('@/redux/api/talent', () => ({
  useAllJobApplicationsQuery: (args: unknown) => listMock(args),
}))

describe('Applications list', () => {
  afterEach(cleanup)

  beforeEach(() => {
    listMock.mockReset()
    listMock.mockReturnValue({
      isLoading: false,
      data: {
        total: 1,
        counts: { all: 6, needs_you: 2, in_progress: 3, closed: 1 },
        applications: [
          {
            id: 'app1',
            createdAt: '2026-11-03T10:00:00Z',
            candidateStatus: 'interview_to_do',
            group: 'needs_you',
            job: {
              id: 'job1',
              role: { name: 'Product Designer' },
              organization: { name: 'Kosana Tech Ltd' },
            },
          },
        ],
      },
    })
  })

  const renderList = () =>
    render(
      <MemoryRouter>
        <ApplicationPipeline />
      </MemoryRouter>,
    )

  it('shows the server’s counts for every group and each application’s status', () => {
    renderList()

    expect(screen.getByText('6 applications · 2 need you')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Needs you 2' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Closed 1' })).toBeTruthy()
    expect(screen.getByText('Interview to do')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'View pipeline' }).getAttribute('href'),
    ).toBe('/talentDashboard/applications/app1')
  })

  it('asks the server for one group at a time', () => {
    renderList()
    expect(listMock).toHaveBeenLastCalledWith(undefined)

    fireEvent.click(screen.getByRole('button', { name: 'In progress 3' }))

    expect(listMock).toHaveBeenLastCalledWith({ group: 'in_progress' })
  })
})
