import { useState } from 'react'

import { useActivateJobPaymentMutation } from '@/redux/api/recruiter'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

export const useJobPayment = () => {
  const [activateJobPayment] = useActivateJobPaymentMutation()
  const [payingJobId, setPayingJobId] = useState<string | null>(null)

  const payForJob = async (jobId: string) => {
    setPayingJobId(jobId)
    try {
      const response = await activateJobPayment(jobId).unwrap()
      const link = response?.data?.link
      if (!link) {
        throw new Error('No payment link returned')
      }
      window.location.assign(link)
    } catch (err) {
      notify(
        'error',
        getErrorMessage(err, 'Could not start payment. Please try again.'),
      )
      setPayingJobId(null)
    }
  }

  return { payForJob, payingJobId }
}
