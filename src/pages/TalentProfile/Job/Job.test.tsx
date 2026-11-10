import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Job from './Job'

const { fetchJobsMock } = vi.hoisted(() => ({ fetchJobsMock: vi.fn() }))

vi.mock('@/redux/api/talent', () => ({
  useFetchJobsQuery: (args: unknown) => fetchJobsMock(args),
}))

vi.mock('./JobFilter', () => ({
  defaultFilterValues: {
    role: '',
    experienceLevel: '',
    workMode: [],
    location: { country: null, state: null, city: null },
  },
  JobFilter: () => <div />,
}))

vi.mock('./SingleJob', () => ({
  SingleJob: ({ jobTitle }: { jobTitle: string }) => <div>{jobTitle}</div>,
}))

const renderJobs = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Job />
    </MemoryRouter>,
  )

describe('Find Jobs keyword', () => {
  beforeEach(() => {
    fetchJobsMock.mockReset()
    fetchJobsMock.mockReturnValue({
      data: {
        data: {
          jobs: [{ id: 'j1', role: { name: 'UX Writer' }, workMode: [] }],
        },
      },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })
  })

  it('sends no keyword when the page opens without one', () => {
    renderJobs('/talentDashboard/job')

    expect(fetchJobsMock.mock.calls[0]?.[0]).toMatchObject({
      q: undefined,
      offset: 0,
    })
    expect(screen.queryByText('Clear search')).toBeNull()
  })

  it('sends a trimmed keyword from the header search and offers to clear it', () => {
    renderJobs('/talentDashboard/job?q=%20%20writer%20')

    expect(fetchJobsMock.mock.calls[0]?.[0]).toMatchObject({
      q: 'writer',
      offset: 0,
    })
    expect(screen.getByText('Showing 1 result for “writer”')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Clear search' }).getAttribute('href'),
    ).toBe('/talentDashboard/job')
  })

  it('ignores a keyword made only of spaces', () => {
    renderJobs('/talentDashboard/job?q=%20%20')

    expect(fetchJobsMock.mock.calls[0]?.[0]).toMatchObject({ q: undefined })
  })
})
