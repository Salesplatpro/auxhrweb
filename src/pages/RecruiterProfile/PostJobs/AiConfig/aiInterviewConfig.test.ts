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

describe('interview switch', () => {
  it('is off by default, with audio and video ready for when it is switched on', () => {
    expect(AI_CONFIG_DEFAULT_VALUES.aiInterview).toBe('false')
    expect(AI_CONFIG_DEFAULT_VALUES.aiInterviewMode).toBe('audio_video')
  })

  it('loads from a saved setup', () => {
    const values = aiConfigFromApi({
      aiInterview: true,
      aiInterviewMode: 'audio_video',
    })
    expect(values.aiInterview).toBe('true')
    expect(values.aiInterviewMode).toBe('audio_video')
    const off = aiConfigFromApi({ aiInterview: false, aiInterviewMode: null })
    expect(off.aiInterview).toBe('false')
    expect(off.aiInterviewMode).toBe('audio_video')
  })

  it('is sent as a boolean with its mode when on', () => {
    const payload = aiConfigToPayload({
      ...base,
      aiInterview: 'true',
      aiInterviewMode: 'audio',
    })
    expect(payload.aiInterview).toBe(true)
    expect(payload.aiInterviewMode).toBe('audio')
  })

  it('drops the mode when the interview is off', () => {
    const payload = aiConfigToPayload({
      ...base,
      aiInterview: 'false',
      aiInterviewMode: 'audio',
    })
    expect(payload.aiInterview).toBe(false)
    expect('aiInterviewMode' in payload).toBe(false)
  })

  it('needs audio only or audio and video while on', async () => {
    const valid = (aiInterview: string, aiInterviewMode: unknown) =>
      aiConfigValidationSchema.isValid(
        asFormikValidates({ ...base, aiInterview, aiInterviewMode }),
      )
    expect(await valid('true', '')).toBe(false)
    expect(await valid('true', 'video')).toBe(false)
    expect(await valid('true', 'audio')).toBe(true)
    expect(await valid('true', 'audio_video')).toBe(true)
    expect(await valid('false', '')).toBe(true)
  })
})
