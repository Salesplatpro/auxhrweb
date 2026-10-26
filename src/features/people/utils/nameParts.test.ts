import { describe, expect, it } from 'vitest'

import { nameParts } from './nameParts'

describe('nameParts', () => {
  it('uses the first and last word', () => {
    expect(nameParts('Ada Mary Obi')).toEqual({
      firstName: 'Ada',
      lastName: 'Obi',
    })
  })

  it('copes with one name, extra spaces and nothing at all', () => {
    expect(nameParts('  Ada  ')).toEqual({ firstName: 'Ada', lastName: '' })
    expect(nameParts('')).toEqual({ firstName: '', lastName: '' })
  })
})
