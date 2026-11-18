import { describe, expect, it } from 'vitest'

import { pageItems } from './Pagination'

describe('pageItems', () => {
  it('lists every page when there are only a few', () => {
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps the first, last and neighbouring pages and marks the gaps', () => {
    expect(pageItems(10, 20)).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ])
  })

  it('does not add a gap next to the first page', () => {
    expect(pageItems(2, 20)).toEqual([1, 2, 3, 'ellipsis', 20])
  })
})
