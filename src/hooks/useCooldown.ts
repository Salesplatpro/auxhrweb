import { useCallback, useEffect, useState } from 'react'

export const useCooldown = (seconds: number) => {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= endsAt) setEndsAt(null)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [endsAt])

  const start = useCallback(() => {
    const current = Date.now()
    setNow(current)
    setEndsAt(current + seconds * 1000)
  }, [seconds])

  const remaining =
    endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000))

  return { remaining, isCoolingDown: remaining > 0, start }
}

export const formatCountdown = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(
    2,
    '0',
  )}`
