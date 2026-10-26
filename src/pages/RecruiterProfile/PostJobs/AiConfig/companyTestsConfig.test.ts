import { describe, expect, it } from 'vitest'

import { AI_CONFIG_DEFAULT_VALUES } from './aiConfigModel'
import { aiConfigFromApi, aiConfigToPayload } from './aiConfigPayload'
import { aiConfigValidationSchema } from './aiConfigValidationSchema'

const base = {
  ...AI_CONFIG_DEFAULT_VALUES,
  name: 'Setup',
  minPrescreeningScore: 50,
}

// Formik turns '' into undefined before it runs the schema; do the same here.
const asFormikValidates = (values: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === '' ? undefined : value,
    ]),
  )

describe('problem-solving and culture-fit test switches', () => {
  it('are off by default with no question count', () => {
    expect(AI_CONFIG_DEFAULT_VALUES.problemSolvingAssessment).toBe('false')
    expect(AI_CONFIG_DEFAULT_VALUES.cultureFitAssessment).toBe('false')
    expect(AI_CONFIG_DEFAULT_VALUES.noOfProblemSolvingQuestions).toBe('')
    expect(AI_CONFIG_DEFAULT_VALUES.noOfCultureFitQuestions).toBe('')
  })

  it('load from a saved setup', () => {
    const values = aiConfigFromApi({
      problemSolvingAssessment: true,
      noOfProblemSolvingQuestions: 4,
      cultureFitAssessment: false,
      noOfCultureFitQuestions: null,
    })
    expect(values.problemSolvingAssessment).toBe('true')
    expect(values.noOfProblemSolvingQuestions).toBe(4)
    expect(values.cultureFitAssessment).toBe('false')
    expect(values.noOfCultureFitQuestions).toBe('')
  })

  it('are sent as booleans with their counts when on', () => {
    const payload = aiConfigToPayload({
      ...base,
      problemSolvingAssessment: 'true',
      noOfProblemSolvingQuestions: 3,
      cultureFitAssessment: 'true',
      noOfCultureFitQuestions: 5,
    })
    expect(payload.problemSolvingAssessment).toBe(true)
    expect(payload.noOfProblemSolvingQuestions).toBe(3)
    expect(payload.cultureFitAssessment).toBe(true)
    expect(payload.noOfCultureFitQuestions).toBe(5)
  })

  it('drop the question count when a test is off', () => {
    const payload = aiConfigToPayload({
      ...base,
      problemSolvingAssessment: 'false',
      noOfProblemSolvingQuestions: 3,
      cultureFitAssessment: 'false',
      noOfCultureFitQuestions: 5,
    })
    expect(payload.problemSolvingAssessment).toBe(false)
    expect(payload.cultureFitAssessment).toBe(false)
    expect('noOfProblemSolvingQuestions' in payload).toBe(false)
    expect('noOfCultureFitQuestions' in payload).toBe(false)
  })

  it.each([
    ['problemSolvingAssessment', 'noOfProblemSolvingQuestions'],
    ['cultureFitAssessment', 'noOfCultureFitQuestions'],
  ] as const)('%s needs a count of 1–10 while on', async (toggle, count) => {
    const valid = (value: unknown) =>
      aiConfigValidationSchema.isValid(
        asFormikValidates({ ...base, [toggle]: 'true', [count]: value }),
      )
    expect(await valid('')).toBe(false)
    expect(await valid(0)).toBe(false)
    expect(await valid(11)).toBe(false)
    expect(await valid(2.5)).toBe(false)
    expect(await valid(1)).toBe(true)
    expect(await valid(10)).toBe(true)
    expect(
      await aiConfigValidationSchema.isValid(
        asFormikValidates({ ...base, [toggle]: 'false', [count]: '' }),
      ),
    ).toBe(true)
  })
})
