import { describe, expect, it } from 'vitest'

import {
  AI_CONFIG_DEFAULT_VALUES,
  splitPersonalityCount,
} from './aiConfigModel'
import { candidateJourney } from './journeyStages'

describe('candidateJourney', () => {
  it('has apply, skills test and review for the lightest setup', () => {
    const { stages, totalMinutes } = candidateJourney({
      ...AI_CONFIG_DEFAULT_VALUES,
      minPrescreeningScore: '50',
    })
    expect(stages.map((stage) => stage.key)).toEqual([
      'apply',
      'skillsTest',
      'review',
    ])
    expect(stages[1].detail).toMatch(/50% or more/)
    expect(stages.map((stage) => stage.timeLabel)).toEqual([
      '2 min',
      '10 min',
      '',
    ])
    expect(totalMinutes).toBe(12)
  })

  it('adds every enabled step in order with its time', () => {
    const { stages, totalMinutes } = candidateJourney({
      ...AI_CONFIG_DEFAULT_VALUES,
      minPrescreeningScore: '60',
      cvSimilarity: 'true',
      minCvSimilarityScore: '65',
      personalizedAssessment: 'true',
      noPersonalizedQuestions: '5',
      problemSolvingAssessment: 'true',
      noOfProblemSolvingQuestions: '6',
      cultureFitAssessment: 'true',
      noOfCultureFitQuestions: '5',
      personalityEvaluation: 'true',
      ...splitPersonalityCount(8),
      aiInterview: 'true',
    })
    expect(
      stages.map((stage) => [stage.key, stage.timeLabel, stage.detail]),
    ).toEqual([
      ['apply', '2 min', 'Sends their profile and CV'],
      ['skillsTest', '10 min', 'Needs 60% or more'],
      ['cvMatch', 'Automatic', 'AI reads every CV'],
      ['tailored', '8 min', '5 questions'],
      ['problemSolving', '8 min', '6 questions'],
      ['cultureFit', '6 min', '5 questions'],
      ['personality', '6 min', '8 questions'],
      ['aiInterview', 'About 15 min', '5 questions'],
      ['review', '', 'Ranked and ready in your job post'],
    ])
    expect(totalMinutes).toBe(2 + 10 + 8 + 8 + 6 + 6 + 15)
  })

  it('counts your own personality questions and uses singular wording', () => {
    const { stages } = candidateJourney({
      ...AI_CONFIG_DEFAULT_VALUES,
      personalizedAssessment: 'true',
      noPersonalizedQuestions: 1,
      personalityEvaluation: 'true',
      ...splitPersonalityCount(4),
      uploadedQuestions: ['Weekends?', ''],
    })
    expect(stages.find((s) => s.key === 'tailored')?.detail).toBe('1 question')
    expect(stages.find((s) => s.key === 'personality')?.detail).toBe(
      '5 questions',
    )
  })

  it('skips switched-on steps that have no questions yet', () => {
    const { stages } = candidateJourney({
      ...AI_CONFIG_DEFAULT_VALUES,
      personalizedAssessment: 'true',
      noPersonalizedQuestions: '',
      personalityEvaluation: 'true',
    })
    expect(stages.map((stage) => stage.key)).not.toContain('tailored')
    expect(stages.map((stage) => stage.key)).not.toContain('personality')
  })
})
