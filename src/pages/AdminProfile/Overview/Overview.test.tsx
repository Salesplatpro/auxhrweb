import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminOverview } from '@/features/admin/types'

import Overview from './Overview'

const { fetchAdminOverviewMock } = vi.hoisted(() => ({
  fetchAdminOverviewMock: vi.fn(),
}))

vi.mock('@/features/admin/services/adminService', () => ({
  fetchAdminOverview: fetchAdminOverviewMock,
}))

vi.mock('@/components/ui/TrendChart', () => ({
  TrendChart: ({ ariaLabel }: { ariaLabel: string }) => (
    <div data-testid="trend-chart">{ariaLabel}</div>
  ),
}))

const overview = (revenueInRange = 0): AdminOverview => ({
  range: { days: 30, from: '2026-09-13', to: '2026-10-12' },
  kpis: {
    talents: { total: 1240, new: 36, previous: 30 },
    recruiters: { total: 80, new: 4, previous: 4 },
    organizations: { total: 22, pending: 3, verified: 18, rejected: 1 },
    jobs: { total: 40, active: 25 },
    applications: { total: 900, new: 120, previous: 100 },
    stuckApplications: 7,
    supportAwaitingReply: 2,
    unresolvedErrors: 5,
    revenue: { total: 250000, inRange: revenueInRange, previous: 0 },
  },
  series: {
    signups: [{ date: '2026-10-12', talents: 1, recruiters: 0 }],
    applications: [{ date: '2026-10-12', count: 3 }],
    revenue: [{ date: '2026-10-12', amount: revenueInRange }],
  },
  breakdowns: {
    applicationsByStatus: [{ key: 'pending', count: 10 }],
    jobsByStatus: [{ key: 'active', count: 25 }],
    organizationsByPlan: [{ key: 'pay_per_use', count: 20 }],
    talentOnboarding: [{ key: 'active', count: 4 }],
    recruiterOnboarding: [{ key: 'active', count: 2 }],
    stuckByStage: [],
    scoutRunsByStatus: [],
  },
})

const renderPage = (path = '/adminDashboard') =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[path]}>
        <Overview />
      </MemoryRouter>
    </SWRConfig>,
  )

describe('Overview', () => {
  beforeEach(() => {
    fetchAdminOverviewMock.mockReset()
  })

  it('renders the headline metrics once data loads', async () => {
    fetchAdminOverviewMock.mockResolvedValue(overview())
    renderPage()

    expect(await screen.findByText('1,240')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Stuck applications: view details' }),
    ).toBeTruthy()
    expect(screen.getByText('3 pending verification')).toBeTruthy()
    expect(screen.getAllByText('+20%')).toHaveLength(2)
    expect(fetchAdminOverviewMock).toHaveBeenCalledWith(30)
  })

  it('shows an empty note instead of a chart when there was no revenue', async () => {
    fetchAdminOverviewMock.mockResolvedValue(overview(0))
    renderPage()

    expect(
      await screen.findByText('No completed payments in the last 30 days.'),
    ).toBeTruthy()
  })

  it('draws the revenue chart when payments completed in the range', async () => {
    fetchAdminOverviewMock.mockResolvedValue(overview(5000))
    renderPage()

    expect(
      await screen.findByText('Revenue per day, last 30 days'),
    ).toBeTruthy()
  })

  it('reads the range from the url and refetches when it changes', async () => {
    fetchAdminOverviewMock.mockResolvedValue(overview())
    renderPage('/adminDashboard?days=7')

    await waitFor(() => expect(fetchAdminOverviewMock).toHaveBeenCalledWith(7))

    fireEvent.click(screen.getByRole('tab', { name: '90 days' }))

    await waitFor(() => expect(fetchAdminOverviewMock).toHaveBeenCalledWith(90))
  })

  it('falls back to 30 days for an unsupported range', async () => {
    fetchAdminOverviewMock.mockResolvedValue(overview())
    renderPage('/adminDashboard?days=12')

    await waitFor(() => expect(fetchAdminOverviewMock).toHaveBeenCalledWith(30))
  })

  it('offers a retry when the request fails', async () => {
    fetchAdminOverviewMock.mockRejectedValueOnce(new Error('boom'))
    fetchAdminOverviewMock.mockResolvedValue(overview())
    renderPage()

    expect(
      await screen.findByText("We couldn't load the overview"),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('1,240')).toBeTruthy()
  })
})
