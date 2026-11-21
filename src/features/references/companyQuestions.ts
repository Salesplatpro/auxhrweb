export type ReferenceQuestionType = 'text' | 'yesno'

export type CompanyQuestion = {
  key?: string
  question: string
  type: ReferenceQuestionType
  required: boolean
}

export type JobWithWaitingReferees = {
  jobId: string
  title: string
  status: string
  createdAt: string
  waiting: number
}

export type JobSort = 'waiting' | 'newest'

export const MAX_COMPANY_QUESTIONS = 15
export const MAX_QUESTION_LENGTH = 300
export const MAX_GENERATED_QUESTIONS = 10

export const QUESTION_TYPE_OPTIONS = [
  { value: 'text', label: 'Written answer' },
  { value: 'yesno', label: 'Yes or No' },
]

export const emptyQuestion = (): CompanyQuestion => ({
  question: '',
  type: 'text',
  required: true,
})

export const questionsToSave = (questions: CompanyQuestion[]) =>
  questions
    .map((item) => ({ ...item, question: item.question.trim() }))
    .filter((item) => item.question.length > 0)

export const questionListProblem = (
  questions: CompanyQuestion[],
): string | null => {
  const kept = questionsToSave(questions)
  if (kept.length > MAX_COMPANY_QUESTIONS)
    return `You can have at most ${MAX_COMPANY_QUESTIONS} questions`
  if (kept.some((item) => item.question.length > MAX_QUESTION_LENGTH))
    return `Keep each question under ${MAX_QUESTION_LENGTH} characters`
  return null
}

export const roomForQuestions = (questions: CompanyQuestion[]) =>
  Math.max(0, MAX_COMPANY_QUESTIONS - questionsToSave(questions).length)

export const sortJobs = (jobs: JobWithWaitingReferees[], sort: JobSort) =>
  [...jobs].sort((a, b) =>
    sort === 'waiting' && b.waiting !== a.waiting
      ? b.waiting - a.waiting
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

export const waitingTotal = (
  jobs: JobWithWaitingReferees[],
  selected: string[],
) =>
  jobs
    .filter((job) => selected.includes(job.jobId))
    .reduce((sum, job) => sum + job.waiting, 0)
