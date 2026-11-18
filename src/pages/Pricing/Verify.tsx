import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSWRConfig } from 'swr'

import { Spinner } from '@/components/ui/Spinner'
import { organizationUsageKey } from '@/features/organizations/hooks/useOrganizationUsage'
import { planHistoryKey } from '@/features/pricing/hooks/usePlanHistory'
import { verifyPaidCheckout } from '@/features/pricing/services/checkoutService'
import { getActiveOrganizationBilling } from '@/features/pricing/utils/getActiveOrganizationBilling'
import { getBillingPlanBadge } from '@/features/pricing/utils/getBillingPlanBadge'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { recruiterApi } from '@/redux/api/recruiter'
import { talentApi } from '@/redux/api/talent'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { notify } from '@/utils/toastNotifications'

import { Button, DisplayError } from '../../components'
import { useJobPayment } from '../RecruiterProfile/MyJobPosts/useJobPayment'
import styles from './Verify.module.scss'

const failedJobIdOf = (err: unknown): string | null => {
  const fields = (
    err as { response?: { data?: { error?: { fields?: { jobId?: string } } } } }
  )?.response?.data?.error?.fields
  return fields?.jobId ?? null
}

const VerifyPaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { mutate } = useProfile()
  const { mutate: globalMutate } = useSWRConfig()
  const dispatch = useDispatch()
  const [error, setError] = useState<string | null>(null)
  const [failedJobId, setFailedJobId] = useState<string | null>(null)
  const { payForJob, payingJobId } = useJobPayment()

  const reference = searchParams.get('reference') || searchParams.get('trxref')

  useEffect(() => {
    const verify = async () => {
      if (!reference) {
        notify('error', 'Missing payment reference.')
        navigate('/pricing')
        return
      }

      try {
        const { data } = await verifyPaidCheckout(reference)

        if (data?.jobId) {
          dispatch(
            recruiterApi.util.invalidateTags([
              { type: 'RecruiterJob', id: 'LIST' },
              { type: 'RecruiterJob', id: data.jobId },
            ]),
          )
          dispatch(talentApi.util.invalidateTags(['Jobs']))
          notify('success', 'Payment verified. Your job is now live.')
          navigate('/recruiterDashboard/myJobPosts')
          return
        }

        // Revalidate the profile first — it carries the new plan — then drop the
        // cached usage snapshot and plan history, which predate the purchase.
        const refreshed = await mutate()
        const user = refreshed?.data?.user
        if (user?.activeOrganizationId) {
          await Promise.all([
            globalMutate(organizationUsageKey(user.activeOrganizationId)),
            globalMutate(planHistoryKey(user.activeOrganizationId)),
          ])
        }

        const label = getBillingPlanBadge(
          getActiveOrganizationBilling(user).billingPlan,
        ).status
        notify('success', `Payment verified. You are now on ${label}.`)
        navigate('/recruiterDashboard/plan')
      } catch (err) {
        const message = getErrorMessage(
          err,
          'Payment verification failed. Please try again.',
        )
        const jobId = failedJobIdOf(err)
        if (jobId) {
          dispatch(
            recruiterApi.util.invalidateTags([
              { type: 'RecruiterJob', id: 'LIST' },
              { type: 'RecruiterJob', id: jobId },
            ]),
          )
        }
        setFailedJobId(jobId)
        setError(message)
        notify('error', message)
      }
    }

    void verify()
  }, [dispatch, globalMutate, mutate, navigate, reference])

  return (
    <div className={styles.page}>
      {error ? (
        <div className={styles.failure}>
          <DisplayError message={error} />
          {failedJobId ? (
            <div className={styles.actions}>
              <Button
                loading={payingJobId === failedJobId}
                onClick={() => void payForJob(failedJobId)}>
                Retry payment
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/recruiterDashboard/myJobPosts')}>
                Back to my jobs
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate('/recruiterDashboard/plan')}>
              Go to Plan
            </Button>
          )}
        </div>
      ) : (
        <Spinner fullPage />
      )}
    </div>
  )
}

export default VerifyPaymentPage
