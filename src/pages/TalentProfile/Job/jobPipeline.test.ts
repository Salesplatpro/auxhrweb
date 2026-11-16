import { describe, expect, it } from 'vitest'

import {
  humanStage,
  humanTalentStage,
  orderedStageKeys,
  talentFacingStage,
} from './jobPipeline'

const stages = {
  personality: 'personalized',
  personalized: 'prescreening',
  prescreening: 'cv_similarity',
  cv_similarity: 'completed',
}

describe('jobPipeline', () => {
  it('walks a subset of enabled stages', () => {
    expect(
      orderedStageKeys({
        personalized: 'cv_similarity',
        cv_similarity: 'completed',
      }),
    ).toEqual(['personalized', 'cv_similarity'])
  })

  it('labels the problem-solving and culture-fit stages for recruiters', () => {
    expect(humanStage('problem_solving')).toBe('Problem-solving test')
    expect(humanStage('culture_fit')).toBe('Culture-fit test')
  })

  it('surfaces talent-owned stages and hides CV match / prescreening', () => {
    expect(talentFacingStage('personality', stages)).toBe('personality')
    expect(talentFacingStage('personalized', stages)).toBe('personalized')
    expect(talentFacingStage('prescreening', stages)).toBe('completed')
    expect(talentFacingStage('cv_similarity', stages)).toBe('completed')
    expect(talentFacingStage('cv_similarity')).toBe('completed')
    expect(talentFacingStage('prescreening')).toBe('completed')
    expect(talentFacingStage('completed', stages)).toBe('completed')
    expect(talentFacingStage(null)).toBeNull()
    expect(humanTalentStage('personality', stages)).toBe('Personality')
    expect(humanTalentStage('cv_similarity', stages)).toBe('Complete')
  })

  it('skips a leading CV match stage to the next talent-owned step', () => {
    const inverted = {
      cv_similarity: 'personalized',
      personalized: 'personality',
      personality: 'completed',
    }
    expect(talentFacingStage('cv_similarity', inverted)).toBe('personalized')
    expect(humanTalentStage('cv_similarity', inverted)).toBe('Personalized')
  })
})
