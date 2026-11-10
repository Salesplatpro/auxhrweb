import { describe, expect, it } from 'vitest'

import {
  chooseRecordingMimeType,
  formatClock,
  isRecordingLimitReached,
  nextUnansweredIndex,
  RECORDING_LIMIT_SECONDS,
  secondsLeft,
  uploadPercent,
} from './interviewFlow'

describe('interviewFlow', () => {
  it('gives the two-minute limit for one answer', () => {
    expect(RECORDING_LIMIT_SECONDS).toBe(120)
    expect(secondsLeft(0)).toBe(120)
    expect(secondsLeft(45)).toBe(75)
    expect(secondsLeft(500)).toBe(0)
  })

  it('stops an answer exactly at the limit', () => {
    expect(isRecordingLimitReached(119)).toBe(false)
    expect(isRecordingLimitReached(120)).toBe(true)
  })

  it('finds the first question still without an answer', () => {
    expect(nextUnansweredIndex([])).toBe(-1)
    expect(nextUnansweredIndex([true, true])).toBe(-1)
    expect(nextUnansweredIndex([true, false, true])).toBe(1)
    expect(nextUnansweredIndex([false, true])).toBe(0)
  })

  it('formats seconds as a clock', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(120)).toBe('2:00')
  })

  it('turns bytes sent into a whole percent that never leaves 0 to 100', () => {
    expect(uploadPercent(0, 200)).toBe(0)
    expect(uploadPercent(50, 200)).toBe(25)
    expect(uploadPercent(300, 200)).toBe(100)
    expect(uploadPercent(10, 0)).toBe(0)
  })

  it('asks for video only when the interview is audio and video', () => {
    const supported = (type: string) =>
      type === 'video/webm' || type === 'audio/webm'
    expect(chooseRecordingMimeType('audio_video', supported)).toBe('video/webm')
    expect(chooseRecordingMimeType('audio', supported)).toBe('audio/webm')
    expect(chooseRecordingMimeType('audio', () => false)).toBe('')
  })
})
