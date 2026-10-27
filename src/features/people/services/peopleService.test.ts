import { describe, expect, it } from 'vitest'

import { toQueryString } from './peopleService'

describe('toQueryString', () => {
  it('leaves out empty filters and a zero offset', () => {
    expect(
      toQueryString({ search: '', status: '', limit: 10, offset: 0 }),
    ).toBe('limit=10')
  })

  it('keeps real filters and encodes them', () => {
    expect(
      toQueryString({ search: 'ada & bayo', status: 'active', offset: 20 }),
    ).toBe('search=ada+%26+bayo&status=active&offset=20')
  })
})
