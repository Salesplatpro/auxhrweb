import { describe, expect, it } from 'vitest'

import {
  consentSchema,
  digitsOnly,
  ID_NUMBER_LENGTH,
  INITIAL_CONSENT,
} from './consentRules'

describe('consent rules', () => {
  it('keeps only the first 11 digits of what is typed', () => {
    expect(ID_NUMBER_LENGTH).toBe(11)
    expect(digitsOnly('123 456-789 0123456')).toBe('12345678901')
    expect(digitsOnly('abc')).toBe('')
  })

  it('needs exactly 11 digits and the tick box', async () => {
    const valid = { ...INITIAL_CONSENT, idNumber: '12345678901', agreed: true }
    expect(await consentSchema.isValid(valid)).toBe(true)
    expect(
      await consentSchema.isValid({ ...valid, idNumber: '1234567890' }),
    ).toBe(false)
    expect(await consentSchema.isValid({ ...valid, agreed: false })).toBe(false)
    expect(await consentSchema.isValid({ ...valid, idKind: 'passport' })).toBe(
      false,
    )
  })
})
