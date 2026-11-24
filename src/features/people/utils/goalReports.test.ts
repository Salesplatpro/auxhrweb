import { describe, expect, it } from 'vitest'

import { periodLabel } from './goalReports'

describe('periodLabel', () => {
  it('names a day, a week or a month', () => {
    expect(periodLabel('daily', '2026-11-24')).toBe('24 Nov 2026')
    expect(periodLabel('weekly', '2026-11-23')).toBe('Week of 23 Nov 2026')
    expect(periodLabel('monthly', '2026-11-01')).toBe('Nov 2026')
  })
})
