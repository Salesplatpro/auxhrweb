import { create } from 'zustand'

import { clearAllOnboardingDrafts } from '@/features/onboarding/company/draftStorage'

import { AuthResponseData, AuthUser } from '../types'
import {
  clearPersistedSession,
  readPersistedSession,
  writePersistedSession,
  writePersistedUser,
} from '../utils/authPersistence'

type SetSessionOptions = {
  persist?: boolean
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  isLoggedIn: boolean
  isSubmitting: boolean
  error: string | null
  setSubmitting: (isSubmitting: boolean) => void
  setError: (error: string | null) => void
  setSession: (data: AuthResponseData, options?: SetSessionOptions) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

const persisted = readPersistedSession()

export const useAuthStore = create<AuthState>()((set) => ({
  user: persisted.user,
  token: persisted.token,
  isLoggedIn: !!persisted.token,
  isSubmitting: false,
  error: null,
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  setSession: ({ user, token }, options) => {
    writePersistedSession(user, token, options?.persist)
    set({ user, token, isLoggedIn: true, error: null })
  },
  setUser: (user) => {
    writePersistedUser(user)
    set({ user, isLoggedIn: true })
  },
  logout: () => {
    clearPersistedSession()
    clearAllOnboardingDrafts()
    set({ user: null, token: null, isLoggedIn: false, error: null })

    void Promise.all([
      import('@/redux/store/store'),
      import('@/redux/api/talent'),
      import('@/redux/api/recruiter'),
      import('@/features/scout/store/useScoutStore'),
      import('@/features/profile/store/useProfileStore'),
      import('@/features/admin/store/useRolesStore'),
      import('@/features/jobs/store/useJobDraftStore'),
      import('@/features/jobs/store/useJobEditDraftStore'),
      import('@/features/jobs/store/useAiConfigDraftStore'),
      import('@/features/pre-assessment/store'),
      import('@/features/pre-assessment/lockStore'),
    ])
      .then(
        ([
          { store },
          { talentApi },
          { recruiterApi },
          { useScoutStore },
          { useProfileStore },
          { useRolesStore },
          { useJobDraftStore },
          { useJobEditDraftStore },
          { useAiConfigDraftStore },
          { usePreAssessmentStore },
          { useAssessmentLockStore },
        ]) => {
          store.dispatch(talentApi.util.resetApiState())
          store.dispatch(recruiterApi.util.resetApiState())
          useScoutStore.getState().resetScout()
          useProfileStore.getState().clearProfile()
          useRolesStore.getState().reset()
          useJobDraftStore.getState().clearDraft()
          useJobEditDraftStore.getState().clearAllDrafts()
          useAiConfigDraftStore.getState().clearAllDrafts()
          usePreAssessmentStore.getState().reset()
          useAssessmentLockStore.getState().unlock()
        },
      )
      .finally(() => {
        // A full reload guarantees no stale in-memory state survives into the
        // next session, matching the 401-interceptor's existing behavior — the
        // explicit resets above are defense-in-depth for anything read
        // synchronously before the reload completes.
        window.location.href = '/login'
      })
  },
}))
