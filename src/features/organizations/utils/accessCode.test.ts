import { describe, expect, it } from 'vitest'

import { formatAccessCodeInput, isCompleteAccessCode } from './accessCode'

describe('formatAccessCodeInput', () => {
  it('uppercases and adds the dash after four characters', () => {
    expect(formatAccessCodeInput('abcd')).toBe('ABCD')
    expect(formatAccessCodeInput('abcd2')).toBe('ABCD-2')
    expect(formatAccessCodeInput('abcd2345')).toBe('ABCD-2345')
  })

  it('drops spaces, symbols and anything past eight characters', () => {
    expect(formatAccessCodeInput(' ab cd-23 45 99')).toBe('ABCD-2345')
  })

  it('knows when the code is complete', () => {
    expect(isCompleteAccessCode('ABCD-2345')).toBe(true)
    expect(isCompleteAccessCode('ABCD-234')).toBe(false)
  })
})
