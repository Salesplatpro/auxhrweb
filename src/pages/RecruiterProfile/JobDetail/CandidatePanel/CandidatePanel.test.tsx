import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CandidatePanel } from './CandidatePanel'

const { appMock } = vi.hoisted(() => ({ appMock: vi.fn() }))

vi.mock('@/features/applications/hooks/useApplication', () => ({
  useApplication: () => appMock(),
}))
vi.mock('@/features/applications/hooks/useRevalidateJob', () => ({
  useRevalidateJob: () => vi.fn(),
}))
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ profile: null }),
}))
vi.mock('./PanelOverview', () => ({ PanelOverview: () => null }))

const application = (overrides: Record<string, unknown> = {}) => ({
  id: 'app1',
  jobId: 'job1',
  status: 'awaiting_decision',
  createdAt: '2026-11-20T00:00:00Z',
  source: null,
  talent: { id: 't1', firstName: 'Amaka', lastName: 'Obi' },
  readyForReview: false,
  waitingFor: 'references',
  canStartInterview: false,
  ...overrides,
})

const renderPanel = (overrides: Record<string, unknown> = {}) => {
  appMock.mockReturnValue({
    data: { data: { application: application(overrides) } },
    isLoading: false,
    mutate: vi.fn(),
  })
  render(
    <CandidatePanel
      applicationId="app1"
      jobTitle="Designer"
      onClose={vi.fn()}
    />,
  )
}

const moveForward = () => screen.getByRole('button', { name: 'Move forward' })

describe('candidate panel decision', () => {
  afterEach(cleanup)
  beforeEach(() => appMock.mockReset())

  it("can't move a candidate forward who hasn't finished every step, and says why", () => {
    renderPanel()

    expect(moveForward()).toHaveProperty('disabled', true)
    expect(screen.getByText('Waiting for a referee')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('shortlists a candidate who finished every step', () => {
    renderPanel({ readyForReview: true, waitingFor: null })

    fireEvent.click(moveForward())

    expect(screen.getByText('Shortlisted')).toBeTruthy()
  })

  it('offers to start the interview when that is the next step', () => {
    renderPanel({ canStartInterview: true, waitingFor: 'ai_interview' })

    fireEvent.click(moveForward())

    expect(screen.getByText('Recorded AI interview')).toBeTruthy()
    expect(
      screen.getByLabelText(/Email Amaka the interview invite now/),
    ).toBeTruthy()
  })
})

describe('candidate panel answers', () => {
  afterEach(cleanup)
  beforeEach(() => appMock.mockReset())

  it('shows each skills test question and the option the talent chose', () => {
    renderPanel({
      talent: {
        id: 't1',
        firstName: 'Amaka',
        lastName: 'Obi',
        prescreeningScore: 75,
      },
      preAssessmentAnswers: [
        {
          question: 'Two deadlines clash. What do you do?',
          answer: 'Pick one',
          score: 5,
          maxScore: 10,
          feedback: 'Defensible, but slow.',
          options: ['Work late', 'Ask your manager', 'Pick one', 'Skip both'],
          selectedOption: 2,
          correctOption: 1,
        },
      ],
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Answers' }))

    expect(screen.getByText('Skills test')).toBeTruthy()
    expect(
      screen.getByText('Two deadlines clash. What do you do?'),
    ).toBeTruthy()
    expect(screen.getByText('C. Pick one')).toBeTruthy()
    expect(screen.getByText(/correct answer B\. Ask your manager/)).toBeTruthy()
  })
})
