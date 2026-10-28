import React, { useState } from 'react'
import { IoIosInformationCircle } from 'react-icons/io'
import { Tooltip as ReactTooltip } from 'react-tooltip'

import { PageHero } from '@/components/layout/PageHero'
import { PagePanel, StatCard, StatGrid } from '@/components/layout/PagePanel'
import { Avatar } from '@/components/ui/Avatar'
import { BackButton } from '@/components/ui/BackButton'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { isRowStuck } from '@/features/admin/applicationFollowUp'
import { useApplication } from '@/features/applications/hooks/useApplication'
import { useUpdateApplicationStatus } from '@/features/applications/hooks/useUpdateApplicationStatus'
import {
  type JobAiConfigThresholds,
  downloadCandidateFitReport,
  retryPersonalityFit,
} from '@/features/applications/services/applicationService'
import { ApplicationFollowUpDrawer } from '@/pages/AdminProfile/Applications/ApplicationFollowUpDrawer'
import { humanStage } from '@/pages/TalentProfile/Job/jobPipeline'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { SingleJobDetails } from '@/utils/recruiterJobPostsTypes'
import { notify } from '@/utils/toastNotifications'
import { viewCandidateCv } from '@/utils/viewCandidateCv'

import { AssessmentChat } from './AssessmentChat'
import styles from './CandidateDossierPanel.module.scss'
import { CompanyTestResults } from './CompanyTestResults'
import { MBTI_TYPES } from './mbtiLegend'
import { Messaging } from './Messaging/Messaging'
import { PersonalityFit } from './PersonalityFit'

const HERO: Record<
  string,
  { title: string; action: string; className: string }
> = {
  high: {
    title: 'Strong Fit',
    action: 'Hire / Shortlist',
    className: styles.heroHigh,
  },
  medium: {
    title: 'Potential Fit',
    action: 'Review',
    className: styles.heroMedium,
  },
  low: {
    title: 'Poor Fit',
    action: 'Bounce / Reject',
    className: styles.heroLow,
  },
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  hire: 'Recommend: Hire',
  interview_further: 'Recommend: Interview further',
  no_hire: 'Recommend: Do not hire',
}

// The one sentence a recruiter should be able to read and act on without
// opening anything else — plain English, suggestive, first thing on the page.
const verdictSentence = (application: SingleJobDetails): string => {
  const { matchVerdict, matchRecommendation, currentStage } = application
  if (!matchVerdict) {
    return currentStage && currentStage !== 'completed'
      ? 'Still screening — the AI recommendation appears once this candidate finishes the pipeline.'
      : 'AI recommendation pending.'
  }
  if (matchVerdict === 'high' || matchRecommendation === 'hire') {
    return "We'd shortlist this candidate — strong evidence of fit against the role's requirements."
  }
  if (matchVerdict === 'low' || matchRecommendation === 'no_hire') {
    return "We wouldn't shortlist this candidate — notable gaps against the role's requirements."
  }
  return 'Worth a closer look — some strong signals alongside open questions.'
}

type CandidateDossierPanelProps = {
  application: SingleJobDetails
  jobAiConfig?: JobAiConfigThresholds | null
  onClose: () => void
  onChanged?: () => void | Promise<void>
  /** Admin viewers can see everything here but can't shortlist/reject/message. */
  readOnly?: boolean
}

const BulletList = ({ items }: { items?: string[] | null }) => {
  const cleaned = items?.filter(Boolean) ?? []
  if (cleaned.length === 0) return <p className={styles.empty}>None recorded</p>
  return (
    <ul className={styles.list}>
      {cleaned.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

const scoreLabel = (value?: number | null, suffix = '%') =>
  value == null ? '—' : `${value}${suffix}`

const personalityCaption = (mbtiType?: string | null) =>
  MBTI_TYPES.find((item) => item.type === mbtiType)?.summary ?? null

export const CandidateDossierPanel = ({
  application: row,
  jobAiConfig,
  onClose,
  onChanged,
  readOnly = false,
}: CandidateDossierPanelProps) => {
  const { data, isLoading, mutate } = useApplication(row.id)
  const application = (data?.data?.application ?? row) as SingleJobDetails & {
    talent: SingleJobDetails['talent']
  }
  const { talent } = application
  const fullName = `${talent.firstName} ${talent.lastName}`.trim()
  const analysis = application.matchAnalysis
  const hero = application.matchVerdict ? HERO[application.matchVerdict] : null
  const location = [
    talent.locationCity,
    talent.locationState,
    talent.locationCountry,
  ]
    .filter(Boolean)
    .join(', ')
  const { updateStatus, isUpdating } = useUpdateApplicationStatus(
    application.id,
  )
  const [isLoadingCv, setIsLoadingCv] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const stuck = readOnly && isRowStuck(application)
  const daysStuck = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(application.updatedAt).getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  )

  const handleStatus = async (status: 'shortlisted' | 'rejected') => {
    await updateStatus(status)
    await onChanged?.()
  }

  const handleViewCv = async () => {
    setIsLoadingCv(true)
    try {
      await viewCandidateCv({ cvUrl: talent.cvUrl, talentId: talent.id })
    } finally {
      setIsLoadingCv(false)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloadingReport(true)
    try {
      await downloadCandidateFitReport(
        application.jobId,
        application.id,
        fullName,
      )
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to generate report'), {
        autoClose: 3000,
      })
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const handleRetryPersonalityFit = async () => {
    try {
      await retryPersonalityFit(application.id)
      notify('success', 'Personality fit worked out', { autoClose: 2000 })
    } catch (err) {
      notify(
        'error',
        getErrorMessage(err, "Couldn't work out the personality fit"),
        { autoClose: 3000 },
      )
    } finally {
      await mutate()
    }
  }

  const decision =
    application.status === 'shortlisted'
      ? { label: 'Accepted', className: styles.decisionAccepted }
      : application.status === 'rejected'
      ? { label: 'Rejected', className: styles.decisionRejected }
      : { label: 'Decision pending', className: styles.decisionPending }

  const rationale =
    analysis?.hiringRationale ||
    analysis?.whyFit ||
    application.matchVerdictReasoning ||
    ''

  const recommendationLabel = application.matchRecommendation
    ? RECOMMENDATION_LABELS[application.matchRecommendation]
    : null

  const typeCaption = personalityCaption(application.mbtiType)

  const personalityValue = (
    <span className={styles.mbtiValue}>
      {application.mbtiType ?? '—'}
      <button
        type="button"
        className={styles.tooltipTrigger}
        data-tooltip-id="mbti-legend"
        aria-label="What personality type letters mean">
        <IoIosInformationCircle size={18} />
      </button>
    </span>
  )

  return (
    <div className={styles.page}>
      <BackButton onClick={onClose} />
      <PageHero
        compact
        identity={
          <Avatar
            firstName={talent.firstName}
            lastName={talent.lastName}
            size="lg"
          />
        }
        title={fullName || 'Applicant'}
        lead={
          [location, talent.experience].filter(Boolean).join(' · ') ||
          talent.email
        }
        chips={
          <>
            <span className={`${styles.decisionChip} ${decision.className}`}>
              {decision.label}
            </span>
            <StatusBadge
              status={humanStage(application.currentStage)}
              backgroundColor="#f3f4f6"
              color="#374151"
            />
          </>
        }
        actions={
          <div className={styles.heroActions}>
            <Button
              variant="outline"
              size="sm"
              loading={isLoadingCv}
              onClick={() => void handleViewCv()}>
              View talent CV
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={isDownloadingReport}
              onClick={() => void handleDownloadReport()}>
              Download report
            </Button>
            {stuck && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFollowUpOpen(true)}>
                Follow up
              </Button>
            )}
            {!readOnly && (
              <>
                <Button
                  size="sm"
                  loading={isUpdating}
                  onClick={() => void handleStatus('shortlisted')}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={isUpdating}
                  onClick={() => void handleStatus('rejected')}>
                  Reject
                </Button>
              </>
            )}
          </div>
        }
      />

      {isLoading && !data ? (
        <Spinner />
      ) : (
        <>
          <section
            className={`${styles.recommendation} ${hero?.className ?? ''}`}
            aria-label="AI hiring recommendation">
            <p className={styles.recKicker}>AI recommendation</p>
            <h2 className={styles.recTitle}>{verdictSentence(application)}</h2>
            <p className={styles.recScore}>
              {hero ? `${hero.title} · ` : ''}Overall fit{' '}
              {application.overallFitScore != null
                ? `${Math.round(application.overallFitScore)}/100`
                : analysis?.overallFitScore != null
                ? `${analysis.overallFitScore}/100`
                : application.averageScore != null
                ? `${application.averageScore}% avg`
                : 'not scored yet'}
              {recommendationLabel ? ` · ${recommendationLabel}` : ''}
            </p>
            {rationale ? (
              <p className={styles.recRationale}>{rationale}</p>
            ) : (
              <p className={styles.empty}>
                AI recommendation appears after the pipeline completes.
              </p>
            )}
            {analysis?.whyHire ? (
              <p className={styles.recRationale}>{analysis.whyHire}</p>
            ) : null}
          </section>

          <StatGrid columns={4}>
            <StatCard
              label={
                jobAiConfig?.minPrescreeningScore != null
                  ? `Prescreening · bar ${jobAiConfig.minPrescreeningScore}%`
                  : 'Prescreening'
              }
              value={scoreLabel(talent.prescreeningScore)}
            />
            <StatCard
              label="CV match"
              value={scoreLabel(application.cvSimilarityScore)}
            />
            <StatCard
              label="Personalized"
              value={scoreLabel(application.personalizedScore)}
            />
            <StatCard
              label="Personality"
              value={personalityValue}
              caption={typeCaption}
            />
          </StatGrid>

          <PersonalityFit
            application={application}
            onRetry={readOnly ? undefined : handleRetryPersonalityFit}
          />

          <ReactTooltip
            id="mbti-legend"
            place="bottom"
            className={styles.mbtiTooltip}>
            <p className={styles.mbtiIntro}>
              A four-letter snapshot of how they prefer to work and decide.
            </p>
          </ReactTooltip>

          <PagePanel
            title="Personality answers"
            hint={
              application.mbtiType
                ? `Typed as ${application.mbtiType}`
                : 'Workplace scenarios the talent answered for this job.'
            }>
            <AssessmentChat
              items={application.personalityAnswers}
              feedback={analysis?.questionFeedback}
            />
          </PagePanel>

          <PagePanel
            title="Role assessment answers"
            hint="How they said they would do this job, with evidence from their CV and answers.">
            <AssessmentChat
              items={application.personalizedAnswers}
              feedback={analysis?.questionFeedback}
            />
          </PagePanel>

          <CompanyTestResults application={application} />

          <PagePanel title="Why they fit">
            {analysis?.whyFit ? (
              <p className={styles.prose}>{analysis.whyFit}</p>
            ) : application.matchVerdictReasoning ? (
              <p className={styles.prose}>
                {application.matchVerdictReasoning}
              </p>
            ) : (
              <p className={styles.empty}>
                No structured analysis yet. It appears after screening
                completes.
              </p>
            )}
            {analysis?.relevantExperience?.length ? (
              <div className={styles.experienceBlock}>
                <h3 className={styles.experienceTitle}>Relevant experience</h3>
                <BulletList items={analysis.relevantExperience} />
              </div>
            ) : null}
            {analysis?.assessmentInsights ? (
              <p className={styles.prose}>{analysis.assessmentInsights}</p>
            ) : null}
          </PagePanel>

          <div className={styles.insightGrid}>
            <PagePanel title="Strengths">
              <BulletList
                items={
                  analysis?.strongestQualifications?.length
                    ? analysis.strongestQualifications
                    : application.matchStrengths
                }
              />
            </PagePanel>
            <PagePanel title="Gaps">
              <BulletList
                items={
                  analysis?.missingRequirements?.length
                    ? analysis.missingRequirements
                    : application.matchWeaknesses
                }
              />
            </PagePanel>
            <PagePanel title="Risks">
              <BulletList items={application.matchRisks} />
            </PagePanel>
            <PagePanel title="Evidence">
              <BulletList items={analysis?.keyEvidence} />
            </PagePanel>
            {analysis?.conflictingRequirements?.length ? (
              <PagePanel title="Conflicting or inconsistent answers">
                <BulletList items={analysis.conflictingRequirements} />
              </PagePanel>
            ) : null}
          </div>

          {stuck && (
            <PagePanel title="Stuck in screening">
              <p className={styles.prose}>
                {fullName || 'This talent'} hasn&apos;t moved past{' '}
                <strong>{humanStage(application.currentStage)}</strong> in{' '}
                {daysStuck}+ day{daysStuck === 1 ? '' : 's'}. Send a follow-up
                to nudge them back to finish this application.
              </p>
            </PagePanel>
          )}

          {!readOnly && (
            <PagePanel title="Messages">
              <Messaging
                applicationId={application.id}
                talentId={talent.id}
                jobId={application.jobId}
              />
            </PagePanel>
          )}
        </>
      )}

      <ApplicationFollowUpDrawer
        applicationId={isFollowUpOpen ? application.id : null}
        talentName={fullName || 'this talent'}
        onClose={() => setIsFollowUpOpen(false)}
      />
    </div>
  )
}
