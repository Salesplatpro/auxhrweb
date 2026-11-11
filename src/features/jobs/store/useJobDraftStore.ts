import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { PostJobFormValues } from '@/utils/jobPostTypes'

interface JobDraftStore {
  draft: PostJobFormValues | null
  /** When the draft was last saved, in ms since the epoch. */
  savedAt: number | null
  saveDraft: (values: PostJobFormValues) => void
  clearDraft: () => void
}

export const useJobDraftStore = create<JobDraftStore>()(
  persist(
    (set) => ({
      draft: null,
      savedAt: null,
      saveDraft: (values) => set({ draft: values, savedAt: Date.now() }),
      clearDraft: () => set({ draft: null, savedAt: null }),
    }),
    { name: 'job-draft' },
  ),
)
