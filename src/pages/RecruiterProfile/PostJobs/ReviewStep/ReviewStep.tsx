import cn from 'classnames'
import React, { useState } from 'react'
import { HiCheck } from 'react-icons/hi2'
import { Link, useNavigate } from 'react-router-dom'

import {
  formatClosingDate,
  formatEmploymentType,
  formatExperience,
} from '@/components/features/jobs/JobDetailsView/jobDetailsFormat'
import { Button } from '@/components/ui/Button'
import { IconBadge } from '@/components/ui/IconBadge'
import { Spinner } from '@/components/ui/Spinner'
import { formatSalaryRange, PERIOD_WORD } from '@/features/jobs/utils/jobSalary'
import { useOrganizationUsage } from '@/features/organizations/hooks/useOrganizationUsage'
import { isPayPerUsePlan } from '@/features/pricing/types'
import { getPlanDisplayName } from '@/features/pricing/utils/getPlanDisplayName'
import { useProfile } from '@/features/profile/hooks/useProfile'
import {
  useGenerateCompanyQuestionsMutation,
  useUpdateJobMutation,
} from '@/redux/api/recruiter'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { capitalizeEachWord } from '@/utils/CapitalizeWord'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { useJobPayment } from '../../MyJobPosts/useJobPayment'
import { aiConfigFromApi } from '../AiConfig/aiConfigPayload'
import { candidateJourney } from '../AiConfig/journeyStages'
import {
  SCREENING_STEP_ICON,
  ScreeningStepKey,
} from '../AiConfig/screeningSteps'
import { jobChecklist } from '../JobPreview/jobChecklist'
import {
  useSalaryComparison,
  VERDICT_LABEL,
} from '../SalaryComparison/useSalaryComparison'
import { jobToFormValues } from '../utils/jobFormValues'
import { PublishingModal } from './PublishingModal'
import styles from './ReviewStep.module.scss'

const BASE_PATH = '/recruiterDashboard/postjob'
const JOB_POSTS_PATH = '/recruiterDashboard/myJobPosts'

const WORK_MODE_LABEL: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onSite: 'On-site',
}

const REVIEW_TITLE: Partial<Record<ScreeningStepKey, string>> = {
  aiInterview: 'Recorded AI interview',
}

type ReviewStepProps = {
  jobId: string
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.detail}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
)

export const ReviewStep = ({ jobId }: ReviewStepProps) => {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { usage } = useOrganizationUsage(profile?.activeOrganizationId)
  const { data, isLoading } = useIndividualJobQuery(jobId, { skip: !jobId })
  const [updateJob] = useUpdateJobMutation()
  const [generateQuestions] = useGenerateCompanyQuestionsMutation()
  const { payForJob, payingJobId } = useJobPayment()
  const [publishing, setPublishing] = useState(false)
  const [publishedStatus, setPublishedStatus] = useState<string | null>(null)

  const job = data?.data?.job ?? data?.data
  const formValues = job ? jobToFormValues(job) : null
  const { comparison, verdict } = useSalaryComparison(
    formValues ?? jobToFormValues({}),
    jobId,
  )

  if (isLoading) return <Spinner fullPage />

  if (!job || !formValues) {
    return (
      <div className={styles.notice}>
        <p>We couldn&apos;t load this job.</p>
        <Button type="button" onClick={() => navigate(JOB_POSTS_PATH)}>
          Go to Job Posts
        </Button>
      </div>
    )
  }

  const roleName = capitalizeEachWord(job.role?.name ?? '')
  const status: string = publishedStatus ?? job.status ?? 'draft'
  const config = job.aiConfig?.id ? aiConfigFromApi(job.aiConfig) : null
  const journey = config ? candidateJourney(config) : null
  const steps = (journey?.stages ?? []).filter(
    (stage) => stage.key !== 'apply' && stage.key !== 'review',
  )
  const companyValues = profile?.activeOrganization?.companyValues ?? []

  const place =
    [job.locationCity, job.locationState].filter(Boolean).join(', ') ||
    job.locationCountry
  const modes = (job.workMode ?? [])
    .map((mode: string) => WORK_MODE_LABEL[mode] ?? mode)
    .join(' · ')
  const period = PERIOD_WORD[formValues.compensationPeriod]
  const salary = formatSalaryRange(job)
  const compared =
    comparison == null
      ? 'Not available yet'
      : !comparison.available
      ? 'Not enough similar jobs yet'
      : `${
          verdict ? VERDICT_LABEL[verdict] : 'Similar jobs pay'
        } (${formatSalaryRange(
          {
            currency: comparison.currency,
            minSalary: comparison.low,
            maxSalary: comparison.high,
          },
          { short: true },
        )?.replace(' – ', '–')})`

  const checklist = [
    {
      label: 'Job details complete',
      done: jobChecklist(formValues).every((item) => item.done),
    },
    {
      label: job.maxSalary != null ? 'Salary range added' : 'Salary added',
      done: job.minSalary != null,
    },
    {
      label: config
        ? `${steps.length} screening step${steps.length === 1 ? '' : 's'} on`
        : 'Screening not set up yet',
      done: !!config,
    },
    ...(config?.cultureFitAssessment === 'true'
      ? [
          {
            label: 'Company values added for culture-fit',
            done: companyValues.length > 0,
          },
        ]
      : []),
  ]

  const meter = usage?.meters.find((item) => item.key === 'job_listings')
  const planName = getPlanDisplayName(usage?.billingPlan)
  const planLine = !usage
    ? null
    : isPayPerUsePlan(usage.billingPlan)
    ? `Each job post is paid once when you publish it on the ${planName} plan.`
    : !meter || meter.limit == null
    ? `Unlimited job posts on the ${planName} plan.`
    : meter.limit - meter.used > 0
    ? `Uses 1 of your ${
        meter.limit - meter.used
      } remaining job posts on the ${planName} plan.`
    : `You've used all ${meter.limit} job posts on the ${planName} plan, so this one needs a one-time payment.`

  const publish = async () => {
    setPublishing(true)
    try {
      if (config && job.status === 'draft') {
        await Promise.all([
          ...(config.problemSolvingAssessment === 'true'
            ? [
                generateQuestions({
                  type: 'problem-solving',
                  jobId,
                  count: Number(config.noOfProblemSolvingQuestions),
                }).unwrap(),
              ]
            : []),
          ...(config.cultureFitAssessment === 'true'
            ? [
                generateQuestions({
                  type: 'culture-fit',
                  jobId,
                  count: Number(config.noOfCultureFitQuestions),
                }).unwrap(),
              ]
            : []),
        ])
      }
      const response = await updateJob({
        jobId,
        data: { status: 'active' },
      }).unwrap()
      const nextStatus: string = response?.data?.job?.status ?? 'active'
      if (nextStatus === 'active') {
        navigate(`${BASE_PATH}/${jobId}/live`, {
          state: { justPublished: true },
        })
        return
      }
      setPublishedStatus(nextStatus)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not publish the job.'))
    } finally {
      setPublishing(false)
    }
  }

  const saveAsDraft = () => {
    notify('success', 'Saved as a draft. Publish it from Job Posts anytime.')
    navigate(JOB_POSTS_PATH)
  }

  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Job details</h2>
              <p className={styles.cardHint}>
                What candidates see on the job post
              </p>
            </div>
            <Link to={`${BASE_PATH}/${jobId}/details`} className={styles.edit}>
              Edit
            </Link>
          </header>
          <dl className={styles.details}>
            <Detail label="Job title" value={roleName} />
            <Detail label="Department" value={job.department || '—'} />
            <Detail
              label="Location"
              value={[place, modes].filter(Boolean).join(' · ') || '—'}
            />
            <Detail label="Job type" value={formatEmploymentType(job) ?? '—'} />
            <Detail label="Experience" value={formatExperience(job) ?? '—'} />
            <Detail
              label="Closes"
              value={formatClosingDate(job) ?? 'No closing date'}
            />
            <Detail
              label="Salary range"
              value={salary ? `${salary}${period ? ` / ${period}` : ''}` : '—'}
            />
            <Detail label="Compared with similar jobs" value={compared} />
            <Detail
              label="Share options"
              value={job.shareOptions ? 'Yes, mentioned on the post' : 'No'}
            />
          </dl>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>AI Configuration</h2>
              <p className={styles.cardHint}>
                {journey
                  ? `Candidate journey · about ${journey.totalMinutes} minutes in total`
                  : 'Choose how applicants are screened before you publish.'}
              </p>
            </div>
            <Link to={`${BASE_PATH}/${jobId}`} className={styles.edit}>
              {config ? 'Edit' : 'Set up'}
            </Link>
          </header>
          {steps.length > 0 && (
            <ul className={styles.steps}>
              {steps.map((stage) => {
                const key = stage.key as ScreeningStepKey
                return (
                  <li key={stage.key} className={styles.step}>
                    <IconBadge
                      icon={SCREENING_STEP_ICON[key].icon}
                      tone="brand"
                    />
                    <div className={styles.stepCopy}>
                      <p className={styles.stepTitle}>
                        {REVIEW_TITLE[key] ?? stage.title}
                      </p>
                      <p className={styles.stepDetail}>
                        {stage.minutes > 0
                          ? `${stage.detail} · ${stage.minutes} min`
                          : stage.detail}
                      </p>
                    </div>
                    <span className={styles.on}>On</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <aside className={cn(styles.card, styles.readyCard)}>
        <h2 className={styles.cardTitle}>
          {status === 'pending_payment'
            ? 'One step left: pay to publish'
            : status === 'active'
            ? 'This job is live'
            : 'Ready to publish'}
        </h2>
        <ul className={styles.checklist}>
          {checklist.map((item) => (
            <li
              key={item.label}
              className={item.done ? styles.checkDone : styles.checkTodo}>
              <HiCheck aria-hidden />
              {item.label}
              <span className={styles.srOnly}>
                {item.done ? ' (done)' : ' (to do)'}
              </span>
            </li>
          ))}
        </ul>

        {status === 'pending_payment' ? (
          <>
            <p className={styles.planLine}>
              Your plan needs a one-time payment to put this job live. It stays
              saved while you pay.
            </p>
            <Button
              type="button"
              variant="ink"
              size="lg"
              stretch
              loading={payingJobId === jobId}
              onClick={() => void payForJob(jobId)}>
              Pay and publish
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              stretch
              onClick={() => navigate(JOB_POSTS_PATH)}>
              Pay later
            </Button>
          </>
        ) : status === 'active' ? (
          <Button
            type="button"
            variant="ink"
            size="lg"
            stretch
            onClick={() => navigate(`${BASE_PATH}/${jobId}/live`)}>
            Share the job
          </Button>
        ) : (
          <>
            {planLine && <p className={styles.planLine}>{planLine}</p>}
            <Button
              type="button"
              variant="ink"
              size="lg"
              stretch
              disabled={!config || publishing}
              onClick={() => void publish()}>
              Publish job
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              stretch
              onClick={saveAsDraft}>
              Save as draft
            </Button>
          </>
        )}
      </aside>

      <PublishingModal open={publishing} roleName={roleName} />
    </div>
  )
}
