import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TalentDashboardHome from './TalentDashboardHome'

const { dashboardMock } = vi.hoisted(() => ({ dashboardMock: vi.fn() }))

vi.mock('@/features/dashboard/hooks/useTalentDashboard', () => ({
  useTalentDashboard: () => dashboardMock(),
}))

vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { firstName: 'Amaka' } }),
}))

vi.mock('@/hooks/useRouteToast', () => ({ useRouteToast: () => undefined }))

vi.mock('@/redux/api/talent', () => ({
  useAllJobApplicationsQuery: () => ({
    isLoading: false,
    data: {
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
            locationState: 'Lagos',
            workMode: ['hybrid'],
          },
        },
      ],
    },
  }),
}))

const step = {
  sentAt: null,
  doneAt: null,
  isNew: false,
  questionCount: 5,
  score: null,
  passed: null,
  matchLabel: null,
  answersSent: null,
  retryAt: null,
  refereeCount: null,
  maxReferees: null,
  outcome: null,
  state: 'current',
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <TalentDashboardHome />
    </MemoryRouter>,
  )

describe('Talent dashboard', () => {
  afterEach(cleanup)

  beforeEach(() => {
    dashboardMock.mockReturnValue({
      isLoading: false,
      error: undefined,
      retry: vi.fn(),
      dashboard: {
        applications: { sent: 6, sentThisWeek: 2 },
        tests: { toTake: 1, nextDueAt: '2026-11-06T10:00:00Z' },
        interviews: { toRecord: 1, nextDueAt: '2026-11-12T10:00:00Z' },
        todo: [
          {
            applicationId: 'app1',
            jobId: 'job1',
            jobTitle: 'Product Designer',
            company: { name: 'Kosana Tech Ltd', logoUrl: null },
            step: {
              ...step,
              key: 'ai_interview',
              minutes: 15,
              interviewId: 'int1',
              dueAt: '2026-11-12T10:00:00Z',
            },
          },
          {
            applicationId: 'app2',
            jobId: 'job2',
            jobTitle: 'Growth Marketing Manager',
            company: { name: 'Paylane', logoUrl: null },
            step: {
              ...step,
              key: 'problem_solving',
              minutes: 11,
              interviewId: null,
              dueAt: '2026-11-13T10:00:00Z',
            },
          },
        ],
      },
    })
  })

  it('greets the talent with what needs doing and the numbers', () => {
    renderPage()

    expect(screen.getByText('Welcome Back, Amaka')).toBeTruthy()
    expect(screen.getByText(/You have 2 things to do today/)).toBeTruthy()
    expect(
      screen.getByText('Recorded interview · Kosana Tech Ltd'),
    ).toBeTruthy()
    expect(
      screen.getByText('Product Designer · 15 min · by 12 Nov'),
    ).toBeTruthy()
    expect(screen.getByText('2 this week')).toBeTruthy()
    expect(screen.getByText('Due Fri')).toBeTruthy()
  })

  it('lists recent applications with where each stands', () => {
    renderPage()

    expect(screen.getByText('Kosana Tech Ltd · Lagos, Hybrid')).toBeTruthy()
    expect(screen.getByText('Interview')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'View all' }).getAttribute('href'),
    ).toBe('/talentDashboard/applicationPipeline')
  })
})
