import { describe, expect, it } from 'vitest'

import { splitRoleValues } from './diffProfileValues'

describe('splitRoleValues', () => {
  it('sends picked roles as ids and typed roles as names', () => {
    expect(
      splitRoleValues([
        '7d3c6f0e-1b2a-4c3d-8e9f-0a1b2c3d4e5f',
        'Solar Installer',
      ]),
    ).toEqual({
      roleIds: ['7d3c6f0e-1b2a-4c3d-8e9f-0a1b2c3d4e5f'],
      newRoles: ['Solar Installer'],
    })
  })
})
