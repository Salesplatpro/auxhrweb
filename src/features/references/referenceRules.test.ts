import { describe, expect, it } from 'vitest'

import {
  canNameAnotherReferee,
  EMPTY_REFEREE,
  MAX_REFEREES,
  refereeSchema,
  refereesSchema,
  REFERENCE_STATUS_LABEL,
} from './referenceRules'

describe('reference rules', () => {
  it('names the four statuses in plain words', () => {
    expect(REFERENCE_STATUS_LABEL).toEqual({
      not_sent: 'Not sent',
      sent: 'Sent',
      answered: 'Answered',
      expired: 'Link expired',
    })
  })

  it('allows up to three referees and no more', () => {
    expect(MAX_REFEREES).toBe(3)
    expect(canNameAnotherReferee(0)).toBe(true)
    expect(canNameAnotherReferee(2)).toBe(true)
    expect(canNameAnotherReferee(3)).toBe(false)
  })

  it('requires a name, a valid email and a relationship', async () => {
    const message = (field: string, values: Record<string, string>) =>
      refereeSchema.validateAt(field, values).catch((e) => e.message)
    const filled = {
      name: 'Ada Obi',
      email: 'ada@example.com',
      relationship: 'Manager',
    }

    expect(await message('name', { ...filled, name: '  ' })).toBe(
      "Enter the referee's name",
    )
    expect(await message('email', { ...filled, email: 'not-an-email' })).toBe(
      'Enter a valid email address',
    )
    expect(await message('relationship', { ...filled, relationship: '' })).toBe(
      'Choose how you know them',
    )
    expect(await refereeSchema.isValid(EMPTY_REFEREE)).toBe(false)
  })

  it('accepts a complete referee', async () => {
    const valid = {
      name: ' Ada Obi ',
      email: 'ada@example.com',
      relationship: 'manager',
    }
    expect(await refereeSchema.isValid(valid)).toBe(true)
    expect(
      await refereeSchema.isValid({ ...valid, relationship: 'Former manager' }),
    ).toBe(false)
  })

  it('limits new referees to the free slots and refuses the same email twice', async () => {
    const row = (email: string) => ({
      name: 'Ada Obi',
      email,
      relationship: 'client',
    })
    const schema = refereesSchema(2)
    expect(await schema.isValid({ referees: [] })).toBe(false)
    expect(
      await schema.isValid({ referees: [row('a@x.com'), row('b@x.com')] }),
    ).toBe(true)
    expect(
      await schema.isValid({
        referees: [row('a@x.com'), row('b@x.com'), row('c@x.com')],
      }),
    ).toBe(false)
    expect(
      await schema.isValid({ referees: [row('a@x.com'), row('A@x.com')] }),
    ).toBe(false)
  })
})
