import { describe, expect, it } from 'vitest'

import { matchTeaserCount } from './matchTeaser'

describe('matchTeaserCount', () => {
  it('gives the same user the same number every time', () => {
    const id = '79c3833c-44b2-4420-863b-32b9af8a73e9'
    expect(matchTeaserCount(id)).toBe(matchTeaserCount(id))
  })

  it('stays between 8 and 24', () => {
    const counts = Array.from({ length: 500 }, (_, index) =>
      matchTeaserCount(`user-${index}-${index * 7919}`),
    )
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(8)
    expect(Math.max(...counts)).toBeLessThanOrEqual(24)
    expect(new Set(counts).size).toBeGreaterThan(5)
  })

  it('still gives a number without a user id', () => {
    expect(matchTeaserCount(undefined)).toBe(8)
  })
})
