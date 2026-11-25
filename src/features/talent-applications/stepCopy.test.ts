import { describe, expect, it } from 'vitest'

import { nextStepCopy, stepDescription } from './stepCopy'
import { CandidatePipeline, PipelineStep } from './types'

const step = (overrides: Partial<PipelineStep>): PipelineStep => ({
  key: 'problem_solving',
  state: 'upcoming',
  sentAt: null,
  doneAt: null,
  dueAt: null,
  isNew: false,
  questionCount: null,
  minutes: null,
  score: null,
  passed: null,
  answersSent: null,
  retryAt: null,
  interviewId: null,
  refereeCount: null,
  maxReferees: null,
  outcome: null,
  ...overrides,
})

describe('step descriptions', () => {
  it('describe each state the way the candidate sees it', () => {
    expect(
      stepDescription(
        step({ key: 'skills_test', state: 'done', score: 81, passed: true }),
        'Kosana',
      ),
    ).toBe('Score 81% · passed')
    expect(
      stepDescription(step({ key: 'cv_match', state: 'done' }), 'Kosana'),
    ).toBe('Done')
    expect(
      stepDescription(
        step({
          state: 'current',
          isNew: true,
          questionCount: 8,
          minutes: 8,
          dueAt: '2026-11-06T10:00:00Z',
        }),
        'Kosana',
      ),
    ).toBe('New · 8 questions · about 8 min · due 6 Nov')
    expect(
      stepDescription(
        step({ key: 'culture_fit', isNew: true, questionCount: 5, minutes: 6 }),
        'Kosana',
      ),
    ).toBe('New · 5 questions · about 6 min')
    expect(
      stepDescription(
        step({ state: 'done', doneAt: '2026-11-04T10:00:00Z' }),
        'Kosana',
      ),
    ).toBe('Sent 4 Nov')
    expect(
      stepDescription(
        step({
          key: 'ai_interview',
          state: 'current',
          questionCount: 5,
          minutes: 15,
          dueAt: '2026-11-12T10:00:00Z',
        }),
        'Kosana',
      ),
    ).toBe('5 questions · about 15 min · by 12 Nov')
    expect(
      stepDescription(step({ key: 'references', maxReferees: 3 }), 'Kosana'),
    ).toBe("You'll add up to 3 referees later")
    expect(
      stepDescription(step({ key: 'company_review' }), 'Kosana Tech Ltd'),
    ).toBe('Kosana Tech Ltd decides')
  })
})

describe('next step copy', () => {
  const pipeline = (
    next: PipelineStep | null,
    status = 'pending',
    steps: PipelineStep[] = [],
  ) =>
    ({
      application: {
        status,
        job: { organization: { name: 'Kosana Tech Ltd' } },
      },
      steps,
      nextStep: next,
    } as unknown as CandidatePipeline)

  it('explains the interview and the one-shot tests', () => {
    expect(
      nextStepCopy(
        pipeline(
          step({
            key: 'ai_interview',
            minutes: 15,
            dueAt: '2026-11-12T10:00:00Z',
          }),
        ),
      ),
    ).toBe(
      'Kosana Tech Ltd invited you to a recorded interview. It takes about 15 minutes. Do it any time before 12 Nov.',
    )
    expect(
      nextStepCopy(
        pipeline(step({ minutes: 10, dueAt: '2026-11-06T10:00:00Z' })),
      ),
    ).toBe(
      'Take the problem-solving test before Fri 6 Nov. You can only take it once, so find 10 quiet minutes.',
    )
    expect(nextStepCopy(pipeline(null, 'not_proceeding'))).toBe(
      'Kosana Tech Ltd decided not to move forward with this application.',
    )
  })

  it('asks a shortlisted candidate to answer the background checks inside company review', () => {
    const review = step({
      key: 'company_review',
      state: 'done',
      outcome: 'shortlisted',
      checks: { requestedAt: '2026-11-20T10:00:00Z', answeredAt: null },
    })

    expect(stepDescription(review, 'Kosana Tech Ltd')).toBe(
      'Shortlisted · Review and answer background checks',
    )
    expect(nextStepCopy(pipeline(null, 'shortlisted', [review]))).toBe(
      'Kosana Tech Ltd shortlisted you. Kosana Tech Ltd would like to check your identity, past jobs and education. It takes about 2 minutes, and you can say no.',
    )
    expect(
      stepDescription(
        {
          ...review,
          checks: { ...review.checks!, answeredAt: '2026-11-21T10:00:00Z' },
        },
        'Kosana Tech Ltd',
      ),
    ).toBe('Shortlisted')
  })
})
