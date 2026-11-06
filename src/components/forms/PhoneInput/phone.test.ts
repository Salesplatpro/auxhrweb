import { describe, expect, it } from 'vitest'

import { buildPhone, parsePhone, phoneLeadingZeroMessage } from './phone'

describe('phone helpers', () => {
  it('builds an international number without spaces', () => {
    expect(buildPhone('NG', '805 827 2524')).toBe('+2348058272524')
  })

  it('returns an empty string when no digits are typed', () => {
    expect(buildPhone('NG', '  ')).toBe('')
  })

  it('parses the longest matching dial code', () => {
    expect(parsePhone('+16845551234')).toEqual({
      iso: 'AS',
      national: '5551234',
    })
  })

  it('prefers the current country when a dial code is shared', () => {
    expect(parsePhone('+14165550000', 'CA').iso).toBe('CA')
    expect(parsePhone('+12025550000', 'NG').iso).toBe('US')
  })

  it('keeps a legacy value without a plus sign as raw text', () => {
    expect(parsePhone('0805 827 2524')).toEqual({
      iso: 'NG',
      national: '0805 827 2524',
    })
  })

  it('asks to remove the leading zero after the dial code', () => {
    expect(phoneLeadingZeroMessage('+23408058272524')).toBe(
      'Remove the first 0. After +234 it should read 805 827 2524.',
    )
  })

  it('allows the leading zero where it is part of the number', () => {
    expect(phoneLeadingZeroMessage('+390612345678')).toBeUndefined()
  })

  it('ignores valid and legacy numbers', () => {
    expect(phoneLeadingZeroMessage('+2348058272524')).toBeUndefined()
    expect(phoneLeadingZeroMessage('0805 827 2524')).toBeUndefined()
    expect(phoneLeadingZeroMessage('')).toBeUndefined()
  })
})
