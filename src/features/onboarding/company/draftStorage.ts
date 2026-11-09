import { useEffect, useState } from 'react'

export const COMPANY_DRAFT_PREFIX = 'auxhr:company-draft:'
export const PROFILE_DRAFT_PREFIX = 'auxhr:profile-draft:'

const SAVE_DELAY_MS = 600

export const clearAllOnboardingDrafts = () => {
  try {
    Object.keys(window.localStorage)
      .filter(
        (key) =>
          key.startsWith(COMPANY_DRAFT_PREFIX) ||
          key.startsWith(PROFILE_DRAFT_PREFIX),
      )
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    return
  }
}

export const useDraftAutosave = <T>(
  key: string | null,
  values: T,
  cleared: { current: boolean },
  isBlank: (values: T) => boolean,
) => {
  const [saved, setSaved] = useState(false)
  const serialized = JSON.stringify(values)
  const blank = isBlank(values)

  useEffect(() => {
    if (!key || cleared.current || blank) return
    const timer = window.setTimeout(() => {
      if (cleared.current) return
      try {
        window.localStorage.setItem(key, serialized)
        setSaved(true)
      } catch {
        setSaved(false)
      }
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [key, serialized, blank])

  return saved
}
