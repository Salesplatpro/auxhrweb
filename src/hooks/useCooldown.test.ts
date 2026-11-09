import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatCountdown, useCooldown } from './useCooldown'

describe('useCooldown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts down and then ends', () => {
    const { result } = renderHook(() => useCooldown(3))
    expect(result.current.isCoolingDown).toBe(false)

    act(() => result.current.start())
    expect(result.current.remaining).toBe(3)

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.remaining).toBe(2)

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.isCoolingDown).toBe(false)
  })

  it('stops its timer on unmount', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval')
    const { result, unmount } = renderHook(() => useCooldown(30))
    act(() => result.current.start())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })

  it('formats seconds as m:ss', () => {
    expect(formatCountdown(38)).toBe('0:38')
    expect(formatCountdown(60)).toBe('1:00')
  })
})
