import cn from 'classnames'
import React, { useMemo, useState } from 'react'
import { LuExternalLink, LuPlay, LuRefreshCw, LuSparkles } from 'react-icons/lu'

import { EmptyState } from '@/components/ui/EmptyState'
import { IconBadge } from '@/components/ui/IconBadge'
import { SegmentedProgress } from '@/components/ui/SegmentedProgress'
import { TipCard } from '@/components/ui/TipCard'
import type {
  NextStep,
  RecruiterInterview,
  ScreenLeaveKind,
} from '@/utils/recruiterJobPostsTypes'

import styles from './CandidatePanel.module.scss'
import { Clip, clock, InterviewPlayer, JumpRequest } from './InterviewPlayer'
import { AiSuggestion } from './PanelOverview'

const SCORE_ROWS = [
  { key: 'clearSpeaking', label: 'Clear speaking' },
  { key: 'fitForRole', label: 'Fit for the role' },
  { key: 'confidence', label: 'Confidence' },
] as const

const LEAVE_LABELS: Record<ScreenLeaveKind, string> = {
  tab_hidden: 'Switched tab or app',
  window_blur: 'Clicked away from the window',
  fullscreen_exit: 'Left full screen',
}

const timeOfDay = (value: string) =>
  new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

const startedLabel = (value: string) => {
  const date = new Date(value)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  return `${
    sameDay
      ? 'Today'
      : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }, ${timeOfDay(value)}`
}

const toClips = (interview: RecruiterInterview): Clip[] => {
  let start = 0
  return interview.questions
    .filter((question) => question.recorded)
    .map((question) => {
      const length = question.durationSeconds ?? 0
      const clip = {
        ...question,
        label: question.isFollowUp
          ? `${question.position}a`
          : String(question.position),
        start,
        length,
      }
      start += length
      return clip
    })
}

const Details = ({
  interview,
  clips,
}: {
  interview: RecruiterInterview
  clips: Clip[]
}) => {
  const main = interview.questions.filter(
    (question) => !question.isFollowUp,
  ).length
  const followUps = interview.questions.length - main
  const total = clips.reduce((sum, clip) => sum + clip.length, 0)
  const minutes = Math.floor(total / 60)
  return (
    <section>
      <h3 className={styles.sectionTitle}>Interview details</h3>
      <dl className={styles.details}>
        <dt>Type</dt>
        <dd>{interview.mode === 'audio' ? 'Audio' : 'Audio and video'}</dd>
        <dt>Questions</dt>
        <dd>
          {main}
          {followUps > 0
            ? ` + ${followUps} follow-up${followUps === 1 ? '' : 's'}`
            : ''}
        </dd>
        <dt>Started</dt>
        <dd>
          {interview.startedAt ? startedLabel(interview.startedAt) : 'Not yet'}
        </dd>
        <dt>Total length</dt>
        <dd>
          {total > 0 ? `${minutes} min ${Math.round(total % 60)} s` : '—'}
        </dd>
      </dl>
    </section>
  )
}

const Processing = ({ interview }: { interview: RecruiterInterview }) => {
  const recorded = interview.questions.filter((question) => question.recorded)
  const done = recorded.filter(
    (question) => question.transcriptStatus === 'completed',
  ).length
  const current = Math.min(done + 1, recorded.length)
  const startedAt = recorded
    .map((question) => question.recordedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .pop()
  return (
    <div className={styles.processing}>
      <IconBadge icon={<LuRefreshCw />} tone="brand" size="lg" />
      <p className={styles.headline}>
        We&apos;re turning the answers into text.
      </p>
      <p className={styles.muted}>
        This takes a few minutes. You can close this panel; we&apos;ll show a
        Ready badge in the Interview column.
      </p>
      <SegmentedProgress
        total={recorded.length}
        filled={done}
        label="Answers transcribed"
        className={styles.progress}
      />
      <p className={styles.muted}>
        {done >= recorded.length
          ? 'Scoring the interview'
          : `Transcribing answer ${current} of ${recorded.length}`}
        {startedAt ? ` · started ${timeOfDay(startedAt)}` : ''}
      </p>
    </div>
  )
}

export const InterviewTab = ({
  interview,
  nextStep,
  candidate,
}: {
  interview?: RecruiterInterview | null
  nextStep?: NextStep
  candidate: { firstName: string; lastName: string }
}) => {
  const [openClip, setOpenClip] = useState(0)
  const [jump, setJump] = useState<JumpRequest | null>(null)
  const clips = useMemo(
    () => (interview ? toClips(interview) : []),
    [interview],
  )

  if (!interview) {
    return (
      <EmptyState
        title="No interview yet"
        description={
          nextStep === 'ai_interview'
            ? 'Move this candidate forward to invite them to the recorded AI interview.'
            : "This job doesn't run a recorded AI interview."
        }
      />
    )
  }

  if (
    interview.status === 'not_started' ||
    interview.status === 'in_progress'
  ) {
    const recorded = interview.questions.filter(
      (question) => question.recorded,
    ).length
    return (
      <>
        <EmptyState
          title={
            interview.status === 'in_progress'
              ? 'Interview in progress'
              : 'Not started yet'
          }
          description={
            interview.status === 'in_progress'
              ? `${recorded} of ${interview.questions.length} answers recorded so far.`
              : 'The candidate has not recorded any answers yet.'
          }
        />
        <Details interview={interview} clips={clips} />
      </>
    )
  }

  if (interview.status === 'processing' && !interview.failed) {
    return (
      <>
        <Processing interview={interview} />
        <Details interview={interview} clips={clips} />
      </>
    )
  }

  const startOf = (position: number) =>
    clips.find((clip) => clip.position === position && !clip.isFollowUp)
  const jumpTo = (index: number) => setJump({ index, key: Date.now() })
  const flags = interview.flags ?? []
  const markers = flags
    .map((flag) =>
      flag.question == null ? null : startOf(flag.question)?.start,
    )
    .filter((value): value is number => value != null)

  return (
    <>
      {interview.failed && (
        <EmptyState
          title="We couldn't score this interview"
          description="You can still watch the answers."
        />
      )}
      <InterviewPlayer
        interviewId={interview.id}
        mode={interview.mode}
        clips={clips}
        markers={markers}
        jump={jump}
        candidate={candidate}
        onClipChange={setOpenClip}
      />

      <section>
        <h3 className={styles.sectionTitle}>Questions</h3>
        <ol className={styles.questions}>
          {clips.map((clip, index) => (
            <li key={clip.id}>
              <button
                type="button"
                className={cn(
                  styles.question,
                  openClip === index && styles.questionOpen,
                )}
                onClick={() => {
                  setOpenClip(index)
                  jumpTo(index)
                }}>
                <LuPlay aria-hidden className={styles.questionIcon} />
                <span className={styles.questionText}>
                  <strong>
                    {clip.label}.{' '}
                    {clip.isFollowUp
                      ? `Follow-up: ${clip.question}`
                      : clip.question}
                  </strong>
                  {openClip === index && clip.transcript && (
                    <span className={styles.transcript}>
                      “{clip.transcript}”
                    </span>
                  )}
                </span>
                <span className={styles.muted}>{clock(clip.length)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {interview.scores && (
        <section className={styles.stack}>
          <h3 className={styles.sectionTitle}>Scores</h3>
          <TipCard icon={<LuSparkles />}>
            AI suggestion only. You make the decision.
          </TipCard>
          <dl className={styles.scoreRows}>
            {SCORE_ROWS.map(({ key, label }) => {
              const entry = interview.scores![key]
              return (
                <div key={key} className={styles.scoreRow}>
                  <dt>{label}</dt>
                  <dd>
                    <SegmentedProgress
                      total={5}
                      filled={entry.score}
                      label={label}
                    />
                    <strong>{entry.score}/5</strong>
                    <span className={styles.muted}>{entry.reason}</span>
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>
      )}

      {interview.summary && (
        <section className={styles.stack}>
          <div className={styles.row}>
            <h3 className={styles.sectionTitle}>Summary</h3>
            <AiSuggestion />
          </div>
          <p className={styles.body}>{interview.summary}</p>
        </section>
      )}

      {flags.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Worth a closer look</h3>
          <ul className={styles.flags}>
            {flags.map((flag, index) => {
              const target =
                flag.question == null ? undefined : startOf(flag.question)
              const clipIndex = target ? clips.indexOf(target) : -1
              return (
                <li key={`${flag.text}-${index}`} className={styles.flag}>
                  {target && (
                    <span className={styles.stamp}>{clock(target.start)}</span>
                  )}
                  <span className={styles.flagText}>{flag.text}</span>
                  {clipIndex >= 0 && (
                    <button
                      type="button"
                      className={styles.control}
                      aria-label="Play this answer"
                      onClick={() => {
                        setOpenClip(clipIndex)
                        jumpTo(clipIndex)
                      }}>
                      <LuExternalLink />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {interview.screenLeaves.count > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Left the interview screen</h3>
          <ul className={styles.flags}>
            {interview.screenLeaves.events.map((event, index) => (
              <li key={`${event.at}-${index}`} className={styles.flag}>
                <span className={styles.stamp}>{timeOfDay(event.at)}</span>
                <span className={styles.flagText}>
                  {LEAVE_LABELS[event.kind]}
                  {event.position != null &&
                    ` · during ${
                      event.isFollowUp ? 'the follow-up to ' : ''
                    }question ${event.position}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
