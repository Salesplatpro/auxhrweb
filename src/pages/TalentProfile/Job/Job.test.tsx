import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Job from './Job'

const { fetchJobsMock, saveJobMock, notifyMock } = vi.hoisted(() => ({
  fetchJobsMock: vi.fn(),
  saveJobMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/redux/api/talent', () => ({
  useFetchJobsQuery: (args: unknown) => fetchJobsMock(args),
  useSaveJobMutation: () => [saveJobMock, { isLoading: false }],
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { locationState: 'Lagos' } }),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const JOB = {
  id: 'j1',
  role: { name: 'Product Designer' },
  createdAt: new Date().toISOString(),
  experienceLevel: '4-6 years',
  employmentType: 'full_time',
  workMode: ['hybrid'],
  locationCity: 'Lekki',
  locationState: 'Lagos',
  minSalary: 300000,
  maxSalary: 380000,
  currency: 'NGN',
  compensationPeriod: 'monthly',
  isSaved: false,
  organization: { name: 'Kosana Tech Ltd' },
}

const renderJobs = (path = '/talentDashboard/job') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Job />
    </MemoryRouter>,
  )

const lastArgs = () => fetchJobsMock.mock.calls.at(-1)?.[0]

describe('Find Jobs', () => {
  afterEach(cleanup)

  beforeEach(() => {
    fetchJobsMock.mockReset()
    saveJobMock.mockReset()
    notifyMock.mockReset()
    fetchJobsMock.mockReturnValue({
      data: { data: { jobs: [JOB], total: 24 } },
      error: undefined,
      isLoading: false,
      isFetching: false,
    })
  })

  it('searches the header keyword in the talent’s state and says how many jobs match', () => {
    renderJobs('/talentDashboard/job?q=%20Product%20designer%20')

    expect(lastArgs()).toMatchObject({
      q: 'Product designer',
      state: 'Lagos',
      offset: 0,
    })
    expect(
      screen.getByText('24 jobs match “Product designer” in Lagos'),
    ).toBeTruthy()
  })

  it('shows each job with its company, place, pay and tags', () => {
    renderJobs()

    expect(
      screen.getByText('Kosana Tech Ltd · Lekki, Lagos · Hybrid'),
    ).toBeTruthy()
    expect(screen.getByText('₦300k–₦380k / month')).toBeTruthy()
    expect(screen.getAllByText('Full time')).toHaveLength(2)
    expect(screen.getAllByText('Mid-level')).toHaveLength(2)
  })

  it('turns each filter chip into its search filter', () => {
    renderJobs()

    for (const label of [
      'Hybrid',
      'On-site',
      'Mid-level',
      '₦300k+ / month',
      'Full time',
      'Posted this week',
    ]) {
      fireEvent.click(screen.getAllByRole('button', { name: label })[0]!)
    }

    expect(lastArgs()).toMatchObject({
      workMode: 'hybrid,onSite',
      experienceLevel: '4-6 years',
      minMonthlySalary: 300000,
      employmentType: 'full_time',
      postedWithin: 'week',
      offset: 0,
    })
  })

  it('puts the star back and says so when saving fails', async () => {
    saveJobMock.mockReturnValue({
      unwrap: () => Promise.reject(new Error('down')),
    })
    renderJobs()

    const star = screen.getByRole('button', { name: 'Save job' })
    fireEvent.click(star)

    await waitFor(() => expect(notifyMock).toHaveBeenCalled())
    expect(saveJobMock).toHaveBeenCalledWith({ jobId: 'j1', saved: true })
    expect(
      screen
        .getByRole('button', { name: 'Save job' })
        .getAttribute('aria-pressed'),
    ).toBe('false')
  })
})
