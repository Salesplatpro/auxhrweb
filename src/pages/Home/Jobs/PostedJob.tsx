import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  JobDetailsJob,
  JobDetailsView,
} from '@/components/features/jobs/JobDetailsView'
import { useDocumentTitle } from '@/components/seo'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { rememberApplicantSource } from '@/utils/applicantSource'
import { notify } from '@/utils/toastNotifications'

import styles from './PostedJob.module.scss'

const PostedJob = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const userRole = useAuthStore((state) => state.user?.userRole)
  const { search } = useLocation()

  React.useEffect(() => {
    if (jobId) rememberApplicantSource(jobId, search)
  }, [jobId, search])

  const { data, error, isLoading, refetch } = useIndividualJobQuery(jobId)
  const job: JobDetailsJob | undefined = data?.data?.job
  const errorStatus = (error as { status?: number } | undefined)?.status
  const jobNotFound = errorStatus === 404
  const jobLoadFailed = !!error && !jobNotFound
  const jobClosed = !!job && job.status !== 'active'
  const isHiringTeam = userRole === 'recruiter' || userRole === 'admin'

  useDocumentTitle(
    job?.role?.name
      ? `${job.role.name}${
          job.organization?.name ? ` at ${job.organization.name}` : ''
        } | Auxhr`
      : undefined,
  )

  if (isLoading) return <Spinner fullPage />

  if (jobNotFound || jobLoadFailed || jobClosed || !job) {
    return (
      <div className={styles.unavailable}>
        <h1 className={styles.title}>
          {jobLoadFailed
            ? "Couldn't load this job"
            : 'This job is no longer available'}
        </h1>
        <p className={styles.message}>
          {jobNotFound || !job
            ? "This job posting doesn't exist, is still a draft, or has been removed."
            : jobLoadFailed
            ? 'Something went wrong loading this job. Please try again.'
            : 'This job is no longer accepting applications.'}
        </p>
        {jobLoadFailed ? (
          <Button onClick={() => void refetch()}>Try again</Button>
        ) : isHiringTeam ? (
          <Button onClick={() => navigate(dashboardPathForRole(userRole))}>
            Go to dashboard
          </Button>
        ) : (
          <Button onClick={() => navigate('/talentDashboard/jobs')}>
            Browse open jobs
          </Button>
        )}
      </div>
    )
  }

  const handleApply = () => {
    if (!jobId) {
      notify('error', 'Invalid job ID')
      return
    }

    navigate(`/apply/${jobId}`)
  }

  const action = isHiringTeam ? null : userRole === 'talent' &&
    job.hasApplied ? (
    <Button
      fullWidth
      variant="secondary"
      onClick={() => navigate(`/talentDashboard/job/${jobId}`)}>
      View your application
    </Button>
  ) : (
    <Button fullWidth size="lg" onClick={handleApply}>
      Apply now
    </Button>
  )

  return (
    <div className={styles.page}>
      <JobDetailsView
        jobId={jobId!}
        job={job}
        audience="public"
        action={action}
      />
    </div>
  )
}

export default PostedJob
