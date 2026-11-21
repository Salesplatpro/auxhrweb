import { describe, expect, it } from 'vitest'

import {
  allRestricted,
  canOrder,
  emptyResult,
  eventTitle,
  OVERALL_LABEL,
  resultPayload,
  resultSchema,
  STATUS_LABEL,
} from './checkRules'
import type { ApplicationCheck } from './types'

describe('check rules', () => {
  it('names statuses the way the recruiter reads them', () => {
    expect(STATUS_LABEL.passed).toBe('Verified')
    expect(OVERALL_LABEL.none).toBe('Not ordered')
  })

  it('allows ordering only after the candidate agreed', () => {
    expect(canOrder('agreed')).toBe(true)
    for (const state of ['not_requested', 'requested', 'declined'] as const) {
      expect(canOrder(state)).toBe(false)
    }
  })

  it('knows when every check is hidden from the reader', () => {
    const hidden: ApplicationCheck = {
      id: '1',
      applicationId: 'a',
      type: 'education',
      restricted: true,
    }
    expect(allRestricted([])).toBe(false)
    expect(allRestricted([hidden])).toBe(true)
  })

  it('asks employment and education for who confirmed and a result', async () => {
    const schema = resultSchema('employment')
    const filled = {
      ...emptyResult(),
      confirmedBy: 'Tunde Bakare, Lagos Brand Co',
      result: 'verified',
    }
    expect(await schema.isValid(filled)).toBe(true)
    expect(await schema.isValid({ ...filled, confirmedBy: ' ' })).toBe(false)
    expect(await schema.isValid({ ...filled, result: 'maybe' })).toBe(false)
    expect(await schema.isValid({ ...filled, confirmedOn: '2999-01-01' })).toBe(
      false,
    )
  })

  it('asks identity only for the name on the ID', async () => {
    const schema = resultSchema('identity')
    expect(await schema.isValid(emptyResult())).toBe(false)
    expect(
      await schema.isValid({ ...emptyResult(), nameOnId: 'Amaka Obi' }),
    ).toBe(true)
  })

  it('sends only the fields each check type uses', () => {
    const values = {
      ...emptyResult(),
      confirmedBy: ' Registrar ',
      result: 'flagged',
      nameOnId: 'ignored',
      note: ' gap ',
    }
    expect(resultPayload('education', values)).toEqual({
      confirmedOn: values.confirmedOn,
      note: 'gap',
      confirmedBy: 'Registrar',
      result: 'flagged',
    })
    expect(resultPayload('identity', values)).toEqual({
      confirmedOn: values.confirmedOn,
      note: 'gap',
      nameOnId: 'ignored',
    })
  })

  it('titles history lines', () => {
    expect(eventTitle('ordered', null)).toBe('Ordered')
    expect(eventTitle('result_saved', 'failed')).toBe('Result saved: Failed')
    expect(eventTitle('id_number_viewed', null)).toBe('Viewed the ID number')
  })
})
