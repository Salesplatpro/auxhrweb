import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { COUNTDOWN_FROM } from './constants'
import PreAssessmentPage from './page'
import { usePreAssessmentStore } from './store'
import { Assessment } from './types'

const { hookState, retakeMock, notifyMock } = vi.hoisted(() => ({
  hookState: { assessment: null as unknown },
  retakeMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  retakeAssessment: () => retakeMock(),
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

vi.mock('./hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./hooks')>()
  return {
    ...actual,
    usePreAssessment: () => ({
      assessment: hookState.assessment,
      isLoading: false,
      fetchError: null,
      isProfileIncomplete: false,
      refetch: vi.fn(),
    }),
  }
})

const ready: Assessment = {
  id: 'a1',
  status: 'pending',
  score: null,
  attemptCount: 0,
  maxAttempts: 3,
  generatedAt: '2026-11-17T00:00:00Z',
  roles: [],
  questions: [
    { questionId: 'q1', question: 'One?', category: 'c', options: ['a', 'b'] },
    { questionId: 'q2', question: 'Two?', category: 'c', options: ['a', 'b'] },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/talentDashboard/talentQuiz']}>
      <PreAssessmentPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.useFakeTimers()
  usePreAssessmentStore.getState().reset()
  hookState.assessment = ready
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PreAssessmentPage start', () => {
  it('waits for the start button instead of starting on its own', () => {
    renderPage()

    act(() => {
      vi.advanceTimersByTime((COUNTDOWN_FROM + 2) * 1000)
    })

    expect(
      screen.getByRole('button', { name: 'Start assessment' }),
    ).toBeTruthy()
    expect(
      screen.queryByText('You are about to start your assessment'),
    ).toBeNull()
    expect(usePreAssessmentStore.getState().assessmentStarted).toBe(false)
    expect(usePreAssessmentStore.getState().startedAt).toBeNull()
  })

  it('runs the countdown and starts the timer only after the click', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Start assessment' }))
    expect(
      screen.getByText('You are about to start your assessment'),
    ).toBeTruthy()
    expect(usePreAssessmentStore.getState().startedAt).toBeNull()

    for (let i = 0; i <= COUNTDOWN_FROM; i++) {
      act(() => {
        vi.advanceTimersByTime(1000)
      })
    }

    const state = usePreAssessmentStore.getState()
    expect(state.assessmentStarted).toBe(true)
    expect(state.startedAt).not.toBeNull()
    expect(screen.getByText('Question 1 of 2')).toBeTruthy()
  })

  it('resumes an in-progress session without asking to start again', () => {
    const store = usePreAssessmentStore.getState()
    store.setStartedAt(Date.now())
    store.setAssessmentStarted(true)
    store.setCountdownCompleted(true)

    renderPage()

    expect(
      screen.queryByRole('button', { name: 'Start assessment' }),
    ).toBeNull()
    expect(screen.getByText('Question 1 of 2')).toBeTruthy()
  })

  it('shows no start button while questions are still generating', () => {
    hookState.assessment = { ...ready, questions: [], generating: true }

    renderPage()

    expect(
      screen.queryByRole('button', { name: 'Start assessment' }),
    ).toBeNull()
    expect(
      screen.getByText('Generating your assessment questions...'),
    ).toBeTruthy()
  })
})

describe('PreAssessmentPage retake', () => {
  it('shows why a retake could not start, such as new questions still being written', async () => {
    vi.useRealTimers()
    hookState.assessment = {
      ...ready,
      status: 'completed',
      score: 40,
      attemptCount: 1,
    }
    retakeMock.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message:
              'Your new questions are almost ready. Try again in a minute.',
          },
        },
      },
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Retake Assessment' }))

    await vi.waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        'Your new questions are almost ready. Try again in a minute.',
        expect.anything(),
      ),
    )
  })
})
