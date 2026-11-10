import {
  type PipelineStageId,
  humanStage,
  TALENT_OWNED_STAGES,
} from '@/pages/TalentProfile/Job/jobPipeline'
import { AllJobTypes } from '@/utils/types'

const OPEN_STATUSES = new Set(['pending', 'retake_assessment'])
const IN_REVIEW_STATUSES = new Set(['pending', 'awaiting_decision'])

export const STRONG_PROFILE_PERCENT = 80

export const applicationCounts = (applications: AllJobTypes[]) => ({
  applied: applications.length,
  inReview: applications.filter((app) =>
    IN_REVIEW_STATUSES.has(app.status ?? ''),
  ).length,
  shortlisted: applications.filter((app) => app.status === 'shortlisted')
    .length,
})

export const waitingOnTalent = (applications: AllJobTypes[]) =>
  applications
    .filter(
      (app) =>
        !!app.job?.id &&
        OPEN_STATUSES.has(app.status ?? '') &&
        TALENT_OWNED_STAGES.includes(app.currentStage as PipelineStageId),
    )
    .map((app) => ({
      applicationId: app.id ?? app.job!.id!,
      jobId: app.job!.id!,
      title: app.job?.role?.name ?? 'Job',
      company: app.job?.organization?.name ?? null,
      stage: `${humanStage(app.currentStage)} test`,
    }))

export const newMatchesLine = (count: number) =>
  count > 0
    ? `${count} new role${count === 1 ? '' : 's'} ${
        count === 1 ? 'matches' : 'match'
      } your profile today.`
    : 'Here are the roles that fit you best.'

const capitalize = (word: string) =>
  word ? word[0].toUpperCase() + word.slice(1) : word

export const placeAndMode = (
  place: Array<string | null | undefined>,
  workMode: string[],
) =>
  [
    place.filter(Boolean)[0] ?? null,
    workMode.map(capitalize).join(', ') || null,
  ]
    .filter(Boolean)
    .join(' · ')

export const yearsLabel = (years?: number | null, experience?: string) => {
  if (typeof years === 'number' && years > 0) {
    return `${years} yr${years === 1 ? '' : 's'}`
  }
  return experience || null
}
