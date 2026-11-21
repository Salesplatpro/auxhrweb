export type ReferenceQuestion = {
  key: string
  question: string
  required: boolean
  type?: 'text' | 'yesno'
}

export type LinkGoneDetails = {
  jobTitle: string | null
  companyName: string | null
  companyEmail: string | null
}

export const ANSWER_MAX_LENGTH = 2000

export type LinkProblem = 'expired' | 'missing'

export const answersComplete = (
  questions: ReferenceQuestion[],
  answers: Record<string, string>,
) =>
  questions
    .filter((item) => item.required)
    .every((item) => (answers[item.key] ?? '').trim().length > 0)

export const answersWithinLimit = (answers: Record<string, string>) =>
  Object.values(answers).every((answer) => answer.length <= ANSWER_MAX_LENGTH)

export const linkProblemFor = (status?: number): LinkProblem | null => {
  if (status === 410) return 'expired'
  if (status === 404 || status === 400) return 'missing'
  return null
}

export const goneDetailsFrom = (error: unknown): LinkGoneDetails | null => {
  const details = (
    error as {
      response?: { data?: { error?: { details?: LinkGoneDetails } } }
    }
  )?.response?.data?.error?.details
  return details ?? null
}
