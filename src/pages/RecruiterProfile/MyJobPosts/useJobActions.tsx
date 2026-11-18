import React, { useState } from 'react'

import { ConfirmDialog } from '@/components/feedback'
import {
  useDeleteJobMutation,
  useUpdateJobMutation,
} from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { JobPaymentStatus } from '../getJobStatus'
import { useJobPayment } from './useJobPayment'

export type ActionableJob = {
  id: string
  status: string
  paymentStatus?: JobPaymentStatus
  title: string
}

type Options = {
  onDeleted?: () => void
}

export const useJobActions = (
  job: ActionableJob,
  { onDeleted }: Options = {},
) => {
  const [updateJob, { isLoading: isClosing }] = useUpdateJobMutation()
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()
  const { payForJob, payingJobId } = useJobPayment()
  const [confirm, setConfirm] = useState<'close' | 'delete' | null>(null)

  const needsPayment = job.status === 'pending_payment'
  const paymentFailed = needsPayment && job.paymentStatus === 'failed'
  const payLabel = paymentFailed ? 'Retry payment' : 'Pay now'

  const closeJob = async () => {
    try {
      await updateJob({ jobId: job.id, data: { status: 'closed' } }).unwrap()
      notify('success', `${job.title} is closed.`)
      setConfirm(null)
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not close the job.'))
    }
  }

  const removeJob = async () => {
    try {
      await deleteJob(job.id).unwrap()
      notify('success', `${job.title} was deleted.`)
      setConfirm(null)
      onDeleted?.()
    } catch (err) {
      notify('error', getErrorMessage(err, 'Could not delete the job.'))
    }
  }

  const dialogs = (
    <>
      <ConfirmDialog
        open={confirm === 'close'}
        title={`Close ${job.title}?`}
        message="Candidates can no longer apply, and current applicants are told the job has closed."
        confirmLabel="Close job"
        variant="danger"
        isConfirming={isClosing}
        onConfirm={() => void closeJob()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={`Delete ${job.title}?`}
        message="The job, its applications and their screening results are removed for good. This cannot be undone."
        confirmLabel="Delete job"
        variant="danger"
        isConfirming={isDeleting}
        onConfirm={() => void removeJob()}
        onCancel={() => setConfirm(null)}
      />
    </>
  )

  return {
    canClose: job.status === 'active',
    needsPayment,
    payLabel,
    isPaying: payingJobId === job.id,
    pay: () => void payForJob(job.id),
    askClose: () => setConfirm('close'),
    askDelete: () => setConfirm('delete'),
    dialogs,
  }
}
