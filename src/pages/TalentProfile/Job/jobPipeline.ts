export type PipelineStageId =
  | 'personality'
  | 'personalized'
  | 'prescreening'
  | 'cv_similarity'

export const STAGE_LABELS: Record<PipelineStageId | 'completed', string> = {
  personality: 'Personality',
  personalized: 'Personalized',
  prescreening: 'Prescreening',
  cv_similarity: 'CV match',
  completed: 'Complete',
}

const EXTRA_STAGE_LABELS: Record<string, string> = {
  problem_solving: 'Problem-solving test',
  culture_fit: 'Culture-fit test',
  ai_interview: 'AI interview',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  awaiting_decision: 'Awaiting decision',
  retake_assessment: 'Retake assessment',
  not_proceeding: 'Not proceeding',
}

export const humanStatus = (status?: string | null) =>
  STATUS_LABELS[status ?? ''] ?? (status ? status.replace(/_/g, ' ') : '—')

export const humanStage = (stage?: string | null) => {
  if (!stage) return '—'
  if (stage in STAGE_LABELS) {
    return STAGE_LABELS[stage as keyof typeof STAGE_LABELS]
  }
  return EXTRA_STAGE_LABELS[stage] ?? stage.replace(/_/g, ' ')
}
