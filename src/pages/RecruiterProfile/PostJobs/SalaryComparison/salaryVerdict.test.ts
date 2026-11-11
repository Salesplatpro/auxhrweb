import { describe, expect, it } from 'vitest'

import { salaryVerdict } from './useSalaryComparison'

describe('salaryVerdict', () => {
  it('counts pay within 10% of the middle as around it', () => {
    expect(salaryVerdict(340_000, 320_000)).toBe('around')
    expect(salaryVerdict(288_000, 320_000)).toBe('around')
    expect(salaryVerdict(250_000, 320_000)).toBe('below')
    expect(salaryVerdict(400_000, 320_000)).toBe('above')
  })
})
