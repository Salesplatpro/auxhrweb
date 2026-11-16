import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TestDraft {
  answers: Record<string, number | string>
  index: number
}

interface ApplicationTestsState {
  drafts: Record<string, TestDraft>
  setAnswer: (key: string, questionId: string, value: number | string) => void
  setIndex: (key: string, index: number) => void
  keepOnly: (key: string, questionIds: string[]) => void
  clear: (key: string) => void
  reset: () => void
}

const EMPTY: TestDraft = { answers: {}, index: 0 }

export const draftKey = (userId: string, applicationId: string, kind: string) =>
  `${userId}:${applicationId}:${kind}`

export const useApplicationTestsStore = create<ApplicationTestsState>()(
  persist(
    (set) => ({
      drafts: {},
      setAnswer: (key, questionId, value) =>
        set((state) => {
          const draft = state.drafts[key] ?? EMPTY
          return {
            drafts: {
              ...state.drafts,
              [key]: {
                ...draft,
                answers: { ...draft.answers, [questionId]: value },
              },
            },
          }
        }),
      setIndex: (key, index) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: { ...(state.drafts[key] ?? EMPTY), index },
          },
        })),
      keepOnly: (key, questionIds) =>
        set((state) => {
          const draft = state.drafts[key]
          if (!draft) return state
          const answers = Object.fromEntries(
            Object.entries(draft.answers).filter(([id]) =>
              questionIds.includes(id),
            ),
          )
          const index = Math.min(
            draft.index,
            Math.max(questionIds.length - 1, 0),
          )
          return { drafts: { ...state.drafts, [key]: { answers, index } } }
        }),
      clear: (key) =>
        set((state) => {
          const drafts = { ...state.drafts }
          delete drafts[key]
          return { drafts }
        }),
      reset: () => set({ drafts: {} }),
    }),
    { name: 'application-tests' },
  ),
)

export const useTestDraft = (key: string) =>
  useApplicationTestsStore((state) => state.drafts[key] ?? EMPTY)
