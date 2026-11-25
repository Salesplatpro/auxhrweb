export interface AssessmentQuestion {
  questionId: string
  question: string
  category: string
  options: string[]
}

export interface Assessment {
  id: string
  status: 'pending' | 'completed'
  score: number | null
  attemptCount: number
  maxAttempts: number
  questions: AssessmentQuestion[]
  generatedAt: string
  roles: string[]
  /** True while questions are still being generated server-side (fire-and-forget). */
  generating?: boolean
  /** True after generation retries are exhausted. */
  generationFailed?: boolean
  /** The talent has a score from the last 90 days, so they can apply to jobs. */
  hasValidScore?: boolean
}

export interface ApiResponse<T> {
  status: boolean
  message?: string
  data: T
}

export interface SubmitPayload {
  answers: { questionId: string; selectedOption: number }[]
}
