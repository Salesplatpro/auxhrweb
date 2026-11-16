import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChoiceTest } from './ChoiceTest'
import { TEST_KINDS } from './kinds'
import { useApplicationTestsStore } from './store'

const { questionsMock, submitMock, notifyMock } = vi.hoisted(() => ({
  questionsMock: vi.fn(),
  submitMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/redux/api/talent', () => ({
  useCompanyAssessmentQuestionsQuery: () => questionsMock(),
  useSubmitCompanyAssessmentAnswersMutation: () => [
    submitMock,
    { isLoading: false },
  ],
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const QUESTIONS = [
  { id: 'q1', question: 'First question?', options: ['A1', 'B1', 'C1', 'D1'] },
  { id: 'q2', question: 'Second question?', options: ['A2', 'B2', 'C2', 'D2'] },
]

const renderTest = (onFinished = vi.fn()) => {
  render(
    <ChoiceTest
      jobId="job1"
      kind="problem-solving"
      config={TEST_KINDS['problem-solving']}
      context="Growth Manager · Acme"
      draftKey="ada:app1:problem-solving"
      onFinished={onFinished}
    />,
  )
  return onFinished
}

const answerBoth = () => {
  fireEvent.click(screen.getByRole('radio', { name: /B1/ }))
  fireEvent.click(screen.getByRole('button', { name: /next/i }))
  fireEvent.click(screen.getByRole('radio', { name: /C2/ }))
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
}

const rejection = (status: number, message: string, code?: string) => ({
  unwrap: () => Promise.reject({ status, data: { error: { message, code } } }),
})

describe('ChoiceTest', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useApplicationTestsStore.getState().reset()
    questionsMock.mockReturnValue({
      data: { data: { questions: QUESTIONS } },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    })
    submitMock.mockReset()
    notifyMock.mockReset()
  })

  it('shows one question at a time, keeps choices on Back, and sends the option numbers', async () => {
    submitMock.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    const onFinished = renderTest()

    expect(screen.getByText('Question 1 of 2')).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /B1/ }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Second question?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(
      (screen.getByRole('radio', { name: /B1/ }) as HTMLInputElement).checked,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('radio', { name: /C2/ }))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(2))
    expect(submitMock).toHaveBeenCalledWith({
      jobId: 'job1',
      type: 'problem-solving',
      answers: { q1: 1, q2: 2 },
    })
    expect(useApplicationTestsStore.getState().drafts).toEqual({})
  })

  it('treats "already submitted" as done, so a retried send never strands the candidate', async () => {
    submitMock.mockReturnValue(
      rejection(409, 'You have already submitted your answers'),
    )
    const onFinished = renderTest()
    answerBoth()
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(2))
  })

  it('keeps the answers and says so when sending fails', async () => {
    submitMock.mockReturnValue(rejection(500, 'Server error'))
    const onFinished = renderTest()
    answerBoth()

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith('error', 'Server error'),
    )
    expect(onFinished).not.toHaveBeenCalled()
    expect(
      useApplicationTestsStore.getState().drafts['ada:app1:problem-solving']!
        .answers,
    ).toEqual({ q1: 1, q2: 2 })
  })

  it('cannot move on before an option is picked', () => {
    renderTest()
    expect(
      (screen.getByRole('button', { name: /next/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
