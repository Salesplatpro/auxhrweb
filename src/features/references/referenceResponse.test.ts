import { describe, expect, it } from 'vitest'

import {
  type ReferenceQuestion,
  ANSWER_MAX_LENGTH,
  answersComplete,
  answersWithinLimit,
  linkProblemFor,
} from './referenceResponse'

const questions: ReferenceQuestion[] = [
  {
    key: 'worked_together',
    question: 'How did you work together?',
    required: true,
  },
  { key: 'strengths', question: 'What are their strengths?', required: true },
  { key: 'improve', question: 'What could they improve?', required: true },
  { key: 'reliability', question: 'How reliable are they?', required: true },
  { key: 'hire_again', question: 'Would you hire them again?', required: true },
  { key: 'anything_else', question: 'Anything else?', required: false },
]

const complete = {
  worked_together: 'Day to day on the same team',
  strengths: 'Clear writing',
  improve: 'Delegating earlier',
  reliability: 'Always on time',
  hire_again: 'Yes',
}

describe('reference response rules', () => {
  it('is complete once every required answer is written', () => {
    expect(answersComplete(questions, complete)).toBe(true)
  })

  it('is not complete while a required answer is blank or only spaces', () => {
    expect(answersComplete(questions, { ...complete, strengths: '   ' })).toBe(
      false,
    )
    expect(
      answersComplete(questions, {
        ...complete,
        hire_again: undefined as unknown as string,
      }),
    ).toBe(false)
  })

  it('does not require the optional last question', () => {
    expect(answersComplete(questions, { ...complete, anything_else: '' })).toBe(
      true,
    )
  })

  it('caps each answer at 2000 characters', () => {
    expect(ANSWER_MAX_LENGTH).toBe(2000)
    expect(answersWithinLimit({ strengths: 'x'.repeat(2000) })).toBe(true)
    expect(answersWithinLimit({ strengths: 'x'.repeat(2001) })).toBe(false)
  })

  it('tells an expired or used link from a missing one', () => {
    expect(linkProblemFor(410)).toBe('expired')
    expect(linkProblemFor(404)).toBe('missing')
    expect(linkProblemFor(400)).toBe('missing')
    expect(linkProblemFor(500)).toBeNull()
    expect(linkProblemFor(undefined)).toBeNull()
  })
})
