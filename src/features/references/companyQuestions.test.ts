import { describe, expect, it } from 'vitest'

import {
  emptyQuestion,
  MAX_COMPANY_QUESTIONS,
  questionListProblem,
  questionsToSave,
  roomForQuestions,
  sortJobs,
  waitingTotal,
} from './companyQuestions'

const job = (jobId: string, waiting: number, createdAt: string) => ({
  jobId,
  title: jobId,
  status: 'active',
  createdAt,
  waiting,
})

describe('company reference questions', () => {
  it('trims questions and drops blank rows before saving', () => {
    expect(
      questionsToSave([
        { question: '  Were they on time?  ', type: 'yesno', required: true },
        emptyQuestion(),
        { key: 'k1', question: 'Best work?', type: 'text', required: false },
      ]),
    ).toEqual([
      { question: 'Were they on time?', type: 'yesno', required: true },
      { key: 'k1', question: 'Best work?', type: 'text', required: false },
    ])
  })

  it('flags too many or too long questions, ignoring blanks', () => {
    const many = Array.from({ length: MAX_COMPANY_QUESTIONS }, () => ({
      ...emptyQuestion(),
      question: 'Q?',
    }))
    expect(questionListProblem([...many, emptyQuestion()])).toBeNull()
    expect(
      questionListProblem([
        ...many,
        { ...emptyQuestion(), question: 'One more?' },
      ]),
    ).toMatch(/at most 15/)
    expect(
      questionListProblem([{ ...emptyQuestion(), question: 'x'.repeat(301) }]),
    ).toMatch(/300/)
    expect(roomForQuestions(many)).toBe(0)
    expect(roomForQuestions([emptyQuestion()])).toBe(MAX_COMPANY_QUESTIONS)
  })

  it('sorts jobs by most waiting or newest, and counts the chosen ones', () => {
    const jobs = [
      job('old-busy', 5, '2026-10-01T00:00:00Z'),
      job('new-quiet', 1, '2026-11-20T00:00:00Z'),
      job('mid', 5, '2026-11-01T00:00:00Z'),
    ]
    expect(sortJobs(jobs, 'waiting').map((item) => item.jobId)).toEqual([
      'mid',
      'old-busy',
      'new-quiet',
    ])
    expect(sortJobs(jobs, 'newest').map((item) => item.jobId)).toEqual([
      'new-quiet',
      'mid',
      'old-busy',
    ])
    expect(waitingTotal(jobs, ['mid', 'new-quiet'])).toBe(6)
  })
})
