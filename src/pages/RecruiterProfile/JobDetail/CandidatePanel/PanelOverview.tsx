import React, { useState } from 'react'
import { LuSparkles } from 'react-icons/lu'

import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { BarList } from '@/components/ui/BarList'
import { Button } from '@/components/ui/Button'
import { CheckList } from '@/components/ui/CheckList'
import { Pill } from '@/components/ui/Pill'
import { retryPersonalityFit } from '@/features/applications/services/applicationService'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { ApplicationDetail } from '@/utils/recruiterJobPostsTypes'
import { notify } from '@/utils/toastNotifications'

import { verdictSentence } from '../../MyJobPosts/CandidateDossierPanel'
import { MBTI_TYPES } from '../../MyJobPosts/mbtiLegend'
import styles from './CandidatePanel.module.scss'

export const AiSuggestion = () => (
  <Pill tone="violet" size="sm" icon={<LuSparkles />}>
    AI suggestion
  </Pill>
)

const percent = (value?: number | null) =>
  value == null ? '—' : `${Math.round(value)}%`

const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <BarList
    ariaLabel={label}
    of={100}
    valueDisplay="share"
    items={[{ key: label, label, value: Math.round(score) }]}
  />
)

const TestCard = ({ title, score }: { title: string; score?: number | null }) =>
  score == null ? null : (
    <PagePanel title={title} action={<AiSuggestion />}>
      <ScoreBar label="Score" score={score} />
    </PagePanel>
  )

const PersonalityCard = ({
  application,
  onChanged,
}: {
  application: ApplicationDetail
  onChanged: () => void | Promise<void>
}) => {
  const [retrying, setRetrying] = useState(false)
  const { mbtiType, personalityFitScore, personalityFitReason } = application
  if (!mbtiType) return null
  const summary = MBTI_TYPES.find((item) => item.type === mbtiType)?.summary

  const retry = async () => {
    setRetrying(true)
    try {
      await retryPersonalityFit(application.id)
    } catch (err) {
      notify(
        'error',
        getErrorMessage(err, "Couldn't work out the personality fit"),
      )
    } finally {
      setRetrying(false)
      await onChanged()
    }
  }

  return (
    <PagePanel title="Personality" action={<AiSuggestion />}>
      <div className={styles.personality}>
        <StatCard label="Type" value={mbtiType} caption={summary} />
        <div className={styles.stack}>
          {personalityFitScore != null ? (
            <>
              <ScoreBar label="Personality fit" score={personalityFitScore} />
              {personalityFitReason && (
                <p className={styles.muted}>{personalityFitReason}</p>
              )}
            </>
          ) : application.personalityFitPending ? (
            <p className={styles.muted}>Working out the fit…</p>
          ) : (
            <div className={styles.row}>
              <p className={styles.muted}>
                The fit hasn&apos;t been worked out yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                loading={retrying}
                onClick={() => void retry()}>
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </PagePanel>
  )
}

export const PanelOverview = ({
  application,
  onChanged,
}: {
  application: ApplicationDetail
  onChanged: () => void | Promise<void>
}) => {
  const analysis = application.matchAnalysis
  const rationale =
    analysis?.hiringRationale ||
    analysis?.whyFit ||
    application.matchVerdictReasoning ||
    ''
  const reasons = analysis?.strongestQualifications?.length
    ? analysis.strongestQualifications
    : application.matchStrengths ?? []

  return (
    <>
      <PagePanel
        className={styles.recommendation}
        title="AI recommendation"
        action={<AiSuggestion />}>
        <div className={styles.stack}>
          <p className={styles.headline}>{verdictSentence(application)}</p>
          <p className={styles.muted}>
            {rationale ? `${rationale} ` : ''}A person makes the final decision.
          </p>
        </div>
      </PagePanel>

      <StatGrid>
        <StatCard
          label="CV match"
          value={percent(application.cvSimilarityScore)}
        />
        <StatCard
          label="Skills test"
          value={percent(application.talent.prescreeningScore)}
        />
        <StatCard
          label="Tailored answers"
          value={percent(application.personalizedScore)}
        />
      </StatGrid>

      <PersonalityCard application={application} onChanged={onChanged} />
      <TestCard
        title="Problem-solving test"
        score={application.problemSolvingScore}
      />
      <TestCard title="Culture-fit test" score={application.cultureFitScore} />

      {reasons.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Why they fit</h3>
          <CheckList
            variant="summary"
            items={reasons.map((reason) => ({ label: reason }))}
          />
        </section>
      )}
    </>
  )
}
