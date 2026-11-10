import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TalentDashboardHome from './TalentDashboardHome'

const { navigateMock, state } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  state: {
    dashboard: undefined as unknown,
    error: undefined as unknown,
    applications: [] as unknown[],
    retry: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      firstName: 'Amaka',
      lastName: 'Obi',
      userRoles: [{ id: 'r1', name: 'Product Designer' }],
      locationCity: 'Lagos',
      locationCountry: 'Nigeria',
      cvYearsExperience: 4,
      cvSkills: ['Figma', 'Design Systems', 'Research', 'Prototyping'],
      profileCompletion: { percentage: 86 },
    },
  }),
}))

vi.mock('@/features/dashboard/hooks/useTalentDashboard', () => ({
  useTalentDashboard: () => ({
    dashboard: state.dashboard,
    error: state.error,
    isLoading: false,
    retry: state.retry,
  }),
}))

vi.mock('@/redux/api/talent', () => ({
  useAllJobApplicationsQuery: () => ({
    data: { data: { applications: state.applications } },
    isLoading: false,
  }),
}))

const MATCH = {
  jobId: 'job-1',
  title: 'Product Designer',
  company: 'Brightline',
  companyLogoUrl: null,
  city: 'Lagos',
  state: null,
  country: 'Nigeria',
  workMode: ['hybrid'],
  createdAt: new Date().toISOString(),
  matchPercent: 94.2,
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <TalentDashboardHome />
    </MemoryRouter>,
  )

describe('Talent dashboard', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    state.dashboard = { cvReady: true, matches: [MATCH], newMatchesToday: 4 }
    state.error = undefined
    state.applications = []
  })

  it('welcomes the talent with today’s new matches and their profile', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Welcome back, Amaka',
    )
    expect(
      screen.getByText('4 new roles match your profile today.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Product Designer · Lagos, Nigeria · 4 yrs'),
    ).toBeTruthy()
    expect(screen.getByText('Design Systems')).toBeTruthy()
    expect(screen.queryByText('Prototyping')).toBeNull()
    expect(screen.getByText('Strong Profile')).toBeTruthy()
  })

  it('lists matches and sends Apply to the job page', () => {
    renderPage()

    expect(screen.getByText('94%')).toBeTruthy()
    expect(screen.getByText('Brightline · Lagos · Hybrid')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(navigateMock).toHaveBeenCalledWith('/talentDashboard/job/job-1')
  })

  it('says the CV is still being read before matches exist', () => {
    state.dashboard = { cvReady: false, matches: [], newMatchesToday: 0 }
    renderPage()

    expect(screen.getByText('We’re still reading your CV')).toBeTruthy()
    expect(
      screen.getByText('Here are the roles that fit you best.'),
    ).toBeTruthy()
  })

  it('offers Find Jobs when nothing matches', () => {
    state.dashboard = { cvReady: true, matches: [], newMatchesToday: 0 }
    renderPage()

    expect(screen.getByText('No new matches right now')).toBeTruthy()
  })

  it('shows a retry when matches fail to load, and keeps the rest of the page', () => {
    state.dashboard = undefined
    state.error = new Error('404')
    state.applications = [
      {
        id: 'a1',
        status: 'pending',
        currentStage: 'personality',
        job: {
          id: 'j9',
          role: { name: 'UX Writer' },
          organization: { name: 'Lumen Pay' },
        },
      },
    ]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(state.retry).toHaveBeenCalled()
    expect(screen.getByText('Personality test')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: /Personality test/ })
        .getAttribute('href'),
    ).toBe('/talentDashboard/job/j9')
  })

  it('counts applications by where they are', () => {
    state.applications = [
      { id: 'a1', status: 'pending' },
      { id: 'a2', status: 'awaiting_decision' },
      { id: 'a3', status: 'shortlisted' },
    ]
    renderPage()

    const tile = (label: string) =>
      screen.getByText(label).previousElementSibling?.textContent
    expect(tile('Applied')).toBe('3')
    expect(tile('In Review')).toBe('2')
  })
})
