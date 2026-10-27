import { describe, expect, it } from 'vitest'

import { formatDateOnly, todayDateOnly } from './formatDate'

describe('formatDateOnly', () => {
  it('formats a date without shifting it across time zones', () => {
    expect(formatDateOnly('2026-01-01')).toBe('1 Jan 2026')
    expect(formatDateOnly('2026-12-31')).toBe('31 Dec 2026')
  })

  it('shows a dash when there is no date', () => {
    expect(formatDateOnly(null)).toBe('—')
    expect(formatDateOnly('')).toBe('—')
  })
})

describe('todayDateOnly', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayDateOnly()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
