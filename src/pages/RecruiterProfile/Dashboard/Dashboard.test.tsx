import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Dashboard from './Dashboard'

const state = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  summary: undefined as unknown,
  error: undefined as unknown,
  retry: vi.fn(),
  ranges: [] as number[],
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: state.profile, isLoading: false }),
}))

vi.mock('@/features/dashboard/hooks/useRecruiterDashboard', () => ({
  APPLICANTS_PAGE_SIZE: 7,
  useRecruiterDashboardSummary: (range: number) => {
    state.ranges.push(range)
    return {
      summary: state.summary,
      error: state.error,
      isLoading: false,
      retry: state.retry,
    }
  },
  useRecruiterApplicants: () => ({
    applicants: [],
    total: 0,
    offset: 0,
    error: undefined,
    isLoading: false,
    retry: vi.fn(),
  }),
}))

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: 'n1',
        message: 'Adaeze applied to Customer Success Lead',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ],
    isLoading: false,
    mutate: vi.fn(),
  }),
}))

vi.mock('@/features/notifications/hooks/useMarkNotificationRead', () => ({
  useMarkNotificationRead: () => ({ markAsRead: vi.fn() }),
}))

vi.mock('@/features/notifications/hooks/useOpenNotification', () => ({
  useOpenNotification: () => ({
    follow: vi.fn(),
    needsSwitch: false,
    isSwitching: false,
    confirmSwitch: vi.fn(),
    cancelSwitch: vi.fn(),
  }),
}))

const SUMMARY = {
  range: { days: 7, from: '2026-11-04', to: '2026-11-10' },
  kpis: {
    activeJobs: { total: 12, new: 2 },
    applications: { total: 1284, current: 118, previous: 100 },
    screened: { total: 846, applications: 1284 },
  },
  series: [{ date: '2026-11-10', applications: 4, screened: 2 }],
  status: {
    total: 10,
    underReview: 4,
    inTesting: 3,
    shortlisted: 2,
    rejected: 1,
  },
  funnel: {
    applied: 118,
    cvMatched: 90,
    preScreened: 80,
    personalityTest: 40,
    shortlisted: 12,
  },
  activeJobPosts: [
    {
      id: 'j1',
      title: 'Growth Marketing Manager',
      city: 'Lagos',
      state: null,
      country: 'Nigeria',
      workMode: ['remote'],
      applicants: 312,
      screened: 156,
    },
  ],
}

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/recruiterDashboard/dashboard']}>
      <Dashboard />
    </MemoryRouter>,
  )

describe('Recruiter dashboard', () => {
  beforeEach(() => {
    state.profile = {
      firstName: 'Philip',
      activeOrganizationId: 'org-1',
      activeOrganization: { id: 'org-1', name: 'Kosana Tech' },
    }
    state.summary = SUMMARY
    state.error = undefined
    state.ranges = []
    state.retry.mockReset()
  })

  it('asks a recruiter without a company to create one, where the tour can find it', () => {
    state.profile = { firstName: 'Philip', activeOrganization: null }
    renderDashboard()

    const button = screen.getByRole('button', { name: 'Create company' })
    expect(button.getAttribute('data-tour')).toBe('create-company')
    expect(screen.queryByText('Total Applications')).toBeNull()
  })

  it('greets the recruiter and shows the headline numbers', () => {
    renderDashboard()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(
      /^Good (morning|afternoon|evening), Philip$/,
    )
    expect(screen.getByText('1,284')).toBeTruthy()
    expect(screen.getByText('+18%')).toBeTruthy()
    expect(screen.getByText('+2')).toBeTruthy()
    expect(screen.getByText('66% of all applicants')).toBeTruthy()
    expect(screen.getByText('Growth Marketing Manager')).toBeTruthy()
    expect(screen.getByText('Lagos · Remote · 312 applicants')).toBeTruthy()
  })

  it('switches the range from the dropdown', () => {
    renderDashboard()
    fireEvent.click(screen.getByText('Last 7 days'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Last 30 days' }))

    expect(state.ranges).toContain(30)
    expect(
      screen.getByText(
        'Here is what happened across your job posts in the last 30 days.',
      ),
    ).toBeTruthy()
  })

  it('shows a retry when the summary fails but keeps the other cards', () => {
    state.summary = undefined
    state.error = new Error('404')
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(state.retry).toHaveBeenCalled()
    expect(
      screen.getByText('Adaeze applied to Customer Success Lead'),
    ).toBeTruthy()
    expect(screen.getByText('Recent Applicants')).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: /Export Report/ })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('explains an empty status chart instead of drawing an empty ring', () => {
    state.summary = { ...SUMMARY, status: { ...SUMMARY.status, total: 0 } }
    renderDashboard()

    expect(screen.getByText('No applications on active jobs')).toBeTruthy()
  })
})
