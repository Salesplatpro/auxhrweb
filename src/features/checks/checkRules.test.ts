import { describe, expect, it } from 'vitest'

import {
  checkRows,
  checkStatusLabel,
  consentView,
  orderBlockReason,
  overallView,
} from './checkRules'
import type { ApplicationCheck, CheckConsent } from './types'

const agreed: CheckConsent = {
  applicationId: 'app-1',
  consented: true,
  version: '2026-11-v1',
  agreedAt: '2026-11-03T12:00:00Z',
}

const notAgreed: CheckConsent = {
  applicationId: 'app-1',
  consented: false,
  version: null,
  agreedAt: null,
}

const check = (
  type: ApplicationCheck['type'],
  status: ApplicationCheck['status'],
  createdAt = '2026-11-04T09:00:00Z',
): ApplicationCheck => ({
  id: `${type}-${status}-${createdAt}`,
  type,
  status,
  resultText: null,
  orderedById: 'user-1',
  createdAt,
  updatedAt: createdAt,
})

describe('consentView', () => {
  it('shows the day the candidate agreed', () => {
    expect(consentView(agreed)).toEqual({
      given: true,
      label: 'Agreed 3 Nov 2026',
    })
  })

  it('says the candidate has not agreed yet', () => {
    expect(consentView(notAgreed)).toEqual({
      given: false,
      label: 'Not agreed yet',
    })
  })

  it('treats a missing lookup as not agreed', () => {
    expect(consentView(undefined)).toEqual({
      given: false,
      label: 'Not agreed yet',
    })
  })
})

describe('orderBlockReason', () => {
  it('gives the reason and blocks ordering until the candidate agrees', () => {
    expect(orderBlockReason(notAgreed)).toBe(
      'Ordering opens once the candidate agrees to background checks.',
    )
  })

  it('allows ordering once the candidate has agreed', () => {
    expect(orderBlockReason(agreed)).toBeNull()
  })

  it('blocks ordering while the consent lookup is unknown', () => {
    expect(orderBlockReason(undefined)).not.toBeNull()
  })
})

describe('checkRows', () => {
  it('returns one row per check type in order, with the latest check of each type', () => {
    const rows = checkRows([
      check('identity', 'failed', '2026-11-04T09:00:00Z'),
      check('identity', 'passed', '2026-11-05T09:00:00Z'),
      check('criminal', 'flagged'),
    ])

    expect(rows.map((row) => row.type)).toEqual([
      'identity',
      'employment',
      'education',
      'criminal',
    ])
    expect(rows.map((row) => row.label)).toEqual([
      'Identity',
      'Employment',
      'Education',
      'Criminal record',
    ])
    expect(rows[0].check?.status).toBe('passed')
    expect(rows[1].check).toBeNull()
    expect(rows[3].check?.status).toBe('flagged')
  })
})

describe('checkStatusLabel', () => {
  it('names each status and says when a check was never ordered', () => {
    expect(checkStatusLabel(null)).toBe('Not ordered')
    expect(checkStatusLabel('pending')).toBe('Pending')
    expect(checkStatusLabel('passed')).toBe('Passed')
    expect(checkStatusLabel('flagged')).toBe('Flagged')
    expect(checkStatusLabel('failed')).toBe('Failed')
  })
})

describe('overallView', () => {
  it.each([
    ['failed', 'Failed', 'danger'],
    ['flagged', 'Flagged', 'warning'],
    ['pending', 'Pending', 'neutral'],
    ['verified', 'Verified', 'success'],
    ['none', 'No checks yet', 'neutral'],
  ] as const)('maps %s to %s with a %s tone', (status, label, tone) => {
    expect(overallView(status)).toEqual({ label, tone })
  })
})
