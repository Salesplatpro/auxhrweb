import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { paths } from '@/paths'
import { notify } from '@/utils/toastNotifications'

import {
  BillingInterval,
  DEFAULT_BILLING_PLAN_KEY,
  isSubscriptionPlan,
  PricingPlan,
} from '../types'
import { usePaidCheckout } from './usePaidCheckout'

export const usePublicPlanSelect = () => {
  const { startCheckout, checkingOutPlanKey } = usePaidCheckout()
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const userRole = useAuthStore((state) => state.user?.userRole)

  const selectPlan = async (plan: PricingPlan, interval: BillingInterval) => {
    if (plan.key === DEFAULT_BILLING_PLAN_KEY) {
      if (isLoggedIn && userRole === 'recruiter') {
        notify(
          'info',
          'Pay per Use is billed when you post a job — no monthly subscription.',
        )
        navigate('/recruiterDashboard/myJobPosts')
        return
      }
      navigate(`/${paths.register}`)
      return
    }

    if (!isSubscriptionPlan(plan)) {
      notify('error', 'This plan is not available for checkout.')
      return
    }

    const checkoutInterval: BillingInterval =
      interval === 'annually' && plan.yearlyAmountNgn == null
        ? 'monthly'
        : interval

    await startCheckout(plan.key, checkoutInterval)
  }

  return { selectPlan, checkingOutPlanKey }
}
