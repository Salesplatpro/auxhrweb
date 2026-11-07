import { useCallback, useMemo, useRef } from 'react'

import { PROFILE_DRAFT_PREFIX } from '../company/draftStorage'
import { ProfileBuilderValues } from './profileBuilder'

export type ProfileDraft = {
  baseUpdatedAt: string | null
  values: ProfileBuilderValues
}

const draftKey = (userId?: string | null) =>
  userId ? `${PROFILE_DRAFT_PREFIX}${userId}` : null

export const isProfileDraftBlank = (draft: ProfileDraft) =>
  !draft.values.fullName.trim() && !draft.values.bio.trim()

/**
 * Returns the saved draft only when it was made on top of the profile the server has
 * now, so edits made elsewhere since are never overwritten by an old draft.
 */
export const readProfileDraft = (
  userId: string | null | undefined,
  updatedAt: string | null | undefined,
): Partial<ProfileBuilderValues> | null => {
  const key = draftKey(userId)
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ProfileDraft> | null
    if (!parsed || typeof parsed.values !== 'object' || !parsed.values) {
      return null
    }
    if ((parsed.baseUpdatedAt ?? null) !== (updatedAt ?? null)) return null
    return parsed.values
  } catch {
    return null
  }
}

export const useProfileDraft = (userId?: string | null) => {
  const key = draftKey(userId)
  const cleared = useRef(false)

  const clear = useCallback(() => {
    if (!key) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      return
    }
  }, [key])

  return useMemo(() => ({ key, cleared, clear }), [key, clear])
}
