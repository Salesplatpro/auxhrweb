export type ReferenceQuestion = {
  key: string
  question: string
  required: boolean
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
