import { describe, expect, it } from 'vitest'

import {
  getStatusBadge,
  getStatusLabel,
  jobDisplayStatus,
} from './getJobStatus'

describe('getStatusBadge', () => {
  it('returns a distinct amber style for the talent-facing "awaiting-decision" status', () => {
    const badge = getStatusBadge('awaiting-decision')
    expect(badge).toEqual({ backgroundColor: '#fff4e2', color: '#c17600' })
  })

  it('returns the same amber style for the raw backend "awaiting_decision" status', () => {
    const badge = getStatusBadge('awaiting_decision')
    expect(badge).toEqual({ backgroundColor: '#fff4e2', color: '#c17600' })
  })

  it('falls back to the default style for an unrecognized status', () => {
    const badge = getStatusBadge('some-unknown-status')
    expect(badge).toEqual({ backgroundColor: '#edfeee', color: '#76c8bc' })
  })
})

describe('jobDisplayStatus', () => {
  it('marks a job awaiting payment whose checkout failed as payment failed', () => {
    const status = jobDisplayStatus({
      status: 'pending_payment',
      paymentStatus: 'failed',
    })
    expect(status).toBe('payment_failed')
    expect(getStatusLabel(status)).toBe('Payment failed')
  })

  it('keeps a job never paid for as awaiting payment', () => {
    const status = jobDisplayStatus({
      status: 'pending_payment',
      paymentStatus: null,
    })
    expect(getStatusLabel(status)).toBe('Awaiting payment')
  })
})
