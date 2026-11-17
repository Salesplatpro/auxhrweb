import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CompanyTestResults } from './CompanyTestResults'

const renderResults = (
  answers: Parameters<typeof CompanyTestResults>[0]['application'],
) =>
  render(
    <MemoryRouter>
      <CompanyTestResults application={answers} />
    </MemoryRouter>,
  )

describe('CompanyTestResults', () => {
  afterEach(cleanup)

  it('marks multiple-choice answers right or wrong with the correct option', () => {
    renderResults({
      problemSolvingScore: 50,
      problemSolvingAnswers: [
        {
          question: 'Most sign-ups?',
          answer: '1,450 sign-ups',
          score: 5,
          maxScore: 5,
          feedback: null,
          options: ['1,250', '1,450 sign-ups', '1,600', '1,875'],
          selectedOption: 1,
          correctOption: 1,
        },
        {
          question: 'Next step?',
          answer: 'Wait',
          score: 0,
          maxScore: 5,
          feedback: null,
          options: ['Call', 'Email', 'Wait', 'Escalate'],
          selectedOption: 2,
          correctOption: 0,
        },
      ],
    })

    expect(screen.getByText('B. 1,450 sign-ups')).toBeTruthy()
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(screen.getByText(/correct answer A\. Call/)).toBeTruthy()
  })

  it('keeps the AI grade for older written answers', () => {
    renderResults({
      cultureFitScore: 80,
      cultureFitAnswers: [
        {
          question: 'A time you owned it?',
          answer: 'I fixed it.',
          score: 4,
          maxScore: 5,
          feedback: 'Clear.',
        },
      ],
    })

    expect(screen.getByText('4/5')).toBeTruthy()
    expect(screen.getByText('Clear.')).toBeTruthy()
  })
})
