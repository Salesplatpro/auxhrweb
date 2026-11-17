import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { dashboardPathForRole } from '@/features/auth/utils/dashboardPath'
import { usePreAssessment } from '@/features/pre-assessment/hooks'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { applicationPath } from '@/features/talent-applications/steps'
import { useIndividualJobQuery } from '@/redux/api/talent'
import { notify } from '@/utils/toastNotifications'

import styles from './ApplyWizardEntry.module.scss'

const ApplyWizardEntry: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { profile, isLoading: isProfileLoading } = useProfile()
  const { assessment, isLoading, isProfileIncomplete } = usePreAssessment()
  const {
    data: jobData,
    error: jobError,
    isLoading: isJobLoading,
    refetch: refetchJob,
  } = useIndividualJobQuery(jobId)

  const job = jobData?.data?.job
  const jobErrorStatus = (jobError as { status?: number } | undefined)?.status
  const jobNotFound = jobErrorStatus === 404
  const jobLoadFailed = !!jobError && !jobNotFound
  const jobClosed = !!job && job.status !== 'active'
  const jobUnavailable =
    !isJobLoading && (jobNotFound || jobClosed || jobLoadFailed)

  useEffect(() => {
    if (!jobId || isJobLoading || jobUnavailable) return

    if (!token) {
      navigate('signup', { replace: true })
      return
    }

    if (user?.userRole !== 'talent') {
      notify('error', 'Only talent accounts can apply to jobs', {
        autoClose: 2000,
      })
      navigate(`/job/postedjob/${jobId}`, { replace: true })
      return
    }

    if (isProfileLoading) return

    if (!profile?.emailVerifiedAt) {
      navigate('verify', { replace: true })
      return
    }

    if (isLoading) return

    if (isProfileIncomplete) {
      navigate('profile', { replace: true })
      return
    }

    if (job?.applicationId) {
      navigate(applicationPath(job.applicationId), { replace: true })
      return
    }

    if (assessment?.status !== 'completed') {
      navigate('prescreen', { replace: true })
      return
    }

    navigate('details', { replace: true })
  }, [
    jobId,
    isJobLoading,
    jobUnavailable,
    token,
    user,
    isProfileLoading,
    profile?.emailVerifiedAt,
    isLoading,
    isProfileIncomplete,
    assessment?.status,
    job?.applicationId,
    navigate,
  ])

  if (isJobLoading) return <Spinner fullPage />

  if (jobUnavailable) {
    return (
      <div className={styles.unavailable}>
        <h1 className={styles.title}>
          {jobLoadFailed
            ? "Couldn't load this job"
            : 'This job is no longer available'}
        </h1>
        <p className={styles.message}>
          {jobNotFound
            ? "This job posting doesn't exist or has been removed."
            : jobLoadFailed
            ? 'Something went wrong loading this job. Please try again.'
            : 'This job is no longer accepting applications.'}
        </p>
        {jobLoadFailed ? (
          <Button onClick={() => void refetchJob()}>Try again</Button>
        ) : user?.userRole === 'recruiter' || user?.userRole === 'admin' ? (
          <Button onClick={() => navigate(dashboardPathForRole(user.userRole))}>
            Go to dashboard
          </Button>
        ) : (
          <Button onClick={() => navigate('/talentDashboard/job')}>
            Browse open jobs
          </Button>
        )}
      </div>
    )
  }

  return <Spinner fullPage />
}

export default ApplyWizardEntry
