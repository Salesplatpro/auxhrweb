import { describe, expect, it } from 'vitest'

import {
  checkPassword,
  PASSWORD_PATTERN,
  passwordRuleItems,
  passwordStrength,
} from './passwordRules'

describe('passwordRules', () => {
  it('matches the backend pattern for valid passwords', () => {
    expect(PASSWORD_PATTERN.test('Acme2025!')).toBe(true)
    expect(PASSWORD_PATTERN.test('acme2025')).toBe(false)
    expect(PASSWORD_PATTERN.test('Acme2025^')).toBe(false)
  })

  it('enforces the 8 to 72 length window', () => {
    expect(checkPassword('a1!aaaa').length).toBe(false)
    expect(checkPassword(`a1!${'a'.repeat(69)}`).length).toBe(true)
    expect(checkPassword(`a1!${'a'.repeat(70)}`).length).toBe(false)
  })

  it('scores strength from the rules that are met', () => {
    expect(passwordStrength('').level).toBe('empty')
    expect(passwordStrength('abc').level).toBe('weak')
    expect(passwordStrength('abcdefg1').level).toBe('fair')
    expect(passwordStrength('abcdef1!')).toEqual({ level: 'strong', filled: 3 })
    expect(passwordStrength('abcdefghi1!x').level).toBe('veryStrong')
  })

  it('flags characters the backend refuses', () => {
    expect(passwordStrength('abcdef1!^').level).toBe('invalid')
    expect(passwordStrength(`a1!${'a'.repeat(70)}`).level).toBe('invalid')
  })

  it('marks the symbol rule unmet when a refused symbol is used', () => {
    const items = passwordRuleItems('abcdef1^')
    expect(items.map((item) => item.done)).toEqual([true, true, false])
  })
})
