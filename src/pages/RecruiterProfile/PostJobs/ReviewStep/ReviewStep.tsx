import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useUpdateJobMutation } from '@/redux/api/recruiter'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { useJobPayment } from '../../MyJobPosts/useJobPayment'
import { aiConfigFromApi } from '../AiConfig/aiConfigPayload'
import { CandidateJourney } from '../AiConfig/CandidateJourney'
import { JobPreview } from '../JobPreview/JobPreview'
import { jobToFormValues } from '../utils/jobFormValues'
import styles from './ReviewStep.module.scss'

const BASE_PATH = '/recruiterDashboard/postjob'
const JOB_POSTS_PATH = '/recruiterDashboard/myJobPosts'

type ReviewStepProps = {
  jobId: string
}

export const ReviewStep = ({ jobId }: ReviewStepProps) => {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { data, isLoading } = useIndividualJobQuery(jobId, { skip: !jobId })
  const [updateJob, { isLoading: isPublishing }] = useUpdateJobMutation()
  const { payForJob, payingJobId } = useJobPayment()
  const [publishedStatus, setPublishedStatus] = useState<string | null>(null)

  if (isLoading) return <Spinner fullPage />

  const job = data?.data?.job ?? data?.data
  if (!job) {
    return (
      <div className={styles.page}>
        <p className={styles.notice}>We couldn&apos;t load this job.</p>
        <Button type="button" onClick={() => navigate(JOB_POSTS_PATH)}>
          Go to Job Posts
        </Button>
      </div>
    )
  }

  const status: string = publishedStatus ?? job.status ?? 'draft'
  const hasScreening = !!job.aiConfig?.id

  const publish = async () => {
    try {
      const response = await updateJob({
        jobId,
        data: { status: 'active' },
      }).unwrap()
      const nextStatus: string = response?.data?.job?.status ?? 'active'
      setPublishedStatus(nextStatus)
      if (nextStatus === 'active') {
        notify('success', 'Your job is live. Talents can now apply.')
        navigate(JOB_POSTS_PATH)
      }
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not publish the job.'))
    }
  }

  const saveAsDraft = () => {
    notify('success', 'Saved as a draft. Publish it from Job Posts anytime.')
    navigate(JOB_POSTS_PATH)
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Check everything, then publish</h2>
      <p className={styles.subheading}>
        This is what candidates will see and the steps they&apos;ll go through.
      </p>

      <div className={styles.layout}>
        <div className={styles.column}>
          <div className={styles.blockHeader}>
            <h3 className={styles.blockTitle}>Job post</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`${BASE_PATH}/${jobId}/details`)}>
              Edit details
            </Button>
          </div>
          <JobPreview
            values={jobToFormValues(job)}
            roleName={job.role?.name ?? ''}
            companyName={
              job.organization?.name ?? profile?.activeOrganization?.name
            }
            showChecklist={false}
          />
        </div>

        <div className={styles.column}>
          <div className={styles.blockHeader}>
            <h3 className={styles.blockTitle}>Screening</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`${BASE_PATH}/${jobId}`)}>
              {hasScreening ? 'Edit screening' : 'Set up screening'}
            </Button>
          </div>
          {hasScreening ? (
            <CandidateJourney values={aiConfigFromApi(job.aiConfig)} />
          ) : (
            <p className={styles.notice}>
              Choose how applicants are screened before you publish.
            </p>
          )}
        </div>
      </div>

      {status === 'pending_payment' ? (
        <section className={styles.payPanel} role="status">
          <h3 className={styles.blockTitle}>One step left: pay to publish</h3>
          <p className={styles.payText}>
            Your plan needs a one-time payment to put this job live. It stays
            saved while you pay.
          </p>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(JOB_POSTS_PATH)}>
              Pay later
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={payingJobId === jobId}
              onClick={() => void payForJob(jobId)}>
              Pay and publish
            </Button>
          </div>
        </section>
      ) : status === 'active' ? (
        <section className={styles.livePanel} role="status">
          <p className={styles.payText}>This job is live.</p>
          <Button type="button" onClick={() => navigate(JOB_POSTS_PATH)}>
            Go to Job Posts
          </Button>
        </section>
      ) : (
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={saveAsDraft}>
            Save as draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={isPublishing}
            disabled={!hasScreening}
            onClick={() => void publish()}>
            Publish job
          </Button>
        </div>
      )}
    </div>
  )
}
