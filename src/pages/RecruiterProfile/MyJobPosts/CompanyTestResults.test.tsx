import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { CompanyTestResults } from './CompanyTestResults'

describe('CompanyTestResults (recruiter candidate panel)', () => {
  it('shows each test score and every graded answer with its feedback', () => {
    render(
      <CompanyTestResults
        application={{
          problemSolvingScore: 80,
          cultureFitScore: 100,
          problemSolvingAnswers: [
            {
              question: 'A key client churns overnight. What first?',
              answer: 'Call them, then find the cause.',
              score: 4,
              maxScore: 5,
              feedback: 'Clear triage, light on root cause.',
            },
          ],
          cultureFitAnswers: [
            {
              question: 'A time you put the customer first?',
              answer: 'I stayed late to fix a refund.',
              score: 5,
              maxScore: 5,
              feedback: 'Strong ownership.',
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Problem-solving test')).toBeTruthy()
    expect(screen.getByText('Culture-fit test')).toBeTruthy()
    expect(screen.getByText('80%')).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByText('Call them, then find the cause.')).toBeTruthy()
    expect(screen.getByText('4/5')).toBeTruthy()
    expect(screen.getByText('Clear triage, light on root cause.')).toBeTruthy()
    expect(screen.getByText('Strong ownership.')).toBeTruthy()
  })

  it('shows nothing for a test the candidate has not taken', () => {
    render(
      <CompanyTestResults
        application={{
          problemSolvingScore: 60,
          cultureFitScore: null,
          problemSolvingAnswers: [],
          cultureFitAnswers: [],
        }}
      />,
    )
    expect(screen.getByText('Problem-solving test')).toBeTruthy()
    expect(screen.queryByText('Culture-fit test')).toBeNull()
  })

  it('renders nothing when neither test was taken', () => {
    const { container } = render(<CompanyTestResults application={{}} />)
    expect(container.innerHTML).toBe('')
  })
})
