import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  JobDetailsJob,
  JobDetailsView,
} from '@/components/features/jobs/JobDetailsView'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { applicationPath } from '@/features/talent-applications/steps'
import {
  useApplyToJobMutation,
  useIndividualJobQuery,
} from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

const ApplyStep: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useIndividualJobQuery(jobId)
  const job: JobDetailsJob | undefined = data?.data?.job

  const [applyToJob, { isLoading: applying }] = useApplyToJobMutation()

  const handleApply = async () => {
    if (!jobId) return
    try {
      const result = await applyToJob({ jobId }).unwrap()
      navigate(`${applicationPath(result.data.application.id)}/sent`)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Failed to apply for this job'), {
        autoClose: 2000,
      })
    }
  }

  if (isLoading) return <Spinner fullPage />

  if (!job) return null

  return (
    <JobDetailsView
      jobId={jobId!}
      job={job}
      audience="talent"
      onBack={() => navigate(`/apply/${jobId}/prescreen`)}
      action={
        <Button fullWidth onClick={() => void handleApply()} loading={applying}>
          Apply for this position
        </Button>
      }
    />
  )
}

export default ApplyStep
