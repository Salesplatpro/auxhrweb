import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ApplicationDetail from './ApplicationDetail'

vi.mock('@/features/references/RefereesSection', () => ({
  RefereesSection: () => <p>referees</p>,
}))

const base = {
  sentAt: null,
  doneAt: null,
  dueAt: null,
  isNew: false,
  questionCount: null,
  minutes: null,
  score: null,
  passed: null,
  matchLabel: null,
  answersSent: null,
  retryAt: null,
  interviewId: null,
  refereeCount: null,
  maxReferees: null,
  outcome: null,
}

const PIPELINE = {
  application: {
    id: 'app1',
    jobId: 'job1',
    status: 'pending',
    appliedAt: '2026-10-21T10:00:00Z',
    candidateStatus: 'test_to_take',
    group: 'needs_you',
    job: {
      id: 'job1',
      title: 'Product Designer',
      status: 'active',
      workMode: ['hybrid'],
      locationCity: 'Lekki',
      locationState: 'Lagos',
      locationCountry: 'Nigeria',
      organization: { id: 'o1', name: 'Kosana Tech Ltd', logoUrl: null },
    },
  },
  steps: [
    { ...base, key: 'applied', state: 'done', doneAt: '2026-10-21T10:00:00Z' },
    { ...base, key: 'skills_test', state: 'done', score: 81, passed: true },
    {
      ...base,
      key: 'problem_solving',
      state: 'current',
      isNew: true,
      questionCount: 8,
      minutes: 8,
      dueAt: '2026-11-06T10:00:00Z',
    },
    {
      ...base,
      key: 'culture_fit',
      state: 'upcoming',
      isNew: true,
      questionCount: 5,
      minutes: 6,
    },
    { ...base, key: 'company_review', state: 'upcoming' },
  ],
  currentStep: 3,
  totalSteps: 5,
  nextStep: null as unknown,
}
PIPELINE.nextStep = PIPELINE.steps[2]

vi.mock('@/redux/api/talent', () => ({
  useApplicationPipelineQuery: () => ({ data: PIPELINE, isLoading: false }),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/talentDashboard/applications/app1']}>
      <Routes>
        <Route
          path="/talentDashboard/applications/:applicationId"
          element={<ApplicationDetail />}
        />
        <Route
          path="/talentDashboard/applications/:applicationId/test/:kind"
          element={<p>test page</p>}
        />
      </Routes>
    </MemoryRouter>,
  )

describe('application pipeline page', () => {
  afterEach(cleanup)

  it('shows where the application stands, the next step and the scores so far', () => {
    renderPage()

    expect(screen.getByText('Step 3 of 5')).toBeTruthy()
    expect(screen.getByText('Score 81% · passed')).toBeTruthy()
    expect(
      screen.getByText('New · 8 questions · about 8 min · due 6 Nov'),
    ).toBeTruthy()
    expect(
      screen.getByText(/You can only take it once, so find 8 quiet minutes/),
    ).toBeTruthy()
    expect(screen.getByText('81%')).toBeTruthy()
    expect(screen.getAllByText('To do')).toHaveLength(2)
  })

  it('opens only the current test; the next one waits', () => {
    renderPage()

    const [current, upcoming] = screen.getAllByRole('button', {
      name: 'Start test',
    })
    expect((upcoming as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(current!)
    expect(screen.getByText('test page')).toBeTruthy()
  })
})
