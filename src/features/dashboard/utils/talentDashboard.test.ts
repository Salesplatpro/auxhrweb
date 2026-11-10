import { describe, expect, it } from 'vitest'

import {
  applicationCounts,
  newMatchesLine,
  placeAndMode,
  waitingOnTalent,
  yearsLabel,
} from './talentDashboard'

const app = (overrides: Record<string, unknown>) => ({
  id: 'a1',
  status: 'pending',
  currentStage: 'personality',
  job: {
    id: 'j1',
    role: { name: 'UX Writer' },
    organization: { name: 'Lumen Pay' },
  },
  ...overrides,
})

describe('talent dashboard helpers', () => {
  it('counts applied, in review and shortlisted', () => {
    expect(
      applicationCounts([
        app({ status: 'pending' }),
        app({ status: 'awaiting_decision' }),
        app({ status: 'shortlisted' }),
        app({ status: 'rejected' }),
      ]),
    ).toEqual({ applied: 4, inReview: 2, shortlisted: 1 })
  })

  it('lists only open applications sitting on a test the talent takes', () => {
    const items = waitingOnTalent([
      app({ id: 'a1', currentStage: 'personality' }),
      app({
        id: 'a2',
        currentStage: 'personalized',
        status: 'retake_assessment',
      }),
      app({ id: 'a3', currentStage: 'cv_similarity' }),
      app({ id: 'a4', currentStage: 'personality', status: 'rejected' }),
      app({ id: 'a5', currentStage: 'completed' }),
      app({ id: 'a6', job: undefined }),
    ])

    expect(items).toEqual([
      {
        applicationId: 'a1',
        jobId: 'j1',
        title: 'UX Writer',
        company: 'Lumen Pay',
        stage: 'Personality test',
      },
      {
        applicationId: 'a2',
        jobId: 'j1',
        title: 'UX Writer',
        company: 'Lumen Pay',
        stage: 'Personalized test',
      },
    ])
  })

  it('words the new match line for zero, one and many', () => {
    expect(newMatchesLine(0)).toBe('Here are the roles that fit you best.')
    expect(newMatchesLine(1)).toBe('1 new role matches your profile today.')
    expect(newMatchesLine(4)).toBe('4 new roles match your profile today.')
  })

  it('joins the first known place with the work modes', () => {
    expect(placeAndMode([null, 'Lagos', 'Nigeria'], ['remote', 'hybrid'])).toBe(
      'Lagos · Remote, Hybrid',
    )
    expect(placeAndMode([null, null, null], [])).toBe('')
  })

  it('prefers years from the CV and falls back to the stated range', () => {
    expect(yearsLabel(4)).toBe('4 yrs')
    expect(yearsLabel(1)).toBe('1 yr')
    expect(yearsLabel(null, '1-3 years')).toBe('1-3 years')
    expect(yearsLabel(0)).toBeNull()
  })
})
