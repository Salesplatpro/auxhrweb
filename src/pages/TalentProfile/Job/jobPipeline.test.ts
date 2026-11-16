import { describe, expect, it } from 'vitest'

import { humanStage } from './jobPipeline'

describe('jobPipeline', () => {
  it('labels the problem-solving and culture-fit stages for recruiters', () => {
    expect(humanStage('problem_solving')).toBe('Problem-solving test')
    expect(humanStage('culture_fit')).toBe('Culture-fit test')
  })
})
