import { describe, expect, it } from 'vitest'

import { answeredSummary, canResend, resendMessage } from './referenceReview'

describe('reference review rules', () => {
  it('lets the company resend to anyone who has not answered', () => {
    expect(canResend('not_sent')).toBe(true)
    expect(canResend('sent')).toBe(true)
    expect(canResend('expired')).toBe(true)
    expect(canResend('answered')).toBe(false)
  })

  it('says how many referees have answered', () => {
    expect(
      answeredSummary([
        { status: 'answered' },
        { status: 'sent' },
        { status: 'answered' },
      ]),
    ).toBe('2 of 3 answered')
    expect(answeredSummary([])).toBeNull()
  })

  it('tells the company whether the new link went out', () => {
    expect(resendMessage('sent', 'Alan Turing')).toBe(
      'A new link is on its way to Alan Turing',
    )
    expect(resendMessage('not_sent', 'Alan Turing')).toBe(
      "We couldn't email Alan Turing. Try resending in a moment.",
    )
  })
})
