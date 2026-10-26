import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CompanyAssessmentTest from './CompanyAssessmentTest'

const { questionsQueryMock, submitMock, notifyMock } = vi.hoisted(() => ({
  questionsQueryMock: vi.fn(),
  submitMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/redux/api/talent', () => ({
  useCompanyAssessmentQuestionsQuery: (...args: unknown[]) =>
    questionsQueryMock(...args),
  useSubmitCompanyAssessmentAnswersMutation: () => [
    submitMock,
    { isLoading: false },
  ],
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: notifyMock }))

const questions = [
  { id: 'q1', question: 'A key client churns overnight. What first?' },
  { id: 'q2', question: 'Two deadlines collide. How do you choose?' },
]

const loaded = () =>
  questionsQueryMock.mockReturnValue({
    data: { data: { questions } },
    isLoading: false,
    error: undefined,
    refetch: vi.fn(),
  })

describe('CompanyAssessmentTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the problem-solving questions for this job and shows them', () => {
    loaded()
    render(<CompanyAssessmentTest jobId="job-1" type="problem-solving" />)

    expect(questionsQueryMock).toHaveBeenCalledWith(
      { jobId: 'job-1', type: 'problem-solving' },
      expect.objectContaining({ skip: false }),
    )
    expect(screen.getByText(/problem-solving/i)).toBeTruthy()
    expect(screen.getByText(questions[0].question)).toBeTruthy()
    expect(screen.getByText(questions[1].question)).toBeTruthy()
  })

  it('sends every answer once all questions are answered, then says thanks without a score', async () => {
    loaded()
    submitMock.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { submitted: true, answered: 2 } }),
    })
    const onSubmitted = vi.fn()
    render(
      <CompanyAssessmentTest
        jobId="job-1"
        type="culture-fit"
        onSubmitted={onSubmitted}
      />,
    )

    const boxes = screen.getAllByRole('textbox')
    fireEvent.change(boxes[0], { target: { value: 'Call them first.' } })
    fireEvent.change(boxes[1], { target: { value: 'Ask the lead.' } })
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }))

    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith({
        type: 'culture-fit',
        jobId: 'job-1',
        answers: { q1: 'Call them first.', q2: 'Ask the lead.' },
      }),
    )
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect(screen.getByText(/answers are in/i)).toBeTruthy()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('shows a done message and no form when the test was already submitted', () => {
    loaded()
    render(
      <CompanyAssessmentTest jobId="job-1" type="problem-solving" submitted />,
    )

    expect(questionsQueryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    )
    expect(screen.getByText(/answers are in/i)).toBeTruthy()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })

  it('treats an already-submitted reply (409) as done', async () => {
    loaded()
    submitMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            message: 'You have already submitted your problem-solving answers',
          },
        }),
    })
    render(<CompanyAssessmentTest jobId="job-1" type="problem-solving" />)
    const boxes = screen.getAllByRole('textbox')
    boxes.forEach((b) => fireEvent.change(b, { target: { value: 'x' } }))
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }))

    expect(await screen.findByText(/answers are in/i)).toBeTruthy()
  })

  it('keeps the answers and asks to try again when grading fails (502)', async () => {
    loaded()
    submitMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 502,
          data: {
            message:
              "We couldn't score your problem-solving answers right now.",
          },
        }),
    })
    render(<CompanyAssessmentTest jobId="job-1" type="problem-solving" />)
    const boxes = screen.getAllByRole('textbox')
    boxes.forEach((b) => fireEvent.change(b, { target: { value: 'kept' } }))
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }))

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(/couldn't score/i),
        expect.anything(),
      ),
    )
    expect(screen.getAllByRole('textbox')[0]).toHaveProperty('value', 'kept')
  })

  it('renders nothing when the test is not switched on for this job (400)', () => {
    questionsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 400, data: { message: 'not switched on' } },
      refetch: vi.fn(),
    })
    const { container } = render(
      <CompanyAssessmentTest jobId="job-1" type="culture-fit" />,
    )
    expect(container.innerHTML).toBe('')
  })
})
