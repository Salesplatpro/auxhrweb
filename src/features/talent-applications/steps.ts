import { PipelineStep, PipelineStepKey } from './types'

export const STEP_TITLE: Record<PipelineStepKey, string> = {
  applied: 'Applied',
  skills_test: 'Skills test',
  cv_match: 'CV match',
  tailored: 'Tailored questions',
  problem_solving: 'Problem-solving test',
  culture_fit: 'Culture-fit test',
  personality: 'Personality check',
  ai_interview: 'Recorded AI interview',
  references: 'References',
  checks: 'Background checks',
  company_review: 'Company review',
}

export type TestKind =
  | 'problem-solving'
  | 'culture-fit'
  | 'tailored'
  | 'personality'

export const TEST_KIND_BY_STEP: Partial<Record<PipelineStepKey, TestKind>> = {
  tailored: 'tailored',
  problem_solving: 'problem-solving',
  culture_fit: 'culture-fit',
  personality: 'personality',
}

export const applicationPath = (applicationId: string) =>
  `/talentDashboard/applications/${applicationId}`

export const stepActionPath = (
  applicationId: string,
  step: PipelineStep,
): string | null => {
  const kind = TEST_KIND_BY_STEP[step.key]
  if (kind) return `${applicationPath(applicationId)}/test/${kind}`
  if (step.key === 'skills_test') return '/talentDashboard/talentQuiz'
  if (step.key === 'references') {
    return `${applicationPath(applicationId)}/references`
  }
  if (step.key === 'checks') return `${applicationPath(applicationId)}/checks`
  if (step.key === 'ai_interview' && step.interviewId) {
    return `/talentDashboard/interview/${step.interviewId}`
  }
  return null
}
