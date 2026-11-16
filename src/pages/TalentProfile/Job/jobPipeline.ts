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

const STAGE_IDS: PipelineStageId[] = [
  'personality',
  'personalized',
  'prescreening',
  'cv_similarity',
]

const isStageId = (value: string): value is PipelineStageId =>
  STAGE_IDS.includes(value as PipelineStageId)

export const TALENT_OWNED_STAGES: PipelineStageId[] = [
  'personality',
  'personalized',
]

/** Auto stages the talent never sees — prescreening is global, CV match is recruiter-only. */
export const HIDDEN_TALENT_STAGES = new Set<PipelineStageId>([
  'prescreening',
  'cv_similarity',
])

/** Walk the linked-list stages map the same way createStages built it. */
export const orderedStageKeys = (
  stages: Record<string, string> | null | undefined,
): PipelineStageId[] => {
  if (!stages) return []
  const values = new Set(Object.values(stages))
  const keys = Object.keys(stages)
  const entry = keys.find((key) => !values.has(key))
  const ordered: PipelineStageId[] = []
  const visited = new Set<string>()
  let cursor: string | undefined = entry
  while (cursor && cursor !== 'completed' && !visited.has(cursor)) {
    visited.add(cursor)
    if (isStageId(cursor)) ordered.push(cursor)
    cursor = stages[cursor]
  }
  return ordered
}

/**
 * Stage the talent should see on CTAs and pipeline copy.
 * CV match / prescreening skip to the next talent-owned step, or complete.
 */
export const talentFacingStage = (
  currentStage: string | null | undefined,
  stages?: Record<string, string> | null,
): string | null => {
  if (!currentStage) return null
  if (currentStage === 'completed') return 'completed'
  if (isStageId(currentStage) && TALENT_OWNED_STAGES.includes(currentStage)) {
    return currentStage
  }

  const ordered = orderedStageKeys(stages)
  const currentIndex = ordered.indexOf(currentStage as PipelineStageId)
  const searchFrom = currentIndex < 0 ? 0 : currentIndex + 1
  const nextOwned = ordered
    .slice(searchFrom)
    .find((id) => TALENT_OWNED_STAGES.includes(id))
  return nextOwned ?? 'completed'
}

export const humanTalentStage = (
  currentStage?: string | null,
  stages?: Record<string, string> | null,
) => humanStage(talentFacingStage(currentStage, stages))
