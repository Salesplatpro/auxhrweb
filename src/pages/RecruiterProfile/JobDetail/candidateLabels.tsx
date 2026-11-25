import React from 'react'
import { LuClock3, LuPlay, LuRefreshCw, LuVideo } from 'react-icons/lu'

import { Pill, PillTone } from '@/components/ui/Pill'
import type {
  BoardColumn,
  InterviewProgress,
  ProgressStage,
  VerificationState,
  WaitingFor,
} from '@/utils/recruiterJobPostsTypes'

export const BOARD_COLUMNS: { key: BoardColumn; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'cv_matched', label: 'CV Matched' },
  { key: 'pre_screened', label: 'Pre-Screened' },
  { key: 'personality_test', label: 'Personality Test' },
  { key: 'shortlisted', label: 'Shortlisted' },
]

const STAGE_LABELS: Record<ProgressStage, string> = {
  applied: 'Applied',
  cv_matched: 'CV Matched',
  pre_screened: 'Pre-Screened',
  personality_test: 'Personality Test',
  interview: 'Interview',
}

export const stageLabel = (stage?: ProgressStage) =>
  stage ? STAGE_LABELS[stage] : '—'

const WAITING_FOR: Record<WaitingFor, string> = {
  prescreening: 'the pre-assessment',
  cv_similarity: 'the CV match',
  personalized: 'the tailored questions',
  problem_solving: 'the problem-solving test',
  culture_fit: 'the culture-fit test',
  personality: 'the personality test',
  ai_interview: 'the AI interview',
  completed: 'the last step',
  references: 'a referee',
}

/** The CV match is under the job's minimum. It only flags the candidate; they still move on. */
export const BelowCvMinimum = () => (
  <Pill tone="warning" size="sm">
    Below your CV minimum
  </Pill>
)

/** Why a candidate can't be shortlisted yet, e.g. "Waiting for a referee". */
export const waitingForLabel = (waitingFor?: WaitingFor | null) =>
  `Waiting for ${waitingFor ? WAITING_FOR[waitingFor] : 'their next step'}`

const INTERVIEW: Record<
  InterviewProgress,
  { label: string; tone: PillTone; icon: React.ReactNode }
> = {
  ready: { label: 'Ready', tone: 'success', icon: <LuPlay /> },
  processing: { label: 'Processing', tone: 'brand', icon: <LuRefreshCw /> },
  in_progress: { label: 'In progress', tone: 'warning', icon: <LuClock3 /> },
  not_started: { label: 'Not started', tone: 'neutral', icon: <LuVideo /> },
}

export const INTERVIEW_FILTERS: {
  value: InterviewProgress | ''
  label: string
}[] = [
  { value: '', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'not_started', label: 'Not started' },
]

const VERIFICATION: Record<
  VerificationState,
  { label: string; tone: PillTone }
> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  flagged: { label: 'Flagged', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  none: { label: 'Not ordered', tone: 'neutral' },
}

export const VERIFICATION_FILTERS: {
  value: VerificationState | ''
  label: string
}[] = [
  { value: '', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'failed', label: 'Failed' },
  { value: 'none', label: 'Not ordered' },
]

export const VerificationPill = ({
  status,
}: {
  status?: VerificationState
}) => {
  const config = VERIFICATION[status ?? 'none']
  return (
    <Pill tone={config.tone} size="sm">
      {config.label}
    </Pill>
  )
}

export const InterviewPill = ({
  status,
  failed = false,
}: {
  status?: InterviewProgress
  failed?: boolean
}) => {
  if (failed) {
    return (
      <Pill tone="danger" size="sm" icon={<LuRefreshCw />}>
        Couldn&apos;t score
      </Pill>
    )
  }
  const config = INTERVIEW[status ?? 'not_started'] ?? INTERVIEW.not_started
  return (
    <Pill tone={config.tone} size="sm" icon={config.icon}>
      {config.label}
    </Pill>
  )
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  indeed: 'Indeed',
  x: 'X',
  facebook: 'Facebook',
}

export const SOURCE_FILTERS = [
  { value: '', label: 'All' },
  ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
]

/** No source means the candidate applied on AuxHR itself. */
export const sourceLabel = (source?: string | null) => {
  if (!source) return 'AuxHR'
  return (
    SOURCE_LABELS[source] ?? source.charAt(0).toUpperCase() + source.slice(1)
  )
}
